import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import User from '@/lib/models/User'
import { verifyAuth } from '@/lib/auth'
import { createQuickBooksAccount, type QuickBooksAccountPayload } from '@/lib/quickbooks'

async function canAccess(request: NextRequest): Promise<boolean> {
  const auth = await verifyAuth(request)
  if (!auth) return false
  await connectDB()
  const user = await User.findById(auth.userId).select('role').lean()
  return Boolean(user && (user.role === 'ADMIN' || user.role === 'STAFF'))
}

const sampleAccount: QuickBooksAccountPayload = {
  Name: 'Accounts Payable (A/P)',
  SubAccount: false,
  Description: 'Description added during update.',
  FullyQualifiedName: 'Accounts Payable (A/P)',
  Active: true,
  Classification: 'Liability',
  AccountType: 'Accounts Payable',
  AccountSubType: 'AccountsPayable',
  CurrentBalance: -1602.67,
  CurrentBalanceWithSubAccounts: -1602.67,
  CurrencyRef: {
    value: 'USD',
    name: 'United States Dollar',
  },
  domain: 'QBO',
  sparse: false,
  Id: '33',
  SyncToken: '1',
}

export async function POST(request: NextRequest) {
  try {
    if (!(await canAccess(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const account = (body?.account || body?.Account || sampleAccount) as QuickBooksAccountPayload

    if (!account?.Name) {
      return NextResponse.json({ error: 'account.Name is required' }, { status: 400 })
    }

    const result = await createQuickBooksAccount(account)
    return NextResponse.json({ success: true, quickbooks: result }, { status: 200 })
  } catch (error) {
    console.error('QuickBooks account POST error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'QuickBooks request failed' },
      { status: 500 }
    )
  }
}
