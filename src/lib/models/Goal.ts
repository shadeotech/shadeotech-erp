import mongoose, { Schema, Model } from 'mongoose'

export interface IGoal {
  period: string // 'YYYY-MM'
  revenueGoal: number
  annualRevenueGoal: number
  quotesGoal: number
  customersGoal: number
  updatedBy?: string
  createdAt?: Date
  updatedAt?: Date
}

const GoalSchema = new Schema<IGoal>(
  {
    period: { type: String, required: true, unique: true, index: true },
    revenueGoal: { type: Number, default: 0 },
    annualRevenueGoal: { type: Number, default: 0 },
    quotesGoal: { type: Number, default: 0 },
    customersGoal: { type: Number, default: 0 },
    updatedBy: { type: String },
  },
  { timestamps: true }
)

const Goal: Model<IGoal> =
  mongoose.models.Goal || mongoose.model<IGoal>('Goal', GoalSchema)

export default Goal
