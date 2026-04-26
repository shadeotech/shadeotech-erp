import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { connectDB } from '@/lib/mongodb'
import Contract, { IContract } from '@/lib/models/Contract'
import Quote from '@/lib/models/Quote'
import Invoice from '@/lib/models/Invoice'
import Customer from '@/lib/models/Customer'
import { verifyAuth } from '@/lib/auth'

function toApiContract(doc: any) {
  const isSigned = doc.status === 'signed'
  return {
    id: doc._id.toString(),
    _id: doc._id.toString(),
    contractNumber: doc.contractNumber,
    quoteId: doc.quoteId,
    quoteNumber: doc.quoteNumber,
    customerId: doc.customerId,
    customerName: doc.customerName,
    contractType: doc.contractType,
    status: doc.status,
    statusLegacy: isSigned ? 'signed' : 'pending_signature',
    adminSignedAt: doc.adminSignedAt ? new Date(doc.adminSignedAt).toISOString() : null,
    adminSignature: doc.adminSignature ?? null,
    adminSignatureData: doc.adminSignatureData ?? null,
    customerSignedAt: doc.customerSignedAt ? new Date(doc.customerSignedAt).toISOString() : null,
    customerSignature: doc.customerSignature ?? null,
    customerSignatureData: doc.customerSignatureData ?? null,
    installationAddress: doc.installationAddress ?? null,
    customerFullName: doc.customerFullName ?? null,
    adminPaymentOption: doc.adminPaymentOption ?? '50',
    adminPaymentAmount: doc.adminPaymentAmount ?? null,
    locked: doc.locked ?? false,
    signedAt: isSigned ? (doc.customerSignedAt || doc.adminSignedAt) : null,
    signature: isSigned ? (doc.customerSignature || doc.adminSignature) : null,
    sentAt: doc.sentAt ? new Date(doc.sentAt).toISOString() : null,
    images: doc.images || [],
    auditTrail: (doc.auditTrail || []).map((e: any) => ({
      id: e._id?.toString() || `audit_${Date.now()}`,
      action: e.action,
      userId: e.userId,
      userName: e.userName,
      timestamp: e.timestamp ? new Date(e.timestamp) : new Date(),
      ipAddress: e.ipAddress,
    })),
    createdAt: doc.createdAt ? new Date(doc.createdAt) : new Date(),
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : new Date(),
  }
}

