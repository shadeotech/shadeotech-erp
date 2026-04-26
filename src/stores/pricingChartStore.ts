import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type CollectionId = 
  | 'duo_basic'
  | 'duo_light_filtering'
  | 'duo_room_dimming'
  | 'tri_light_filtering'
  | 'tri_room_dimming'
  | 'roller_room_darkening'
  | 'roller_light_filtering'
  | 'roller_room_darkening_y'
  | 'roller_light_filtering_y'
  | 'roller_sun_screen'
  | 'room_darkening_sun_screen'
  | 'zip'
  | 'wire_guide'
  | 'uni_shades'

export interface DimensionPricingTable {
  widthValues: number[]
  lengthValues: number[]
  prices: Record<string, Record<string, number>> // [length][width] = price
}

export interface CassettePricingTable {
  widthValues: number[]
  cassetteTypes: string[]
  prices: Record<string, Record<string, number>> // [type][width] = price
}

export interface PricingSubChart {
  id: string
  name: string
  mainTable: DimensionPricingTable
  cassetteTable?: CassettePricingTable
  notes: {
    mainTableNote: string
    cassetteTableNote?: string
  }
  fabrics?: string[]
}

export interface PricingChart {
  collectionId: CollectionId
  collectionName: string
  subCharts?: PricingSubChart[] // For collections like ZIP
  mainTable: DimensionPricingTable
  cassetteTable?: CassettePricingTable
  notes: {
    mainTableNote: string
    cassetteTableNote?: string
  }
  fabrics?: string[]
}

interface PricingChartState {
  charts: Record<CollectionId, PricingChart>
  loading: boolean
  saving: boolean
  
  // Actions
  getChart: (collectionId: CollectionId, subChartId?: string) => PricingChart | PricingSubChart | null
  updateMainTablePrice: (collectionId: CollectionId, length: number, width: number, price: number, subChartId?: string) => void
  updateCassettePrice: (collectionId: CollectionId, type: string, width: number, price: number, subChartId?: string) => void
  addMainTableRow: (collectionId: CollectionId, length: number, subChartId?: string) => void
  addMainTableColumn: (collectionId: CollectionId, width: number, subChartId?: string) => void
  removeMainTableRow: (collectionId: CollectionId, length: number, subChartId?: string) => void
  removeMainTableColumn: (collectionId: CollectionId, width: number, subChartId?: string) => void
  addCassetteType: (collectionId: CollectionId, type: string, subChartId?: string) => void
  removeCassetteType: (collectionId: CollectionId, type: string, subChartId?: string) => void
  updateNotes: (collectionId: CollectionId, mainNote: string, cassetteNote?: string, subChartId?: string) => void
  bulkIncreasePrices: (collectionId: CollectionId, percent: number, flat: number, subChartId?: string) => void
  bulkImportMainTable: (collectionId: CollectionId, widthValues: number[], lengthValues: number[], prices: Record<string, Record<string, number>>, subChartId?: string) => void
  initializeDefaultCharts: () => void
  fetchCharts: (token: string) => Promise<void>
  saveCharts: (token: string) => Promise<boolean>
}

// Default width and length values from the image
const DEFAULT_WIDTHS = [24, 30, 36, 48, 60, 72, 84, 96, 108, 120, 132, 144]
const DEFAULT_LENGTHS = [36, 48, 60, 72, 84, 96, 108, 120, 132, 144]

