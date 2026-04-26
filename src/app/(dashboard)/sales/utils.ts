import { Quote } from './mockQuotes'
import { Invoice } from './mockInvoices'
import { Payment } from './mockPayments'
import { calculateInvoiceStatus } from './mockInvoices'

/**
 * Generate a new invoice ID
 */
export function generateInvoiceId(): string {
  const timestamp = Date.now()
  return `INV-${timestamp}`
}

/**
 * Generate a new payment ID
 */
export function generatePaymentId(): string {
  const timestamp = Date.now()
  return `PAY-${timestamp}`
}

/**
 * Create a standalone invoice for a customer (service, shipping, etc. - not from quote)
 */
export function createStandaloneInvoice(params: {
  customerId: string
  customerName: string
  sideMark: string
  totalAmount: number
  description?: string
  dueDate?: string
}): Invoice {
  const invoiceId = generateInvoiceId()
  const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invoiceId.split('-')[1]).slice(-3)}`
  const due = params.dueDate ?? (() => {
    const d = new Date()
    d.setDate(d.getDate() + 30)
    return d.toISOString().split('T')[0]
  })()
  const items: Invoice['items'] = params.description
    ? [{
        id: `item-${invoiceId}`,
        productName: params.description,
        category: 'Service',
        unitPrice: params.totalAmount,
        quantity: 1,
        totalPrice: params.totalAmount,
      }]
    : undefined
  return {
    id: invoiceId,
    invoiceNumber,
    customerId: params.customerId,
    customerName: params.customerName,
    sideMark: params.sideMark || '',
    totalAmount: params.totalAmount,
    paidAmount: 0,
    dueAmount: params.totalAmount,
    status: 'Unpaid',
    dueDate: due,
    createdAt: new Date().toISOString().split('T')[0],
    items,
    notes: params.description,
  }
}

/**
 * Create an invoice from an accepted quote
 */
export function createInvoiceFromQuote(quote: Quote): Invoice {
  const invoiceId = generateInvoiceId()
  const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invoiceId.split('-')[1]).slice(-3)}`
  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + 30) // 30 days from now

  return {
    id: invoiceId,
    invoiceNumber,
    quoteId: quote.id,
    customerId: quote.customerId,
    customerName: quote.customerName || 'Unknown Customer',
    sideMark: quote.sideMark || '',
    totalAmount: quote.total,
    paidAmount: 0,
    dueAmount: quote.total,
    status: 'Unpaid',
    dueDate: dueDate.toISOString().split('T')[0],
    createdAt: new Date().toISOString().split('T')[0],
  }
}

/**
 * Update invoice balance when payment is added
 */
export function updateInvoiceBalance(
  invoice: Invoice,
  paymentAmount: number
): Invoice {
  const newPaidAmount = invoice.paidAmount + paymentAmount
  const newDueAmount = Math.max(0, invoice.totalAmount - newPaidAmount)
  
  const updatedInvoice: Invoice = {
    ...invoice,
    paidAmount: newPaidAmount,
    dueAmount: newDueAmount,
    status: calculateInvoiceStatus({
      ...invoice,
      paidAmount: newPaidAmount,
    }),
  }

  return updatedInvoice
}

/**
 * Check if quote should trigger automation
 */
export function shouldTriggerQuoteReminder(quote: Quote, delayDays: number): boolean {
  if (quote.status !== 'Sent' && quote.status !== 'Pending') {
    return false
  }

  const createdAt = new Date(quote.createdAt)
  const now = new Date()
  const daysDiff = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
  
  return daysDiff >= delayDays
}

/**
 * Check if invoice should trigger overdue reminder
 */
export function shouldTriggerOverdueReminder(invoice: Invoice): boolean {
  if (invoice.status !== 'Overdue' && invoice.status !== 'Unpaid') {
    return false
  }

  const dueDate = new Date(invoice.dueDate)
  const now = new Date()
  
  return dueDate < now
}

/**
 * Check if invoice should trigger balance reminder
 */
export function shouldTriggerBalanceReminder(invoice: Invoice, delayDays: number): boolean {
  if (invoice.status !== 'Partially Paid') {
    return false
  }

  const createdAt = new Date(invoice.createdAt)
  const now = new Date()
  const daysDiff = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
  
  return daysDiff >= delayDays
}

/**
 * Get all payments for an invoice
 */
export function getPaymentsForInvoice(
  invoiceId: string,
  payments: Payment[]
): Payment[] {
  return payments.filter(p => p.invoiceId === invoiceId)
}

/**
 * Calculate total paid for an invoice
 */
export function calculateTotalPaid(
  invoiceId: string,
  payments: Payment[]
): number {
  return getPaymentsForInvoice(invoiceId, payments).reduce(
    (sum, payment) => sum + payment.amount,
    0
  )
}

