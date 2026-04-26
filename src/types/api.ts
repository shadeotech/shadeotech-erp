import type { Customer, Quote, Invoice, Payment, Event, User, Task, Note } from './database';

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: Omit<User, 'password'>;
  token: string;
  refreshToken: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: User['role'];
}

// Customer Types
export interface CustomerListParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: Customer['customerType'];
  status?: Customer['status'];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateCustomerRequest {
  customerType: Customer['customerType'];
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  companyName?: string;
  leadSource?: Customer['leadSource'];
  leadSourceDetail?: string;
  referredById?: string;
  numberOfWindows?: number;
  numberOfOpenings?: number;
  productsOfInterest?: string[];
  partnerType?: Customer['partnerType'];
  companyType?: Customer['companyType'];
}

export interface UpdateCustomerRequest extends Partial<CreateCustomerRequest> {}

// Quote Types
export interface QuoteListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: Quote['status'];
  customerId?: string;
}

export interface CreateQuoteRequest {
  customerId: string;
  items: Array<{
    productName: string;
    description?: string;
    category: string;
    width: number;
    length: number;
    unitPrice: number;
    quantity: number;
    fabricImage?: string;
    cassetteImage?: string;
  }>;
  taxRate?: number;
  notes?: string;
  terms?: string;
  expiryDate?: Date;
}

export interface UpdateQuoteRequest extends Partial<CreateQuoteRequest> {
  status?: Quote['status'];
}

// Invoice Types
export interface InvoiceListParams {
  page?: number;
  limit?: number;
  status?: Invoice['status'];
  customerId?: string;
}

export interface CreateInvoiceRequest {
  quoteId?: string;
  customerId: string;
  items: Quote['items'];
  dueDate?: Date;
  lateFeeEnabled?: boolean;
  lateFeePerDay?: number;
  notes?: string;
}

// Payment Types
export interface PaymentListParams {
  page?: number;
  limit?: number;
  status?: Payment['paymentStatus'];
  customerId?: string;
  invoiceId?: string;
}

export interface CreatePaymentRequest {
  invoiceId?: string;
  customerId: string;
  amount: number;
  paymentMethod: Payment['paymentMethod'];
  notes?: string;
}

// Event Types
export interface EventListParams {
  start?: Date;
  end?: Date;
  eventType?: Event['eventType'];
  assignedToId?: string;
}

export interface CreateEventRequest {
  title: string;
  description?: string;
  eventType: Event['eventType'];
  startDateTime: Date;
  endDateTime: Date;
  allDay?: boolean;
  location?: string;
  commuteTime?: number;
  consultationType?: Event['consultationType'];
  numberOfWindows?: number;
  numberOfOpenings?: number;
  productsOfInterest?: string[];
  isCompany?: boolean;
  customerId: string;
  assignedToId: string;
}

// Task Types
export interface TaskListParams {
  page?: number;
  limit?: number;
  status?: Task['status'];
  priority?: Task['priority'];
  assignedToId?: string;
  customerId?: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  priority: Task['priority'];
  dueDate?: Date;
  customerId?: string;
  assignedToId?: string;
}

// Note Types
export interface CreateNoteRequest {
  content: string;
  noteType: Note['noteType'];
  customerId: string;
}

// Dashboard Stats
export interface DashboardStats {
  totalCustomers: number;
  customersChange: number;
  activeQuotes: number;
  quotesConversionRate: number;
  pendingPayments: number;
  pendingPaymentsAmount: number;
  todayAppointments: number;
}

// Stripe Types
export interface CreatePaymentIntentRequest {
  amount: number;
  customerId: string;
  invoiceId?: string;
}

export interface CreatePaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
}

