import mongoose, { Schema, Model } from 'mongoose'

export interface DimensionPricingTable {
  widthValues: number[]
  lengthValues: number[]
  prices: Record<string, Record<string, number>> // [length][width] = price
}

export interface CassettePricingTable {
  widthValues: number[]
  cassetteTypes: string[]
  prices: Record<string, Record<string, number>> // [type][width] = price
}

export interface PricingSubChart {
  id: string
  name: string
  mainTable: DimensionPricingTable
  cassetteTable?: CassettePricingTable
  notes: {
    mainTableNote: string
    cassetteTableNote?: string
  }
  fabrics?: string[]
}

export interface PricingChart {
  _id?: mongoose.Types.ObjectId
  collectionId: string
  collectionName: string
  subCharts?: PricingSubChart[]
  mainTable: DimensionPricingTable
  cassetteTable?: CassettePricingTable
  notes: {
    mainTableNote: string
    cassetteTableNote?: string
  }
  fabrics?: string[]
  createdAt?: Date
  updatedAt?: Date
}

const DimensionPricingTableSchema = new Schema<DimensionPricingTable>(
  {
    widthValues: [Number],
    lengthValues: [Number],
    prices: {
      type: Schema.Types.Mixed,
      required: true,
    },
  },
  { _id: false }
)

const CassettePricingTableSchema = new Schema<CassettePricingTable>(
  {
    widthValues: [Number],
    cassetteTypes: [String],
    prices: {
      type: Schema.Types.Mixed,
      required: false,
    },
  },
  { _id: false }
)

const PricingSubChartSchema = new Schema<PricingSubChart>(
  {
    id: String,
    name: String,
    mainTable: DimensionPricingTableSchema,
    cassetteTable: CassettePricingTableSchema,
    notes: {
      mainTableNote: String,
      cassetteTableNote: String,
    },
    fabrics: [String],
  },
  { _id: false }
)

const PricingChartSchema = new Schema<PricingChart>(
  {
    collectionId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    collectionName: {
      type: String,
      required: true,
      trim: true,
    },
    subCharts: [PricingSubChartSchema],
    mainTable: {
      type: DimensionPricingTableSchema,
      required: true,
    },
    cassetteTable: CassettePricingTableSchema,
    notes: {
      mainTableNote: {
        type: String,
        default: '',
      },
      cassetteTableNote: {
        type: String,
        default: '',
      },
    },
    fabrics: [String],
  },
  {
    timestamps: true,
  }
)

// Prevent re-compilation during development
const PricingChartModel: Model<PricingChart> =
  mongoose.models.PricingChart || mongoose.model<PricingChart>('PricingChart', PricingChartSchema)

export default PricingChartModel
