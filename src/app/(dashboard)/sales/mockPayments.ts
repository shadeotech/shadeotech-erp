export type PaymentMethod = 'Credit Card' | 'ACH' | 'Check' | 'Zelle' | 'Financing'

export interface Payment {
  id: string
  paymentNumber: string
  invoiceId: string
  invoiceNumber?: string
  customerId: string
  customerName: string
  sideMark: string
  amount: number
  date: string
  method: PaymentMethod
}

export const mockPayments: Payment[] = [
  {
    id: 'PAY-1001',
    paymentNumber: 'PAY-2024-001',
    invoiceId: 'INV-1001',
    invoiceNumber: 'INV-2024-001',
    customerId: 'cust_001',
    customerName: 'John Smith',
    sideMark: 'SH-R12345',
    amount: 1000,
    date: '2025-01-20',
    method: 'Credit Card',
  },
  {
    id: 'PAY-1002',
    paymentNumber: 'PAY-2024-002',
    invoiceId: 'INV-1002',
    invoiceNumber: 'INV-2024-002',
    customerId: 'cust_003',
    customerName: 'ABC Corp',
    sideMark: 'SH-C23456',
    amount: 13531.25,
    date: '2025-01-18',
    method: 'Check',
  },
  {
    id: 'PAY-1003',
    paymentNumber: 'PAY-2024-003',
    invoiceId: 'INV-1001',
    invoiceNumber: 'INV-2024-001',
    customerId: 'cust_001',
    customerName: 'John Smith',
    sideMark: 'SH-R12345',
    amount: 1000,
    date: '2025-01-22',
    method: 'ACH',
  },
  {
    id: 'PAY-1004',
    paymentNumber: 'PAY-2024-004',
    invoiceId: 'INV-1004',
    invoiceNumber: 'INV-2024-004',
    customerId: 'cust_005',
    customerName: 'XYZ Inc',
    sideMark: 'SH-C45678',
    amount: 5000,
    date: '2025-01-15',
    method: 'Financing',
  },
]

