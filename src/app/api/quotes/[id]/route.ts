import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import User from '@/lib/models/User'
import Customer from '@/lib/models/Customer'
import Quote from '@/lib/models/Quote'
import Contract from '@/lib/models/Contract'
import Invoice from '@/lib/models/Invoice'
import { verifyAuth } from '@/lib/auth'
import { sendEmail } from '@/lib/email'
import { notifyAdmins } from '@/lib/notifications'
import type { User as UserType } from '@/types/database'
import mongoose from 'mongoose'

async function getAuthUser(request: NextRequest): Promise<{ user: UserType | null; userId: string } | null> {
  const authPayload = await verifyAuth(request)
  if (!authPayload) return null
  await connectDB()
  const raw = await User.findById(authPayload.userId).select('-password').lean()
  if (!raw) return null
  let permissionsObj: Record<string, string> = {}
  if (raw.permissions) {
    if (raw.permissions instanceof Map) {
      ;(raw.permissions as Map<string, string>).forEach((value: string, key: string) => {
        permissionsObj[key] = value
      })
    } else if (typeof raw.permissions === 'object' && !Array.isArray(raw.permissions)) {
      permissionsObj = raw.permissions as Record<string, string>
    }
  }
  const user: UserType = {
    _id: raw._id.toString(),
    email: raw.email,
    firstName: raw.firstName,
    lastName: raw.lastName,
    role: raw.role,
    isActive: raw.isActive,
    permissions: permissionsObj as Record<string, 'no' | 'read' | 'edit' | 'full'>,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  }
  return { user, userId: authPayload.userId }
}

