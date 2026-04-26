// Types for MongoDB Collections

export interface User {
  _id: string;
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  mobile?: string;
  fax?: string;
  street?: string;
  town?: string;
  city?: string;
  country?: string;
  postcode?: string;
  role: 'ADMIN' | 'STAFF' | 'DEALER' | 'FRANCHISEE' | 'CUSTOMER';
  isActive: boolean;
  permissions?: Record<string, 'no' | 'read' | 'edit' | 'full'>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerContact {
  _id?: string;
  name: string;
  relationship: string;
  phone?: string;
  mobile?: string;
  email?: string;
  notes?: string;
}

export interface CustomerFile {
  _id?: string;
  name: string;
  url: string;
  publicId?: string;
  category: 'tax_exemption' | 'contract' | 'invoice' | 'other';
  uploadedAt: Date;
  uploadedBy?: string;
}

export interface Customer {
  _id: string;
  sideMark: string;
  customerType: 'FRANCHISEE' | 'RESIDENTIAL' | 'COMMERCIAL' | 'PARTNER';
  
  // Common fields
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  fax?: string;
  address?: string;
  street?: string;
  town?: string;
  city?: string;
  country?: string;
  postcode?: string;
  
  // Company-specific
  companyName?: string;
  website?: string;
  contactPerson?: string;
  phoneExtension?: string;
  companyType?: 'MEDICAL_OFFICE' | 'DENTAL_OFFICE' | 'CORPORATE_OFFICE' | 
                'BUSINESS_OFFICE' | 'RESTAURANT' | 'OTHER';
  
  // Franchisee-specific
  ownerName?: string;
  storeNumber?: string;
  shippingAddress?: string;
  
  // Residential/Commercial
  numberOfWindows?: number;
  numberOfOpenings?: number;
  productsOfInterest?: string[];
  
  // Partner-specific
  partnerType?: 'DESIGNER' | 'BUILDER' | 'CONTRACTOR' | 'DEALER';
  
  // Lead tracking
  leadSource?: LeadSource;
  leadSourceDetail?: string;
  referredById?: string;
  
  // Delivery type
  deliveryType?: 'DELIVERY_INSTALLATION' | 'SHIPMENT' | 'PICK_UP';

  /** If true, customer does not pay the 8% tax on orders */
  taxExempt?: boolean;

  /** Uploaded documents for this customer (tax exemption cert, etc.) */
  files?: CustomerFile[];

  /** Additional contacts (spouse, partner, site manager, etc.) */
  contacts?: CustomerContact[];

  status: CustomerStatus;
  
  createdAt: Date;
  updatedAt: Date;
}

export type LeadSource = 
  | 'META' 
  | 'GOOGLE' 
  | 'REFERRAL' 
  | 'PARTNER_REFERRAL' 
  | 'DOOR_HANGER' 
  | 'DOOR_TO_DOOR' 
  | 'LINKEDIN' 
  | 'VEHICLE' 
  | 'WALK_IN' 
  | 'OTHER_PAID' 
  | 'OTHER_ORGANIC';

export type CustomerStatus = 'LEAD' | 'CONTACTED' | 'QUALIFIED' | 'CUSTOMER' | 'INACTIVE';

export type CustomerType = 'FRANCHISEE' | 'RESIDENTIAL' | 'COMMERCIAL' | 'PARTNER';

export interface Event {
  _id: string;
  title: string;
  description?: string;
  eventType: 'CONSULTATION' | 'DELIVERY' | 'INSTALLATION' | 'FOLLOW_UP' | 'MEETING' | 'OTHER';
  
  startDateTime: Date;
  endDateTime: Date;
  allDay: boolean;
  
  location?: string;
  commuteTime?: number;
  
  // Consultation-specific
  consultationType?: 'IN_HOME' | 'SHOWROOM';
  numberOfWindows?: number;
  numberOfOpenings?: number;
  productsOfInterest?: string[];
  isCompany?: boolean;
  
  // Relations
  customerId: string;
  assignedToId: string;
  
  // Microsoft Calendar sync
  msCalendarId?: string;
  isSynced: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface Quote {
  _id: string;
  quoteNumber: string;
  
  customerId: string;
  customer?: Customer;
  
  status: QuoteStatus;
  
  items: QuoteItem[];
  
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  
  expiryDate?: Date;
  
  notes?: string;
  terms?: string;
  
  sentAt?: Date;
  viewedAt?: Date;
  acceptedAt?: Date;
  signedAt?: Date;
  signatureUrl?: string;
  
  createdById: string;
  
  createdAt: Date;
  updatedAt: Date;
}

export type QuoteStatus = 
  | 'DRAFT' 
  | 'SENT' 
  | 'VIEWED' 
  | 'NEGOTIATION' 
  | 'POSTPONED' 
  | 'ACCEPTED' 
  | 'WON' 
  | 'LOST' 
  | 'EXPIRED';

export interface QuoteItem {
  _id?: string;
  productName: string;
  description?: string;
  category: string;
  subcategory?: string;
  subSubcategory?: string;
  
  width: number;
  length: number;
  area: number;
  
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  
  fabricImage?: string;
  cassetteImage?: string;
}

export interface Invoice {
  _id: string;
  invoiceNumber: string;
  
  quoteId?: string;
  customerId: string;
  customer?: Customer;
  
  status: InvoiceStatus;
  
  items: QuoteItem[];
  
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  
  dueDate?: Date;
  
  lateFeeEnabled: boolean;
  lateFeePerDay?: number;
  lateFeeAccrued: number;
  
  notes?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

export type InvoiceStatus = 
  | 'DRAFT' 
  | 'SENT' 
  | 'PARTIALLY_PAID' 
  | 'PAID' 
  | 'OVERDUE' 
  | 'CANCELLED';

export interface Payment {
  _id: string;
  paymentNumber: string;
  
  invoiceId?: string;
  customerId: string;
  customer?: Customer;
  
  amount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  
  stripePaymentId?: string;
  
  transactionDate: Date;
  notes?: string;
  
  recordedById: string;
  
  createdAt: Date;
  updatedAt: Date;
}

export type PaymentMethod = 
  | 'CREDIT_CARD' 
  | 'ACH' 
  | 'CHECK' 
  | 'FINANCING' 
  | 'ZELLE' 
  | 'CASH' 
  | 'OTHER';

export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

export interface Note {
  _id: string;
  content: string;
  noteType: 'NOTE' | 'CALL' | 'TEXT' | 'EMAIL';
  
  customerId: string;
  createdById: string;
  createdBy?: User;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  _id: string;
  title: string;
  description?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  
  dueDate?: Date;
  
  customerId?: string;
  assignedToId?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface File {
  _id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  
  customerId?: string;
  
  uploadedAt: Date;
}

export interface Announcement {
  _id: string;
  title: string;
  content: string;
  visibleTo: ('ADMIN' | 'STAFF' | 'DEALER' | 'FRANCHISEE' | 'CUSTOMER')[];
  isActive: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface PriceChart {
  _id: string;
  category: string;
  minArea: number;
  maxArea: number;
  pricePerSqM: number;
  
  isActive: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface AutomationRule {
  _id: string;
  name: string;
  trigger: string;
  conditions: Record<string, unknown>;
  actions: Record<string, unknown>;
  
  isActive: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailTemplate {
  _id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
  
  createdAt: Date;
  updatedAt: Date;
}

