import mongoose, { Schema, Model } from 'mongoose';

export interface IInventoryCutPiece {
  _id: mongoose.Types.ObjectId;
  fabric: string;
  fabricId?: mongoose.Types.ObjectId;
  label?: string;
  width: number;
  length: number;
  quantity: number;
  unit: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const InventoryCutPieceSchema = new Schema<IInventoryCutPiece>(
  {
    fabric: { type: String, required: true, trim: true },
    fabricId: { type: Schema.Types.ObjectId, ref: 'InventoryFabric' },
    label: { type: String, trim: true },
    width: { type: Number, required: true },
    length: { type: Number, required: true },
    quantity: { type: Number, default: 1 },
    unit: { type: String, default: 'mm', trim: true },
  },
  { timestamps: true }
);

const InventoryCutPiece: Model<IInventoryCutPiece> =
  mongoose.models.InventoryCutPiece ||
  mongoose.model<IInventoryCutPiece>('InventoryCutPiece', InventoryCutPieceSchema);

export default InventoryCutPiece;
