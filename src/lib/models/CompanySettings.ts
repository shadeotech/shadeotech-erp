import mongoose, { Schema, Model } from 'mongoose'
import type { StoredContractTemplates } from '@/lib/contract-templates'

export interface IFaqItem {
  question: string
  answer: string
}

export interface ICompanySettings {
  _id?: mongoose.Types.ObjectId
  companyAddress: string
  contractTemplates?: StoredContractTemplates
  invoiceTemplateConfig?: Record<string, unknown>
  bookingBuffer: number
  bookingStartHour: number
  bookingLastSlotHour: number
  manufacturingVideoUrl?: string
  faqs?: IFaqItem[]
  ticketSubjects?: string[]
  updatedAt?: Date
}

const DEFAULT_ADDRESS = '3235 Skylane Dr. Unit 111, Carrollton, TX 75006'

const CompanySettingsSchema = new Schema<ICompanySettings>(
  {
    _id: { type: String, default: 'company' },
    companyAddress: {
      type: String,
      default: DEFAULT_ADDRESS,
      trim: true,
    },
    contractTemplates: {
      INTERIOR: { type: String },
      EXTERIOR: { type: String },
      INTERIOR_AND_EXTERIOR: { type: String },
    },
    invoiceTemplateConfig: { type: Schema.Types.Mixed },
    bookingBuffer: { type: Number, default: 2 },
    bookingStartHour: { type: Number, default: 10 },
    bookingLastSlotHour: { type: Number, default: 15 },
    manufacturingVideoUrl: { type: String, default: '' },
    faqs: [{ question: { type: String }, answer: { type: String }, _id: false }],
    ticketSubjects: [{ type: String }],
  },
  { timestamps: true, _id: false }
)

const CompanySettings: Model<ICompanySettings> =
  mongoose.models.CompanySettings ||
  mongoose.model<ICompanySettings>('CompanySettings', CompanySettingsSchema)

export default CompanySettings
