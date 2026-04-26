'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { format } from 'date-fns'

export type QuoteStatus = 'DRAFT' | 'SENT' | 'NEGOTIATION' | 'POSTPONED' | 'WON' | 'LOST' | 'EXPIRED'

export interface QuoteItem {
  id: string
  productName: string
  description?: string
  category: string
  subcategory?: string
  subSubcategory?: string
  width: number // in inches
  length: number // in inches
  area: number
  unitPrice: number
  quantity: number
  totalPrice: number
  basePrice?: number // Base price before adjustments and tax
  manualPriceOverride?: number // Manual price override if set
  fabricImage?: string
  cassetteImage?: string
  componentImage?: string
  collectionId?: string // Collection ID from pricing charts
  fabricId?: string // Selected fabric ID
  cassetteType?: string // Selected cassette type
  cassetteColor?: string // Cassette color (White, Ivory, Bronze, etc.)
  fabricWrap?: 'same' | 'other' | 'none' // Fabric wrap option
  fabricWrapImage?: string // Fabric wrap image (if "other" was selected)
  // Product configuration options (per line item)
  roomType?: string
  sequence?: string // L, R, Middle, Top, Down, L2, R2
  controlType?: string // Operation: Motorized, Battery Powered, AC 12V/24V, AC 110 V, Wand Motor, Chain, Cord, Cordless, Wand
  controlChain?: string // 2nd dropdown: channel (CH,1-16), chain color, cord color, wand type
  controlChainColor?: string // legacy
  controlChainSide?: string // 3rd: R/L or wand custom length
  mountType?: string // Inside / Outside
  bottomRailType?: string
  bottomRailColor?: string
  sideChannel?: string
  sideChannelColor?: string // Color when side channel is Yes (exterior)
  solarPanel?: string // Yes / No
  bottomRailSealType?: string // Brush S / Brush L / Rubber (exterior)
  sequenceImage?: string // Photo URL for sequence
  roll?: string
  brackets?: string
  brackets2?: string
  stacks?: string
  springAssist?: string
  remoteNumber?: string // Remote control number/ID when motorized
  remeasure?: boolean // Flagged for remeasurement
  remeasureWidth?: number // Confirmed new width after remeasurement
  remeasureLength?: number // Confirmed new length after remeasurement
}

export interface QuoteHistoryEntry {
  status: QuoteStatus | 'CREATED'
  timestamp: string
  note?: string
}

export interface QuoteAddOn {
  addOnId: string
  name: string
  pricePerFabric: number
  fabricCount: number
  total: number
  /** When set, total = pricePerFabric * quantity (per-unit). When absent, total = pricePerFabric * fabricCount (per-fabric). */
  quantity?: number
}

export interface Quote {
  id: string
  quoteNumber: string
  customerId: string
  customerName: string
  sideMark?: string
  status: QuoteStatus
  items: QuoteItem[]
  subtotal: number
  taxRate: number
  taxAmount: number
  totalAmount: number
  createdAt: string
  expiryDate: string
  notes?: string
  priceAdjustPercent: number
  priceAdjustFlat: number
  contractType?: 'INTERIOR' | 'EXTERIOR' | 'INTERIOR_AND_EXTERIOR'
  isFranchisee?: boolean // Orders from franchisees skip contract step
  visuals?: {
    coverPage?: boolean
    fabricImage?: string
    cassetteImage?: string
    componentImage?: string
  }
  history: QuoteHistoryEntry[]
  addOns?: QuoteAddOn[]
  // New fields
  referenceNumber?: string
  saleAgent?: string
  discountType?: string
  discountValue?: number
  adminNote?: string
  installationAmount?: number
  deliveryMethod?: 'PICK_UP' | 'SHIPPED' | 'INSTALLED'
  shipToStreet?: string
  shipToCity?: string
  shipToState?: string
  shipToPostcode?: string
  shipToCountry?: string
  dealerId?: string
}

export interface PriceRow {
  category: string
  pricePerM2: number
}

