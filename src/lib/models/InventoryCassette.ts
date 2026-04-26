import mongoose, { Schema, Model } from 'mongoose';

export interface IInventoryCassette {
  _id: mongoose.Types.ObjectId;
  type: 'Square' | 'Round';
  color: string;
  specs: string;
  quantity: number;
  image?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const InventoryCassetteSchema = new Schema<IInventoryCassette>(
  {
    type: { type: String, enum: ['Square', 'Round'], required: true },
    color: { type: String, required: true, trim: true },
    specs: { type: String, trim: true, default: '' },
    quantity: { type: Number, default: 0 },
    image: { type: String, trim: true },
  },
  { timestamps: true }
);

const InventoryCassette: Model<IInventoryCassette> =
  mongoose.models.InventoryCassette ||
  mongoose.model<IInventoryCassette>('InventoryCassette', InventoryCassetteSchema);

export default InventoryCassette;
