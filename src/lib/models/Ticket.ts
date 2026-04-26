import mongoose, { Schema, Model } from 'mongoose'

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
export type TicketSource = 'SHADEOTECH_CUSTOMER' | 'AT_SHADES' | 'AT_SHADES_FRANCHISEE'

export interface Ticket {
  _id?: mongoose.Types.ObjectId
  ticketNumber: string // e.g., TKT-001
  subject: string
  description: string
  status: TicketStatus
  priority: TicketPriority
  source: TicketSource
  customerId: string // Reference to customer/user
  customerName: string
  assignedTo?: string // Staff member ID
  assignedToName?: string // Staff member name
  orderNumber: string // Required order reference
  createdAt?: Date
  updatedAt?: Date
}

const TicketSchema = new Schema<Ticket>(
  {
    ticketNumber: {
      type: String,
      required: false, // Will be generated if not provided
      unique: true,
      trim: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
      default: 'OPEN',
      required: true,
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      default: 'MEDIUM',
      required: true,
    },
    source: {
      type: String,
      enum: ['SHADEOTECH_CUSTOMER', 'AT_SHADES', 'AT_SHADES_FRANCHISEE'],
      required: true,
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
    assignedTo: {
      type: String,
      trim: true,
    },
    assignedToName: {
      type: String,
      trim: true,
    },
    orderNumber: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
)

// Generate ticket number before saving
TicketSchema.pre('save', async function (next) {
  if (!this.ticketNumber) {
    const count = await mongoose.model('Ticket').countDocuments()
    this.ticketNumber = `TKT-${String(count + 1).padStart(3, '0')}`
  }
  next()
})

// Prevent re-compilation during development
const TicketModel: Model<Ticket> =
  mongoose.models.Ticket ||
  mongoose.model<Ticket>('Ticket', TicketSchema)

export default TicketModel