function toApiQuote(doc: any) {
  return {
    id: doc._id.toString(),
    _id: doc._id.toString(),
    quoteNumber: doc.quoteNumber,
    customerId: doc.customerId,
    customerName: doc.customerName,
    sideMark: doc.sideMark,
    status: doc.status,
    items: doc.items || [],
    subtotal: doc.subtotal,
    taxRate: doc.taxRate,
    taxAmount: doc.taxAmount,
    totalAmount: doc.totalAmount,
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    expiryDate: doc.expiryDate ? new Date(doc.expiryDate).toISOString().split('T')[0] : undefined,
    notes: doc.notes,
    priceAdjustPercent: doc.priceAdjustPercent || 0,
    priceAdjustFlat: doc.priceAdjustFlat || 0,
    contractType: doc.contractType,
    isFranchisee: doc.isFranchisee,
    visuals: doc.visuals,
    history: (doc.history || []).map((h: any) => ({
      status: h.status,
      timestamp: h.timestamp ? new Date(h.timestamp).toISOString() : new Date().toISOString(),
      note: h.note,
    })),
    addOns: doc.addOns || [],
    referenceNumber: doc.referenceNumber,
    saleAgent: doc.saleAgent,
    discountType: doc.discountType,
    discountValue: doc.discountValue,
    adminNote: doc.adminNote,
    installationAmount: doc.installationAmount || 0,
    shipToStreet: doc.shipToStreet,
    shipToCity: doc.shipToCity,
    shipToState: doc.shipToState,
    shipToPostcode: doc.shipToPostcode,
    shipToCountry: doc.shipToCountry,
    dealerId: doc.dealerId,
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuthUser(request)
    if (!auth || !auth.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid quote ID' }, { status: 400 })
    }

    const quote = await Quote.findById(params.id).lean()

    if (!quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
    }

    // Role-based access control — quote may be stored with either User._id or CRM Customer._id
    if (auth.user.role === 'CUSTOMER' || auth.user.role === 'DEALER') {
      const escapedEmail = auth.user.email?.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') || ''
      const customerRecord = escapedEmail
        ? await Customer.findOne({ email: { $regex: new RegExp(`^${escapedEmail}$`, 'i') } }).select('_id').lean()
        : null
      const allowedIds = [auth.userId, customerRecord ? (customerRecord as any)._id.toString() : null].filter(Boolean)
      if (!allowedIds.includes(quote.customerId)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    return NextResponse.json({ quote: toApiQuote(quote) })
  } catch (error) {
    console.error('Quote GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/** PATCH — customer accepts or rejects a quote (SENT → WON / LOST) */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuthUser(request)
    if (!auth || !auth.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (auth.user.role !== 'CUSTOMER' && auth.user.role !== 'DEALER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await connectDB()

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid quote ID' }, { status: 400 })
    }

    const body = await request.json().catch(() => ({}))
    const action = body.action || 'accept'

    if (action !== 'accept' && action !== 'reject') {
      return NextResponse.json({ error: 'Invalid action. Use "accept" or "reject"' }, { status: 400 })
    }

    const quote = await Quote.findById(params.id)
    if (!quote) return NextResponse.json({ error: 'Quote not found' }, { status: 404 })

    // Verify customer owns this quote (User._id or CRM Customer._id)
    const escapedEmail = auth.user.email?.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') || ''
    const customerRecord = escapedEmail
      ? await Customer.findOne({ email: { $regex: new RegExp(`^${escapedEmail}$`, 'i') } }).select('_id').lean()
      : null
    const allowedIds = [auth.userId, customerRecord ? (customerRecord as any)._id.toString() : null].filter(Boolean)
    if (!allowedIds.includes(quote.customerId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (quote.status !== 'SENT') {
      return NextResponse.json({ error: 'Only a SENT quote can be accepted or rejected' }, { status: 400 })
    }

    quote.status = action === 'accept' ? 'WON' : 'LOST'
    quote.history.push({ status: quote.status, timestamp: new Date() })
    await quote.save()

    let contractId: string | undefined
    if (action === 'accept' && quote.contractType) {
      try {
        const existing = await Contract.findOne({ quoteId: quote._id.toString() }).select('_id').lean()
        if (existing) {
          contractId = (existing as any)._id.toString()
        } else {
          const depositAmount = Number(((quote.totalAmount as number) * 0.5).toFixed(2))
          const created = await Contract.create({
            quoteId: quote._id.toString(),
            quoteNumber: quote.quoteNumber,
            customerId: quote.customerId,
            customerName: quote.customerName,
            contractType: quote.contractType,
            status: 'pending_customer_signature',
            adminPaymentOption: '50',
            adminPaymentAmount: depositAmount,
            sentAt: new Date(),
            auditTrail: [
              { action: 'created', userId: auth.userId, timestamp: new Date() },
              { action: 'sent', userId: auth.userId, timestamp: new Date() },
            ],
          })
          contractId = created._id.toString()
        }
      } catch (err) {
        console.error('[quotes PATCH] Contract auto-creation failed:', err)
      }
    }

    // Notify all admins of the customer's decision
    const customerLabel = auth.user.firstName
      ? `${auth.user.firstName} ${auth.user.lastName || ''}`.trim()
      : auth.user.email
    if (action === 'accept') {
      notifyAdmins({
        type: 'success',
        title: 'Quote Accepted',
        message: `${customerLabel} accepted quote ${quote.quoteNumber}`,
        link: `/quotes/${params.id}`,
      })
    } else {
      notifyAdmins({
        type: 'warning',
        title: 'Quote Rejected',
        message: `${customerLabel} rejected quote ${quote.quoteNumber}`,
        link: `/quotes/${params.id}`,
      })
    }

    return NextResponse.json({ quote: toApiQuote(quote), contractId })
  } catch (error) {
    console.error('Quote PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuthUser(request)
    if (!auth || !auth.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only ADMIN and STAFF can update quotes
    if (auth.user.role !== 'ADMIN' && auth.user.role !== 'STAFF') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await connectDB()

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid quote ID' }, { status: 400 })
    }

    const body = await request.json()
    const {
      status,
      notes,
      expiryDate,
      items,
      subtotal,
      taxRate,
      taxAmount,
      totalAmount,
      priceAdjustPercent,
      priceAdjustFlat,
      contractType,
      visuals,
      addOns,
      referenceNumber,
      saleAgent,
      discountType,
      discountValue,
      adminNote,
      installationAmount,
      shipToStreet,
      shipToCity,
      shipToState,
      shipToPostcode,
      shipToCountry,
    } = body

    const updateData: Record<string, unknown> = {}

    if (status !== undefined) {
      updateData.status = status
      // Add history entry for status change
      const quote = await Quote.findById(params.id)
      if (quote) {
        const historyEntry = {
          status,
          timestamp: new Date(),
          note: body.statusNote,
        }
        updateData.$push = { history: historyEntry }
      }
    }

    if (notes !== undefined) updateData.notes = notes
    if (expiryDate !== undefined) updateData.expiryDate = expiryDate ? new Date(expiryDate) : null
    if (items !== undefined) updateData.items = items
    if (subtotal !== undefined) updateData.subtotal = subtotal
    if (taxRate !== undefined) updateData.taxRate = taxRate
    if (taxAmount !== undefined) updateData.taxAmount = taxAmount
    if (totalAmount !== undefined) updateData.totalAmount = totalAmount
    if (priceAdjustPercent !== undefined) updateData.priceAdjustPercent = priceAdjustPercent
    if (priceAdjustFlat !== undefined) updateData.priceAdjustFlat = priceAdjustFlat
    if (contractType !== undefined) updateData.contractType = contractType
    if (visuals !== undefined) updateData.visuals = visuals
    if (addOns !== undefined) updateData.addOns = Array.isArray(addOns) ? addOns : []
    if (referenceNumber !== undefined) updateData.referenceNumber = referenceNumber
    if (saleAgent !== undefined) updateData.saleAgent = saleAgent
    if (discountType !== undefined) updateData.discountType = discountType
    if (discountValue !== undefined) updateData.discountValue = discountValue
    if (adminNote !== undefined) updateData.adminNote = adminNote
    if (installationAmount !== undefined) updateData.installationAmount = installationAmount
    if (shipToStreet !== undefined) updateData.shipToStreet = shipToStreet
    if (shipToCity !== undefined) updateData.shipToCity = shipToCity
    if (shipToState !== undefined) updateData.shipToState = shipToState
    if (shipToPostcode !== undefined) updateData.shipToPostcode = shipToPostcode
    if (shipToCountry !== undefined) updateData.shipToCountry = shipToCountry

    const quote = await Quote.findByIdAndUpdate(params.id, updateData, { new: true }).lean()

    if (!quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
    }

    // When admin accepts a dealer-placed order (WON + dealerId), auto-create 50% deposit invoice
    if (status === 'WON' && (quote as any).dealerId) {
      try {
        const existing = await Invoice.findOne({ quoteId: params.id }).lean()
        if (!existing) {
          const dealerUser = await User.findById((quote as any).dealerId).select('firstName lastName').lean()
          const dealerName = dealerUser
            ? [dealerUser.firstName, dealerUser.lastName].filter(Boolean).join(' ')
            : (quote as any).customerName || 'Dealer'
          const depositAmount = Number(((quote as any).totalAmount * 0.5).toFixed(2))
          await Invoice.create({
            quoteId: params.id,
            customerId: (quote as any).dealerId,
            customerName: dealerName,
            dealerId: (quote as any).dealerId,
            dealerName,
            sideMark: (quote as any).sideMark,
            items: ((quote as any).items || []).map((item: any) => ({
              productName: item.productName,
              category: item.category || '',
              description: item.subcategory || '',
              width: item.width,
              length: item.length,
              quantity: item.quantity ?? 1,
              unitPrice: item.unitPrice ?? 0,
              totalPrice: item.totalPrice ?? 0,
            })),
            subtotal: depositAmount,
            taxRate: (quote as any).taxRate ?? 0,
            taxAmount: 0,
            totalAmount: depositAmount,
            paidAmount: 0,
            balanceAmount: depositAmount,
            status: 'SENT',
            invoicePhase: 'deposit',
            sentAt: new Date(),
            notes: `50% deposit invoice for dealer order. Quote: ${(quote as any).quoteNumber}`,
          })
        }
      } catch (invoiceErr) {
        console.error('[quotes PUT] Failed to auto-create dealer deposit invoice:', invoiceErr)
      }
    }

    // Send quote email when status is changed to SENT (non-blocking)
    if (status === 'SENT') {
      try {
        let customerEmail: string | null = null
        let resolvedName = (quote as any).customerName || 'Valued Customer'
        const customerId = (quote as any).customerId

        if (customerId && mongoose.Types.ObjectId.isValid(customerId)) {
          const userDoc = await User.findById(customerId).select('email firstName lastName').lean()
          if (userDoc?.email) {
            customerEmail = userDoc.email
            resolvedName = [userDoc.firstName, userDoc.lastName].filter(Boolean).join(' ') || resolvedName
          } else {
            const crmDoc = await Customer.findById(customerId).select('email firstName lastName').lean()
            if (crmDoc?.email) {
              customerEmail = crmDoc.email
              resolvedName = [crmDoc.firstName, crmDoc.lastName].filter(Boolean).join(' ') || resolvedName
            }
          }
        }

        if (customerEmail) {
          const quoteNumber = (quote as any).quoteNumber || ''
          const totalAmount = ((quote as any).totalAmount ?? 0).toFixed(2)
          const expiryStr = (quote as any).expiryDate
            ? new Date((quote as any).expiryDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
            : 'N/A'

          const _appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://erpshadeotech.vercel.app'
          sendEmail({
            to: customerEmail,
            subject: `Your Quote ${quoteNumber} from Shadeotech`,
            html: `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;color:#1f2937;max-width:560px;margin:0 auto;padding:0;">
<div style="background:linear-gradient(135deg,#111,#1a1a1a);padding:28px 24px;border-radius:12px 12px 0 0;text-align:center;">
  <img src="${_appUrl}/images/logo.png" alt="Shadeotech" style="height:48px;object-fit:contain;margin-bottom:8px;" />
</div>
<div style="background:#f9fafb;padding:28px 24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">
  <p style="font-size:15px;">Hi ${resolvedName},</p>
  <p>Your quote is ready for review. Log in to your portal to view, accept, or ask questions.</p>
  <table style="width:100%;border-collapse:collapse;margin:16px 0;">
    <tr style="background:#f3f4f6;"><td style="padding:8px 12px;border:1px solid #e5e7eb;color:#6b7280;font-size:13px;">Quote Number</td><td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:600;">${quoteNumber}</td></tr>
    <tr><td style="padding:8px 12px;border:1px solid #e5e7eb;color:#6b7280;font-size:13px;">Total</td><td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:700;color:#c8864e;">$${totalAmount}</td></tr>
    <tr style="background:#f3f4f6;"><td style="padding:8px 12px;border:1px solid #e5e7eb;color:#6b7280;font-size:13px;">Expires</td><td style="padding:8px 12px;border:1px solid #e5e7eb;">${expiryStr}</td></tr>
  </table>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;" />
  <p style="color:#6b7280;font-size:12px;margin:0;">Shadeotech &bull; office@shadeotech.com</p>
</div>
</body></html>`,
          }).catch(err => console.error('[quotes] Email failed:', err))
        }
      } catch (emailErr) {
        console.error('[quotes] Failed to send quote email on status update:', emailErr)
      }
    }

    return NextResponse.json({ quote: toApiQuote(quote) })
  } catch (error) {
    console.error('Quote PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
