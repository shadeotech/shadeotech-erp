import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import User from '@/lib/models/User'
import Invoice from '@/lib/models/Invoice'
import Quote from '@/lib/models/Quote'
import ProductionOrder from '@/lib/models/ProductionOrder'
import { verifyAuth } from '@/lib/auth'
import { createProductionOrderFromQuote } from '@/lib/quoteToProductionOrder'
import type { User as UserType } from '@/types/database'
import mongoose from 'mongoose'

async function getAuthUser(request: NextRequest): Promise<{ user: UserType | null; userId: string } | null> {
  const authPayload = await verifyAuth(request)
  if (!authPayload) return null
  await connectDB()
  const raw = await User.findById(authPayload.userId).select('-password').lean()
  if (!raw) return null
  let permissionsObj: Record<string, string> = {}
  if (raw.permissions) {
    if (raw.permissions instanceof Map) {
      ;(raw.permissions as Map<string, string>).forEach((value: string, key: string) => {
        permissionsObj[key] = value
      })
    } else if (typeof raw.permissions === 'object' && !Array.isArray(raw.permissions)) {
      permissionsObj = raw.permissions as Record<string, string>
    }
  }
  const user: UserType = {
    _id: raw._id.toString(),
    email: raw.email,
    firstName: raw.firstName,
    lastName: raw.lastName,
    role: raw.role,
    isActive: raw.isActive,
    permissions: permissionsObj as Record<string, 'no' | 'read' | 'edit' | 'full'>,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  }
  return { user, userId: authPayload.userId }
}

// Convert decimal to fraction string (e.g., 0.5 -> "1/2")
function decimalToFraction(decimal: string): string {
  const num = parseFloat(decimal)
  if (num === 0) return ''
  if (num === 0.125) return '1/8'
  if (num === 0.25) return '1/4'
  if (num === 0.375) return '3/8'
  if (num === 0.5) return '1/2'
  if (num === 0.625) return '5/8'
  if (num === 0.75) return '3/4'
  if (num === 0.875) return '7/8'
  if (num === 1) return '1'
  return decimal
}

// Convert widthWhole/widthDecimal to width string (e.g., 34, "0.5" -> "34 1/2")
function formatDimension(whole: number, decimal: string): string {
  const fraction = decimalToFraction(decimal)
  if (fraction) {
    return `${whole} ${fraction}`
  }
  return whole.toString()
}

// Convert dealer OrderItem to ProductionOrderItem
function convertOrderItem(item: any, lineNumber: number): any {
  const width = formatDimension(item.widthWhole || 0, item.widthDecimal || '0')
  const length = formatDimension(item.lengthWhole || 0, item.lengthDecimal || '0')
  
  // Map controlType to operation
  const operation = item.controlType === 'Motorized' ? 'MOTORIZED' : 'MANUAL'
  
  // Map chainCord to sideChain (use default if empty)
  const sideChain = item.chainCord || 'U channel'
  
  // Map cassetteColor to cassetteTypeColor (use default if empty)
  const cassetteTypeColor = item.cassetteColor || 'Standard'
  
  // Map bottomRailType to bottomRail (use default if empty)
  const bottomRail = item.bottomRailType || 'Standard'
  
  return {
    lineNumber,
    qty: item.quantity || 1,
    area: item.roomType || '',
    mount: item.mount || '',
    width,
    length,
    product: (() => {
      const cat = (item.category || '').toLowerCase()
      if (cat.startsWith('exterior')) return 'Exterior'
      if (cat.includes('duo')) return 'Duo'
      if (cat.includes('roller')) return 'Roller'
      if (cat.includes('tri')) return 'Tri'
      if (cat.includes('uni')) return 'Uni'
      if (cat.includes('roman')) return 'Roman'
      return item.product ? item.product.split(' - ')[0].trim() : ''
    })(),
    fabric: item.fabric || '',
    cassetteTypeColor,
    bottomRail,
    sideChain,
    operation,
    brackets: item.brackets || '',
    // Keep dealer portal fields for reference
    roomType: item.roomType,
    widthWhole: item.widthWhole,
    widthDecimal: item.widthDecimal,
    lengthWhole: item.lengthWhole,
    lengthDecimal: item.lengthDecimal,
    controlType: item.controlType,
    chainCord: item.chainCord,
    controlColor: item.controlColor,
    controlSide: item.controlSide,
    cassetteColor: item.cassetteColor,
    cassetteWrapped: item.cassetteWrapped,
    bottomRailType: item.bottomRailType,
    bottomRailColor: item.bottomRailColor,
    options: item.options,
  }
}

