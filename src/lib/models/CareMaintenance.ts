import mongoose, { Schema, Model } from 'mongoose'

export interface CareMaintenance {
  _id?: mongoose.Types.ObjectId
  title: string
  type: 'PDF' | 'Video'
  category: string
  description: string
  url?: string // For video URLs or Cloudinary file URLs
  cloudinaryPublicId?: string // Cloudinary public ID for uploaded files
  cloudinaryUrl?: string // Full Cloudinary URL
  uploadDate: Date
  createdAt?: Date
  updatedAt?: Date
}

const CareMaintenanceSchema = new Schema<CareMaintenance>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['PDF', 'Video'],
      required: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      trim: true,
    },
    cloudinaryPublicId: {
      type: String,
      trim: true,
    },
    cloudinaryUrl: {
      type: String,
      trim: true,
    },
    uploadDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
)

// Prevent re-compilation during development
const CareMaintenanceModel: Model<CareMaintenance> =
  mongoose.models.CareMaintenance ||
  mongoose.model<CareMaintenance>('CareMaintenance', CareMaintenanceSchema)

export default CareMaintenanceModel
