import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { connectDB } from '@/lib/mongodb'
import Invoice from '@/lib/models/Invoice'
import User from '@/lib/models/User'
import Customer from '@/lib/models/Customer'
import Quote from '@/lib/models/Quote'
import { verifyAuth } from '@/lib/auth'
import { sendEmail } from '@/lib/email'

function toApiInvoice(doc: any) {
  const paidAmount = doc.paidAmount ?? 0
  const totalAmount = doc.totalAmount ?? 0
  const balanceAmount = doc.balanceAmount ?? totalAmount - paidAmount

  let uiStatus: 'Unpaid' | 'Partially Paid' | 'Paid' | 'Overdue' = 'Unpaid'
  if (doc.status === 'PAID' || (totalAmount > 0 && paidAmount >= totalAmount)) uiStatus = 'Paid'
  else if (doc.status === 'OVERDUE') uiStatus = 'Overdue'
  else if (paidAmount > 0) uiStatus = 'Partially Paid'
  else if (balanceAmount > 0 && doc.dueDate && new Date(doc.dueDate) < new Date()) uiStatus = 'Overdue'

  return {
    id: doc._id.toString(),
    _id: doc._id.toString(),
    invoiceNumber: doc.invoiceNumber,
    quoteId: doc.quoteId,
    orderId: doc.orderId,
    orderNumber: doc.orderNumber,
    customerId: doc.customerId,
    customerName: doc.customerName,
    dealerId: doc.dealerId,
    dealerName: doc.dealerName,
    sideMark: doc.sideMark,
    invoicePhase: doc.invoicePhase ?? undefined,
    status: uiStatus,
    statusDb: doc.status,
    sentAt: doc.sentAt ? new Date(doc.sentAt).toISOString() : undefined,
    items: doc.items || [],
    subtotal: doc.subtotal ?? 0,
    taxRate: doc.taxRate ?? 0,
    taxAmount: doc.taxAmount ?? 0,
    totalAmount,
    paidAmount,
    dueAmount: balanceAmount,
    dueDate: doc.dueDate ? new Date(doc.dueDate).toISOString().split('T')[0] : undefined,
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString().split('T')[0] : undefined,
    notes: doc.notes,
    billToStreet: doc.billToStreet,
    billToCity: doc.billToCity,
    billToState: doc.billToState,
    billToPostcode: doc.billToPostcode,
    billToCountry: doc.billToCountry,
    shipToStreet: doc.shipToStreet,
    shipToCity: doc.shipToCity,
    shipToState: doc.shipToState,
    shipToPostcode: doc.shipToPostcode,
    shipToCountry: doc.shipToCountry,
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authPayload = await verifyAuth(request)
    if (!authPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid invoice ID' }, { status: 400 })
    }

    await connectDB()

    const doc = await Invoice.findById(id).lean()
    if (!doc) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    let hydratedDoc: any = { ...doc }

    if ((!hydratedDoc.billToStreet || !hydratedDoc.billToCity || !hydratedDoc.billToCountry) && hydratedDoc.customerId) {
      const customer = await Customer.findById(hydratedDoc.customerId).lean()
      if (customer) {
        hydratedDoc.billToStreet = hydratedDoc.billToStreet || customer.street || customer.address || ''
        hydratedDoc.billToCity = hydratedDoc.billToCity || customer.city || ''
        hydratedDoc.billToState = hydratedDoc.billToState || customer.town || ''
        hydratedDoc.billToPostcode = hydratedDoc.billToPostcode || customer.postcode || ''
        hydratedDoc.billToCountry = hydratedDoc.billToCountry || customer.country || ''
      }
    }

    if ((!hydratedDoc.shipToStreet || !hydratedDoc.shipToCity || !hydratedDoc.shipToCountry) && hydratedDoc.quoteId) {
      const quote = await Quote.findById(hydratedDoc.quoteId).lean()
      if (quote) {
        hydratedDoc.shipToStreet = hydratedDoc.shipToStreet || quote.shipToStreet || ''
        hydratedDoc.shipToCity = hydratedDoc.shipToCity || quote.shipToCity || ''
        hydratedDoc.shipToState = hydratedDoc.shipToState || quote.shipToState || ''
        hydratedDoc.shipToPostcode = hydratedDoc.shipToPostcode || quote.shipToPostcode || ''
        hydratedDoc.shipToCountry = hydratedDoc.shipToCountry || quote.shipToCountry || ''
      }
    }

    return NextResponse.json({ invoice: toApiInvoice(hydratedDoc) }, { status: 200 })
  } catch (error) {
    console.error('Invoice GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authPayload = await verifyAuth(request)
    if (!authPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid invoice ID' }, { status: 400 })
    }

    await connectDB()

    const doc = await Invoice.findById(id)
    if (!doc) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    const body = await request.json()
    const { action, totalAmount, items } = body

    if (action === 'send') {
      if (doc.status === 'SENT' && doc.sentAt) {
        return NextResponse.json({ error: 'Invoice has already been sent' }, { status: 400 })
      }
      doc.status = 'SENT'
      doc.sentAt = new Date()
      await doc.save()

      // Send invoice email (non-blocking)
      try {
        let recipientEmail: string | null = null
        const lookupId = doc.dealerId || doc.customerId
        if (lookupId && mongoose.Types.ObjectId.isValid(lookupId)) {
          const userDoc = await User.findById(lookupId).select('email').lean()
          if (userDoc?.email) {
            recipientEmail = userDoc.email
          } else {
            const custDoc = await Customer.findById(lookupId).select('email').lean()
            if (custDoc?.email) recipientEmail = custDoc.email
          }
        }

        if (recipientEmail) {
          const invoiceNumber = doc.invoiceNumber || ''
          const totalAmount = (doc.totalAmount ?? 0).toFixed(2)
          const dueDate = doc.dueDate ? new Date(doc.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'
          const recipientName = doc.dealerName || doc.customerName || 'Valued Customer'

          await sendEmail({
            to: recipientEmail,
            subject: `Invoice ${invoiceNumber} from Shadeotech`,
            html: `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;color:#1f2937;max-width:600px;margin:0 auto;padding:24px;">
<div style="background:#1e3a5f;padding:24px;border-radius:8px 8px 0 0;text-align:center;">
  <h1 style="color:#ffffff;margin:0;font-size:24px;">Shadeotech</h1>
  <p style="color:#93c5fd;margin:8px 0 0;">Invoice Ready</p>
</div>
<div style="background:#ffffff;padding:24px;border:1px solid #e5e7eb;border-top:0;">
  <p>Hi ${recipientName},</p>
  <p>Please find your invoice details below.</p>
  <table style="width:100%;border-collapse:collapse;margin:16px 0;">
    <tr style="background:#f3f4f6;"><td style="padding:8px 12px;border:1px solid #e5e7eb;color:#6b7280;">Invoice Number</td><td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:bold;">${invoiceNumber}</td></tr>
    <tr><td style="padding:8px 12px;border:1px solid #e5e7eb;color:#6b7280;">Amount Due</td><td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:bold;color:#1e3a5f;">$${totalAmount}</td></tr>
    <tr style="background:#f3f4f6;"><td style="padding:8px 12px;border:1px solid #e5e7eb;color:#6b7280;">Due Date</td><td style="padding:8px 12px;border:1px solid #e5e7eb;">${dueDate}</td></tr>
  </table>
  <p>Please log in to your portal to view and pay this invoice. If you have any questions, please contact us.</p>
  <p style="margin-top:24px;">Warm regards,<br/><strong>The Shadeotech Team</strong></p>
</div>
<div style="background:#f3f4f6;padding:16px;border-radius:0 0 8px 8px;text-align:center;border:1px solid #e5e7eb;border-top:0;">
  <p style="margin:0;font-size:12px;color:#6b7280;">Shadeotech &mdash; Window Treatment Specialists</p>
  <p style="margin:4px 0 0;font-size:12px;color:#6b7280;">concierge@shadeotech.com</p>
</div>
</body></html>`,
          })
        }
      } catch (emailErr) {
        console.error('[invoices] Failed to send invoice email:', emailErr)
      }

      return NextResponse.json({ invoice: toApiInvoice(doc.toObject()) }, { status: 200 })
    }

    if (action === 'update' || totalAmount !== undefined || items !== undefined) {
      if (totalAmount !== undefined) {
        doc.totalAmount = Number(totalAmount)
        doc.balanceAmount = Math.max(0, doc.totalAmount - (doc.paidAmount ?? 0))
      }
      if (items !== undefined && Array.isArray(items)) {
        doc.items = items
      }
      await doc.save()
      return NextResponse.json({ invoice: toApiInvoice(doc.toObject()) }, { status: 200 })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Invoice PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
