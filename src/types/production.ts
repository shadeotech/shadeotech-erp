export type ProductionStatus = 
  | 'PENDING_APPROVAL'
  | 'READY_FOR_PRODUCTION'
  | 'PRODUCTION_CHECK'
  | 'COMPONENT_CUT'
  | 'FABRIC_CUT'
  | 'ASSEMBLE'
  | 'QUALITY_CHECK'
  | 'PACKING'
  | 'SHIPPED_INSTALLED';

export interface ProductionOrderItem {
  _id: string;
  lineNumber: number;
  qty: number; // fq - from quote
  area: string; // fq (e.g., "Bed 1")
  mount: string; // fq (e.g., "IS")
  width: string; // fq (e.g., "34 1/2")
  length: string; // fq (e.g., "70 3/4")
  product: string; // fq
  collection: string; // fq
  fabric: string; // fq
  cassetteTypeColor: string; // fq (e.g., "Square Cassette, Black Exposed")
  bottomRail: string; // fq (e.g., "Sealed")
  sideChain: string; // fq (e.g., "U channel")
  operation: 'MANUAL' | 'MOTORIZED'; // fq
  
  // Motorized specific
  motor?: string; // fq
  motorType?: string; // Admin selects
  remoteControl?: string; // Admin selects
  remoteNumber?: string; // Admin selects
  channelNumber?: string; // fq
  
  // Manual specific
  cordChain?: string;
  cordChainColor?: string;
  
  // Accessories
  accessories?: string; // fq (e.g., "solar/wind sensor")
  smartAccessories?: string; // fq (e.g., "smart hub")
  smartAccessoriesType?: string; // Admin selects
  brackets?: string; // fq
  
  // Production sheet assignment
  productionSheetId?: string;
  productionSheetName?: string;
  
  // Images from quote
  fabricImage?: string;
  cassetteImage?: string;

  sequence?: string;
  // Simple per-item checklist flag for production/orders UI
  checklistDone?: boolean;
}

export interface StageCompletion {
  status: ProductionStatus;
  completedBy: string; // User name who marked this stage
  completedAt: Date; // When this stage was marked as completed
}

export interface OrderNote {
  _id?: string;
  content: string;
  createdBy: string;
  createdByName: string;
  createdAt: Date;
}

export interface ProductionOrder {
  _id: string;
  orderNumber: string;
  quoteId?: string;
  invoiceId?: string;
  customerId: string;
  customerName: string;
  sideMark?: string;
  
  // Dates
  orderDate: Date;
  approvalDate?: Date;
  installationDate?: Date;
  
  // Status tracking
  status: ProductionStatus;
  
  // Stage completion tracking - tracks who completed each stage
  stageCompletions?: StageCompletion[];
  
  // From quote
  items: ProductionOrderItem[];
  totalShades: number;
  products?: string[];
  notes?: string;
  images?: (string | { url: string; category: string })[];
  deliveryMethod?: 'INSTALLATION' | 'PICKUP' | 'SHIPPING';

  // Tracking
  checkpoints?: ProductionCheckpoint[];
  cutPieces?: CutPiece[];
  bom?: BOMItem[];
  shipping?: ShippingBox[];
  activity?: ActivityLog[];
  orderNotes?: OrderNote[];
  
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductionSheet {
  _id: string;
  name: string;
  productType: string;
  operation: 'MANUAL' | 'MOTORIZED';
  fabric?: string;
  cassette?: string;
  bottomRail?: string;
}

export interface ProductionCheckpoint {
  _id: string;
  itemId: string;
  status: ProductionStatus;
  scannedAt: Date;
  scannedBy: string;
  barcode: string;
}

export interface CutPiece {
  _id?: string;
  fabric: string;
  width: number;
  length: number;
}

export interface BOMItem {
  _id?: string;
  supplyName: string;
  quantity: number;
  unit: string;
}

export interface ShippingBox {
  _id?: string;
  width: number;
  length: number;
  height: number;
  weight: number;
}

export interface ActivityLog {
  _id?: string;
  action: string;
  user: string;
  userName?: string;
  timestamp: Date;
  details?: string;
}

export interface InventoryFabric {
  _id: string;
  name: string;
  collection?: string;
  width: number; // Maximum width
  quantity: number;
  product?: string;
  specs?: string;
  image?: string;
  fabricCode?: string;
  colorName?: string;
  colorCode?: string;
  isDuo: boolean;
  duoSpecs?: string;
  lowStockThreshold?: number;
}

export interface InventoryCassette {
  _id: string;
  type: 'Square' | 'Round';
  color: string;
  specs: string;
  image?: string;
  quantity: number;
}

export interface InventoryComponent {
  _id: string;
  name: string;
  type: string;
  quantity: number;
  unit: string;
}

export interface InventoryCutPiece {
  _id: string;
  fabric: string;
  fabricId?: string;
  label?: string;
  width: number;
  length: number;
  quantity: number;
  unit: string;
  createdAt?: string;
}

export interface PurchaseOrderItem {
  _id?: string;
  itemType: string;
  itemId?: string;
  itemName: string;
  itemCode?: string;
  unitType: string;
  qtyOrdered: number;
  qtyReceived: number;
  fullyReceived: boolean;
  forceClosed: boolean;
  invoiceDate?: string;
  invoiceNo?: string;
  invoiceFileUrl?: string;
  receivedBy?: string;
  lineNotes?: string;
}

export interface PurchaseOrder {
  _id: string;
  poNumber: string;
  supplier: string;
  orderDate: string;
  status: 'DRAFT' | 'SENT' | 'PARTIALLY_RECEIVED' | 'FULLY_RECEIVED';
  notes?: string;
  items: PurchaseOrderItem[];
  createdAt?: string;
  updatedAt?: string;
}


