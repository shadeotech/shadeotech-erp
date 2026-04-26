export type ContractType = 'INTERIOR' | 'EXTERIOR' | 'INTERIOR_AND_EXTERIOR'

export type StoredContractTemplates = Record<ContractType, string>

export const SETTINGS_TEMPLATE_ID_TO_TYPE = {
  contract_1: 'INTERIOR',
  contract_2: 'EXTERIOR',
  contract_3: 'INTERIOR_AND_EXTERIOR',
} as const

export const TYPE_TO_SETTINGS_TEMPLATE_ID: Record<ContractType, keyof typeof SETTINGS_TEMPLATE_ID_TO_TYPE> = {
  INTERIOR: 'contract_1',
  EXTERIOR: 'contract_2',
  INTERIOR_AND_EXTERIOR: 'contract_3',
}

export function settingsContentsToStored(contents: Record<string, string>): StoredContractTemplates {
  return {
    INTERIOR: contents.contract_1 || '',
    EXTERIOR: contents.contract_2 || '',
    INTERIOR_AND_EXTERIOR: contents.contract_3 || '',
  }
}

export function storedToSettingsContents(
  templates: Partial<StoredContractTemplates> | null | undefined,
  fallback: Record<string, string>
): Record<string, string> {
  return {
    contract_1: templates?.INTERIOR || fallback.contract_1 || '',
    contract_2: templates?.EXTERIOR || fallback.contract_2 || '',
    contract_3: templates?.INTERIOR_AND_EXTERIOR || fallback.contract_3 || '',
  }
}

export function normalizeStoredContractTemplates(value: unknown): StoredContractTemplates | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }

  const obj = value as Record<string, unknown>
  const interior = obj.INTERIOR
  const exterior = obj.EXTERIOR
  const interiorAndExterior = obj.INTERIOR_AND_EXTERIOR

  if (
    typeof interior !== 'string' ||
    typeof exterior !== 'string' ||
    typeof interiorAndExterior !== 'string'
  ) {
    return null
  }

  return {
    INTERIOR: interior,
    EXTERIOR: exterior,
    INTERIOR_AND_EXTERIOR: interiorAndExterior,
  }
}
