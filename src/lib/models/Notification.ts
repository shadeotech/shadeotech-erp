import mongoose from 'mongoose'

const NotificationSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  type: { type: String, enum: ['success', 'info', 'warning', 'error'], default: 'info' },
  title: { type: String, required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  link: { type: String },
}, { timestamps: true })

export default mongoose.models.Notification || mongoose.model('Notification', NotificationSchema)
