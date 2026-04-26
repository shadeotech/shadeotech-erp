import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import User from '@/lib/models/User'
import ProductionOrder from '@/lib/models/ProductionOrder'
import Quote from '@/lib/models/Quote'
import Task from '@/lib/models/Task'
import Expense from '@/lib/models/Expense'
import { verifyAuth } from '@/lib/auth'
import mongoose from 'mongoose'

export interface AuditLogEntry {
  timestamp: string
  userName: string
  userEmail: string
  action: string
  actionBadge: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW'
  entityType: string
  entityId: string
  details: string
}

function toActionBadge(action: string): 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW' {
  const a = (action || '').toLowerCase()
  if (a.includes('created') || a === 'create') return 'CREATE'
  if (a.includes('deleted') || a === 'delete') return 'DELETE'
  if (a.includes('viewed') || a === 'view') return 'VIEW'
  return 'UPDATE'
}

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const rawUser = await User.findById(auth.userId).select('role').lean()
    if (!rawUser || (rawUser.role !== 'ADMIN' && rawUser.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Forbidden – audit logs are only available to admins and staff' }, { status: 403 })
    }

    const entries: Array<{
      timestamp: Date
      userId: string
      userName: string
      action: string
      entityType: string
      entityId: string
      details: string
    }> = []

    // 1. Orders: creation (dealerId/dealerName) + activity array
    const orders = await ProductionOrder.find()
      .sort({ createdAt: -1 })
      .limit(80)
      .select('orderNumber createdAt dealerId dealerName activity')
      .lean()

    for (const order of orders) {
      const orderNumber = order.orderNumber || (order as any)._id?.toString() || '—'
      if (order.dealerId && order.createdAt) {
        entries.push({
          timestamp: new Date(order.createdAt),
          userId: order.dealerId,
          userName: order.dealerName || 'Unknown',
          action: 'CREATE',
          entityType: 'Order',
          entityId: orderNumber,
          details: 'Created new order',
        })
      }
      const activity = (order as any).activity || []
      for (const a of activity) {
        entries.push({
          timestamp: a.timestamp ? new Date(a.timestamp) : new Date(),
          userId: a.user || '',
          userName: a.userName || 'Unknown',
          action: a.action || 'UPDATE',
          entityType: 'Order',
          entityId: orderNumber,
          details: a.details || a.action || 'Order activity',
        })
      }
    }

    // 2. Quotes: createdById + createdAt
    const quotes = await Quote.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .select('quoteNumber createdById createdAt')
      .lean()

    for (const q of quotes) {
      if (q.createdAt) {
        entries.push({
          timestamp: new Date(q.createdAt),
          userId: (q as any).createdById || '',
          userName: 'Unknown',
          action: 'CREATE',
          entityType: 'Quote',
          entityId: (q as any).quoteNumber || (q as any)._id?.toString() || '—',
          details: 'Created new quote for customer',
        })
      }
    }

    // 3. Tasks: createdBy + createdAt
    const tasks = await Task.find()
      .sort({ createdAt: -1 })
      .limit(40)
      .select('title createdBy createdAt')
      .lean()

    for (const t of tasks) {
      if (t.createdAt && (t as any).createdBy) {
        entries.push({
          timestamp: new Date((t as any).createdAt),
          userId: (t as any).createdBy,
          userName: 'Unknown',
          action: 'CREATE',
          entityType: 'Task',
          entityId: (t as any)._id?.toString() || '—',
          details: (t as any).title ? `Created task: ${(t as any).title}` : 'Created task',
        })
      }
    }

    // 4. Expenses: createdBy + createdAt
    const expenses = await Expense.find()
      .sort({ createdAt: -1 })
      .limit(40)
      .select('description amount createdBy createdAt')
      .lean()

    for (const e of expenses) {
      if ((e as any).createdAt && (e as any).createdBy) {
        const desc = (e as any).description || `Expense $${(e as any).amount ?? 0}`
        entries.push({
          timestamp: new Date((e as any).createdAt),
          userId: (e as any).createdBy,
          userName: 'Unknown',
          action: 'CREATE',
          entityType: 'Expense',
          entityId: (e as any)._id?.toString() || '—',
          details: desc,
        })
      }
    }

    // Collect all user IDs and resolve names/emails
    const userIds = Array.from(new Set(entries.map((e) => e.userId).filter(Boolean)))
    const userMap: Record<string, { name: string; email: string }> = {}
    if (userIds.length > 0) {
      const validIds = userIds.filter((id) => mongoose.Types.ObjectId.isValid(id))
      const users = await User.find({ _id: { $in: validIds.map((id) => new mongoose.Types.ObjectId(id)) } })
        .select('email firstName lastName')
        .lean()
      for (const u of users) {
        const id = (u as any)._id?.toString()
        if (id) {
          const first = (u as any).firstName || ''
          const last = (u as any).lastName || ''
          userMap[id] = {
            name: [first, last].filter(Boolean).join(' ') || 'Unknown',
            email: (u as any).email || '',
          }
        }
      }
    }

    // Merge, sort by timestamp desc, limit 100
    entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    const limited = entries.slice(0, 100)

    const auditLogs: AuditLogEntry[] = limited.map((e) => {
      const user = userMap[e.userId] || { name: e.userName, email: '' }
      return {
        timestamp: e.timestamp.toISOString(),
        userName: user.name || e.userName || 'Unknown',
        userEmail: user.email || '',
        action: e.action,
        actionBadge: toActionBadge(e.action),
        entityType: e.entityType,
        entityId: e.entityId,
        details: e.details,
      }
    })

    return NextResponse.json({ auditLogs }, { status: 200 })
  } catch (error) {
    console.error('Audit logs error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
