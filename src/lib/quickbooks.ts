interface QuickBooksConfig {
  baseUrl: string
  companyId: string
  minorVersion: string
  accessToken: string
}

export interface QuickBooksAccountPayload {
  Name: string
  SubAccount?: boolean
  Description?: string
  FullyQualifiedName?: string
  Active?: boolean
  Classification?: string
  AccountType?: string
  AccountSubType?: string
  CurrentBalance?: number
  CurrentBalanceWithSubAccounts?: number
  CurrencyRef?: {
    value: string
    name?: string
  }
  SyncToken?: string
  Id?: string
  domain?: string
  sparse?: boolean
}

function getConfig(): QuickBooksConfig {
  const baseUrl = process.env.QUICKBOOKS_BASE_URL || 'https://sandbox-quickbooks.api.intuit.com'
  const companyId = process.env.QUICKBOOKS_COMPANY_ID || ''
  const minorVersion = process.env.QUICKBOOKS_MINOR_VERSION || '75'
  const accessToken = process.env.QUICKBOOKS_ACCESS_TOKEN || ''

  if (!companyId) {
    throw new Error('QUICKBOOKS_COMPANY_ID is not configured')
  }
  if (!accessToken) {
    throw new Error('QUICKBOOKS_ACCESS_TOKEN is not configured')
  }

  return { baseUrl, companyId, minorVersion, accessToken }
}

export function getQuickBooksStatus() {
  const baseUrl = process.env.QUICKBOOKS_BASE_URL || 'https://sandbox-quickbooks.api.intuit.com'
  const companyId = process.env.QUICKBOOKS_COMPANY_ID || ''
  const minorVersion = process.env.QUICKBOOKS_MINOR_VERSION || '75'
  const accessToken = process.env.QUICKBOOKS_ACCESS_TOKEN || ''

  return {
    configured: Boolean(companyId),
    connected: Boolean(companyId && accessToken),
    baseUrl,
    companyId,
    minorVersion,
    missing: {
      companyId: !companyId,
      accessToken: !accessToken,
    },
  }
}

export async function createQuickBooksAccount(account: QuickBooksAccountPayload) {
  const cfg = getConfig()
  const url = `${cfg.baseUrl}/v3/company/${cfg.companyId}/account?minorversion=${encodeURIComponent(cfg.minorVersion)}`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cfg.accessToken}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(account),
    cache: 'no-store',
  })

  const text = await response.text()
  let data: any
  try {
    data = text ? JSON.parse(text) : {}
  } catch {
    data = { raw: text }
  }

  if (!response.ok) {
    const message =
      data?.Fault?.Error?.[0]?.Detail ||
      data?.Fault?.Error?.[0]?.Message ||
      data?.error ||
      `QuickBooks API request failed with ${response.status}`
    throw new Error(message)
  }

  return data
}
