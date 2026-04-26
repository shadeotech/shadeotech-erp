export type InvoiceTemplate = 'minimal' | 'modern' | 'classic' | 'estimate-style'

export interface CustomRow {
  id: string
  label: string
  amount: number
  type: 'add' | 'subtract'
}

export interface InvoiceFieldLabels {
  invoiceTitle: string
  billTo: string
  shipTo: string
  invoiceDate: string
  dueDate: string
  status: string
  quoteRef: string
  subtotal: string
  tax: string
  total: string
  amountPaid: string
  balanceDue: string
  notes: string
  terms: string
  colNo: string
  colDescription: string
  colDimensions: string
  colQty: string
  colUnitPrice: string
  colTotal: string
}

export interface InvoiceTemplateConfig {
  template: InvoiceTemplate
  // Branding
  showLogo: boolean
  companyName: string
  companyTagline: string
  companyAddress: string
  // Colors
  accentColor: string
  headerBgColor: string
  // Content
  footerText: string
  termsText: string
  showTerms: boolean
  // Section visibility
  showDimensions: boolean
  showQuoteRef: boolean
  // Custom rows (additional fees / discounts)
  customRows: CustomRow[]
  // Field labels
  labels: InvoiceFieldLabels
}

export const DEFAULT_LABELS: InvoiceFieldLabels = {
  invoiceTitle: 'INVOICE',
  billTo: 'Bill To',
  shipTo: 'Ship To',
  invoiceDate: 'Invoice Date',
  dueDate: 'Due Date',
  status: 'Status',
  quoteRef: 'Quote Reference',
  subtotal: 'Subtotal',
  tax: 'Tax',
  total: 'Total',
  amountPaid: 'Amount Paid',
  balanceDue: 'Balance Due',
  notes: 'Notes',
  terms: 'Terms & Conditions',
  colNo: '#',
  colDescription: 'Description',
  colDimensions: 'Dimensions',
  colQty: 'Qty',
  colUnitPrice: 'Unit Price',
  colTotal: 'Total',
}

export const DEFAULT_CONFIG: InvoiceTemplateConfig = {
  template: 'estimate-style',
  showLogo: true,
  companyName: 'SHADEOTECH',
  companyTagline: 'Management System',
  companyAddress: '3235 Skylane Dr. Unit 111, Carrollton, TX 75006',
  accentColor: '#3b82f6',
  headerBgColor: '#0f172a',
  footerText: 'Thank you for your business!',
  termsText:
    'Payment is due within 30 days of invoice date. Late payments are subject to a 1.5% monthly finance charge. All installations are guaranteed for 12 months from the date of installation.',
  showTerms: false,
  showDimensions: true,
  showQuoteRef: true,
  customRows: [],
  labels: DEFAULT_LABELS,
}
