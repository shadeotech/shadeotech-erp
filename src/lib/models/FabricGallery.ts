import mongoose, { Schema, Model } from 'mongoose'

export interface IFabricGallery {
  _id: mongoose.Types.ObjectId
  category: string
  subcategory: string
  mountType?: string
  mountTypeStockStatus?: 'IN_STOCK' | 'OUT_OF_STOCK'
  opacity?: string
  color: string
  collection?: string
  pricingCollectionId?: string
  imageFilename: string
  imageUrl?: string // Cloudinary URL (takes priority over imageFilename)
  cloudinaryPublicId?: string
  width?: string
  minWidth?: string
  maxWidth?: string
  rollLength?: string
  fabricWidth?: number
  createdAt?: Date
  updatedAt?: Date
}

const FabricGallerySchema = new Schema<IFabricGallery>(
  {
    category: { type: String, required: true, trim: true },
    subcategory: { type: String, required: true, trim: true },
    mountType: { type: String, trim: true },
    mountTypeStockStatus: { type: String, enum: ['IN_STOCK', 'OUT_OF_STOCK'] },
    opacity: { type: String, trim: true },
    color: { type: String, required: true, trim: true },
    collection: { type: String, trim: true },
    pricingCollectionId: { type: String, trim: true },
    imageFilename: { type: String, required: true, trim: true, default: 'placeholder.jpg' },
    imageUrl: { type: String, trim: true },
    cloudinaryPublicId: { type: String, trim: true },
    width: { type: String, trim: true },
    minWidth: { type: String, trim: true },
    maxWidth: { type: String, trim: true },
    rollLength: { type: String, trim: true },
    fabricWidth: { type: Number },
  },
  { timestamps: true }
)

const FabricGallery: Model<IFabricGallery> =
  mongoose.models.FabricGallery ||
  mongoose.model<IFabricGallery>('FabricGallery', FabricGallerySchema)

export default FabricGallery
