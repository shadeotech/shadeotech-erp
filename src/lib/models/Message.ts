import mongoose from 'mongoose'

const MessageSchema = new mongoose.Schema({
  customerId: { type: String, required: true, index: true },
  customerPhone: { type: String, required: true },
  customerName: { type: String, default: 'Unknown' },
  direction: { type: String, enum: ['inbound', 'outbound'], required: true },
  body: { type: String, required: true },
  twilioSid: { type: String },
  status: { type: String, default: 'sent' },
  staffId: { type: String },
  staffName: { type: String },
  read: { type: Boolean, default: false },
}, { timestamps: true })

MessageSchema.index({ customerId: 1, createdAt: -1 })

export default mongoose.models.Message || mongoose.model('Message', MessageSchema)
