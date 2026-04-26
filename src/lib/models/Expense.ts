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
  vendor?: string
  paymentMethod: PaymentMethod
  createdBy?: string // User ID who created the expense
  createdAt?: Date
  updatedAt?: Date
}

const ExpenseSchema = new Schema<Expense>(
  {
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    category: {
      type: String,
      enum: ['Materials', 'Labor', 'Marketing', 'Office Supplies', 'Utilities', 'Rent', 'Insurance', 'Other'],
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    vendor: {
      type: String,
      trim: true,
    },
    paymentMethod: {
      type: String,
      enum: ['Credit Card', 'ACH', 'Check', 'Cash', 'Other'],
      default: 'Credit Card',
      required: true,
    },
    createdBy: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
)

// Prevent re-compilation during development
const ExpenseModel: Model<Expense> =
  mongoose.models.Expense || mongoose.model<Expense>('Expense', ExpenseSchema)

export default ExpenseModel
