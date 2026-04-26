import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IInvoiceItem {
  productName: string
  category?: string
  subcategory?: string
  description?: string
  width?: number
  length?: number
  quantity: number
  unitPrice: number
  totalPrice: number
}

export interface IInvoice extends Document {
  invoiceNumber: string
  quoteId?: string
  orderId?: string
  orderNumber?: string
  customerId?: string
  customerName: string
  dealerId?: string
  dealerName?: string
  sideMark?: string
  invoicePhase?: 'deposit' | 'balance'
  status: 'DRAFT' | 'SENT' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED'
  sentAt?: Date
  items: IInvoiceItem[]
  subtotal: number
  taxRate: number
  taxAmount: number
  totalAmount: number
  paidAmount: number
  balanceAmount: number
  dueDate?: Date
  notes?: string
  billToStreet?: string
  billToCity?: string
  billToState?: string
  billToPostcode?: string
  billToCountry?: string
  shipToStreet?: string
  shipToCity?: string
  shipToState?: string
  shipToPostcode?: string
  shipToCountry?: string
  stripeCustomerId?: string
  createdAt: Date
  updatedAt: Date
}

const InvoiceItemSchema = new Schema<IInvoiceItem>(
  {
    productName: { type: String, required: true },
    category: String,
    subcategory: String,
    description: String,
    width: Number,
    length: Number,
    quantity: { type: Number, required: true, default: 1 },
    unitPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
  },
  { _id: false }
)

const InvoiceSchema = new Schema<IInvoice>(
  {
    invoiceNumber: { type: String, required: true, unique: true },
    quoteId: String,
    orderId: String,
    orderNumber: String,
    customerId: String,
    customerName: { type: String, required: true },
    dealerId: String,
    dealerName: String,
    sideMark: String,
    invoicePhase: { type: String, enum: ['deposit', 'balance'] },
    sentAt: Date,
    status: {
      type: String,
      enum: ['DRAFT', 'SENT', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED'],
      default: 'SENT',
    },
    items: [InvoiceItemSchema],
    subtotal: { type: Number, required: true, default: 0 },
    taxRate: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    balanceAmount: { type: Number, required: true },
    dueDate: Date,
    notes: String,
    billToStreet: String,
    billToCity: String,
    billToState: String,
    billToPostcode: String,
    billToCountry: String,
    shipToStreet: String,
    shipToCity: String,
    shipToState: String,
    shipToPostcode: String,
    shipToCountry: String,
    stripeCustomerId: String,
  },
  { timestamps: true }
)

// Auto-generate invoice number before validation if not set
InvoiceSchema.pre('validate', async function (next) {
  if (!this.invoiceNumber) {
    const year = String(new Date().getFullYear()).slice(-2)
    const count = await (mongoose.models.Invoice as Model<IInvoice>)?.countDocuments({ invoiceNumber: new RegExp(`^INV-${year}-`) }) ?? 0
    this.invoiceNumber = `INV-${year}-${String(count + 1).padStart(4, '0')}`
  }
  next()
})

const Invoice: Model<IInvoice> =
  mongoose.models.Invoice || mongoose.model<IInvoice>('Invoice', InvoiceSchema)

export default Invoice
