export type PaymentStatus = 'PAID' | 'PARTIALLY_PAID'

export type PaymentMethod =
  | 'Credit Card'
  | 'ACH'
  | 'Check'
  | 'Financing'
  | 'Zelle'
  | 'Cash'

export interface Payment {
  id: string
  paymentNumber: string
  customerName: string
  sideMark: string
  amount: number
  status: PaymentStatus
  method: PaymentMethod
  date: string
  quoteId?: string
  invoiceId?: string
}

export const mockPayments: Payment[] = [
  {
    id: 'pay_001',
    paymentNumber: 'PAY-2025-001',
    customerName: 'John Smith',
    sideMark: 'SH-R12345',
    amount: 2500,
    status: 'PARTIALLY_PAID',
    method: 'Credit Card',
    date: '2025-01-10',
    quoteId: 'Q-1001',
    invoiceId: 'INV-1001',
  },
  {
    id: 'pay_002',
    paymentNumber: 'PAY-2025-002',
    customerName: 'ABC Corp',
    sideMark: 'SH-C23456',
    amount: 8200,
    status: 'PAID',
    method: 'ACH',
    date: '2025-01-12',
    quoteId: 'Q-1002',
    invoiceId: 'INV-1002',
  },
  {
    id: 'pay_003',
    paymentNumber: 'PAY-2025-003',
    customerName: 'XYZ Inc',
    sideMark: 'SH-C45678',
    amount: 4300,
    status: 'PAID',
    method: 'Check',
    date: '2025-01-15',
    invoiceId: 'INV-1003',
  },
  {
    id: 'pay_004',
    paymentNumber: 'PAY-2025-004',
    customerName: 'Bright Dental Group',
    sideMark: 'SHC-LL54321',
    amount: 3000,
    status: 'PARTIALLY_PAID',
    method: 'Financing',
    date: '2025-01-18',
    invoiceId: 'INV-1004',
  },
]


