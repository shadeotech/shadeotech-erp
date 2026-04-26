import mongoose, { Schema, Model } from 'mongoose'

export interface ProductionSheetRow {
  [columnKey: string]: string
}

export interface ProductionSheet {
  _id?: mongoose.Types.ObjectId
  name: string
  productType: string
  operation: 'MANUAL' | 'MOTORIZED'
  columns: string[]
  rows: ProductionSheetRow[]
  createdAt?: Date
  updatedAt?: Date
}

const ProductionSheetRowSchema = new Schema(
  {},
  { _id: false, strict: false }
)

const ProductionSheetSchema = new Schema<ProductionSheet>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    productType: {
      type: String,
      required: true,
      trim: true,
    },
    operation: {
      type: String,
      enum: ['MANUAL', 'MOTORIZED'],
      required: true,
    },
    columns: {
      type: [String],
      default: ['Serial', 'QTY', 'Area', 'Width', 'Height', 'Cord', 'POS', 'SHADES', 'Fascia', 'Tube', 'Bottom Rail', 'Fabric W', 'Fabric H'],
    },
    rows: {
      type: [ProductionSheetRowSchema],
      default: [],
    },
  },
  { timestamps: true }
)

const ProductionSheetModel: Model<ProductionSheet> =
  mongoose.models.ProductionSheet ||
  mongoose.model<ProductionSheet>('ProductionSheet', ProductionSheetSchema)

export default ProductionSheetModel
