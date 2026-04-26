import mongoose, { Schema, Model } from 'mongoose'

export type ExpenseCategory =
  | 'Materials'
  | 'Labor'
  | 'Marketing'
  | 'Office Supplies'
  | 'Utilities'
  | 'Rent'
  | 'Insurance'
  | 'Other'

export type PaymentMethod =
  | 'Credit Card'
  | 'ACH'
  | 'Check'
  | 'Cash'
  | 'Other'

export interface Expense {
  _id?: mongoose.Types.ObjectId
  date: Date
  category: ExpenseCategory
  description: string
  amount: number
  // Legacy field kept for existing records
  vendor?: string
  // New fields
  payee?: string
  customerId?: string
  paymentAccount?: string
  refNo?: string
  poNumber?: string
  sideMark?: string
  paymentMethod: PaymentMethod
  createdBy?: string
  createdAt?: Date
  updatedAt?: Date
}

const ExpenseSchema = new Schema<Expense>(
  {
    date: { type: Date, required: true, default: Date.now },
    category: {
      type: String,
      enum: ['Materials', 'Labor', 'Marketing', 'Office Supplies', 'Utilities', 'Rent', 'Insurance', 'Other'],
      required: true,
    },
    description: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    vendor: { type: String, trim: true },
    payee: { type: String, trim: true },
    customerId: { type: String, trim: true },
    paymentAccount: { type: String, trim: true },
    refNo: { type: String, trim: true },
    poNumber: { type: String, trim: true },
    sideMark: { type: String, trim: true },
    paymentMethod: {
      type: String,
      enum: ['Credit Card', 'ACH', 'Check', 'Cash', 'Other'],
      default: 'Credit Card',
      required: true,
    },
    createdBy: { type: String, trim: true },
  },
  { timestamps: true }
)

const ExpenseModel: Model<Expense> =
  mongoose.models.Expense || mongoose.model<Expense>('Expense', ExpenseSchema)

export default ExpenseModel
