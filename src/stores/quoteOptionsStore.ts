import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ProductFieldRules {
  showSideChannel: boolean
  showCassette: boolean
  showWrap: boolean
  showBottomRailSeal: boolean
  hideSealed: boolean
  showRollerColumn: boolean
  showSpringAssist: boolean
}

export const DEFAULT_PRODUCT_RULES: Record<string, ProductFieldRules> = {
  Exterior: {
    showSideChannel: false,
    showCassette: false,
    showWrap: false,
    showBottomRailSeal: false,
    hideSealed: false,
    showRollerColumn: false,
    showSpringAssist: false,
  },
  'Duo Shades': {
    showSideChannel: true,
    showCassette: true,
    showWrap: true,
    showBottomRailSeal: false,
    hideSealed: true,
    showRollerColumn: false,
    showSpringAssist: false,
  },
  'Roller Shades': {
    showSideChannel: true,
    showCassette: true,
    showWrap: true,
    showBottomRailSeal: true,
    hideSealed: false,
    showRollerColumn: true,
    showSpringAssist: true,
  },
  Default: {
    showSideChannel: true,
    showCassette: true,
    showWrap: true,
    showBottomRailSeal: false,
    hideSealed: false,
    showRollerColumn: false,
    showSpringAssist: false,
  },
}

export const DEFAULT_TERMS = `1. Due to the nature of custom made products we required a 50% downpayment to start manufacturing. The remaining balance will be due prior to pickup/installation.
2. All Sales are Final and Non Refundable. No changes or cancellation accepted after placing the order.
3. Shadeotech Window Fashions shall not be responsible for delay of product due to any circumstances.`

interface QuoteOptionsState {
  roomTypes: string[]
  sequenceOptions: string[]
  motorizedOperations: string[]
  manualOperations: string[]
  exteriorMotorizedOperations: string[]
  exteriorManualOperations: string[]
  beadedChainColors: string[]
  cordColors: string[]
  bottomRailTypes: string[]
  bottomRailExposedColors: string[]
  exteriorComponentColors: string[]
  sideChannelColors: string[]
  productRules: Record<string, ProductFieldRules>
  termsAndConditions: string

  setRoomTypes: (v: string[]) => void
  setSequenceOptions: (v: string[]) => void
  setMotorizedOperations: (v: string[]) => void
  setManualOperations: (v: string[]) => void
  setExteriorMotorizedOperations: (v: string[]) => void
  setExteriorManualOperations: (v: string[]) => void
  setBeadedChainColors: (v: string[]) => void
  setCordColors: (v: string[]) => void
  setBottomRailTypes: (v: string[]) => void
  setBottomRailExposedColors: (v: string[]) => void
  setExteriorComponentColors: (v: string[]) => void
  setSideChannelColors: (v: string[]) => void
  setProductRules: (v: Record<string, ProductFieldRules>) => void
  updateProductRule: (category: string, field: keyof ProductFieldRules, value: boolean) => void
  getProductRules: (category: string) => ProductFieldRules
  setTermsAndConditions: (v: string) => void
}

export const useQuoteOptionsStore = create<QuoteOptionsState>()(
  persist(
    (set, get) => ({
      roomTypes: ['TV ROOM', 'Living Room', 'Bedroom', 'Kitchen', 'Dining Room', 'Office', 'Bathroom', 'Nursery', 'Other'],
      sequenceOptions: ['L', 'R', 'Middle', 'Top', 'Down', 'L2', 'R2'],
      motorizedOperations: ['Motorized', 'Battery Powered', 'AC 12V/24V', 'AC 110 V', 'Wand Motor'],
      manualOperations: ['Chain', 'Cord', 'Cordless', 'Wand'],
      exteriorMotorizedOperations: ['AC 110V Motor', 'Battery powered motor'],
      exteriorManualOperations: ['Crank'],
      beadedChainColors: ['Default', 'White', 'Black', 'Anodized', 'Stainless Steel'],
      cordColors: ['Default', 'White', 'Grey', 'Black', 'Ivory'],
      bottomRailTypes: ['Exposed', 'Wrapped', 'Sealed'],
      bottomRailExposedColors: ['Default', 'White', 'Ivory', 'Anodized', 'Brown', 'Black'],
      exteriorComponentColors: ['White', 'Black', 'Bronze', 'Beige', 'Anodized', 'Brown', 'Dark Grey', 'Light Grey', 'Ivory'],
      sideChannelColors: ['White', 'Ivory', 'Black', 'Anodized', 'Brown'],
      productRules: { ...DEFAULT_PRODUCT_RULES },
      termsAndConditions: DEFAULT_TERMS,

      setRoomTypes: (v) => set({ roomTypes: v }),
      setSequenceOptions: (v) => set({ sequenceOptions: v }),
      setMotorizedOperations: (v) => set({ motorizedOperations: v }),
      setManualOperations: (v) => set({ manualOperations: v }),
      setExteriorMotorizedOperations: (v) => set({ exteriorMotorizedOperations: v }),
      setExteriorManualOperations: (v) => set({ exteriorManualOperations: v }),
      setBeadedChainColors: (v) => set({ beadedChainColors: v }),
      setCordColors: (v) => set({ cordColors: v }),
      setBottomRailTypes: (v) => set({ bottomRailTypes: v }),
      setBottomRailExposedColors: (v) => set({ bottomRailExposedColors: v }),
      setExteriorComponentColors: (v) => set({ exteriorComponentColors: v }),
      setSideChannelColors: (v) => set({ sideChannelColors: v }),
      setProductRules: (v) => set({ productRules: v }),
      updateProductRule: (category, field, value) =>
        set((state) => ({
          productRules: {
            ...state.productRules,
            [category]: { ...(state.productRules[category] ?? DEFAULT_PRODUCT_RULES.Default), [field]: value },
          },
        })),
      setTermsAndConditions: (v) => set({ termsAndConditions: v }),
      getProductRules: (category) => {
        const rules = get().productRules
        if (category === 'Exterior' || category?.startsWith('Exterior')) return rules.Exterior ?? DEFAULT_PRODUCT_RULES.Exterior
        if (category?.startsWith('Duo')) return rules['Duo Shades'] ?? DEFAULT_PRODUCT_RULES['Duo Shades']
        return rules[category] ?? rules.Default ?? DEFAULT_PRODUCT_RULES.Default
      },
    }),
    { name: 'quote-options-v1' }
  )
)
