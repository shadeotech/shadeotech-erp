// Production sheet formula templates - mirrors the CSV files provided

export type ColDef =
  | 'ser' | 'qty' | 'seq' | 'ss' | 'area'
  | 'width' | 'height' | 'heightL' | 'heightR'
  | 'cord' | 'channel' | 'pos' | 'isOs' | 'wand' | 'component' | 'fabricLoc'
  | { source: 'w'; offset: number }    // WIDTH + offset (negative = subtract)
  | { source: 'h' | 'hL' | 'hR'; offset: number }  // HEIGHT + offset

export interface SheetColumn {
  key: string
  label: string
  type: ColDef
  /** width hint for table cell */
  w?: number
}

export interface SheetTemplate {
  key: string
  name: string
  title: string  // printed header on the sheet
  productFamily: string  // for dropdown filtering
  operation: 'MANUAL' | 'MOTORIZED' | 'CORDLESS'
  cassetteVariant: string  // 'Round' | 'Square' | 'Open' | '3in' | 'ZipTrack' | ''
  columns: SheetColumn[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const W = (offset: number): ColDef => ({ source: 'w', offset })
const H = (offset: number): ColDef => ({ source: 'h', offset })
const HL = (offset: number): ColDef => ({ source: 'hL', offset })
const HR = (offset: number): ColDef => ({ source: 'hR', offset })

// ─── Template Definitions ────────────────────────────────────────────────────

export const SHEET_TEMPLATES: SheetTemplate[] = [
  // ── DUO SHADES ─────────────────────────────────────────────────────────────

  {
    key: 'duo-manual-round',
    name: 'Duo Manual Round',
    title: 'DUO SHADES ( SHADEO ROUND FASCIA ) MANUAL',
    productFamily: 'Duo Shade',
    operation: 'MANUAL',
    cassetteVariant: 'Round',
    columns: [
      { key: 'ser', label: 'SER', type: 'ser', w: 40 },
      { key: 'qty', label: 'QTY', type: 'qty', w: 40 },
      { key: 'seq', label: 'SEQ', type: 'seq', w: 40 },
      { key: 'ss', label: 'S/S', type: 'ss', w: 40 },
      { key: 'area', label: 'AREA', type: 'area', w: 80 },
      { key: 'width', label: 'WIDTH', type: 'width', w: 70 },
      { key: 'height', label: 'HEIGHT', type: 'height', w: 70 },
      { key: 'cord', label: 'CORD', type: 'cord', w: 40 },
      { key: 'pos', label: 'POS', type: 'pos', w: 60 },
      { key: 'shades', label: 'SHADES', type: W(-0.125), w: 70 },
      { key: 'fascia', label: 'FASCIA', type: W(-0.5), w: 70 },
      { key: 'tube', label: 'TUBE', type: W(-1.1875), w: 70 },
      { key: 'bottomRail', label: 'BOTTOM RAIL', type: W(-1.125), w: 80 },
      { key: 'bottomTube', label: 'BOTTOM TUBE', type: W(-1.375), w: 80 },
      { key: 'fabricW', label: 'FABRIC W', type: W(-1.1875), w: 70 },
      { key: 'fabricH', label: 'FABRIC H', type: H(1.5), w: 70 },
      { key: 'cut', label: 'CUT', type: H(3), w: 50 },
    ],
  },

  {
    key: 'duo-manual-square',
    name: 'Duo Manual Square',
    title: 'DUO SHADES ( SQUARE VERTILUX CASSETTE ) MANUAL',
    productFamily: 'Duo Shade',
    operation: 'MANUAL',
    cassetteVariant: 'Square',
    columns: [
      { key: 'ser', label: 'SER', type: 'ser', w: 40 },
      { key: 'qty', label: 'QTY', type: 'qty', w: 40 },
      { key: 'seq', label: 'SEQ', type: 'seq', w: 40 },
      { key: 'area', label: 'AREA', type: 'area', w: 80 },
      { key: 'width', label: 'WIDTH', type: 'width', w: 70 },
      { key: 'height', label: 'HEIGHT', type: 'height', w: 70 },
      { key: 'cord', label: 'CORD', type: 'cord', w: 40 },
      { key: 'pos', label: 'POS', type: 'pos', w: 60 },
      { key: 'shades', label: 'SHADES', type: W(-0.125), w: 70 },
      { key: 'cassette', label: 'CASSETTE', type: W(-0.4375), w: 70 },
      { key: 'tube', label: 'TUBE', type: W(-1.25), w: 70 },
      { key: 'bottomRail', label: 'BOTTOM RAIL', type: W(-1.1875), w: 80 },
      { key: 'bottomTube', label: 'BOTTOM TUBE', type: W(-1.375), w: 80 },
      { key: 'fabricW', label: 'FABRIC W', type: W(-1.25), w: 70 },
      { key: 'fabricH', label: 'FABRIC H', type: H(1.5), w: 70 },
      { key: 'cut', label: 'CUT', type: H(3), w: 50 },
    ],
  },

  {
    key: 'duo-motorized-round',
    name: 'Duo Motorized Round',
    title: 'DUO SHADES ( SHADEO ROUND FASCIA ) MOTORIZED',
    productFamily: 'Duo Shade',
    operation: 'MOTORIZED',
    cassetteVariant: 'Round',
    columns: [
      { key: 'ser', label: 'SER', type: 'ser', w: 40 },
      { key: 'qty', label: 'QTY', type: 'qty', w: 40 },
      { key: 'seq', label: 'SEQ', type: 'seq', w: 40 },
      { key: 'area', label: 'AREA', type: 'area', w: 80 },
      { key: 'width', label: 'WIDTH', type: 'width', w: 70 },
      { key: 'height', label: 'HEIGHT', type: 'height', w: 70 },
      { key: 'channel', label: 'CH', type: 'channel', w: 50 },
      { key: 'pos', label: 'POS', type: 'pos', w: 60 },
      { key: 'shades', label: 'SHADES', type: W(-0.125), w: 70 },
      { key: 'fascia', label: 'FASCIA', type: W(-0.375), w: 70 },
      { key: 'tube', label: 'TUBE', type: W(-0.5625), w: 70 },
      { key: 'bottomRail', label: 'BOTTOM RAIL', type: W(-0.9375), w: 80 },
      { key: 'bottomTube', label: 'BOTTOM TUBE', type: W(-0.75), w: 80 },
      { key: 'fabricW', label: 'FABRIC W', type: W(-0.5625), w: 70 },
      { key: 'fabricH', label: 'FABRIC H', type: H(1.5), w: 70 },
      { key: 'double', label: 'DOUBLE', type: H(3), w: 60 },
    ],
  },

  {
    key: 'duo-motorized-square',
    name: 'Duo Motorized Square',
    title: 'DUO SHADES ( SQUARE VERTILUX CASSETTE ) MOTORIZED',
    productFamily: 'Duo Shade',
    operation: 'MOTORIZED',
    cassetteVariant: 'Square',
    columns: [
      { key: 'ser', label: 'SER', type: 'ser', w: 40 },
      { key: 'seq', label: 'SEQ', type: 'seq', w: 40 },
      { key: 'qty', label: 'QTY', type: 'qty', w: 40 },
      { key: 'area', label: 'AREA', type: 'area', w: 80 },
      { key: 'width', label: 'WIDTH', type: 'width', w: 70 },
      { key: 'height', label: 'HEIGHT', type: 'height', w: 70 },
      { key: 'channel', label: 'CH', type: 'channel', w: 50 },
      { key: 'pos', label: 'POS', type: 'pos', w: 60 },
      { key: 'shades', label: 'SHADES', type: W(-0.125), w: 70 },
      { key: 'fascia', label: 'FASCIA', type: W(-0.4375), w: 70 },
      { key: 'tube', label: 'TUBE', type: W(-1.125), w: 70 },
      { key: 'bottomRail', label: 'BOTTOM RAIL', type: W(-1.0625), w: 80 },
      { key: 'bottomTube', label: 'BOTTOM TUBE', type: W(-1.25), w: 80 },
      { key: 'fabricW', label: 'FABRIC W', type: W(-1.125), w: 70 },
      { key: 'fabricH', label: 'FABRIC H', type: H(1.5), w: 70 },
      { key: 'cut', label: 'CUT', type: H(3), w: 50 },
    ],
  },

  // ── TRI SHADES ──────────────────────────────────────────────────────────────

  {
    key: 'tri-manual-round',
    name: 'Tri Manual Round',
    title: 'TRI SHADES ( SHADEO Fascia & Clutch ) MANUAL',
    productFamily: 'Tri Shade',
    operation: 'MANUAL',
    cassetteVariant: 'Round',
    columns: [
      { key: 'ser', label: 'SERIAL', type: 'ser', w: 45 },
      { key: 'qty', label: 'QTY', type: 'qty', w: 40 },
      { key: 'area', label: 'AREA', type: 'area', w: 80 },
      { key: 'width', label: 'WIDTH', type: 'width', w: 70 },
      { key: 'height', label: 'HEIGHT', type: 'height', w: 70 },
      { key: 'cord', label: 'CORD', type: 'cord', w: 40 },
      { key: 'pos', label: 'POS', type: 'pos', w: 60 },
      { key: 'shades', label: 'SHADES', type: W(-0.125), w: 70 },
      { key: 'fascia', label: 'FASCIA', type: W(-0.4375), w: 70 },
      { key: 'tube', label: 'TUBE', type: W(-1.1875), w: 70 },
      { key: 'bottomRail', label: 'BOTTOM RAIL', type: W(-1.0625), w: 80 },
      { key: 'fabricW', label: 'FABRIC W', type: W(-1.125), w: 70 },
      { key: 'fabricH', label: 'FABRIC H', type: H(0.9375), w: 70 },
      { key: 'component', label: 'COMPONENT', type: 'component', w: 80 },
      { key: 'fabricLoc', label: 'FABRIC/LOC', type: 'fabricLoc', w: 80 },
    ],
  },

  {
    key: 'tri-manual-square',
    name: 'Tri Manual Square',
    title: 'TRI SHADES ( SQUARE VERTILUX Fascia & Clutch ) MANUAL',
    productFamily: 'Tri Shade',
    operation: 'MANUAL',
    cassetteVariant: 'Square',
    columns: [
      { key: 'ser', label: 'SER', type: 'ser', w: 40 },
      { key: 'qty', label: 'QTY', type: 'qty', w: 40 },
      { key: 'area', label: 'AREA', type: 'area', w: 80 },
      { key: 'width', label: 'WIDTH', type: 'width', w: 70 },
      { key: 'height', label: 'HEIGHT', type: 'height', w: 70 },
      { key: 'cord', label: 'CORD', type: 'cord', w: 40 },
      { key: 'pos', label: 'POS', type: 'pos', w: 60 },
      { key: 'shades', label: 'SHADES', type: W(-0.125), w: 70 },
      { key: 'fascia', label: 'FASCIA', type: W(-0.4375), w: 70 },
      { key: 'tube', label: 'TUBE', type: W(-1.25), w: 70 },
      { key: 'bottomRail', label: 'BOTTOM RAIL', type: W(-1.25), w: 80 },
      { key: 'fabricW', label: 'FABRIC W', type: W(-1.25), w: 70 },
      { key: 'fabricH', label: 'FABRIC H', type: H(0.9375), w: 70 },
    ],
  },

  {
    key: 'tri-motorized-round',
    name: 'Tri Motorized Round',
    title: 'TRI SHADES ( SHADEO Fascia & Clutch ) MOTORIZED',
    productFamily: 'Tri Shade',
    operation: 'MOTORIZED',
    cassetteVariant: 'Round',
    columns: [
      { key: 'ser', label: 'SERIAL', type: 'ser', w: 45 },
      { key: 'qty', label: 'QTY', type: 'qty', w: 40 },
      { key: 'area', label: 'AREA', type: 'area', w: 80 },
      { key: 'width', label: 'WIDTH', type: 'width', w: 70 },
      { key: 'height', label: 'HEIGHT', type: 'height', w: 70 },
      { key: 'channel', label: 'CHANNEL', type: 'channel', w: 60 },
      { key: 'pos', label: 'POS', type: 'pos', w: 60 },
      { key: 'shades', label: 'SHADES', type: W(-0.125), w: 70 },
      { key: 'fascia', label: 'FASCIA', type: W(-0.3125), w: 70 },
      { key: 'tube', label: 'TUBE', type: W(-0.8125), w: 70 },
      { key: 'bottomRail', label: 'BOTTOM RAIL', type: W(-0.8125), w: 80 },
      { key: 'fabricW', label: 'FABRIC W', type: W(-0.8125), w: 70 },
      { key: 'fabricH', label: 'FABRIC H', type: H(0.9375), w: 70 },
      { key: 'component', label: 'COMPONENT', type: 'component', w: 80 },
      { key: 'fabricLoc', label: 'FABRIC/LOC', type: 'fabricLoc', w: 80 },
    ],
  },

  {
    key: 'tri-motorized-square',
    name: 'Tri Motorized Square',
    title: 'TRI SHADES ( SQUARE VERTILUX Fascia & Clutch ) MOTORIZED',
    productFamily: 'Tri Shade',
    operation: 'MOTORIZED',
    cassetteVariant: 'Square',
    columns: [
      { key: 'ser', label: 'SER', type: 'ser', w: 40 },
      { key: 'qty', label: 'QTY', type: 'qty', w: 40 },
      { key: 'area', label: 'AREA', type: 'area', w: 80 },
      { key: 'width', label: 'WIDTH', type: 'width', w: 70 },
      { key: 'height', label: 'HEIGHT', type: 'height', w: 70 },
      { key: 'channel', label: 'CH', type: 'channel', w: 50 },
      { key: 'pos', label: 'POS', type: 'pos', w: 60 },
      { key: 'shades', label: 'SHADES', type: W(-0.125), w: 70 },
      { key: 'fascia', label: 'FASCIA', type: W(-0.4375), w: 70 },
      { key: 'tube', label: 'TUBE', type: W(-1.25), w: 70 },
      { key: 'bottomRail', label: 'BOTTOM RAIL', type: W(-1.25), w: 80 },
      { key: 'fabricW', label: 'FABRIC W', type: W(-1.25), w: 70 },
      { key: 'fabricH', label: 'FABRIC H', type: H(0.9375), w: 70 },
    ],
  },

  // ── UNI SHADES ──────────────────────────────────────────────────────────────

  {
    key: 'uni-manual-round',
    name: 'Uni Manual Round',
    title: 'UNI SHADES ( ROUND CASSETTE & Clutch )',
    productFamily: 'Uni Shade',
    operation: 'MANUAL',
    cassetteVariant: 'Round',
    columns: [
      { key: 'ser', label: 'SER', type: 'ser', w: 40 },
      { key: 'qty', label: 'QTY', type: 'qty', w: 40 },
      { key: 'area', label: 'AREA', type: 'area', w: 80 },
      { key: 'width', label: 'WIDTH', type: 'width', w: 70 },
      { key: 'height', label: 'HEIGHT', type: 'height', w: 70 },
      { key: 'wand', label: 'WAND', type: 'wand', w: 50 },
      { key: 'pos', label: 'POS', type: 'pos', w: 60 },
      { key: 'isOs', label: 'IS / OS', type: 'isOs', w: 60 },
      { key: 'fascia', label: 'FASCIA', type: W(-0.375), w: 70 },
      { key: 'trackRod', label: 'TRACK/ROD', type: W(-0.5), w: 80 },
      { key: 'fabricQty', label: 'FABRIC QTY', type: W(-1), w: 80 },
      { key: 'fabricH', label: 'FABRIC H', type: H(-4), w: 70 },
      { key: 'carrier', label: 'CARRIER', type: H(0), w: 60 },
    ],
  },

  {
    key: 'uni-manual-square',
    name: 'Uni Manual Square',
    title: 'UNI SHADES ( SQ CASSETTE & Clutch )',
    productFamily: 'Uni Shade',
    operation: 'MANUAL',
    cassetteVariant: 'Square',
    columns: [
      { key: 'ser', label: 'SER', type: 'ser', w: 40 },
      { key: 'qty', label: 'QTY', type: 'qty', w: 40 },
      { key: 'area', label: 'AREA', type: 'area', w: 80 },
      { key: 'width', label: 'WIDTH', type: 'width', w: 70 },
      { key: 'height', label: 'HEIGHT', type: 'height', w: 70 },
      { key: 'wand', label: 'WAND', type: 'wand', w: 50 },
      { key: 'pos', label: 'POS', type: 'pos', w: 60 },
      { key: 'isOs', label: 'IS / OS', type: 'isOs', w: 60 },
      { key: 'fascia', label: 'FASCIA', type: W(-0.375), w: 70 },
      { key: 'trackRod', label: 'TRACK/ROD', type: W(-0.5), w: 80 },
      { key: 'fabricQty', label: 'FABRIC QTY', type: W(-1), w: 80 },
      { key: 'fabricH', label: 'FABRIC H', type: H(-4), w: 70 },
      { key: 'carrier', label: 'CARRIER', type: H(0), w: 60 },
    ],
  },

  // ── ROLLER SHADES ───────────────────────────────────────────────────────────

  {
    key: 'roller-cordless-square',
    name: 'Roller Cordless Square',
    title: 'ROLLER SHADES ( VERTILUX SQUARE CASSETTE ) CORDLESS',
    productFamily: 'Roller Shade',
    operation: 'CORDLESS',
    cassetteVariant: 'Square',
    columns: [
      { key: 'ser', label: 'REF', type: 'ser', w: 40 },
      { key: 'qty', label: 'QTY', type: 'qty', w: 40 },
      { key: 'seq', label: 'SEQ', type: 'seq', w: 40 },
      { key: 'area', label: 'AREA', type: 'area', w: 80 },
      { key: 'width', label: 'WIDTH', type: 'width', w: 70 },
      { key: 'height', label: 'HEIGHT', type: 'height', w: 70 },
      { key: 'pos', label: 'POS', type: 'pos', w: 60 },
      { key: 'shades', label: 'SHADES', type: W(-0.125), w: 70 },
      { key: 'fascia', label: 'FASCIA', type: W(-0.4375), w: 70 },
      { key: 'tube', label: 'TUBE', type: W(-0.875), w: 70 },
      { key: 'bottomR', label: 'BOTTOM R', type: W(-0.9375), w: 70 },
      { key: 'fabricW', label: 'FABRIC W', type: W(-0.9375), w: 70 },
      { key: 'fabricH', label: 'FABRIC H', type: H(10), w: 70 },
    ],
  },

  {
    key: 'roller-manual-3in',
    name: 'Roller Manual 3" Fascia',
    title: 'ROLLER SHADES ( VERTILUX 3" FASCIA & MANUAL )',
    productFamily: 'Roller Shade',
    operation: 'MANUAL',
    cassetteVariant: '3in',
    columns: [
      { key: 'ser', label: 'SER', type: 'ser', w: 40 },
      { key: 'seq', label: 'SEQ', type: 'seq', w: 40 },
      { key: 'qty', label: 'QTY', type: 'qty', w: 40 },
      { key: 'area', label: 'AREA', type: 'area', w: 80 },
      { key: 'width', label: 'WIDTH', type: 'width', w: 70 },
      { key: 'height', label: 'HEIGHT', type: 'height', w: 70 },
      { key: 'cord', label: 'CHAIN', type: 'cord', w: 50 },
      { key: 'pos', label: 'POS', type: 'pos', w: 60 },
      { key: 'shades', label: 'SHADES', type: W(-0.125), w: 70 },
      { key: 'fascia', label: 'FASCIA', type: W(-0.25), w: 70 },
      { key: 'tube', label: 'TUBE', type: W(-1), w: 70 },
      { key: 'bottomR', label: 'BOTTOM R', type: W(-2.5), w: 70 },
      { key: 'fabricW', label: 'FABRIC W', type: W(-1.0625), w: 70 },
      { key: 'fabricH', label: 'FABRIC H', type: H(10), w: 70 },
    ],
  },

  {
    key: 'roller-manual-open',
    name: 'Roller Manual Open',
    title: 'VERTILUX OPEN ROLLER, MANUAL',
    productFamily: 'Roller Shade',
    operation: 'MANUAL',
    cassetteVariant: 'Open',
    columns: [
      { key: 'ser', label: 'SER', type: 'ser', w: 40 },
      { key: 'qty', label: 'QTY', type: 'qty', w: 40 },
      { key: 'area', label: 'AREA', type: 'area', w: 80 },
      { key: 'width', label: 'WIDTH', type: 'width', w: 70 },
      { key: 'height', label: 'HEIGHT', type: 'height', w: 70 },
      { key: 'cord', label: 'CHAIN', type: 'cord', w: 50 },
      { key: 'pos', label: 'POS', type: 'pos', w: 60 },
      { key: 'shades', label: 'SHADES', type: W(-0.125), w: 70 },
      { key: 'tube', label: 'TUBE', type: W(-1), w: 70 },
      { key: 'bottomR', label: 'BOTTOM RAIL', type: W(-1), w: 80 },
      { key: 'fabricW', label: 'FABRIC W', type: W(-1.125), w: 70 },
      { key: 'fabricH', label: 'FABRIC H', type: H(8), w: 70 },
    ],
  },

  {
    key: 'roller-manual-round',
    name: 'Roller Manual Round',
    title: 'ROLLER SHADES ( SHADEO ROUND FASCIA ) MANUAL',
    productFamily: 'Roller Shade',
    operation: 'MANUAL',
    cassetteVariant: 'Round',
    columns: [
      { key: 'ser', label: 'SER', type: 'ser', w: 40 },
      { key: 'qty', label: 'QTY', type: 'qty', w: 40 },
      { key: 'seq', label: 'SEQ', type: 'seq', w: 40 },
      { key: 'area', label: 'AREA', type: 'area', w: 80 },
      { key: 'width', label: 'WIDTH', type: 'width', w: 70 },
      { key: 'height', label: 'HEIGHT', type: 'height', w: 70 },
      { key: 'cord', label: 'CHAIN', type: 'cord', w: 50 },
      { key: 'pos', label: 'POS', type: 'pos', w: 60 },
      { key: 'shades', label: 'SHADES', type: W(-0.125), w: 70 },
      { key: 'fascia', label: 'FASCIA', type: W(-0.375), w: 70 },
      { key: 'tube', label: 'TUBE', type: W(-1.0625), w: 70 },
      { key: 'bottomRail', label: 'BOTTOM RAIL', type: W(-1.0625), w: 80 },
      { key: 'fabricW', label: 'FABRIC W', type: W(-1.0625), w: 70 },
      { key: 'fabricH', label: 'FABRIC H', type: H(10), w: 70 },
    ],
  },

  {
    key: 'roller-manual-square',
    name: 'Roller Manual Square',
    title: 'ROLLER SHADES ( VERTILUX SQUARE CASSETTE ) MANUAL',
    productFamily: 'Roller Shade',
    operation: 'MANUAL',
    cassetteVariant: 'Square',
    columns: [
      { key: 'ser', label: 'REF', type: 'ser', w: 40 },
      { key: 'qty', label: 'QTY', type: 'qty', w: 40 },
      { key: 'seq', label: 'SEQ', type: 'seq', w: 40 },
      { key: 'area', label: 'AREA', type: 'area', w: 80 },
      { key: 'width', label: 'WIDTH', type: 'width', w: 70 },
      { key: 'height', label: 'HEIGHT', type: 'height', w: 70 },
      { key: 'cord', label: 'CHAIN', type: 'cord', w: 50 },
      { key: 'pos', label: 'POS', type: 'pos', w: 60 },
      { key: 'shades', label: 'SHADES', type: W(-0.125), w: 70 },
      { key: 'fascia', label: 'FASCIA', type: W(-0.4375), w: 70 },
      { key: 'tube', label: 'TUBE', type: W(-1.125), w: 70 },
      { key: 'bottomRail', label: 'BOTTOM RAIL', type: W(-1.1875), w: 80 },
      { key: 'fabricW', label: 'FABRIC W', type: W(-1.1875), w: 70 },
      { key: 'fabricH', label: 'FABRIC H', type: H(10), w: 70 },
    ],
  },

  {
    key: 'roller-motorized-3in',
    name: 'Roller Motorized 3" Fascia',
    title: 'ROLLER SHADES ( VERTILUX 3" Fascia & Motorized )',
    productFamily: 'Roller Shade',
    operation: 'MOTORIZED',
    cassetteVariant: '3in',
    columns: [
      { key: 'ser', label: 'SER', type: 'ser', w: 40 },
      { key: 'seq', label: 'SEQ', type: 'seq', w: 40 },
      { key: 'qty', label: 'QTY', type: 'qty', w: 40 },
      { key: 'area', label: 'AREA', type: 'area', w: 80 },
      { key: 'width', label: 'WIDTH', type: 'width', w: 70 },
      { key: 'height', label: 'HEIGHT', type: 'height', w: 70 },
      { key: 'channel', label: 'CH', type: 'channel', w: 50 },
      { key: 'pos', label: 'POS', type: 'pos', w: 60 },
      { key: 'shades', label: 'SHADES', type: W(0), w: 70 },
      { key: 'fascia', label: 'FASCIA', type: W(-0.125), w: 70 },
      { key: 'tube', label: 'TUBE', type: W(-0.8125), w: 70 },
      { key: 'bottomRail', label: 'BOTTOM RAIL', type: W(-2.3125), w: 80 },
      { key: 'fabricW', label: 'FABRIC W', type: W(-0.875), w: 70 },
      { key: 'fabricH', label: 'FABRIC H', type: H(10), w: 70 },
    ],
  },

  {
    key: 'roller-motorized-open',
    name: 'Roller Motorized Open',
    title: 'VERTILUX OPEN ROLLER, MOTORIZED',
    productFamily: 'Roller Shade',
    operation: 'MOTORIZED',
    cassetteVariant: 'Open',
    columns: [
      { key: 'ser', label: 'SER', type: 'ser', w: 40 },
      { key: 'qty', label: 'QTY', type: 'qty', w: 40 },
      { key: 'area', label: 'AREA', type: 'area', w: 80 },
      { key: 'width', label: 'WIDTH', type: 'width', w: 70 },
      { key: 'height', label: 'HEIGHT', type: 'height', w: 70 },
      { key: 'channel', label: 'CH', type: 'channel', w: 50 },
      { key: 'pos', label: 'POS', type: 'pos', w: 60 },
      { key: 'shades', label: 'SHADES', type: W(-0.125), w: 70 },
      { key: 'tube', label: 'TUBE', type: W(-0.875), w: 70 },
      { key: 'bottomR', label: 'BOTTOM RAIL', type: W(-0.875), w: 80 },
      { key: 'fabricW', label: 'FABRIC W', type: W(-1), w: 70 },
      { key: 'fabricH', label: 'FABRIC H', type: H(10), w: 70 },
    ],
  },

  {
    key: 'roller-motorized-round',
    name: 'Roller Motorized Round',
    title: 'ROLLER SHADES ( SHADEO Fascia & Clutch ) MOTOR',
    productFamily: 'Roller Shade',
    operation: 'MOTORIZED',
    cassetteVariant: 'Round',
    columns: [
      { key: 'ser', label: 'SER', type: 'ser', w: 40 },
      { key: 'seq', label: 'SEQ', type: 'seq', w: 40 },
      { key: 'qty', label: 'QTY', type: 'qty', w: 40 },
      { key: 'area', label: 'AREA', type: 'area', w: 80 },
      { key: 'width', label: 'WIDTH', type: 'width', w: 70 },
      { key: 'height', label: 'HEIGHT', type: 'height', w: 70 },
      { key: 'channel', label: 'CH', type: 'channel', w: 50 },
      { key: 'pos', label: 'POS', type: 'pos', w: 60 },
      { key: 'shades', label: 'SHADES', type: W(-0.125), w: 70 },
      { key: 'fascia', label: 'FASCIA', type: W(-0.375), w: 70 },
      { key: 'tube', label: 'TUBE', type: W(-0.9375), w: 70 },
      { key: 'bottomRail', label: 'BOTTOM RAIL', type: W(-1), w: 80 },
      { key: 'fabricW', label: 'FABRIC W', type: W(-1), w: 70 },
      { key: 'fabricH', label: 'FABRIC H', type: H(8), w: 70 },
    ],
  },

  {
    key: 'roller-motorized-square',
    name: 'Roller Motorized Square',
    title: 'ROLLER SHADES ( VERTILUX SQUARE CASSETTE ) MOTORIZED',
    productFamily: 'Roller Shade',
    operation: 'MOTORIZED',
    cassetteVariant: 'Square',
    columns: [
      { key: 'ser', label: 'SER', type: 'ser', w: 40 },
      { key: 'qty', label: 'QTY', type: 'qty', w: 40 },
      { key: 'seq', label: 'SEQ', type: 'seq', w: 40 },
      { key: 'area', label: 'AREA', type: 'area', w: 80 },
      { key: 'width', label: 'WIDTH', type: 'width', w: 70 },
      { key: 'height', label: 'HEIGHT', type: 'height', w: 70 },
      { key: 'channel', label: 'CH', type: 'channel', w: 50 },
      { key: 'pos', label: 'POS', type: 'pos', w: 60 },
      { key: 'shades', label: 'SHADES', type: W(-0.125), w: 70 },
      { key: 'fascia', label: 'FASCIA', type: W(-0.4375), w: 70 },
      { key: 'tube', label: 'TUBE', type: W(-1.125), w: 70 },
      { key: 'bottomRail', label: 'BOTTOM RAIL', type: W(-1.0625), w: 80 },
      { key: 'fabricW', label: 'FABRIC W', type: W(-1.125), w: 70 },
      { key: 'fabricH', label: 'FABRIC H', type: H(7), w: 70 },
    ],
  },

  // ── EXTERIOR / ZIP TRACK ────────────────────────────────────────────────────

  {
    key: 'zip-motorized',
    name: 'Zip Track Motorized',
    title: 'PATIO SHADES ( VERTILUX MOTORIZED )',
    productFamily: 'Exterior',
    operation: 'MOTORIZED',
    cassetteVariant: 'ZipTrack',
    columns: [
      { key: 'ser', label: 'SER', type: 'ser', w: 40 },
      { key: 'qty', label: 'QTY', type: 'qty', w: 40 },
      { key: 'seq', label: 'SEQ', type: 'seq', w: 40 },
      { key: 'area', label: 'AREA', type: 'area', w: 80 },
      { key: 'width', label: 'WIDTH', type: 'width', w: 70 },
      { key: 'heightL', label: 'HEIGHT L', type: 'heightL', w: 70 },
      { key: 'heightR', label: 'HEIGHT R', type: 'heightR', w: 70 },
      { key: 'channel', label: 'CH', type: 'channel', w: 50 },
      { key: 'pos', label: 'POS', type: 'pos', w: 60 },
      { key: 'shades', label: 'SHADES', type: W(-0.125), w: 70 },
      { key: 'box', label: 'BOX', type: W(-0.125), w: 60 },
      { key: 'cover', label: 'COVER', type: W(-0.125), w: 60 },
      { key: 'tube', label: 'TUBE', type: W(-5.375), w: 70 },
      { key: 'bottomR', label: 'BOTTOM R', type: W(-4.375), w: 70 },
      { key: 'weight', label: 'WEIGHT', type: W(-7.875), w: 70 },
      { key: 'trackL', label: 'TRACK L', type: HL(-5.375), w: 70 },
      { key: 'trackR', label: 'TRACK R', type: HR(-5.375), w: 70 },
      { key: 'pvcL', label: 'PVC L', type: HL(-5.75), w: 60 },
      { key: 'pvcR', label: 'PVC R', type: HR(-5.75), w: 60 },
      { key: 'fabricW', label: 'FABRIC W', type: W(-3.25), w: 70 },
      { key: 'fabricH', label: 'FABRIC H', type: H(12), w: 70 },
    ],
  },
]

// ─── Template Lookup Helpers ──────────────────────────────────────────────────

export function getTemplateByKey(key: string): SheetTemplate | undefined {
  return SHEET_TEMPLATES.find(t => t.key === key)
}

export function getTemplatesForFamily(productFamily: string): SheetTemplate[] {
  return SHEET_TEMPLATES.filter(t => t.productFamily === productFamily)
}

export function detectProductFamily(product: string): string {
  const p = (product || '').toLowerCase()
  if (p.includes('duo')) return 'Duo Shade'
  if (p.includes('tri')) return 'Tri Shade'
  if (p.includes('uni')) return 'Uni Shade'
  if (p.includes('zip') || p.includes('patio') || p.includes('exterior')) return 'Exterior'
  if (p.includes('roller')) return 'Roller Shade'
  return 'Roller Shade'
}

export function autoSelectTemplate(
  item: { product: string; operation: string; cassetteTypeColor?: string },
  quoteProductName?: string
): string {
  const fullName = ((quoteProductName || item.product || '') + ' ' + (item.cassetteTypeColor || '')).toLowerCase()
  const op = (item.operation || 'MANUAL').toUpperCase()

  const isRound = fullName.includes('round') || fullName.includes('shadeo')
  const isSquare = fullName.includes('square') || fullName.includes('vertilux')
  const isOpen = fullName.includes('open')
  const is3in = fullName.includes('3"') || fullName.includes('3 in') || fullName.includes('fascia')
  const isZip = fullName.includes('zip') || fullName.includes('patio')
  const isCordless = fullName.includes('cordless')

  if (fullName.includes('duo')) {
    if (op === 'MOTORIZED') return isSquare ? 'duo-motorized-square' : 'duo-motorized-round'
    return isSquare ? 'duo-manual-square' : 'duo-manual-round'
  }
  if (fullName.includes('tri')) {
    if (op === 'MOTORIZED') return isSquare ? 'tri-motorized-square' : 'tri-motorized-round'
    return isSquare ? 'tri-manual-square' : 'tri-manual-round'
  }
  if (fullName.includes('uni')) {
    return isSquare ? 'uni-manual-square' : 'uni-manual-round'
  }
  if (isZip || fullName.includes('exterior')) {
    return 'zip-motorized'
  }
  // Roller
  if (op === 'MOTORIZED') {
    if (isOpen) return 'roller-motorized-open'
    if (is3in) return 'roller-motorized-3in'
    if (isRound) return 'roller-motorized-round'
    return 'roller-motorized-square'
  }
  if (isCordless) return 'roller-cordless-square'
  if (isOpen) return 'roller-manual-open'
  if (is3in) return 'roller-manual-3in'
  if (isRound) return 'roller-manual-round'
  return 'roller-manual-square'
}

// ─── Dimension Parsing / Formatting ──────────────────────────────────────────

/** Parse a fraction string like "34 1/2" or "1/2" or "34" to decimal inches */
export function parseDim(dim: string | number): number {
  if (typeof dim === 'number') return dim
  if (!dim) return 0
  const parts = String(dim).trim().split(/\s+/)
  let total = 0
  for (const part of parts) {
    if (part.includes('/')) {
      const [n, d] = part.split('/')
      total += parseInt(n, 10) / parseInt(d, 10)
    } else {
      total += parseFloat(part) || 0
    }
  }
  return total
}

const FRAC_MAP: Record<number, string> = {
  1: '1/16', 2: '1/8', 3: '3/16', 4: '1/4', 5: '5/16', 6: '3/8',
  7: '7/16', 8: '1/2', 9: '9/16', 10: '5/8', 11: '11/16', 12: '3/4',
  13: '13/16', 14: '7/8', 15: '15/16',
}

/** Format a decimal inch value as a fraction string like "-1 3/16" */
export function fmtDim(value: number): string {
  if (value === undefined || value === null || isNaN(value)) return '—'
  const negative = value < 0
  const abs = Math.abs(value)
  const whole = Math.floor(abs)
  const n = Math.round((abs - whole) * 16)
  let result: string
  if (n === 0) result = `${whole}`
  else if (n === 16) result = `${whole + 1}`
  else result = whole > 0 ? `${whole} ${FRAC_MAP[n]}` : FRAC_MAP[n] ?? `${whole}`
  return negative ? `-${result}` : result
}

/** Compute a column's value given the row's width/height inputs */
export function computeCol(
  colType: ColDef,
  w: number,
  h: number,
  hL: number,
  hR: number
): number | null {
  if (typeof colType === 'string') return null  // input column, not computed
  if (colType.source === 'w') return w + colType.offset
  if (colType.source === 'h') return h + colType.offset
  if (colType.source === 'hL') return hL + colType.offset
  if (colType.source === 'hR') return hR + colType.offset
  return null
}
