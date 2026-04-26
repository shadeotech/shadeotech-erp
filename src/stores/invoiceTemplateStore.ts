import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  type InvoiceTemplateConfig,
  type CustomRow,
  type InvoiceFieldLabels,
  DEFAULT_CONFIG,
} from '@/lib/invoice-template-types'

interface InvoiceTemplateStore {
  config: InvoiceTemplateConfig
  setConfig: (updates: Partial<InvoiceTemplateConfig>) => void
  setLabel: (key: keyof InvoiceFieldLabels, value: string) => void
  addCustomRow: () => void
  updateCustomRow: (id: string, updates: Partial<CustomRow>) => void
  removeCustomRow: (id: string) => void
  resetConfig: () => void
}

export const useInvoiceTemplateStore = create<InvoiceTemplateStore>()(
  persist(
    (set) => ({
      config: DEFAULT_CONFIG,

      setConfig: (updates) =>
        set((state) => ({ config: { ...state.config, ...updates } })),

      setLabel: (key, value) =>
        set((state) => ({
          config: {
            ...state.config,
            labels: { ...state.config.labels, [key]: value },
          },
        })),

      addCustomRow: () =>
        set((state) => ({
          config: {
            ...state.config,
            customRows: [
              ...state.config.customRows,
              { id: `custom-${Date.now()}`, label: 'Custom Fee', amount: 0, type: 'add' },
            ],
          },
        })),

      updateCustomRow: (id, updates) =>
        set((state) => ({
          config: {
            ...state.config,
            customRows: state.config.customRows.map((r) =>
              r.id === id ? { ...r, ...updates } : r
            ),
          },
        })),

      removeCustomRow: (id) =>
        set((state) => ({
          config: {
            ...state.config,
            customRows: state.config.customRows.filter((r) => r.id !== id),
          },
        })),

      resetConfig: () => set({ config: DEFAULT_CONFIG }),
    }),
    { name: 'shadeotech-invoice-template' }
  )
)