// Default pricing data from the image
const DEFAULT_MAIN_PRICING: Record<string, Record<string, number>> = {
  '36': { '24': 335, '30': 347, '36': 355, '48': 465, '60': 540, '72': 658, '84': 785, '96': 927, '108': 1011, '120': 1105, '132': 1214, '144': 1307 },
  '48': { '24': 388, '30': 405, '36': 414, '48': 532, '60': 633, '72': 768, '84': 920, '96': 1072, '108': 1197, '120': 1307, '132': 1425, '144': 1534 },
  '60': { '24': 448, '30': 465, '36': 472, '48': 590, '60': 718, '72': 860, '84': 1011, '96': 1231, '108': 1392, '120': 1509, '132': 1611, '144': 1779 },
  '72': { '24': 523, '30': 540, '36': 549, '48': 725, '60': 860, '72': 970, '84': 1156, '96': 1374, '108': 1585, '120': 1703, '132': 1854, '144': 2040 },
  '84': { '24': 583, '30': 600, '36': 616, '48': 785, '60': 953, '72': 1079, '84': 1290, '96': 1551, '108': 1736, '120': 1888, '132': 2099, '144': 2267 },
  '96': { '24': 641, '30': 658, '36': 674, '48': 877, '60': 1053, '72': 1197, '84': 1425, '96': 1720, '108': 1930, '120': 2150, '132': 2292, '144': 2487 },
  '108': { '24': 700, '30': 718, '36': 735, '48': 953, '60': 1172, '72': 1307, '84': 1551, '96': 1888, '108': 2106, '120': 2335, '132': 2520, '144': 2689 },
  '120': { '24': 751, '30': 768, '36': 785, '48': 1029, '60': 1274, '72': 1425, '84': 1678, '96': 2040, '108': 2285, '120': 2520, '132': 2739, '144': 2949 },
  '132': { '24': 802, '30': 819, '36': 835, '48': 1105, '60': 1366, '72': 1543, '84': 1813, '96': 2191, '108': 2443, '120': 2713, '132': 2992, '144': 3194 },
  '144': { '24': 843, '30': 869, '36': 894, '48': 1180, '60': 1458, '72': 1678, '84': 1989, '96': 2359, '108': 2612, '120': 2915, '132': 3194, '144': 3489 },
}

const DEFAULT_CASSETTE_PRICING: Record<string, Record<string, number>> = {
  'ROUND CASETTE': { '24': 78, '30': 91, '36': 104, '48': 117, '60': 130, '72': 143, '84': 156, '96': 169, '108': 182, '120': 195, '132': 208, '144': 221 },
  'SQUARE CASETTE': { '24': 98, '30': 111, '36': 124, '48': 137, '60': 150, '72': 162, '84': 175, '96': 188, '108': 201, '120': 214, '132': 227, '144': 240 },
}

// Collection fabrics data
const COLLECTION_FABRICS: Record<CollectionId, string[]> = {
  'duo_basic': ['SH 14000-58', 'SH 14000-63', 'SH 14000-2', 'SH-160-2'],
  'duo_light_filtering': [
    'SH GW-01', 'SH GG-02', 'SH 50000-T58', 'SH 50000-T06', 'SH 824-2',
    'SH Elegie 2 White', 'SH Elegie 3 Grey', 'SH Folklore 1 White',
    'SH Folklore 4 Mushroom', 'SH Aurora 2 Beige', 'SH Aurora 5 Grey',
    'SH Aurora 6 Dk Grey', 'SH Aurora 7 Charcoal', 'SH Lous 1 White',
    'SH Lous 2 Grey', 'SH Evermore 2 Grey', 'SH Evermore 6 Charcoal',
    'SH Prose 4" -1 White', 'SH Prose 4" -2 Grey', 'SH Prose 4" - 3 Dk Grey',
    'SH Prose 4" - 4 Charcoal', 'SH Gio White', 'SH Venice 1 Grey',
    'SH Venice 2 Ivory', 'SH Venice 4 Khaki', 'SH Venice 6 Dk Grey',
    'SH 510-58', 'SH 519-1', 'SH 510-4', 'SH 50013-4', 'SH 50009-2'
  ],
  'duo_room_dimming': [
    'SH Genova 1 Grey', 'SH Genova 2 White', 'SH Genova 4 Mushroom',
    'SH Genova 5 Dk, Grey', 'SH Chalant 1 Grey', 'SH Chalant 2 White',
    'SH Chalant 3 Mushroom', 'SH Chalant 8 Dk. Grey', 'SH Florence 1 White',
    'SH Florence 2 Ivory', 'SH Florence 4 Dk. Grey', 'SH Florence 5 Charcoal',
    'SH Lyon 1 Ivory', 'SH Lyon 2 Lt. Grey', 'SH Swift 1 White',
    'SH Swift 3 Sand', 'SH Swift 4 Lt. Grey', 'SH 3071 2', 'SH 3263 6',
    'SH 500 2', 'SH 500 3', 'SH 702 1', 'SH 702 6', 'SH GW 01',
    'SH 50000 T 4', 'SH 50000 T 06', 'SH 50000 T 58', 'SH Aurora 2 Beige',
    'SH Aurora 5 Dk. Grey', 'SH Aurora 7 Charcoal'
  ],
  'tri_light_filtering': ['SH-3074-1', 'SH-3074-2', 'SH-3074-4', 'SH 3063-11', 'SH 3063-12'],
  'tri_room_dimming': ['SH 01- Ivory'],
  'roller_room_darkening': [],
  'roller_light_filtering': [],
  'roller_room_darkening_y': [],
  'roller_light_filtering_y': [],
  'roller_sun_screen': [],
  'room_darkening_sun_screen': [],
  'zip': ['SH Black', 'SH Beige'],
  'wire_guide': [],
  'uni_shades': [],
}