interface QuotesState {
  quotes: Quote[]
  priceTable: PriceRow[]
  globalAdjust: { percent: number; flat: number }
  customers: { id: string; name: string; sideMark?: string }[]
  loading: boolean
  error: string | null

  fetchQuotes: (token: string) => Promise<void>
  addQuote: (quote: Omit<Quote, 'history'>, token: string) => Promise<string>
  updateQuote: (quoteId: string, payload: Partial<Quote>, token: string) => Promise<void>
  duplicateQuote: (sourceId: string, token: string) => Promise<string>
  updateStatus: (id: string, status: QuoteStatus, note?: string, token?: string) => Promise<void>
  requestExtend: (id: string, extraDays: number) => void
  importPriceTable: (rows: PriceRow[]) => void
  setGlobalAdjust: (percent: number, flat: number) => void
  addCustomer: (name: string, sideMark?: string) => string
}

const basePriceTable: PriceRow[] = [
  { category: 'roller_shades', pricePerM2: 150 },
  { category: 'zebra_blinds', pricePerM2: 180 },
  { category: 'shutters', pricePerM2: 220 },
  { category: 'drapes', pricePerM2: 140 },
  { category: 'roman_shades', pricePerM2: 200 },
  { category: 'motorized', pricePerM2: 260 },
]

const mockCustomers = [
  { id: 'cust_001', name: 'John Smith', sideMark: 'SH-R12345' },
  { id: 'cust_002', name: 'ABC Corp', sideMark: 'SH-C23456' },
  { id: 'cust_003', name: 'Jane Doe', sideMark: 'SH-R34567' },
]

