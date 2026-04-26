import mongoose, { Schema, Model } from 'mongoose'

export type QuoteStatus = 'DRAFT' | 'SENT' | 'NEGOTIATION' | 'POSTPONED' | 'WON' | 'LOST' | 'EXPIRED'

export interface QuoteItem {
  id?: string
  productName: string
  category: string
  subcategory?: string
  subSubcategory?: string
  width: number // in inches
  length: number // in inches
  area: number
  unitPrice: number
  quantity: number
  totalPrice: number
  basePrice?: number // Base price before adjustments and tax
  manualPriceOverride?: number // Manual price override if set
  fabricImage?: string
  cassetteImage?: string
  componentImage?: string
  collectionId?: string
  fabricId?: string
  cassetteType?: string
  cassetteColor?: string
  fabricWrap?: 'same' | 'other' | 'none'
  fabricWrapImage?: string
  // Product configuration options (per line item)
  roomType?: string
  controlType?: string // Operation: Motorized, Battery Powered, AC 12V/24V, AC 110 V, Wand Motor, Chain, Cord, Cordless, Wand
  controlChain?: string // 2nd dropdown: channel (CH,1-16), chain color, cord color, wand type
  controlChainColor?: string // legacy — kept for backward compat
  controlChainSide?: string // 3rd dropdown: R/L or wand custom length
  mountType?: string // Inside / Outside
  bottomRailType?: string
  bottomRailColor?: string
  sideChannel?: string
  sideChannelColor?: string
  solarPanel?: string
  bottomRailSealType?: string
  sequenceImage?: string
  roll?: string
  brackets?: string
  brackets2?: string
  stacks?: string
  springAssist?: string
  sequence?: string
  remoteNumber?: string
}

export interface QuoteHistoryEntry {
  status: QuoteStatus | 'CREATED'
  timestamp: Date
  note?: string
}

export interface QuoteAddOn {
  addOnId: string
  name: string
  pricePerFabric: number
  fabricCount: number
  total: number
  /** When set, total = pricePerFabric * quantity (per-unit). When absent, total = pricePerFabric * fabricCount (per-fabric). */
  quantity?: number
}

export interface Quote {
  _id?: mongoose.Types.ObjectId
  quoteNumber: string
  customerId: string
  customerName: string
  sideMark?: string
  status: QuoteStatus
  items: QuoteItem[]
  subtotal: number
  taxRate: number
  taxAmount: number
  totalAmount: number
  createdAt?: Date
  expiryDate?: Date
  notes?: string
  priceAdjustPercent: number
  priceAdjustFlat: number
  contractType?: 'INTERIOR' | 'EXTERIOR' | 'INTERIOR_AND_EXTERIOR'
  isFranchisee?: boolean
  visuals?: {
    coverPage?: boolean
    fabricImage?: string
    cassetteImage?: string
    componentImage?: string
  }
  history: QuoteHistoryEntry[]
  createdById: string
  updatedAt?: Date
  addOns?: QuoteAddOn[]
  // New fields from redesign
  referenceNumber?: string
  saleAgent?: string
  discountType?: string // 'No discount', 'Percentage', 'Fixed'
  discountValue?: number
  adminNote?: string
  installationAmount?: number
  shipToStreet?: string
  shipToCity?: string
  shipToState?: string
  shipToPostcode?: string
  shipToCountry?: string
  dealerId?: string
  deliveryMethod?: 'PICK_UP' | 'SHIPPED' | 'INSTALLED'
  shippingCost?: number
}

const QuoteAddOnSchema = new Schema<QuoteAddOn>(
  {
    addOnId: { type: String, required: true },
    name: { type: String, required: true },
    pricePerFabric: { type: Number, required: true },
    fabricCount: { type: Number, required: true },
    total: { type: Number, required: true },
    quantity: { type: Number },
  },
  { _id: false }
)

