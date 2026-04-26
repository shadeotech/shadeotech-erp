import mongoose, { Schema, Document } from 'mongoose'

export interface IWorkflow extends Document {
  key: string
  name: string
  trigger: string
  emailEnabled: boolean
  emailTemplateKey: string
  smsEnabled: boolean
  smsBody: string
  enabled: boolean
  delayMinutes: number
  updatedAt: Date
}

const WorkflowSchema = new Schema<IWorkflow>(
  {
    key: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    trigger: { type: String, required: true },
    emailEnabled: { type: Boolean, default: true },
    emailTemplateKey: { type: String, default: '' },
    smsEnabled: { type: Boolean, default: false },
    smsBody: { type: String, default: '' },
    enabled: { type: Boolean, default: true },
    delayMinutes: { type: Number, default: 0 },
  },
  { timestamps: true }
)

export default mongoose.models.Workflow ||
  mongoose.model<IWorkflow>('Workflow', WorkflowSchema)