export const useQuotesStore = create<QuotesState>()(
  persist(
    (set, get) => ({
      quotes: [],
      priceTable: basePriceTable,
      globalAdjust: { percent: 0, flat: 0 },
      customers: mockCustomers,
      loading: false,
      error: null,

      fetchQuotes: async (token: string) => {
        try {
          set({ loading: true, error: null })
          const response = await fetch('/api/quotes', {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
          if (!response.ok) throw new Error('Failed to fetch quotes')
          const data = await response.json()
          // Convert API format to store format
          const quotes: Quote[] = (data.quotes || []).map((q: any) => ({
            id: q.id || q._id,
            quoteNumber: q.quoteNumber,
            customerId: q.customerId,
            customerName: q.customerName,
            sideMark: q.sideMark,
            status: q.status,
            items: q.items || [],
            subtotal: q.subtotal,
            taxRate: q.taxRate,
            taxAmount: q.taxAmount,
            totalAmount: q.totalAmount,
            createdAt: q.createdAt,
            expiryDate: q.expiryDate || '',
            notes: q.notes,
            priceAdjustPercent: q.priceAdjustPercent || 0,
            priceAdjustFlat: q.priceAdjustFlat || 0,
            contractType: q.contractType,
            isFranchisee: q.isFranchisee,
            visuals: q.visuals,
            history: q.history || [],
            addOns: q.addOns || [],
            referenceNumber: q.referenceNumber,
            saleAgent: q.saleAgent,
            discountType: q.discountType,
            discountValue: q.discountValue,
            adminNote: q.adminNote,
            installationAmount: q.installationAmount || 0,
            deliveryMethod: q.deliveryMethod,
            shipToStreet: q.shipToStreet,
            shipToCity: q.shipToCity,
            shipToState: q.shipToState,
            shipToPostcode: q.shipToPostcode,
            shipToCountry: q.shipToCountry,
          }))
          set({ quotes, loading: false })
        } catch (error: any) {
          console.error('Error fetching quotes:', error)
          set({ error: error.message, loading: false })
        }
      },

      addQuote: async (quote, token) => {
        try {
          const response = await fetch('/api/quotes', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              quoteNumber: quote.quoteNumber,
              customerId: quote.customerId,
              customerName: quote.customerName,
              sideMark: quote.sideMark,
              status: quote.status,
              items: quote.items,
              subtotal: quote.subtotal,
              taxRate: quote.taxRate,
              taxAmount: quote.taxAmount,
              totalAmount: quote.totalAmount,
              expiryDate: quote.expiryDate,
              notes: quote.notes,
              priceAdjustPercent: quote.priceAdjustPercent,
              priceAdjustFlat: quote.priceAdjustFlat,
              contractType: quote.contractType,
              isFranchisee: quote.isFranchisee,
              visuals: quote.visuals,
              addOns: quote.addOns || [],
              referenceNumber: quote.referenceNumber,
              saleAgent: quote.saleAgent,
              discountType: quote.discountType,
              discountValue: quote.discountValue,
              adminNote: quote.adminNote,
              installationAmount: quote.installationAmount,
              shipToStreet: quote.shipToStreet,
              shipToCity: quote.shipToCity,
              shipToState: quote.shipToState,
              shipToPostcode: quote.shipToPostcode,
              shipToCountry: quote.shipToCountry,
            }),
          })
          if (!response.ok) throw new Error('Failed to create quote')
          const data = await response.json()
          const newQuote: Quote = {
            id: data.quote.id || data.quote._id,
            quoteNumber: data.quote.quoteNumber,
            customerId: data.quote.customerId,
            customerName: data.quote.customerName,
            sideMark: data.quote.sideMark,
            status: data.quote.status,
            items: data.quote.items || [],
            subtotal: data.quote.subtotal,
            taxRate: data.quote.taxRate,
            taxAmount: data.quote.taxAmount,
            totalAmount: data.quote.totalAmount,
            createdAt: data.quote.createdAt,
            expiryDate: data.quote.expiryDate || '',
            notes: data.quote.notes,
            priceAdjustPercent: data.quote.priceAdjustPercent || 0,
            priceAdjustFlat: data.quote.priceAdjustFlat || 0,
            contractType: data.quote.contractType,
            isFranchisee: data.quote.isFranchisee,
            visuals: data.quote.visuals,
            history: data.quote.history || [],
            addOns: data.quote.addOns || [],
            referenceNumber: data.quote.referenceNumber,
            saleAgent: data.quote.saleAgent,
            discountType: data.quote.discountType,
            discountValue: data.quote.discountValue,
            adminNote: data.quote.adminNote,
            installationAmount: data.quote.installationAmount || 0,
            shipToStreet: data.quote.shipToStreet,
            shipToCity: data.quote.shipToCity,
            shipToState: data.quote.shipToState,
            shipToPostcode: data.quote.shipToPostcode,
            shipToCountry: data.quote.shipToCountry,
          }
          set((state) => ({
            quotes: [...state.quotes, newQuote],
          }))
          return newQuote.id
        } catch (error: any) {
          console.error('Error creating quote:', error)
          throw error
        }
      },

      updateQuote: async (quoteId, payload, token) => {
        try {
          const body: Record<string, unknown> = {}
          if (payload.items !== undefined) body.items = payload.items
          if (payload.subtotal !== undefined) body.subtotal = payload.subtotal
          if (payload.taxRate !== undefined) body.taxRate = payload.taxRate
          if (payload.taxAmount !== undefined) body.taxAmount = payload.taxAmount
          if (payload.totalAmount !== undefined) body.totalAmount = payload.totalAmount
          if (payload.expiryDate !== undefined) body.expiryDate = payload.expiryDate
          if (payload.notes !== undefined) body.notes = payload.notes
          if (payload.priceAdjustPercent !== undefined) body.priceAdjustPercent = payload.priceAdjustPercent
          if (payload.priceAdjustFlat !== undefined) body.priceAdjustFlat = payload.priceAdjustFlat
          if (payload.contractType !== undefined) body.contractType = payload.contractType
          if (payload.visuals !== undefined) body.visuals = payload.visuals
          if (payload.status !== undefined) body.status = payload.status
          if (payload.addOns !== undefined) body.addOns = payload.addOns
          if (payload.referenceNumber !== undefined) body.referenceNumber = payload.referenceNumber
          if (payload.saleAgent !== undefined) body.saleAgent = payload.saleAgent
          if (payload.discountType !== undefined) body.discountType = payload.discountType
          if (payload.discountValue !== undefined) body.discountValue = payload.discountValue
          if (payload.adminNote !== undefined) body.adminNote = payload.adminNote
          if (payload.installationAmount !== undefined) body.installationAmount = payload.installationAmount
          if (payload.shipToStreet !== undefined) body.shipToStreet = payload.shipToStreet
          if (payload.shipToCity !== undefined) body.shipToCity = payload.shipToCity
          if (payload.shipToState !== undefined) body.shipToState = payload.shipToState
          if (payload.shipToPostcode !== undefined) body.shipToPostcode = payload.shipToPostcode
          if (payload.shipToCountry !== undefined) body.shipToCountry = payload.shipToCountry
          const response = await fetch(`/api/quotes/${quoteId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(body),
          })
          if (!response.ok) {
            const err = await response.json().catch(() => ({}))
            throw new Error(err.error || 'Failed to update quote')
          }
          const data = await response.json()
          const updatedQuote: Quote = {
            id: data.quote.id || data.quote._id,
            quoteNumber: data.quote.quoteNumber,
            customerId: data.quote.customerId,
            customerName: data.quote.customerName,
            sideMark: data.quote.sideMark,
            status: data.quote.status,
            items: data.quote.items || [],
            subtotal: data.quote.subtotal,
            taxRate: data.quote.taxRate,
            taxAmount: data.quote.taxAmount,
            totalAmount: data.quote.totalAmount,
            createdAt: data.quote.createdAt,
            expiryDate: data.quote.expiryDate || '',
            notes: data.quote.notes,
            priceAdjustPercent: data.quote.priceAdjustPercent || 0,
            priceAdjustFlat: data.quote.priceAdjustFlat || 0,
            contractType: data.quote.contractType,
            isFranchisee: data.quote.isFranchisee,
            visuals: data.quote.visuals,
            history: data.quote.history || [],
            addOns: data.quote.addOns || [],
            referenceNumber: data.quote.referenceNumber,
            saleAgent: data.quote.saleAgent,
            discountType: data.quote.discountType,
            discountValue: data.quote.discountValue,
            adminNote: data.quote.adminNote,
            installationAmount: data.quote.installationAmount || 0,
            shipToStreet: data.quote.shipToStreet,
            shipToCity: data.quote.shipToCity,
            shipToState: data.quote.shipToState,
            shipToPostcode: data.quote.shipToPostcode,
            shipToCountry: data.quote.shipToCountry,
          }
          set((state) => ({
            quotes: state.quotes.map((q) => (q.id === quoteId ? updatedQuote : q)),
          }))
        } catch (error: any) {
          console.error('Error updating quote:', error)
          throw error
        }
      },

      duplicateQuote: async (sourceId, token) => {
        const response = await fetch('/api/quotes/duplicate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ sourceId }),
        })
        if (!response.ok) {
          const err = await response.json().catch(() => ({}))
          throw new Error(err.error || 'Failed to duplicate quote')
        }
        const data = await response.json()
        const newQuote: Quote = {
          id: data.quote.id || data.quote._id,
          quoteNumber: data.quote.quoteNumber,
          customerId: data.quote.customerId,
          customerName: data.quote.customerName,
          sideMark: data.quote.sideMark,
          status: data.quote.status,
          items: data.quote.items || [],
          subtotal: data.quote.subtotal,
          taxRate: data.quote.taxRate,
          taxAmount: data.quote.taxAmount,
          totalAmount: data.quote.totalAmount,
          createdAt: data.quote.createdAt,
          expiryDate: data.quote.expiryDate || '',
          notes: data.quote.notes,
          priceAdjustPercent: data.quote.priceAdjustPercent || 0,
          priceAdjustFlat: data.quote.priceAdjustFlat || 0,
          contractType: data.quote.contractType,
          isFranchisee: data.quote.isFranchisee,
          visuals: data.quote.visuals,
          history: data.quote.history || [],
          addOns: data.quote.addOns || [],
          referenceNumber: data.quote.referenceNumber,
          saleAgent: data.quote.saleAgent,
          discountType: data.quote.discountType,
          discountValue: data.quote.discountValue,
          adminNote: data.quote.adminNote,
          installationAmount: data.quote.installationAmount || 0,
          shipToStreet: data.quote.shipToStreet,
          shipToCity: data.quote.shipToCity,
          shipToState: data.quote.shipToState,
          shipToPostcode: data.quote.shipToPostcode,
          shipToCountry: data.quote.shipToCountry,
        }
        set((state) => ({
          quotes: [newQuote, ...state.quotes],
        }))
        return newQuote.id
      },

      updateStatus: async (id, status, note, token) => {
        if (!token) {
          // Fallback to local update if no token
          const timestamp = new Date().toISOString()
          set((state) => ({
            quotes: state.quotes.map((q) =>
              q.id === id
                ? {
                    ...q,
                    status,
                    history: [...q.history, { status, timestamp, note }],
                  }
                : q
            ),
          }))
          return
        }

        try {
          const response = await fetch(`/api/quotes/${id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              status,
              statusNote: note,
            }),
          })
          if (!response.ok) throw new Error('Failed to update quote status')
          const data = await response.json()
          const updatedQuote: Quote = {
            id: data.quote.id || data.quote._id,
            quoteNumber: data.quote.quoteNumber,
            customerId: data.quote.customerId,
            customerName: data.quote.customerName,
            sideMark: data.quote.sideMark,
            status: data.quote.status,
            items: data.quote.items || [],
            subtotal: data.quote.subtotal,
            taxRate: data.quote.taxRate,
            taxAmount: data.quote.taxAmount,
            totalAmount: data.quote.totalAmount,
            createdAt: data.quote.createdAt,
            expiryDate: data.quote.expiryDate || '',
            notes: data.quote.notes,
            priceAdjustPercent: data.quote.priceAdjustPercent || 0,
            priceAdjustFlat: data.quote.priceAdjustFlat || 0,
            contractType: data.quote.contractType,
            isFranchisee: data.quote.isFranchisee,
            visuals: data.quote.visuals,
            history: data.quote.history || [],
            addOns: data.quote.addOns || [],
            referenceNumber: data.quote.referenceNumber,
            saleAgent: data.quote.saleAgent,
            discountType: data.quote.discountType,
            discountValue: data.quote.discountValue,
            adminNote: data.quote.adminNote,
            installationAmount: data.quote.installationAmount || 0,
            shipToStreet: data.quote.shipToStreet,
            shipToCity: data.quote.shipToCity,
            shipToState: data.quote.shipToState,
            shipToPostcode: data.quote.shipToPostcode,
            shipToCountry: data.quote.shipToCountry,
          }
          set((state) => ({
            quotes: state.quotes.map((q) => (q.id === id ? updatedQuote : q)),
          }))
        } catch (error: any) {
          console.error('Error updating quote status:', error)
          throw error
        }
      },

      requestExtend: (id, extraDays) => {
        set((state) => ({
          quotes: state.quotes.map((q) =>
            q.id === id
              ? {
                  ...q,
                  expiryDate: format(
                    new Date(new Date(q.expiryDate).getTime() + extraDays * 86400000),
                    'yyyy-MM-dd'
                  ),
                  history: [
                    ...q.history,
                    { status: q.status, timestamp: new Date().toISOString(), note: 'Extension requested' },
                  ],
                }
              : q
          ),
        }))
      },

      importPriceTable: (rows) => {
        set({ priceTable: rows })
      },

      setGlobalAdjust: (percent, flat) => {
        set({ globalAdjust: { percent, flat } })
      },

      addCustomer: (name, sideMark) => {
        const id = `cust_${Date.now()}`
        set((state) => ({
          customers: [...state.customers, { id, name, sideMark }],
        }))
        return id
      },
    }),
    {
      name: 'quotes-storage',
      partialize: (state) => ({
        priceTable: state.priceTable,
        globalAdjust: state.globalAdjust,
        customers: state.customers,
      }),
    }
  )
)

