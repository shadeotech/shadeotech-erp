import mongoose, { Schema, Model } from 'mongoose';

export interface IPurchaseOrderItem {
  itemType: string;
  itemId?: mongoose.Types.ObjectId;
  itemName: string;
  itemCode?: string;
  unitType: string;
  qtyOrdered: number;
  qtyReceived: number;
  fullyReceived: boolean;
  forceClosed: boolean;
  invoiceDate?: Date;
  invoiceNo?: string;
  invoiceFileUrl?: string;
  receivedBy?: string;
  lineNotes?: string;
}

export interface IPurchaseOrder {
  _id: mongoose.Types.ObjectId;
  poNumber: string;
  supplier: string;
  orderDate: Date;
  status: 'DRAFT' | 'SENT' | 'PARTIALLY_RECEIVED' | 'FULLY_RECEIVED';
  notes?: string;
  items: IPurchaseOrderItem[];
  createdAt?: Date;
  updatedAt?: Date;
}

const PurchaseOrderItemSchema = new Schema<IPurchaseOrderItem>(
  {
    itemType: { type: String, required: true, trim: true },
    itemId: { type: Schema.Types.ObjectId },
    itemName: { type: String, required: true, trim: true },
    itemCode: { type: String, trim: true },
    unitType: { type: String, default: 'Each', trim: true },
    qtyOrdered: { type: Number, required: true },
    qtyReceived: { type: Number, default: 0 },
    fullyReceived: { type: Boolean, default: false },
    forceClosed: { type: Boolean, default: false },
    invoiceDate: { type: Date },
    invoiceNo: { type: String, trim: true },
    invoiceFileUrl: { type: String, trim: true },
    receivedBy: { type: String, trim: true },
    lineNotes: { type: String, trim: true },
  },
  { _id: true }
);

const PurchaseOrderSchema = new Schema<IPurchaseOrder>(
  {
    poNumber: { type: String, required: true, unique: true, trim: true },
    supplier: { type: String, required: true, trim: true },
    orderDate: { type: Date, required: true, default: Date.now },
    status: {
      type: String,
      enum: ['DRAFT', 'SENT', 'PARTIALLY_RECEIVED', 'FULLY_RECEIVED'],
      default: 'DRAFT',
    },
    notes: { type: String, trim: true },
    items: [PurchaseOrderItemSchema],
  },
  { timestamps: true }
);

const PurchaseOrder: Model<IPurchaseOrder> =
  mongoose.models.PurchaseOrder ||
  mongoose.model<IPurchaseOrder>('PurchaseOrder', PurchaseOrderSchema);

export default PurchaseOrder;
