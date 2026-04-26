import mongoose, { Schema, Model } from 'mongoose'

export interface IAddOn {
  _id: mongoose.Types.ObjectId
  name: string
  price: number
  description: string
  createdAt?: Date
  updatedAt?: Date
}

const AddOnSchema = new Schema<IAddOn>(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    description: { type: String, default: '', trim: true },
  },
  { timestamps: true }
)

const AddOn: Model<IAddOn> =
  mongoose.models.AddOn || mongoose.model<IAddOn>('AddOn', AddOnSchema)

export default AddOn
