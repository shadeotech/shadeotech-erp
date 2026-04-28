import mongoose, { Schema, Model } from 'mongoose'
import type { StoredContractTemplates } from '@/lib/contract-templates'

export interface IFaqItem {
  question: string
  answer: string
}

export interface IInvoiceReminderConfig {
  enabled: boolean
  frequencyDays: number   // send reminder every N days after due date
  maxReminders: number    // stop after N reminders per invoice
  emailSubject?: string
  emailMessage?: string
}

export interface ICompanySettings {
  _id?: mongoose.Types.ObjectId
  companyAddress: string
  contractTemplates?: StoredContractTemplates
  invoiceTemplateConfig?: Record<string, unknown>
  invoiceReminderConfig?: IInvoiceReminderConfig
  bookingBuffer: number
  bookingStartHour: number
  bookingLastSlotHour: number
  manufacturingVideoUrl?: string
  faqs?: IFaqItem[]
  ticketSubjects?: string[]
  productCategories?: string[]
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
    invoiceReminderConfig: {
      type: new Schema({
        enabled: { type: Boolean, default: false },
        frequencyDays: { type: Number, default: 3 },
        maxReminders: { type: Number, default: 5 },
        emailSubject: String,
        emailMessage: String,
      }, { _id: false }),
      default: () => ({ enabled: false, frequencyDays: 3, maxReminders: 5 }),
    },
    bookingBuffer: { type: Number, default: 2 },
    bookingStartHour: { type: Number, default: 10 },
    bookingLastSlotHour: { type: Number, default: 15 },
    manufacturingVideoUrl: { type: String, default: '' },
    faqs: [{ question: { type: String }, answer: { type: String }, _id: false }],
    ticketSubjects: [{ type: String }],
    productCategories: [{ type: String }],
  },
  { timestamps: true, _id: false }
)

const CompanySettings: Model<ICompanySettings> =
  mongoose.models.CompanySettings ||
  mongoose.model<ICompanySettings>('CompanySettings', CompanySettingsSchema)

export default CompanySettings
