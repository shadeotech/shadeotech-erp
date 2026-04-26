import mongoose, { Schema, Document, Model } from 'mongoose'

export type PaymentMethod = 'CREDIT_CARD' | 'ACH' | 'CHECK' | 'ZELLE' | 'FINANCING' | 'CASH' | 'OTHER'
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED'

export interface IPayment extends Document {
  paymentNumber: string
  invoiceId?: string
  invoiceNumber?: string
  customerId?: string
  customerName: string
  sideMark?: string
  amount: number
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  stripePaymentIntentId?: string
  stripeChargeId?: string
  transactionDate: Date
  notes?: string
  recordedById?: string
  createdAt: Date
  updatedAt: Date
}

const PaymentSchema = new Schema<IPayment>(
  {
    paymentNumber: { type: String, required: true, unique: true },
    invoiceId: String,
    invoiceNumber: String,
    customerId: String,
    customerName: { type: String, required: true },
    sideMark: String,
    amount: { type: Number, required: true },
    paymentMethod: {
      type: String,
      enum: ['CREDIT_CARD', 'ACH', 'CHECK', 'ZELLE', 'FINANCING', 'CASH', 'OTHER'],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'],
      default: 'PENDING',
    },
    stripePaymentIntentId: String,
    stripeChargeId: String,
    transactionDate: { type: Date, default: Date.now },
    notes: String,
    recordedById: String,
  },
  { timestamps: true }
)

// Auto-generate payment number before validation if not set
PaymentSchema.pre('validate', async function (next) {
  if (!this.paymentNumber) {
    const year = String(new Date().getFullYear()).slice(-2)
    const count = await (mongoose.models.Payment as Model<IPayment>)?.countDocuments({ paymentNumber: new RegExp(`^PAY-${year}-`) }) ?? 0
    this.paymentNumber = `PAY-${year}-${String(count + 1).padStart(4, '0')}`
  }
  next()
})

const Payment: Model<IPayment> =
  mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema)

export default Payment
