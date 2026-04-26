import mongoose, { Schema, Model } from 'mongoose'

export type ProductionStatus =
  | 'PENDING_APPROVAL'
  | 'READY_FOR_PRODUCTION'
  | 'PRODUCTION_CHECK'
  | 'COMPONENT_CUT'
  | 'FABRIC_CUT'
  | 'ASSEMBLE'
  | 'QUALITY_CHECK'
  | 'PACKING'
  | 'SHIPPED_INSTALLED'

export interface ProductionOrderItem {
  _id?: mongoose.Types.ObjectId
  lineNumber: number
  qty: number
  area: string // e.g., "Bed 1"
  mount: string // e.g., "IS"
  width: string // e.g., "34 1/2"
  length: string // e.g., "70 3/4"
  product: string
  collection?: string
  fabric: string
  cassetteTypeColor: string // e.g., "Square Cassette, Black Exposed"
  bottomRail: string // e.g., "Sealed"
  sideChain: string // e.g., "U channel"
  operation: 'MANUAL' | 'MOTORIZED'
  
  // Motorized specific
  motor?: string
  motorType?: string
  remoteControl?: string
  remoteNumber?: string
  channelNumber?: string
  
  // Manual specific
  cordChain?: string
  cordChainColor?: string
  
  // Accessories
  accessories?: string
  smartAccessories?: string
  smartAccessoriesType?: string
  brackets?: string
  
  // Production sheet assignment
  productionSheetId?: string
  productionSheetName?: string
  
  // Images from quote
  fabricImage?: string
  cassetteImage?: string
  
  // Dealer portal fields
  roomType?: string
  widthWhole?: number
  widthDecimal?: string
  lengthWhole?: number
  lengthDecimal?: string
  controlType?: string
  chainCord?: string
  controlColor?: string
  controlSide?: string
  cassetteColor?: string
  cassetteWrapped?: boolean
  bottomRailType?: string
  bottomRailColor?: string
  options?: string
  sequence?: string
  // Simple per-item checklist flag for production/orders UI
  checklistDone?: boolean
}

export interface StageCompletion {
  status: ProductionStatus
  completedBy: string
  completedAt: Date
}

export interface OrderNote {
  _id?: mongoose.Types.ObjectId
  content: string
  createdBy: string
  createdByName: string
  createdAt: Date
}

export interface CutPiece {
  _id?: mongoose.Types.ObjectId
  fabric: string
  width: number
  length: number
}

export interface BOMItem {
  _id?: mongoose.Types.ObjectId
  supplyName: string
  quantity: number
  unit: string
}

export interface ShippingBox {
  _id?: mongoose.Types.ObjectId
  width: number
  length: number
  height: number
  weight: number
}

export interface ActivityLog {
  _id?: mongoose.Types.ObjectId
  action: string
  user: string
  userName: string
  timestamp: Date
  details?: string
}

export interface ProductionOrder {
  _id?: mongoose.Types.ObjectId
  orderNumber: string
  quoteId?: string
  invoiceId?: string
  customerId: string
  customerName: string
  dealerId?: string // ID of dealer who placed the order
  dealerName?: string // Name of dealer who placed the order
  sideMark?: string
  
  // Dates
  orderDate: Date
  approvalDate?: Date
  installationDate?: Date
  
  // Status tracking
  status: ProductionStatus
  
  // Stage completion tracking
  stageCompletions?: StageCompletion[]
  
  // From quote/order
  items: ProductionOrderItem[]
  totalShades: number
  products?: string[]
  notes?: string
  images?: (string | { url: string; category: string })[]
  deliveryMethod?: 'INSTALLATION' | 'PICKUP' | 'SHIPPING'

  // Production workflow data
  orderNotes?: OrderNote[]
  cutPieces?: CutPiece[]
  bom?: BOMItem[]
  shipping?: ShippingBox[]
  activity?: ActivityLog[]
  
  createdAt?: Date
  updatedAt?: Date
}

