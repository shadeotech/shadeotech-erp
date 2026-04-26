import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Invoice from '@/lib/models/Invoice'
import User from '@/lib/models/User'
import { verifyAuth } from '@/lib/auth'

/**
 * POST - Send all unsent dealer invoices (status DRAFT, has dealerId, no sentAt).
 * Admin/Staff only. Use to fix invoices created before auto-send was implemented.
 */
export async function POST(request: NextRequest) {
  try {
    const authPayload = await verifyAuth(request)
    if (!authPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const user = await User.findById(authPayload.userId).lean()
    if (!user || (user.role !== 'ADMIN' && user.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Forbidden – admin or staff only' }, { status: 403 })
    }

    const unsent = await Invoice.find({
      dealerId: { $exists: true, $nin: [null, ''] },
      $or: [
        { sentAt: { $exists: false } },
        { sentAt: null },
      ],
    })

    let sent = 0
    for (const inv of unsent) {
      inv.status = 'SENT'
      inv.sentAt = new Date()
      await inv.save()
      sent++
    }

    return NextResponse.json({
      message: `Sent ${sent} invoice(s) to dealers`,
      sent,
      total: unsent.length,
    }, { status: 200 })
  } catch (error) {
    console.error('Send unsent invoices error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