function toApiOrder(doc: any) {
  return {
    _id: doc._id.toString(),
    orderNumber: doc.orderNumber,
    quoteId: doc.quoteId,
    invoiceId: doc.invoiceId,
    customerId: doc.customerId,
    customerName: doc.customerName,
    dealerId: doc.dealerId,
    dealerName: doc.dealerName,
    sideMark: doc.sideMark,
    orderDate: doc.orderDate,
    approvalDate: doc.approvalDate,
    installationDate: doc.installationDate,
    status: doc.status,
    stageCompletions: doc.stageCompletions || [],
    items: doc.items || [],
    totalShades: doc.totalShades,
    products: doc.products || [],
    notes: doc.notes,
    images: doc.images || [],
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

// POST - Create new order (Dealers only)
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only dealers can create orders
    if (!auth.user || auth.user.role !== 'DEALER') {
      return NextResponse.json({ error: 'Forbidden – only dealers can create orders' }, { status: 403 })
    }

    await connectDB()

    const body = await request.json()
    const { items, notes, customerId, customerName, installationDate, sideMark } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Missing required field: items' }, { status: 400 })
    }

    if (!customerId || !customerName) {
      return NextResponse.json({ error: 'Missing required fields: customerId, customerName' }, { status: 400 })
    }

    // Convert dealer order items to production order items
    const productionItems = items.map((item: any, index: number) =>
      convertOrderItem(item, index + 1)
    )

    // Calculate total shades
    const totalShades = productionItems.reduce((sum: number, item: any) => sum + (item.qty || 1), 0)

    // Get unique products
    const products = Array.from(new Set(productionItems.map((item: any) => item.product).filter(Boolean)))

    // Generate unique order number
    // Find the highest order number and increment
    const lastOrder = await ProductionOrder.findOne().sort({ orderNumber: -1 }).select('orderNumber').lean()
    let orderNumber = 'ORD-001'
    if (lastOrder?.orderNumber) {
      const match = lastOrder.orderNumber.match(/ORD-(\d+)/)
      if (match) {
        const lastNum = parseInt(match[1])
        orderNumber = `ORD-${String(lastNum + 1).padStart(3, '0')}`
      }
    }
    
    // Check if order number already exists (race condition protection)
    const existingOrder = await ProductionOrder.findOne({ orderNumber }).lean()
    if (existingOrder) {
      // If exists, find next available number
      const count = await ProductionOrder.countDocuments()
      orderNumber = `ORD-${String(count + 1).padStart(3, '0')}`
    }

    const dealerName = `${auth.user.firstName} ${auth.user.lastName}`

    const doc = await ProductionOrder.create({
      orderNumber,
      customerId,
      customerName,
      dealerId: auth.userId,
      dealerName,
      sideMark,
      orderDate: new Date(),
      installationDate: installationDate ? new Date(installationDate) : undefined,
      status: 'PENDING_APPROVAL',
      items: productionItems,
      totalShades,
      products,
      notes,
    })

    return NextResponse.json({ order: toApiOrder(doc) }, { status: 201 })
  } catch (error) {
    console.error('Orders POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET - Fetch orders (Admin/Staff can view all, Dealers can view their own)
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    // Build query
    const query: any = {}
    if (status) {
      query.status = status
    }

    // Dealers can only see their own orders
    if (auth.user && auth.user.role === 'DEALER') {
      query.dealerId = auth.userId
    } else if (!auth.user || (auth.user.role !== 'ADMIN' && auth.user.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Forbidden – insufficient permissions' }, { status: 403 })
    }

    // Self-heal: for admin/staff viewing Pending Approval, reconcile any paid
    // quote-linked invoices from the last 30 days that never produced an order
    // (covers Stripe webhook drops / pre-fix historical rows).
    if (
      status === 'PENDING_APPROVAL' &&
      auth.user &&
      (auth.user.role === 'ADMIN' || auth.user.role === 'STAFF')
    ) {
      try {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        const paidInvoices = await Invoice.find({
          quoteId: { $exists: true, $ne: null },
          paidAmount: { $gt: 0 },
          updatedAt: { $gte: thirtyDaysAgo },
        }).lean()

        for (const inv of paidInvoices) {
          const existing = await ProductionOrder.findOne({ quoteId: (inv as any).quoteId }).select('_id').lean()
          if (existing) continue
          const quote = await Quote.findById((inv as any).quoteId)
          if (!quote) continue
          if (quote.status !== 'WON') {
            quote.status = 'WON'
            await quote.save()
          }
          await createProductionOrderFromQuote(quote.toObject(), inv)
        }
      } catch (healErr) {
        console.error('[orders GET] Pending-approval self-heal failed:', healErr)
      }
    }

    const orders = await ProductionOrder.find(query)
      .sort({ orderDate: -1, createdAt: -1 })
      .lean()

    return NextResponse.json({ orders: orders.map(toApiOrder) }, { status: 200 })
  } catch (error) {
    console.error('Orders GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
