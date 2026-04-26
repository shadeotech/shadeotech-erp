import mongoose, { Schema, Model } from 'mongoose';

export interface IInventoryFabric {
  _id: mongoose.Types.ObjectId;
  name: string;
  collection?: string;
  width: number;
  quantity: number;
  product?: string;
  specs?: string;
  image?: string;
  fabricCode?: string;
  colorName?: string;
  colorCode?: string;
  isDuo: boolean;
  duoSpecs?: string;
  lowStockThreshold: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const InventoryFabricSchema = new Schema<IInventoryFabric>(
  {
    name: { type: String, required: true, trim: true },
    collection: { type: String, trim: true },
    width: { type: Number, default: 0 },
    quantity: { type: Number, default: 0 },
    product: { type: String, trim: true },
    specs: { type: String, trim: true },
    image: { type: String, trim: true },
    fabricCode: { type: String, trim: true },
    colorName: { type: String, trim: true },
    colorCode: { type: String, trim: true },
    isDuo: { type: Boolean, default: false },
    duoSpecs: { type: String, trim: true },
    lowStockThreshold: { type: Number, default: 10 },
  },
  { timestamps: true }
);

const InventoryFabric: Model<IInventoryFabric> =
  mongoose.models.InventoryFabric ||
  mongoose.model<IInventoryFabric>('InventoryFabric', InventoryFabricSchema);

export default InventoryFabric;