const createDefaultChart = (collectionId: CollectionId, collectionName: string): PricingChart => ({
  collectionId,
  collectionName,
  mainTable: {
    widthValues: [...DEFAULT_WIDTHS],
    lengthValues: [...DEFAULT_LENGTHS],
    prices: JSON.parse(JSON.stringify(DEFAULT_MAIN_PRICING)),
  },
  cassetteTable: {
    widthValues: [...DEFAULT_WIDTHS],
    cassetteTypes: ['ROUND CASETTE', 'SQUARE CASETTE'],
    prices: JSON.parse(JSON.stringify(DEFAULT_CASSETTE_PRICING)),
  },
  notes: {
    mainTableNote: '***Standard roller is open roller, please specify cassette if required.',
    cassetteTableNote: '***The standard cassette/ fascia is color coordinated as much as possible.',
  },
  fabrics: [...COLLECTION_FABRICS[collectionId]],
})

export const usePricingChartStore = create<PricingChartState>()(
  persist(
    (set, get) => ({
      charts: {} as Record<CollectionId, PricingChart>,
      loading: false,
      saving: false,

      getChart: (collectionId, subChartId) => {
        const charts = get().charts
        const chart = charts[collectionId]
        if (!chart) return null
        
        if (subChartId && chart.subCharts) {
          return chart.subCharts.find(sc => sc.id === subChartId) || null
        }
        return chart
      },

      updateMainTablePrice: (collectionId, length, width, price, subChartId) => {
        set((state) => {
          const charts = { ...state.charts }
          const chart = charts[collectionId]
          if (!chart) return state

          if (subChartId && chart.subCharts) {
            const subChart = chart.subCharts.find(sc => sc.id === subChartId)
            if (subChart) {
              subChart.mainTable.prices[String(length)] = {
                ...subChart.mainTable.prices[String(length)],
                [String(width)]: price,
              }
              return { charts }
            }
          }

          chart.mainTable.prices[String(length)] = {
            ...chart.mainTable.prices[String(length)],
            [String(width)]: price,
          }
          return { charts }
        })
      },

      updateCassettePrice: (collectionId, type, width, price, subChartId) => {
        set((state) => {
          const charts = { ...state.charts }
          const chart = charts[collectionId]
          if (!chart || !chart.cassetteTable) return state

          if (subChartId && chart.subCharts) {
            const subChart = chart.subCharts.find(sc => sc.id === subChartId)
            if (subChart && subChart.cassetteTable) {
              subChart.cassetteTable.prices[type] = {
                ...subChart.cassetteTable.prices[type],
                [String(width)]: price,
              }
              return { charts }
            }
          }

          chart.cassetteTable!.prices[type] = {
            ...chart.cassetteTable!.prices[type],
            [String(width)]: price,
          }
          return { charts }
        })
      },

      addMainTableRow: (collectionId, length, subChartId) => {
        set((state) => {
          const charts = { ...state.charts }
          const chart = charts[collectionId]
          if (!chart) return state

          if (subChartId && chart.subCharts) {
            const subChart = chart.subCharts.find(sc => sc.id === subChartId)
            if (subChart) {
              if (!subChart.mainTable.lengthValues.includes(length)) {
                subChart.mainTable.lengthValues.push(length)
                subChart.mainTable.lengthValues.sort((a, b) => a - b)
                subChart.mainTable.prices[String(length)] = {}
                subChart.mainTable.widthValues.forEach(width => {
                  subChart.mainTable.prices[String(length)][String(width)] = 0
                })
              }
              return { charts }
            }
          }

          if (!chart.mainTable.lengthValues.includes(length)) {
            chart.mainTable.lengthValues.push(length)
            chart.mainTable.lengthValues.sort((a, b) => a - b)
            chart.mainTable.prices[String(length)] = {}
            chart.mainTable.widthValues.forEach(width => {
              chart.mainTable.prices[String(length)][String(width)] = 0
            })
          }
          return { charts }
        })
      },

      addMainTableColumn: (collectionId, width, subChartId) => {
        set((state) => {
          const charts = { ...state.charts }
          const chart = charts[collectionId]
          if (!chart) return state

          if (subChartId && chart.subCharts) {
            const subChart = chart.subCharts.find(sc => sc.id === subChartId)
            if (subChart) {
              if (!subChart.mainTable.widthValues.includes(width)) {
                subChart.mainTable.widthValues.push(width)
                subChart.mainTable.widthValues.sort((a, b) => a - b)
                subChart.mainTable.lengthValues.forEach(length => {
                  subChart.mainTable.prices[String(length)][String(width)] = 0
                })
                if (subChart.cassetteTable) {
                  subChart.cassetteTable.widthValues.push(width)
                  subChart.cassetteTable.widthValues.sort((a, b) => a - b)
                  subChart.cassetteTable.cassetteTypes.forEach(type => {
                    subChart.cassetteTable!.prices[type][String(width)] = 0
                  })
                }
              }
              return { charts }
            }
          }

          if (!chart.mainTable.widthValues.includes(width)) {
            chart.mainTable.widthValues.push(width)
            chart.mainTable.widthValues.sort((a, b) => a - b)
            chart.mainTable.lengthValues.forEach(length => {
              chart.mainTable.prices[String(length)][String(width)] = 0
            })
            if (chart.cassetteTable) {
              chart.cassetteTable.widthValues.push(width)
              chart.cassetteTable.widthValues.sort((a, b) => a - b)
              chart.cassetteTable.cassetteTypes.forEach(type => {
                chart.cassetteTable!.prices[type][String(width)] = 0
              })
            }
          }
          return { charts }
        })
      },

      removeMainTableRow: (collectionId, length, subChartId) => {
        set((state) => {
          const charts = { ...state.charts }
          const chart = charts[collectionId]
          if (!chart) return state

          if (subChartId && chart.subCharts) {
            const subChart = chart.subCharts.find(sc => sc.id === subChartId)
            if (subChart) {
              subChart.mainTable.lengthValues = subChart.mainTable.lengthValues.filter(l => l !== length)
              delete subChart.mainTable.prices[String(length)]
              return { charts }
            }
          }

          chart.mainTable.lengthValues = chart.mainTable.lengthValues.filter(l => l !== length)
          delete chart.mainTable.prices[String(length)]
          return { charts }
        })
      },

      removeMainTableColumn: (collectionId, width, subChartId) => {
        set((state) => {
          const charts = { ...state.charts }
          const chart = charts[collectionId]
          if (!chart) return state

          if (subChartId && chart.subCharts) {
            const subChart = chart.subCharts.find(sc => sc.id === subChartId)
            if (subChart) {
              subChart.mainTable.widthValues = subChart.mainTable.widthValues.filter(w => w !== width)
              subChart.mainTable.lengthValues.forEach(length => {
                delete subChart.mainTable.prices[String(length)][String(width)]
              })
              if (subChart.cassetteTable) {
                subChart.cassetteTable.widthValues = subChart.cassetteTable.widthValues.filter(w => w !== width)
                subChart.cassetteTable.cassetteTypes.forEach(type => {
                  delete subChart.cassetteTable!.prices[type][String(width)]
                })
              }
              return { charts }
            }
          }

          chart.mainTable.widthValues = chart.mainTable.widthValues.filter(w => w !== width)
          chart.mainTable.lengthValues.forEach(length => {
            delete chart.mainTable.prices[String(length)][String(width)]
          })
          if (chart.cassetteTable) {
            chart.cassetteTable.widthValues = chart.cassetteTable.widthValues.filter(w => w !== width)
            chart.cassetteTable.cassetteTypes.forEach(type => {
              delete chart.cassetteTable!.prices[type][String(width)]
            })
          }
          return { charts }
        })
      },

      addCassetteType: (collectionId, type, subChartId) => {
        set((state) => {
          const charts = { ...state.charts }
          const chart = charts[collectionId]
          if (!chart) return state

          if (subChartId && chart.subCharts) {
            const subChart = chart.subCharts.find(sc => sc.id === subChartId)
            if (subChart && subChart.cassetteTable) {
              if (!subChart.cassetteTable.cassetteTypes.includes(type)) {
                subChart.cassetteTable.cassetteTypes.push(type)
                subChart.cassetteTable.prices[type] = {}
                subChart.cassetteTable.widthValues.forEach(width => {
                  subChart.cassetteTable!.prices[type][String(width)] = 0
                })
              }
              return { charts }
            }
          }

          if (chart.cassetteTable) {
            if (!chart.cassetteTable.cassetteTypes.includes(type)) {
              chart.cassetteTable.cassetteTypes.push(type)
              chart.cassetteTable.prices[type] = {}
              chart.cassetteTable.widthValues.forEach(width => {
                chart.cassetteTable!.prices[type][String(width)] = 0
              })
            }
          }
          return { charts }
        })
      },

      removeCassetteType: (collectionId, type, subChartId) => {
        set((state) => {
          const charts = { ...state.charts }
          const chart = charts[collectionId]
          if (!chart) return state

          if (subChartId && chart.subCharts) {
            const subChart = chart.subCharts.find(sc => sc.id === subChartId)
            if (subChart && subChart.cassetteTable) {
              subChart.cassetteTable.cassetteTypes = subChart.cassetteTable.cassetteTypes.filter(t => t !== type)
              delete subChart.cassetteTable.prices[type]
              return { charts }
            }
          }

          if (chart.cassetteTable) {
            chart.cassetteTable.cassetteTypes = chart.cassetteTable.cassetteTypes.filter(t => t !== type)
            delete chart.cassetteTable.prices[type]
          }
          return { charts }
        })
      },

      updateNotes: (collectionId, mainNote, cassetteNote, subChartId) => {
        set((state) => {
          const charts = { ...state.charts }
          const chart = charts[collectionId]
          if (!chart) return state

          if (subChartId && chart.subCharts) {
            const subChart = chart.subCharts.find(sc => sc.id === subChartId)
            if (subChart) {
              subChart.notes.mainTableNote = mainNote
              if (cassetteNote !== undefined) {
                subChart.notes.cassetteTableNote = cassetteNote
              }
              return { charts }
            }
          }

          chart.notes.mainTableNote = mainNote
          if (cassetteNote !== undefined) {
            chart.notes.cassetteTableNote = cassetteNote
          }
          return { charts }
        })
      },

      bulkIncreasePrices: (collectionId, percent, flat, subChartId) => {
        set((state) => {
          const charts = { ...state.charts }
          const chart = charts[collectionId]
          if (!chart) return state

          const updatePrices = (mainTable: DimensionPricingTable, cassetteTable?: CassettePricingTable) => {
            // Update main table prices
            Object.keys(mainTable.prices).forEach(length => {
              Object.keys(mainTable.prices[length]).forEach(width => {
                const currentPrice = mainTable.prices[length][width]
                mainTable.prices[length][width] = Math.round(currentPrice * (1 + percent / 100) + flat)
              })
            })

            // Update cassette table prices
            if (cassetteTable) {
              cassetteTable.cassetteTypes.forEach(type => {
                Object.keys(cassetteTable.prices[type]).forEach(width => {
                  const currentPrice = cassetteTable.prices[type][width]
                  cassetteTable.prices[type][width] = Math.round(currentPrice * (1 + percent / 100) + flat)
                })
              })
            }
          }

          if (subChartId && chart.subCharts) {
            const subChart = chart.subCharts.find(sc => sc.id === subChartId)
            if (subChart) {
              updatePrices(subChart.mainTable, subChart.cassetteTable)
              return { charts }
            }
          }

          updatePrices(chart.mainTable, chart.cassetteTable)
          return { charts }
        })
      },

      bulkImportMainTable: (collectionId, widthValues, lengthValues, prices, subChartId) => {
        set((state) => {
          const charts = { ...state.charts }
          const chart = charts[collectionId]
          if (!chart) return state

          const newTable: DimensionPricingTable = { widthValues, lengthValues, prices }

          if (subChartId && chart.subCharts) {
            const subChart = chart.subCharts.find(sc => sc.id === subChartId)
            if (subChart) {
              subChart.mainTable = newTable
              return { charts }
            }
          }

          chart.mainTable = newTable
          return { charts }
        })
      },

      initializeDefaultCharts: () => {
        const charts: Record<CollectionId, PricingChart> = {
          'duo_basic': createDefaultChart('duo_basic', 'Duo Basic'),
          'duo_light_filtering': createDefaultChart('duo_light_filtering', 'Duo Light Filtering'),
          'duo_room_dimming': createDefaultChart('duo_room_dimming', 'Duo Room Dimming'),
          'tri_light_filtering': createDefaultChart('tri_light_filtering', 'Tri Light Filtering'),
          'tri_room_dimming': createDefaultChart('tri_room_dimming', 'Tri Room Dimming'),
          'roller_room_darkening': createDefaultChart('roller_room_darkening', 'Roller Room Darkening'),
          'roller_light_filtering': createDefaultChart('roller_light_filtering', 'Roller Light Filtering'),
          'roller_room_darkening_y': createDefaultChart('roller_room_darkening_y', 'Roller Room Darkening Y Collection'),
          'roller_light_filtering_y': createDefaultChart('roller_light_filtering_y', 'Roller Light Filtering Y Collection'),
          'roller_sun_screen': createDefaultChart('roller_sun_screen', 'Roller Sun Screen'),
          'room_darkening_sun_screen': createDefaultChart('room_darkening_sun_screen', 'Room Darkening Sun Screen'),
          'wire_guide': createDefaultChart('wire_guide', 'Wire Guide'),
          'uni_shades': createDefaultChart('uni_shades', 'Uni Shades'),
          'zip': {
            collectionId: 'zip',
            collectionName: 'ZIP',
            subCharts: [
              {
                id: 'zip_full_box',
                name: 'Zip-track Full Box',
                mainTable: {
                  widthValues: [...DEFAULT_WIDTHS],
                  lengthValues: [...DEFAULT_LENGTHS],
                  prices: JSON.parse(JSON.stringify(DEFAULT_MAIN_PRICING)),
                },
                cassetteTable: {
                  widthValues: [...DEFAULT_WIDTHS],
                  cassetteTypes: ['ROUND CASETTE', 'SQUARE CASETTE'],
                  prices: JSON.parse(JSON.stringify(DEFAULT_CASSETTE_PRICING)),
                },
                notes: {
                  mainTableNote: '***Standard roller is open roller, please specify cassette if required.',
                  cassetteTableNote: '***The standard cassette/ fascia is color coordinated as much as possible.',
                },
                fabrics: [...COLLECTION_FABRICS['zip']],
              },
              {
                id: 'zip_no_box',
                name: 'Zip-track No Box',
                mainTable: {
                  widthValues: [...DEFAULT_WIDTHS],
                  lengthValues: [...DEFAULT_LENGTHS],
                  prices: JSON.parse(JSON.stringify(DEFAULT_MAIN_PRICING)),
                },
                cassetteTable: {
                  widthValues: [...DEFAULT_WIDTHS],
                  cassetteTypes: ['ROUND CASETTE', 'SQUARE CASETTE'],
                  prices: JSON.parse(JSON.stringify(DEFAULT_CASSETTE_PRICING)),
                },
                notes: {
                  mainTableNote: '***Standard roller is open roller, please specify cassette if required.',
                  cassetteTableNote: '***The standard cassette/ fascia is color coordinated as much as possible.',
                },
                fabrics: [...COLLECTION_FABRICS['zip']],
              },
            ],
            mainTable: {
              widthValues: [...DEFAULT_WIDTHS],
              lengthValues: [...DEFAULT_LENGTHS],
              prices: JSON.parse(JSON.stringify(DEFAULT_MAIN_PRICING)),
            },
            cassetteTable: {
              widthValues: [...DEFAULT_WIDTHS],
              cassetteTypes: ['ROUND CASETTE', 'SQUARE CASETTE'],
              prices: JSON.parse(JSON.stringify(DEFAULT_CASSETTE_PRICING)),
            },
            notes: {
              mainTableNote: '***Standard roller is open roller, please specify cassette if required.',
              cassetteTableNote: '***The standard cassette/ fascia is color coordinated as much as possible.',
            },
            fabrics: [...COLLECTION_FABRICS['zip']],
          },
        }

        set({ charts })
      },

      fetchCharts: async (token: string) => {
        try {
          set({ loading: true })
          const res = await fetch('/api/pricing-charts', {
            headers: { Authorization: `Bearer ${token}` },
          })
          if (!res.ok) {
            throw new Error('Failed to fetch pricing charts')
          }
          const data = await res.json()
          if (data.charts && Object.keys(data.charts).length > 0) {
            set({ charts: data.charts as Record<CollectionId, PricingChart> })
          } else {
            // If no charts in DB, initialize defaults
            get().initializeDefaultCharts()
          }
        } catch (error) {
          console.error('Error fetching pricing charts:', error)
          // Initialize defaults on error
          get().initializeDefaultCharts()
        } finally {
          set({ loading: false })
        }
      },

      saveCharts: async (token: string) => {
        try {
          set({ saving: true })
          const charts = get().charts
          const res = await fetch('/api/pricing-charts', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ charts }),
          })
          if (!res.ok) {
            const error = await res.json().catch(() => ({}))
            throw new Error(error.error || 'Failed to save pricing charts')
          }
          const data = await res.json()
          // Update with saved data
          set({ charts: data.charts as Record<CollectionId, PricingChart> })
          return true
        } catch (error) {
          console.error('Error saving pricing charts:', error)
          return false
        } finally {
          set({ saving: false })
        }
      },
    }),
    {
      name: 'pricing-chart-storage',
    }
  )
)