const ProductionOrderItemSchema = new Schema<ProductionOrderItem>(
  {
    lineNumber: { type: Number, required: true },
    qty: { type: Number, required: true, default: 1 },
    area: { type: String, default: '' },
    mount: { type: String, default: '' },
    width: { type: String, required: true, default: '0' },
    length: { type: String, required: true, default: '0' },
    product: { type: String, required: true, default: '' },
    collection: { type: String },
    fabric: { type: String, default: '' },
    cassetteTypeColor: { type: String, default: '' },
    // Note: mount and bottomRail validation is enforced at the application layer (handleSaveDraft)
    bottomRail: { type: String, default: '' },
    sideChain: { type: String, required: false, default: '' },
    operation: { type: String, enum: ['MANUAL', 'MOTORIZED'], required: true },
    motor: { type: String },
    motorType: { type: String },
    remoteControl: { type: String },
    remoteNumber: { type: String },
    channelNumber: { type: String },
    cordChain: { type: String },
    cordChainColor: { type: String },
    accessories: { type: String },
    smartAccessories: { type: String },
    smartAccessoriesType: { type: String },
    brackets: { type: String },
    productionSheetId: { type: String },
    productionSheetName: { type: String },
    fabricImage: { type: String },
    cassetteImage: { type: String },
    roomType: { type: String },
    widthWhole: { type: Number },
    widthDecimal: { type: String },
    lengthWhole: { type: Number },
    lengthDecimal: { type: String },
    controlType: { type: String },
    chainCord: { type: String },
    controlColor: { type: String },
    controlSide: { type: String },
    cassetteColor: { type: String },
    cassetteWrapped: { type: Boolean },
    bottomRailType: { type: String },
    bottomRailColor: { type: String },
    options: { type: String },
    sequence: { type: String, default: '' },
    // Simple per-item checklist flag for production/orders UI
    checklistDone: { type: Boolean, default: false },
  },
  { _id: true }
)

const StageCompletionSchema = new Schema<StageCompletion>(
  {
    status: {
      type: String,
      enum: [
        'PENDING_APPROVAL',
        'READY_FOR_PRODUCTION',
        'PRODUCTION_CHECK',
        'COMPONENT_CUT',
        'FABRIC_CUT',
        'ASSEMBLE',
        'QUALITY_CHECK',
        'PACKING',
        'SHIPPED_INSTALLED',
      ],
      required: true,
    },
    completedBy: { type: String, required: true },
    completedAt: { type: Date, required: true },
  },
  { _id: false }
)

const OrderNoteSchema = new Schema<OrderNote>(
  {
    content: { type: String, required: true },
    createdBy: { type: String, required: true },
    createdByName: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
)

const CutPieceSchema = new Schema<CutPiece>(
  {
    fabric: { type: String, required: true, default: '' },
    width: { type: Number, required: true, default: 0 },
    length: { type: Number, required: true, default: 0 },
  },
  { _id: true }
)

const BOMItemSchema = new Schema<BOMItem>(
  {
    supplyName: { type: String, required: true, default: '' },
    quantity: { type: Number, required: true, default: 0 },
    unit: { type: String, required: true, default: 'pieces' },
  },
  { _id: true }
)

const ShippingBoxSchema = new Schema<ShippingBox>(
  {
    width: { type: Number, required: true, default: 0 },
    length: { type: Number, required: true, default: 0 },
    height: { type: Number, required: true, default: 0 },
    weight: { type: Number, required: true, default: 0 },
  },
  { _id: true }
)

const ActivityLogSchema = new Schema<ActivityLog>(
  {
    action: { type: String, required: true },
    user: { type: String, required: true },
    userName: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    details: { type: String },
  },
  { _id: true }
)

const ProductionOrderSchema = new Schema<ProductionOrder>(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    quoteId: { type: String, trim: true },
    invoiceId: { type: String, trim: true },
    customerId: { type: String, required: true },
    customerName: { type: String, required: true, trim: true },
    dealerId: { type: String },
    dealerName: { type: String, trim: true },
    sideMark: { type: String, trim: true },
    orderDate: { type: Date, required: true, default: Date.now },
    approvalDate: { type: Date },
    installationDate: { type: Date },
    status: {
      type: String,
      enum: [
        'PENDING_APPROVAL',
        'READY_FOR_PRODUCTION',
        'PRODUCTION_CHECK',
        'COMPONENT_CUT',
        'FABRIC_CUT',
        'ASSEMBLE',
        'QUALITY_CHECK',
        'PACKING',
        'SHIPPED_INSTALLED',
      ],
      default: 'PENDING_APPROVAL',
      required: true,
    },
    stageCompletions: [StageCompletionSchema],
    items: [ProductionOrderItemSchema],
    totalShades: { type: Number, required: true },
    products: [String],
    notes: { type: String },
    images: [Schema.Types.Mixed],
    deliveryMethod: { type: String, enum: ['INSTALLATION', 'PICKUP', 'SHIPPING'], default: 'INSTALLATION' },
    orderNotes: [OrderNoteSchema],
    cutPieces: [CutPieceSchema],
    bom: [BOMItemSchema],
    shipping: [ShippingBoxSchema],
    activity: [ActivityLogSchema],
  },
  {
    timestamps: true,
  }
)

// Generate order number before validation (must run before required check)
ProductionOrderSchema.pre('validate', async function (next) {
  if (!this.orderNumber) {
    const count = await mongoose.model('ProductionOrder').countDocuments()
    this.orderNumber = `ORD-${String(count + 1).padStart(3, '0')}`
  }
  next()
})

// Prevent re-compilation during development
const ProductionOrderModel: Model<ProductionOrder> =
  mongoose.models.ProductionOrder ||
  mongoose.model<ProductionOrder>('ProductionOrder', ProductionOrderSchema)

export default ProductionOrderModel
