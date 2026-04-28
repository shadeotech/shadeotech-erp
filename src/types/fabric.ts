export type StockStatus = 'in_stock' | 'back_order' | 'discontinued'

export interface Fabric {
  id: string
  category: string // e.g., "Duo Shades", "Roller Shades"
  subcategory: string // e.g., "Light Filtering", "Blackout"
  mountType?: string // e.g., "Exterior Wire Guide", "Exterior Zip-Track"
  mountTypeStockStatus?: 'IN_STOCK' | 'OUT_OF_STOCK' // Stock status for mount type
  opacity?: string // e.g., "10%", "5%", "20%", "15%", "6%", "1%"
  color: string // e.g., "White", "Sunrise", "Sand"
  collection: string // e.g., "Infra", "Salvus", "Geneva"
  pricingCollectionId?: string // e.g., "duo_light_filtering", "roller_room_darkening"
  imageFilename: string // e.g., "placeholder.jpg"
  imageUrl?: string // Cloudinary URL (takes priority over imageFilename)
  width?: string // e.g., "126\"", "98\"", "118\""
  minWidth?: string // Minimum width e.g., "24\"", "30\""
  maxWidth?: string // Maximum width e.g., "126\"", "144\""
  rollLength?: string // e.g., "22 yd/roll", "33 yd/roll"
  fabricWidth?: number // Duo Shades: fabric roll width in inches; < 3" disables fabric wrap in cassette
  stockStatus?: StockStatus
  expectedArrival?: string // ISO date string, set when stockStatus is 'back_order'
  inStock?: boolean // legacy; derived from stockStatus when present
  rollsAvailable?: number
}
