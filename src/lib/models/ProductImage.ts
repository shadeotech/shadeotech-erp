import mongoose, { Schema, Model } from 'mongoose'

export interface ProductImage {
  _id?: mongoose.Types.ObjectId
  collectionId: string
  name: string
  imageUrl?: string
  publicId?: string
  sortOrder?: number
  updatedAt?: Date
}

const ProductImageSchema = new Schema<ProductImage>(
  {
    collectionId: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    imageUrl: { type: String, default: '' },
    publicId: { type: String, default: '' },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
)

const ProductImageModel: Model<ProductImage> =
  mongoose.models.ProductImage ||
  mongoose.model<ProductImage>('ProductImage', ProductImageSchema)

export default ProductImageModel
