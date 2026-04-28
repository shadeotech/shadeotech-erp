import mongoose, { Schema, Model } from 'mongoose'

export interface ICollection {
  _id: mongoose.Types.ObjectId
  name: string
  sortOrder: number
}

export interface ICategory {
  _id: mongoose.Types.ObjectId
  name: string
  visibleInQuote: boolean
  sortOrder: number
  collections: ICollection[]
}

export interface IProduct {
  _id: mongoose.Types.ObjectId
  name: string
  type: 'interior' | 'exterior'
  visibleInQuote: boolean
  sortOrder: number
  categories: ICategory[]
  createdAt?: Date
  updatedAt?: Date
}

const CollectionSchema = new Schema<ICollection>({
  name: { type: String, required: true, trim: true },
  sortOrder: { type: Number, default: 0 },
})

const CategorySchema = new Schema<ICategory>({
  name: { type: String, required: true, trim: true },
  visibleInQuote: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
  collections: { type: [CollectionSchema], default: [] },
})

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    type: { type: String, enum: ['interior', 'exterior'], required: true },
    visibleInQuote: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    categories: { type: [CategorySchema], default: [] },
  },
  { timestamps: true }
)

const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema)

export default Product
