import mongoose, { Schema, Model } from 'mongoose'

export type PointsTransactionType =
  | 'REFERRAL_PURCHASE'
  | 'GOOGLE_REVIEW'
  | 'SOCIAL_FOLLOW'
  | 'REDEMPTION'
  | 'MANUAL'

export type PointsTransactionStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface IPointsTransaction {
  userId: string
  type: PointsTransactionType
  amount: number // positive = earned, negative = redeemed
  description: string
  referralId?: string
  redemptionReward?: string // 'MOTOR' | 'REMOTE' | 'SMART_HUB'
  approvedBy?: string // admin userId
  status: PointsTransactionStatus
  createdAt?: Date
  updatedAt?: Date
}

const PointsTransactionSchema = new Schema<IPointsTransaction>(
  {
    userId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ['REFERRAL_PURCHASE', 'GOOGLE_REVIEW', 'SOCIAL_FOLLOW', 'REDEMPTION', 'MANUAL'],
      required: true,
    },
    amount: { type: Number, required: true },
    description: { type: String, required: true },
    referralId: { type: String },
    redemptionReward: { type: String },
    approvedBy: { type: String },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
    },
  },
  { timestamps: true }
)

const PointsTransaction: Model<IPointsTransaction> =
  mongoose.models.PointsTransaction ||
  mongoose.model<IPointsTransaction>('PointsTransaction', PointsTransactionSchema)

export default PointsTransaction
