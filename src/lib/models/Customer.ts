import mongoose, { Schema, Model } from 'mongoose';
import type { Customer as CustomerType } from '@/types/database';

const CustomerFileSchema = new Schema(
  {
    name: { type: String, required: true },
    url: { type: String, required: true },
    publicId: { type: String },
    category: {
      type: String,
      enum: ['tax_exemption', 'contract', 'invoice', 'other'],
      default: 'other',
    },
    uploadedAt: { type: Date, default: Date.now },
    uploadedBy: { type: String },
  },
  { _id: true }
)

const CustomerContactSchema = new Schema(
  {
    name: { type: String, trim: true },
    relationship: { type: String, trim: true }, // Spouse, Partner, Site Manager, Accountant, Assistant, Other
    phone: { type: String, trim: true },
    mobile: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    notes: { type: String, trim: true },
  },
  { _id: true }
)

const CustomerSchema = new Schema<CustomerType>(
  {
    sideMark: {
      type: String,
      required: true,
      trim: true,
    },
    customerType: {
      type: String,
      enum: ['FRANCHISEE', 'RESIDENTIAL', 'COMMERCIAL', 'PARTNER'],
      required: true,
    },
    status: {
      type: String,
      enum: ['LEAD', 'CONTACTED', 'QUALIFIED', 'CUSTOMER', 'INACTIVE'],
      default: 'LEAD',
    },
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    mobile: { type: String, trim: true },
    fax: { type: String, trim: true },
    address: { type: String, trim: true },
    street: { type: String, trim: true },
    town: { type: String, trim: true },
    city: { type: String, trim: true },
    country: { type: String, trim: true },
    postcode: { type: String, trim: true },
    companyName: { type: String, trim: true },
    contactPerson: { type: String, trim: true },
    ownerName: { type: String, trim: true },
    storeNumber: { type: String, trim: true },
    shippingAddress: { type: String, trim: true },
    leadSource: {
      type: String,
      enum: ['META', 'GOOGLE', 'REFERRAL', 'PARTNER_REFERRAL', 'DOOR_HANGER', 'DOOR_TO_DOOR', 'LINKEDIN', 'VEHICLE', 'WALK_IN', 'OTHER_PAID', 'OTHER_ORGANIC'],
    },
    leadSourceDetail: { type: String, trim: true },
    referredById: { type: Schema.Types.ObjectId, ref: 'Customer' },
    deliveryType: {
      type: String,
      enum: ['DELIVERY_INSTALLATION', 'SHIPMENT', 'PICK_UP'],
    },
    numberOfWindows: { type: Number },
    numberOfOpenings: { type: Number },
    productsOfInterest: [{ type: String }],
    partnerType: {
      type: String,
      enum: ['DESIGNER', 'BUILDER', 'CONTRACTOR', 'DEALER'],
    },
    companyType: {
      type: String,
      enum: ['MEDICAL_OFFICE', 'DENTAL_OFFICE', 'CORPORATE_OFFICE', 'BUSINESS_OFFICE', 'RESTAURANT', 'OTHER'],
    },
    taxExempt: { type: Boolean, default: false },
    files: { type: [CustomerFileSchema], default: [] },
    contacts: { type: [CustomerContactSchema], default: [] },
  },
  { timestamps: true }
);

const Customer: Model<CustomerType> = mongoose.models.Customer || mongoose.model<CustomerType>('Customer', CustomerSchema);

export default Customer;
