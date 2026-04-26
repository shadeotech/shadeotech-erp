import mongoose, { Schema, Model } from 'mongoose'

export interface HelpLibrary {
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

const HelpLibrarySchema = new Schema<HelpLibrary>(
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
const HelpLibraryModel: Model<HelpLibrary> =
  mongoose.models.HelpLibrary ||
  mongoose.model<HelpLibrary>('HelpLibrary', HelpLibrarySchema)

export default HelpLibraryModel
