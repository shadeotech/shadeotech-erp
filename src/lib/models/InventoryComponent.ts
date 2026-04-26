import mongoose, { Schema, Model } from 'mongoose';

export interface IInventoryComponent {
  _id: mongoose.Types.ObjectId;
  name: string;
  type: string;
  quantity: number;
  unit: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const InventoryComponentSchema = new Schema<IInventoryComponent>(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, required: true, trim: true },
    quantity: { type: Number, default: 0 },
    unit: { type: String, trim: true, default: 'pieces' },
  },
  { timestamps: true }
);

const InventoryComponent: Model<IInventoryComponent> =
  mongoose.models.InventoryComponent ||
  mongoose.model<IInventoryComponent>('InventoryComponent', InventoryComponentSchema);

export default InventoryComponent;
