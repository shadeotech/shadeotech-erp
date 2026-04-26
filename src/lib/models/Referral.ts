import mongoose, { Schema, Model } from 'mongoose'

export type ReferralStatus = 'PENDING' | 'CONTACTED' | 'PURCHASED'

export interface IReferral {
  referrerId: string // User._id of customer who referred
  referredName: string
  referredEmail: string
  referredPhone: string
  status: ReferralStatus
  customerId?: string // CRM Customer._id once created
  purchasedAt?: Date
  pointsAwarded: boolean
  pointsTransactionId?: string
  createdAt?: Date
  updatedAt?: Date
}

const ReferralSchema = new Schema<IReferral>(
  {
    referrerId: { type: String, required: true, index: true },
    referredName: { type: String, required: true },
    referredEmail: { type: String, required: true },
    referredPhone: { type: String, required: true },
    status: {
      type: String,
      enum: ['PENDING', 'CONTACTED', 'PURCHASED'],
      default: 'PENDING',
    },
    customerId: { type: String },
    purchasedAt: { type: Date },
    pointsAwarded: { type: Boolean, default: false },
    pointsTransactionId: { type: String },
  },
  { timestamps: true }
)

const Referral: Model<IReferral> =
  mongoose.models.Referral || mongoose.model<IReferral>('Referral', ReferralSchema)

export default Referral
