export interface QuoteItem {
  product: string
  width: number
  height: number
  price: number
}

export interface Quote {
  id: string
  customerId: string
  status: 'Draft' | 'Sent' | 'Pending' | 'Accepted' | 'Lost'
  total: number
  expiryDate: string
  createdAt: string
  items: QuoteItem[]
  customerName?: string
  sideMark?: string
}

export const mockQuotes: Quote[] = [
  {
    id: 'Q-1001',
    customerId: 'cust_001',
    status: 'Sent',
    total: 4200,
    expiryDate: '2025-12-30',
    createdAt: '2025-01-15',
    customerName: 'John Smith',
    sideMark: 'SH-R12345',
    items: [
      {
        product: 'Roller Blind',
        width: 120,
        height: 200,
        price: 800,
      },
      {
        product: 'Venetian Blinds',
        width: 150,
        height: 180,
        price: 1200,
      },
      {
        product: 'Roman Shades',
        width: 100,
        height: 150,
        price: 2200,
      },
    ],
  },
  {
    id: 'Q-1002',
    customerId: 'cust_002',
    status: 'Draft',
    total: 3500,
    expiryDate: '2025-12-25',
    createdAt: '2025-01-20',
    customerName: 'Jane Smith',
    sideMark: 'SH-R23456',
    items: [
      {
        product: 'Cellular Shades',
        width: 140,
        height: 190,
        price: 3500,
      },
    ],
  },
  {
    id: 'Q-1003',
    customerId: 'cust_003',
    status: 'Accepted',
    total: 5600,
    expiryDate: '2025-12-20',
    createdAt: '2025-01-10',
    customerName: 'Michael Johnson',
    sideMark: 'SH-R34567',
    items: [
      {
        product: 'Shutters',
        width: 200,
        height: 220,
        price: 5600,
      },
    ],
  },
  {
    id: 'Q-1004',
    customerId: 'cust_004',
    status: 'Pending',
    total: 2800,
    expiryDate: '2025-12-28',
    createdAt: '2025-01-18',
    customerName: 'Sarah Williams',
    sideMark: 'SH-R45678',
    items: [
      {
        product: 'Zebra Blinds',
        width: 130,
        height: 170,
        price: 2800,
      },
    ],
  },
  {
    id: 'Q-1005',
    customerId: 'cust_005',
    status: 'Lost',
    total: 1900,
    expiryDate: '2025-12-15',
    createdAt: '2025-01-05',
    customerName: 'David Brown',
    sideMark: 'SH-R56789',
    items: [
      {
        product: 'Drapes',
        width: 110,
        height: 160,
        price: 1900,
      },
    ],
  },
]

