export type ScanStageId =
  | 'PRODUCTION_CHECK'
  | 'COMPONENT_CUT'
  | 'FABRIC_CUT'
  | 'ASSEMBLE'
  | 'QUALITY_CHECK'
  | 'PACKING'
  | 'SHIPPED_INSTALLED'

export interface StationDef {
  id: string
  label: string
  stage: ScanStageId
  color: string
  icon: string
  description: string
  deductsInventory?: 'components' | 'fabric'
}

export const SCAN_STATIONS: StationDef[] = [
  {
    id: 'production_check',
    label: 'Production Check',
    stage: 'PRODUCTION_CHECK',
    color: '#3b82f6',
    icon: '🔍',
    description: 'Review full order specs before production begins',
  },
  {
    id: 'components_cut',
    label: 'Components Station',
    stage: 'COMPONENT_CUT',
    color: '#8b5cf6',
    icon: '⚙️',
    description: 'Cut metal hardware — tube, hem bar, slats',
    deductsInventory: 'components',
  },
  {
    id: 'fabric_cut',
    label: 'Fabric Cutting',
    stage: 'FABRIC_CUT',
    color: '#ec4899',
    icon: '✂️',
    description: 'Cut fabric to precise width × drop',
    deductsInventory: 'fabric',
  },
  {
    id: 'assembly',
    label: 'Assembly Bench',
    stage: 'ASSEMBLE',
    color: '#f97316',
    icon: '🔧',
    description: 'Assemble components, mount motor, set control side',
  },
  {
    id: 'qc',
    label: 'Quality Control',
    stage: 'QUALITY_CHECK',
    color: '#10b981',
    icon: '✅',
    description: 'Test finished unit — all checklist points must pass',
  },
  {
    id: 'packing',
    label: 'Packing Station',
    stage: 'PACKING',
    color: '#f59e0b',
    icon: '📦',
    description: 'Package for shipping or installation',
  },
  {
    id: 'outbound',
    label: 'Outbound / Dispatch',
    stage: 'SHIPPED_INSTALLED',
    color: '#6366f1',
    icon: '🚚',
    description: 'Final dispatch — ship, install, or customer pickup',
  },
]

export const QC_CHECKLIST = [
  'Motor travel limits set correctly',
  'Fabric hangs level (no twist)',
  'No fraying on cut edges',
  'Cassette cover aligned and clips secure',
  'Operation smooth throughout full range',
  'Remote / channel programmed and tested',
  'Dimensions match order spec',
]

export const STAGE_ORDER: ScanStageId[] = [
  'PRODUCTION_CHECK',
  'COMPONENT_CUT',
  'FABRIC_CUT',
  'ASSEMBLE',
  'QUALITY_CHECK',
  'PACKING',
  'SHIPPED_INSTALLED',
]

export const STAGE_LABELS: Record<string, string> = {
  PENDING_APPROVAL: 'Pending Approval',
  READY_FOR_PRODUCTION: 'Ready for Production',
  PRODUCTION_CHECK: 'Production Check',
  COMPONENT_CUT: 'Components Cut',
  FABRIC_CUT: 'Fabric Cut',
  ASSEMBLE: 'Assembly',
  QUALITY_CHECK: 'Quality Control',
  PACKING: 'Packing',
  SHIPPED_INSTALLED: 'Shipped / Installed',
}
