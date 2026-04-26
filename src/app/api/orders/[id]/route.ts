import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import User from '@/lib/models/User'
import ProductionOrder from '@/lib/models/ProductionOrder'
import Invoice from '@/lib/models/Invoice'
import { verifyAuth } from '@/lib/auth'
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
    orderNotes: doc.orderNotes || [],
    cutPieces: doc.cutPieces || [],
    bom: doc.bom || [],
    shipping: doc.shipping || [],
    deliveryMethod: doc.deliveryMethod || 'INSTALLATION',
    activity: doc.activity || [],
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

function addActivity(doc: any, auth: { user: UserType | null; userId: string }, action: string, details?: string) {
  const userName = auth.user ? `${auth.user.firstName} ${auth.user.lastName}` : auth.userId
  doc.activity = doc.activity || []
  doc.activity.push({
    action,
    user: auth.userId,
    userName,
    timestamp: new Date(),
    details,
  })
}

// GET - Fetch single order by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuthUser(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const id = params.id
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid order id' }, { status: 400 })
    }

    const doc = await ProductionOrder.findById(id).lean()
    if (!doc) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Check permissions: dealers can only see their own orders
    if (auth.user && auth.user.role === 'DEALER' && doc.dealerId !== auth.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Admins and staff can view all orders
    if (!auth.user || (auth.user.role !== 'ADMIN' && auth.user.role !== 'STAFF' && auth.user.role !== 'DEALER')) {
      return NextResponse.json({ error: 'Forbidden – insufficient permissions' }, { status: 403 })
    }

    return NextResponse.json({ order: toApiOrder(doc) }, { status: 200 })
  } catch (error) {
    console.error('Order GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH - Update order
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuthUser(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins and staff can update orders
    if (!auth.user || (auth.user.role !== 'ADMIN' && auth.user.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Forbidden – only admins and staff can update orders' }, { status: 403 })
    }

    await connectDB()

    const id = params.id
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid order id' }, { status: 400 })
    }

    const doc = await ProductionOrder.findById(id)
    if (!doc) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const body = await request.json()
    const {
      status,
      stageCompletions,
      items,
      notes,
      installationDate,
      approvalDate,
      sideMark,
      orderNotes,
      cutPieces,
      bom,
      shipping,
      images,
      deliveryMethod,
    } = body

    const previousStatus = doc.status

    // Update fields
    if (status !== undefined) doc.status = status
    if (stageCompletions !== undefined) doc.stageCompletions = stageCompletions
    if (items !== undefined) doc.items = items
    if (notes !== undefined) doc.notes = notes
    if (installationDate !== undefined) doc.installationDate = installationDate ? new Date(installationDate) : undefined
    if (approvalDate !== undefined) doc.approvalDate = approvalDate ? new Date(approvalDate) : undefined
    if (sideMark !== undefined) doc.sideMark = sideMark
    if (orderNotes !== undefined) doc.orderNotes = orderNotes
    if (cutPieces !== undefined) doc.cutPieces = cutPieces
    if (bom !== undefined) doc.bom = bom
    if (shipping !== undefined) doc.shipping = shipping
    if (images !== undefined) doc.images = images
    if (deliveryMethod !== undefined) {
      const prevMethod = doc.deliveryMethod || 'INSTALLATION'
      doc.deliveryMethod = deliveryMethod
      if (deliveryMethod !== prevMethod) {
        const methodLabels: Record<string, string> = { INSTALLATION: 'Installation', PICKUP: 'Pickup', SHIPPING: 'Shipping' }
        addActivity(doc, auth, 'Delivery method changed', `${methodLabels[prevMethod] || prevMethod} → ${methodLabels[deliveryMethod] || deliveryMethod}`)
      }
    }

    // Activity logging for production workflow updates - show who added what
    if (cutPieces !== undefined) {
      const details = cutPieces.length > 0
        ? cutPieces.map((p: any) => `${p.fabric || 'Fabric'} (${p.width}" x ${p.length}")`).join(', ')
        : 'Cleared all'
      addActivity(doc, auth, 'Added cut pieces', details || `${cutPieces.length} piece(s)`)
    }
    if (bom !== undefined) {
      const details = bom.length > 0
        ? bom.map((b: any) => `${b.supplyName} (${b.quantity} ${b.unit})`).join(', ')
        : 'Cleared all'
      addActivity(doc, auth, 'Added bill of materials', details || `${bom.length} item(s)`)
    }
    if (shipping !== undefined) {
      addActivity(doc, auth, 'Added shipping boxes', shipping.length > 0 ? `${shipping.length} box(es)` : 'Cleared all')
    }

    // Activity when checklist status changes
    if (status !== undefined && status !== previousStatus) {
      const userName = auth.user ? `${auth.user.firstName} ${auth.user.lastName}` : auth.userId
      const statusLabel = status.replace(/_/g, ' ')
      addActivity(doc, auth, 'Updated status', `Order status changed to ${statusLabel}`)
    }

    // When approving (PENDING_APPROVAL -> READY_FOR_PRODUCTION), add stage completion and create invoice
    if (status === 'READY_FOR_PRODUCTION' && previousStatus === 'PENDING_APPROVAL') {
      const completedBy = auth.user ? `${auth.user.firstName} ${auth.user.lastName}` : auth.userId
      doc.stageCompletions = doc.stageCompletions || []
      doc.stageCompletions.push({
        status: 'READY_FOR_PRODUCTION',
        completedBy,
        completedAt: new Date(),
      })
      if (!doc.approvalDate) {
        doc.approvalDate = new Date()
      }

      // Create and auto-send invoice for dealer order when approved
      if (!doc.invoiceId && doc.dealerId) {
        const items = (doc.items || []).map((item: any) => ({
          productName: `${item.product || 'Shade'} - ${item.fabric || ''} (${item.width || ''} x ${item.length || ''})`,
          category: 'Product',
          quantity: item.qty || 1,
          unitPrice: 0,
          totalPrice: 0,
        }))
        const totalAmount = items.reduce((sum: number, i: any) => sum + (i.totalPrice || 0), 0) || 0
        const dueDate = new Date()
        dueDate.setDate(dueDate.getDate() + 30)

        const invoice = await Invoice.create({
          orderId: doc._id.toString(),
          orderNumber: doc.orderNumber,
          customerId: doc.customerId,
          customerName: doc.customerName,
          dealerId: doc.dealerId,
          dealerName: doc.dealerName,
          sideMark: doc.sideMark || '',
          status: 'SENT',
          sentAt: new Date(),
          items: items.length ? items : [{ productName: `Order ${doc.orderNumber}`, category: 'Product', quantity: 1, unitPrice: 0, totalPrice: 0 }],
          subtotal: totalAmount,
          taxRate: 0,
          taxAmount: 0,
          totalAmount: totalAmount,
          paidAmount: 0,
          balanceAmount: totalAmount,
          dueDate,
        })
        doc.invoiceId = invoice._id.toString()
      }
    }

    await doc.save()

    return NextResponse.json({ order: toApiOrder(doc.toObject()) }, { status: 200 })
  } catch (error) {
    console.error('Order PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
