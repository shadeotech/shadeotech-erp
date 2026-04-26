'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface QuickQuoteItem {
  id: string
  product: string
  width: number
  length: number
  quantity: number
  operation: 'Manual' | 'Motorized'
  unitPrice: number
  totalPrice: number
}

export interface QuickQuote {
  id: string
  clientName: string
  clientPhone: string
  items: QuickQuoteItem[]
  subtotal: number
  installationFee: number
  taxAmount: number
  totalAmount: number
  createdAt: string
}

const DEFAULT_TAX_RATE = 8.25
const DEFAULT_INSTALLATION_FEE = 125

interface QuickQuoteState {
  quickQuotes: QuickQuote[]
  addQuickQuote: (q: Omit<QuickQuote, 'id' | 'createdAt'>) => string
  removeQuickQuote: (id: string) => void
  getInstallationFee: () => number
  getTaxRate: () => number
}

export const useQuickQuoteStore = create<QuickQuoteState>()(
  persist(
    (set) => ({
      quickQuotes: [],

      addQuickQuote: (q) => {
        const id = `qq_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
        const created: QuickQuote = {
          ...q,
          id,
          createdAt: new Date().toISOString(),
        }
        set((s) => ({ quickQuotes: [created, ...s.quickQuotes] }))
        return id
      },

      removeQuickQuote: (id) => {
        set((s) => ({ quickQuotes: s.quickQuotes.filter((q) => q.id !== id) }))
      },

      getInstallationFee: () => DEFAULT_INSTALLATION_FEE,
      getTaxRate: () => DEFAULT_TAX_RATE,
    }),
    { name: 'shadeotech-quick-quotes' }
  )
)
