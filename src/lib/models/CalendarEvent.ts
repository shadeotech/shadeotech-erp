import mongoose, { Schema, Model } from 'mongoose'

export interface ICalendarEvent {
  _id: mongoose.Types.ObjectId
  title: string
  start: string
  end: string
  type: string
  assignedTo: string
  status?: string
  otherTypeName?: string
  customerId?: string
  partnerId?: string
  location?: string
  leadSource?: string
  referralName?: string
  partnerReferralName?: string
  sideMark?: string
  productsOfInterest?: string[]
  numberOfWindows?: number
  numberOfOpenings?: number
  isCompany?: boolean
  companyName?: string
  website?: string
  commuteTime?: string
  notes?: string
  taxExempt?: boolean
  microsoftEventId?: string
  createdAt?: Date
  updatedAt?: Date
}

const CalendarEventSchema = new Schema<ICalendarEvent>(
  {
    title: { type: String, required: true },
    start: { type: String, required: true },
    end: { type: String, required: true },
    type: { type: String, required: true },
    assignedTo: { type: String, required: true },
    status: { type: String },
    otherTypeName: { type: String },
    customerId: { type: String },
    partnerId: { type: String },
    location: { type: String },
    leadSource: { type: String },
    referralName: { type: String },
    partnerReferralName: { type: String },
    sideMark: { type: String },
    productsOfInterest: [{ type: String }],
    numberOfWindows: { type: Number },
    numberOfOpenings: { type: Number },
    isCompany: { type: Boolean },
    companyName: { type: String },
    website: { type: String },
    commuteTime: { type: String },
    notes: { type: String },
    taxExempt: { type: Boolean },
    microsoftEventId: { type: String },
  },
  { timestamps: true }
)

const CalendarEvent: Model<ICalendarEvent> =
  mongoose.models.CalendarEvent ||
  mongoose.model<ICalendarEvent>('CalendarEvent', CalendarEventSchema)

export default CalendarEvent