const QuoteItemSchema = new Schema<QuoteItem>(
  {
    productName: { type: String, required: true },
    category: { type: String, required: true },
    subcategory: { type: String },
    subSubcategory: { type: String },
    width: { type: Number, required: true },
    length: { type: Number, required: true },
    area: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    quantity: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    basePrice: { type: Number },
    manualPriceOverride: { type: Number },
    fabricImage: { type: String },
    cassetteImage: { type: String },
    componentImage: { type: String },
    collectionId: { type: String },
    fabricId: { type: String },
    cassetteType: { type: String },
    cassetteColor: { type: String },
    fabricWrap: { type: String },
    fabricWrapImage: { type: String },
    roomType: { type: String },
    controlType: { type: String },
    controlChain: { type: String },
    controlChainColor: { type: String },
    controlChainSide: { type: String },
    mountType: { type: String },
    bottomRailType: { type: String },
    bottomRailColor: { type: String },
    sideChannel: { type: String },
    sideChannelColor: { type: String },
    solarPanel: { type: String },
    bottomRailSealType: { type: String },
    sequenceImage: { type: String },
    roll: { type: String },
    brackets: { type: String },
    brackets2: { type: String },
    stacks: { type: String },
    springAssist: { type: String },
    sequence: { type: String },
    id: { type: String },
    remoteNumber: { type: String },
  },
  { _id: false }
)

const QuoteHistoryEntrySchema = new Schema<QuoteHistoryEntry>(
  {
    status: { type: String, required: true },
    timestamp: { type: Date, required: true, default: Date.now },
    note: { type: String },
  },
  { _id: false }
)

const QuoteSchema = new Schema<Quote>(
  {
    quoteNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    customerId: {
      type: String,
      required: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    sideMark: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'SENT', 'NEGOTIATION', 'POSTPONED', 'WON', 'LOST', 'EXPIRED'],
      default: 'DRAFT',
      required: true,
    },
    items: {
      type: [QuoteItemSchema],
      default: [],
    },
    subtotal: {
      type: Number,
      required: true,
      default: 0,
    },
    taxRate: {
      type: Number,
      required: true,
      default: 0,
    },
    taxAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    expiryDate: {
      type: Date,
    },
    notes: {
      type: String,
    },
    priceAdjustPercent: {
      type: Number,
      default: 0,
    },
    priceAdjustFlat: {
      type: Number,
      default: 0,
    },
    contractType: {
      type: String,
      enum: ['INTERIOR', 'EXTERIOR', 'INTERIOR_AND_EXTERIOR'],
    },
    isFranchisee: {
      type: Boolean,
      default: false,
    },
    visuals: {
      coverPage: { type: Boolean },
      fabricImage: { type: String },
      cassetteImage: { type: String },
      componentImage: { type: String },
    },
    history: {
      type: [QuoteHistoryEntrySchema],
      default: [],
    },
    createdById: {
      type: String,
      required: true,
    },
    addOns: {
      type: [QuoteAddOnSchema],
      default: [],
    },
    referenceNumber: { type: String, trim: true },
    saleAgent: { type: String, trim: true },
    discountType: { type: String, trim: true },
    discountValue: { type: Number },
    adminNote: { type: String },
    installationAmount: { type: Number, default: 0 },
    shipToStreet: { type: String, trim: true },
    shipToCity: { type: String, trim: true },
    shipToState: { type: String, trim: true },
    shipToPostcode: { type: String, trim: true },
    shipToCountry: { type: String, trim: true },
    dealerId: { type: String },
    deliveryMethod: { type: String, enum: ['PICK_UP', 'SHIPPED', 'INSTALLED'] },
    shippingCost: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
)

// Generate quote number before saving
QuoteSchema.pre('save', async function (next) {
  if (!this.quoteNumber) {
    const year = String(new Date().getFullYear()).slice(-2)
    const count = await mongoose.model('Quote').countDocuments()
    this.quoteNumber = `QT-${year}-${String(count + 1).padStart(4, '0')}`
  }
  
  // Initialize history if empty
  if (!this.history || this.history.length === 0) {
    this.history = [
      { status: 'CREATED', timestamp: new Date() },
      { status: this.status, timestamp: new Date() },
    ]
  }
  
  next()
})

// Prevent re-compilation during development
const QuoteModel: Model<Quote> =
  mongoose.models.Quote || mongoose.model<Quote>('Quote', QuoteSchema)

export default QuoteModel
