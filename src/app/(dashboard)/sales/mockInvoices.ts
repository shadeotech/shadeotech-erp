export interface InvoiceItem {
  id: string
  productName: string
  description?: string
  category: string
  subcategory?: string
  subSubcategory?: string
  width?: number
  length?: number
  area?: number
  unitPrice: number
  quantity: number
  totalPrice: number
  fabricImage?: string
  cassetteImage?: string
}

export interface Invoice {
  id: string
  invoiceNumber: string
  quoteId?: string
  customerId: string
  customerName: string
  sideMark: string
  totalAmount: number
  paidAmount: number
  dueAmount: number
  subtotal?: number
  taxAmount?: number
  taxRate?: number
  status: 'Unpaid' | 'Partially Paid' | 'Paid' | 'Overdue'
  dueDate: string
  createdAt: string
  items?: InvoiceItem[]
  notes?: string
}

export const mockInvoices: Invoice[] = [
  {
    id: 'INV-1001',
    invoiceNumber: 'INV-2024-001',
    quoteId: 'Q-1003',
    customerId: 'cust_001',
    customerName: 'John Smith',
    sideMark: 'SH-R12345',
    subtotal: 4400,
    taxRate: 10.7,
    taxAmount: 471.25,
    totalAmount: 4871.25,
    paidAmount: 2000,
    dueAmount: 2871.25,
    status: 'Partially Paid',
    dueDate: '2025-02-15',
    createdAt: '2025-01-15',
    items: [
      {
        id: 'item_1',
        productName: 'Motorized Roller Shades',
        description: 'Living room bay window - blackout fabric',
        category: 'Roller Shades',
        subcategory: 'Motorized',
        width: 96,
        length: 84,
        area: 8064,
        unitPrice: 1200,
        quantity: 1,
        totalPrice: 1200,
      },
      {
        id: 'item_2',
        productName: 'Zebra Blinds',
        description: 'Bedroom windows - light filtering',
        category: 'Zebra Blinds',
        subcategory: 'Cordless',
        width: 48,
        length: 72,
        area: 3456,
        unitPrice: 450,
        quantity: 3,
        totalPrice: 1350,
      },
      {
        id: 'item_3',
        productName: 'Roman Shades',
        description: 'Dining room window - linen fabric',
        category: 'Roman Shades',
        subcategory: 'Classic Fold',
        width: 60,
        length: 80,
        area: 4800,
        unitPrice: 850,
        quantity: 2,
        totalPrice: 1700,
      },
      {
        id: 'item_4',
        productName: 'Venetian Blinds',
        description: 'Kitchen window - 2" slats',
        category: 'Venetian Blinds',
        width: 36,
        length: 48,
        area: 1728,
        unitPrice: 150,
        quantity: 1,
        totalPrice: 150,
      },
    ],
    notes: 'Please ensure installation is completed before February 15th. Customer prefers morning installation.',
  },
  {
    id: 'INV-1002',
    invoiceNumber: 'INV-2024-002',
    quoteId: 'Q-1003',
    customerId: 'cust_003',
    customerName: 'Michael Johnson',
    sideMark: 'SH-R34567',
    subtotal: 5060,
    taxRate: 10.7,
    taxAmount: 540,
    totalAmount: 5600,
    paidAmount: 5600,
    dueAmount: 0,
    status: 'Paid',
    dueDate: '2025-02-10',
    createdAt: '2025-01-12',
    items: [
      {
        id: 'item_1',
        productName: 'Plantation Shutters',
        description: 'Full-height shutters with tilt rod',
        category: 'Shutters',
        subcategory: 'Plantation Style',
        width: 72,
        length: 96,
        area: 6912,
        unitPrice: 2530,
        quantity: 2,
        totalPrice: 5060,
      },
    ],
  },
  {
    id: 'INV-1003',
    invoiceNumber: 'INV-2024-003',
    customerId: 'cust_004',
    customerName: 'Jane Doe',
    sideMark: 'SH-R34567',
    subtotal: 3130,
    taxRate: 10.7,
    taxAmount: 334,
    totalAmount: 3464,
    paidAmount: 0,
    dueAmount: 3464,
    status: 'Overdue',
    dueDate: '2025-01-10',
    createdAt: '2025-01-01',
    items: [
      {
        id: 'item_1',
        productName: 'Cellular Shades',
        description: 'Energy-efficient honeycomb shades',
        category: 'Cellular Shades',
        subcategory: 'Double Cell',
        width: 48,
        length: 60,
        area: 2880,
        unitPrice: 380,
        quantity: 4,
        totalPrice: 1520,
      },
      {
        id: 'item_2',
        productName: 'Vertical Blinds',
        description: 'Patio door - 3.5" vanes',
        category: 'Vertical Blinds',
        width: 96,
        length: 84,
        area: 8064,
        unitPrice: 1610,
        quantity: 1,
        totalPrice: 1610,
      },
    ],
    notes: 'OVERDUE - Multiple payment reminders sent. Please contact customer urgently.',
  },
  {
    id: 'INV-1004',
    invoiceNumber: 'INV-2024-004',
    customerId: 'cust_005',
    customerName: 'XYZ Inc',
    sideMark: 'SH-C45678',
    subtotal: 8700,
    taxRate: 10.7,
    taxAmount: 934.25,
    totalAmount: 9634.25,
    paidAmount: 0,
    dueAmount: 9634.25,
    status: 'Unpaid',
    dueDate: '2025-02-28',
    createdAt: '2025-01-20',
    items: [
      {
        id: 'item_1',
        productName: 'Commercial Roller Shades',
        description: 'Office building - solar screen fabric',
        category: 'Roller Shades',
        subcategory: 'Commercial Grade',
        width: 72,
        length: 96,
        area: 6912,
        unitPrice: 580,
        quantity: 15,
        totalPrice: 8700,
      },
    ],
    notes: 'Commercial order for office renovation. Net 30 payment terms.',
  },
]

// Helper function to calculate overdue status
export function calculateInvoiceStatus(invoice: Invoice): Invoice['status'] {
  if (invoice.paidAmount >= invoice.totalAmount) {
    return 'Paid'
  }
  if (invoice.paidAmount > 0) {
    return 'Partially Paid'
  }
  const today = new Date()
  const dueDate = new Date(invoice.dueDate)
  if (dueDate < today) {
    return 'Overdue'
  }
  return 'Unpaid'
}

