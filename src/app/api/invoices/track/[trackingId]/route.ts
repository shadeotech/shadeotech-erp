import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Invoice from '@/lib/models/Invoice'

// 1×1 transparent GIF — standard email open-tracking pixel
const PIXEL_GIF = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
)

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ trackingId: string }> }
) {
  try {
    const { trackingId } = await params
    if (trackingId) {
      await connectDB()
      const now = new Date()
      // Atomically increment openCount and set timestamps on the matching log entry
      await Invoice.findOneAndUpdate(
        { 'emailLog.trackingId': trackingId },
        {
          $inc: { 'emailLog.$.openCount': 1 },
          $set: { 'emailLog.$.lastOpenedAt': now },
        }
      )
      // Set firstOpenedAt only if not already set
      await Invoice.findOneAndUpdate(
        { 'emailLog.trackingId': trackingId, 'emailLog.firstOpenedAt': { $exists: false } },
        { $set: { 'emailLog.$.firstOpenedAt': now } }
      )
    }
  } catch {
    // Never fail a tracking request — customer experience must not be affected
  }

  return new NextResponse(PIXEL_GIF, {
    status: 200,
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  })
}
