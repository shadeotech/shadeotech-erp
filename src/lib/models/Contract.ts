import mongoose, { Schema, Document, Model } from 'mongoose'

export type ContractType = 'INTERIOR' | 'EXTERIOR' | 'INTERIOR_AND_EXTERIOR'

export interface IContractAuditEntry {
  action: 'created' | 'sent' | 'opened' | 'viewed' | 'signed' | 'downloaded'
  userId?: string
  userName?: string
  timestamp: Date
  ipAddress?: string
}

export interface IContract extends Document {
  contractNumber: string
  quoteId: string
  quoteNumber: string
  customerId: string
  customerName: string
  contractType: ContractType
  status: 'pending_admin_signature' | 'pending_customer_signature' | 'signed' | 'cancelled'
  adminSignedAt?: Date
  adminSignature?: string
  adminSignatureData?: string
  adminSignedById?: string
  customerSignedAt?: Date
  customerSignature?: string
  customerSignatureData?: string
  installationAddress?: string
  customerFullName?: string
  adminPaymentOption?: '50' | '100' | 'custom'
  adminPaymentAmount?: number
  locked?: boolean
  sentAt?: Date
  images?: string[]
  auditTrail: IContractAuditEntry[]
  createdAt: Date
  updatedAt: Date
}

const ContractAuditEntrySchema = new Schema<IContractAuditEntry>(
  {
    action: { type: String, required: true },
    userId: String,
    userName: String,
    timestamp: { type: Date, required: true, default: Date.now },
    ipAddress: String,
  },
  { _id: false }
)

const ContractSchema = new Schema<IContract>(
  {
    contractNumber: { type: String, required: true, unique: true, trim: true },
    quoteId: { type: String, required: true, trim: true },
    quoteNumber: { type: String, required: true, trim: true },
    customerId: { type: String, required: true, trim: true },
    customerName: { type: String, required: true, trim: true },
    contractType: {
      type: String,
      enum: ['INTERIOR', 'EXTERIOR', 'INTERIOR_AND_EXTERIOR'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending_admin_signature', 'pending_customer_signature', 'signed', 'cancelled'],
      default: 'pending_admin_signature',
      required: true,
    },
    adminSignedAt: Date,
    adminSignature: String,
    adminSignatureData: String,
    adminSignedById: String,
    customerSignedAt: Date,
    customerSignature: String,
    customerSignatureData: String,
    installationAddress: String,
    customerFullName: String,
    adminPaymentOption: { type: String, enum: ['50', '100', 'custom'] },
    adminPaymentAmount: Number,
    locked: { type: Boolean, default: false },
    sentAt: Date,
    images: [String],
    auditTrail: {
      type: [ContractAuditEntrySchema],
      default: [],
    },
  },
  { timestamps: true }
)

// Generate contract number before validation (so required check passes)
ContractSchema.pre('validate', async function (next) {
  if (!this.contractNumber) {
    const year = String(new Date().getFullYear()).slice(-2)
    const count = await mongoose.model('Contract').countDocuments()
    this.contractNumber = `CNT-${year}-${String(count + 1).padStart(4, '0')}`
  }
  next()
})

const Contract: Model<IContract> =
  mongoose.models.Contract || mongoose.model<IContract>('Contract', ContractSchema)

export default Contract
