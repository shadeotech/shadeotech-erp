import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Quote } from '@/app/(dashboard)/sales/mockQuotes'
import { Invoice } from '@/app/(dashboard)/sales/mockInvoices'
import { Payment } from '@/app/(dashboard)/sales/mockPayments'
import { mockQuotes } from '@/app/(dashboard)/sales/mockQuotes'
import { mockInvoices } from '@/app/(dashboard)/sales/mockInvoices'
import { mockPayments } from '@/app/(dashboard)/sales/mockPayments'
import { createInvoiceFromQuote, updateInvoiceBalance, generatePaymentId } from '@/app/(dashboard)/sales/utils'

interface SalesState {
  quotes: Quote[]
  invoices: Invoice[]
  payments: Payment[]
  
  // Actions
  updateQuoteStatus: (quoteId: string, status: Quote['status']) => void
  addInvoice: (invoice: Invoice) => void
  addPayment: (payment: Payment) => void
  updateInvoice: (invoiceId: string, updates: Partial<Invoice>) => void
  initializeData: () => void
}

export const useSalesStore = create<SalesState>()(
  persist(
    (set, get) => ({
      quotes: [],
      invoices: [],
      payments: [],

      initializeData: () => {
        // Load from localStorage or use mock data
        const storedQuotes = localStorage.getItem('sales_quotes')
        const storedInvoices = localStorage.getItem('sales_invoices')
        const storedPayments = localStorage.getItem('sales_payments')

        set({
          quotes: storedQuotes ? JSON.parse(storedQuotes) : mockQuotes,
          invoices: storedInvoices ? JSON.parse(storedInvoices) : mockInvoices,
          payments: storedPayments ? JSON.parse(storedPayments) : mockPayments,
        })
      },

      updateQuoteStatus: (quoteId, status) => {
        const quotes = get().quotes
        const updatedQuotes = quotes.map(q =>
          q.id === quoteId ? { ...q, status } : q
        )

        set({ quotes: updatedQuotes })
        localStorage.setItem('sales_quotes', JSON.stringify(updatedQuotes))

        // Auto-create invoice when quote is accepted
        if (status === 'Accepted') {
          const quote = updatedQuotes.find(q => q.id === quoteId)
          if (quote) {
            const invoice = createInvoiceFromQuote(quote)
            const invoices = get().invoices
            
            // Check if invoice already exists for this quote
            const existingInvoice = invoices.find(inv => inv.quoteId === quoteId)
            if (!existingInvoice) {
              const newInvoices = [...invoices, invoice]
              set({ invoices: newInvoices })
              localStorage.setItem('sales_invoices', JSON.stringify(newInvoices))
            }
          }
        }
      },

      addInvoice: (invoice) => {
        const invoices = [...get().invoices, invoice]
        set({ invoices })
        localStorage.setItem('sales_invoices', JSON.stringify(invoices))
      },

      addPayment: (payment) => {
        const payments = [...get().payments, payment]
        set({ payments })
        localStorage.setItem('sales_payments', JSON.stringify(payments))

        // Update invoice balance
        const invoices = get().invoices
        const invoice = invoices.find(inv => inv.id === payment.invoiceId)
        if (invoice) {
          const updatedInvoice = updateInvoiceBalance(invoice, payment.amount)
          const updatedInvoices = invoices.map(inv =>
            inv.id === updatedInvoice.id ? updatedInvoice : inv
          )
          set({ invoices: updatedInvoices })
          localStorage.setItem('sales_invoices', JSON.stringify(updatedInvoices))
        }
      },

      updateInvoice: (invoiceId, updates) => {
        const invoices = get().invoices
        const updatedInvoices = invoices.map(inv =>
          inv.id === invoiceId ? { ...inv, ...updates } : inv
        )
        set({ invoices: updatedInvoices })
        localStorage.setItem('sales_invoices', JSON.stringify(updatedInvoices))
      },
    }),
    {
      name: 'sales-storage',
      partialize: (state) => ({
        quotes: state.quotes,
        invoices: state.invoices,
        payments: state.payments,
      }),
    }
  )
)