async function createInvoiceFromQuote(quoteId: string, contract: IContract): Promise<any | null> {
  const quote = await Quote.findById(quoteId).lean()
  if (!quote) return null

  // If a legacy single invoice already exists for this quote (no phase), keep it.
  const legacy = await Invoice.findOne({ quoteId, invoicePhase: { $exists: false } }).lean()
  if (legacy) return legacy

  const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100
  const fullAmount = Number((quote as any).totalAmount ?? 0)
  const fullSubtotal = Number((quote as any).subtotal ?? 0)

  const baseItems = ((quote as any).items || []).map((item: any) => ({
    productName: item.productName,
    category: item.category,
    subcategory: item.subcategory,
    width: item.width,
    length: item.length,
    quantity: item.quantity ?? 1,
    unitPrice: Number(item.unitPrice ?? 0),
    totalPrice: Number(item.totalPrice ?? 0),
  }))

  const makeScaledItems = (factor: number) =>
    baseItems.map((it: any) => ({
      ...it,
      unitPrice: round2((it.unitPrice ?? 0) * factor),
      totalPrice: round2((it.totalPrice ?? 0) * factor),
    }))

  const createInvoice = async (opts: {
    phase?: 'deposit' | 'balance'
    factor: number
    dueDays: number
    notes?: string
  }) => {
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + opts.dueDays)

    const totalAmount = round2(fullAmount * opts.factor)
    const subtotal = round2(fullSubtotal * opts.factor)
    const taxRate = Number((quote as any).taxRate ?? 0)
    const taxAmount = round2(totalAmount - subtotal)

    const payload: any = {
      quoteId: (quote as any)._id.toString(),
      customerId: (quote as any).customerId,
      customerName: (quote as any).customerName,
      sideMark: (quote as any).sideMark || '',
      status: 'SENT',
      items: baseItems.length
        ? makeScaledItems(opts.factor)
        : [{ productName: 'Shades', category: 'Product', quantity: 1, unitPrice: totalAmount, totalPrice: totalAmount }],
      subtotal,
      taxRate,
      taxAmount,
      totalAmount,
      paidAmount: 0,
      balanceAmount: totalAmount,
      dueDate,
    }

    if (opts.phase) payload.invoicePhase = opts.phase
    if (opts.notes) payload.notes = opts.notes

    return await Invoice.create(payload)
  }

  const option = contract.adminPaymentOption ?? '50'
  const customAmount = Number(contract.adminPaymentAmount ?? 0)

  const phasedDeposit = await Invoice.findOne({ quoteId, invoicePhase: 'deposit' }).lean()
  const phasedBalance = await Invoice.findOne({ quoteId, invoicePhase: 'balance' }).lean()

  // 100% (or invalid amounts) → single invoice (unless phased invoices already exist)
  if (option === '100' || fullAmount <= 0 || (option === 'custom' && customAmount >= fullAmount && fullAmount > 0)) {
    if (phasedDeposit) return phasedDeposit
    if (phasedBalance) return phasedBalance
    const anyExisting = await Invoice.findOne({ quoteId }).lean()
    if (anyExisting) return anyExisting
    return await createInvoice({ factor: 1, dueDays: 30 })
  }

  // Determine deposit factor
  let depositFactor = 0.5
  if (option === 'custom') {
    if (!customAmount || customAmount <= 0) {
      // fallback to 50% if custom amount is missing
      depositFactor = 0.5
    } else {
      depositFactor = customAmount / fullAmount
    }
  }

  const balanceFactor = Math.max(0, 1 - depositFactor)

  const depositInvoice =
    phasedDeposit ?? (depositFactor > 0 ? await createInvoice({ phase: 'deposit', factor: depositFactor, dueDays: 30, notes: 'Deposit invoice' }) : null)

  if (!phasedBalance && balanceFactor > 0) {
    await createInvoice({ phase: 'balance', factor: balanceFactor, dueDays: 60, notes: 'Balance invoice (due before installation)' })
  }

  return depositInvoice
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authPayload = await verifyAuth(request)
    if (!authPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid contract ID' }, { status: 400 })
    }

    const contract = await Contract.findById(params.id).lean()
    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    }

    if (authPayload.role === 'CUSTOMER') {
      const customer = await Customer.findOne({ email: { $regex: new RegExp(`^${authPayload.email}$`, 'i') } }).lean()
      const allowedIds = [authPayload.userId]
      if (customer?._id) allowedIds.push(customer._id.toString())
      if (!allowedIds.includes((contract as any).customerId)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    return NextResponse.json({ contract: toApiContract(contract) }, { status: 200 })
  } catch (error) {
    console.error('Contract GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authPayload = await verifyAuth(request)
    if (!authPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid contract ID' }, { status: 400 })
    }

    const body = await request.json()
    const { action, signature, signatureData, installationAddress, customerFullName } = body

    if (!action) {
      return NextResponse.json({ error: 'action is required' }, { status: 400 })
    }

    const contract = await Contract.findById(params.id)
    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    }

    if (contract.locked) {
      return NextResponse.json({ error: 'Contract is fully executed and locked' }, { status: 400 })
    }

    if (contract.status === 'signed') {
      return NextResponse.json({ error: 'Contract is already fully signed' }, { status: 400 })
    }

    if (contract.status === 'cancelled') {
      return NextResponse.json({ error: 'Contract is cancelled' }, { status: 400 })
    }

    if (action === 'admin_sign') {
      if (!signature?.trim()) {
        return NextResponse.json({ error: 'signature is required' }, { status: 400 })
      }
      if (authPayload.role !== 'ADMIN' && authPayload.role !== 'STAFF') {
        return NextResponse.json({ error: 'Forbidden – only admin/staff can sign as admin' }, { status: 403 })
      }
      if (contract.adminSignedAt) {
        return NextResponse.json({ error: 'Admin has already signed' }, { status: 400 })
      }

      contract.adminSignedAt = new Date()
      contract.adminSignature = signature.trim()
      if (signatureData) contract.adminSignatureData = signatureData
      contract.adminSignedById = authPayload.userId
      contract.auditTrail.push({
        action: 'signed',
        userId: authPayload.userId,
        userName: signature.trim(),
        timestamp: new Date(),
      })

      contract.status = contract.customerSignedAt ? 'signed' : 'pending_customer_signature'

    } else if (action === 'customer_sign') {
      if (!signature?.trim()) {
        return NextResponse.json({ error: 'signature is required' }, { status: 400 })
      }
      if (authPayload.role === 'CUSTOMER') {
        const customer = await Customer.findOne({
          email: { $regex: new RegExp(`^${authPayload.email}$`, 'i') },
        }).lean()
        const allowedIds = [authPayload.userId]
        if (customer?._id) allowedIds.push(customer._id.toString())
        if (!allowedIds.includes(contract.customerId)) {
          return NextResponse.json({ error: 'Forbidden – contract does not belong to this customer' }, { status: 403 })
        }
      } else if (authPayload.role !== 'ADMIN' && authPayload.role !== 'STAFF') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      if (contract.customerSignedAt) {
        return NextResponse.json({ error: 'Customer has already signed' }, { status: 400 })
      }
      // Admin sign step bypassed for now — customer can sign directly
      contract.customerSignedAt = new Date()
      contract.customerSignature = signature.trim()
      if (signatureData) contract.customerSignatureData = signatureData
      if (installationAddress) contract.installationAddress = installationAddress
      if (customerFullName) contract.customerFullName = customerFullName
      contract.auditTrail.push({
        action: 'signed',
        userId: authPayload.userId,
        userName: signature.trim(),
        timestamp: new Date(),
      })
      contract.status = 'signed'
      contract.locked = true

    } else {
      return NextResponse.json({ error: 'Invalid action. Use admin_sign or customer_sign' }, { status: 400 })
    }

    await contract.save()

    if (contract.status === 'signed') {
      await createInvoiceFromQuote(contract.quoteId, contract)
    }

    const updated = await Contract.findById(contract._id).lean()
    return NextResponse.json({ contract: toApiContract(updated) }, { status: 200 })
  } catch (error) {
    console.error('Contract PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
