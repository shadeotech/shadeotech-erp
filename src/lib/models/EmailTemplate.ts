import mongoose, { Schema, Document } from 'mongoose'

export interface IEmailTemplate extends Document {
  key: string
  name: string
  subject: string
  body: string
  variables: string[]
  enabled: boolean
  updatedAt: Date
}

const EmailTemplateSchema = new Schema<IEmailTemplate>(
  {
    key: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    subject: { type: String, required: true },
    body: { type: String, required: true },
    variables: [{ type: String }],
    enabled: { type: Boolean, default: true },
  },
  { timestamps: true }
)

export default mongoose.models.EmailTemplate ||
  mongoose.model<IEmailTemplate>('EmailTemplate', EmailTemplateSchema)
