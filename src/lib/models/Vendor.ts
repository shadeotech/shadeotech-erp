import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IVendor extends Document {
  name: string
  email?: string
  phone?: string
  address?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

const VendorSchema = new Schema<IVendor>(
  {
    name:    { type: String, required: true, trim: true },
    email:   { type: String, trim: true, lowercase: true },
    phone:   { type: String, trim: true },
    address: { type: String, trim: true },
    notes:   { type: String, trim: true },
  },
  { timestamps: true }
)

const Vendor: Model<IVendor> =
  mongoose.models.Vendor || mongoose.model<IVendor>('Vendor', VendorSchema)

export default Vendor
