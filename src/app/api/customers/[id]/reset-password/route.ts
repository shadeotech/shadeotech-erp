import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { verifyAuth, hashPassword } from '@/lib/auth'
import Customer from '@/lib/models/Customer'
import User from '@/lib/models/User'
import { sendEmail } from '@/lib/email'

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let pass = ''
  for (let i = 0; i < 10; i++) pass += chars[Math.floor(Math.random() * chars.length)]
  return pass
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await verifyAuth(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.role !== 'ADMIN' && auth.role !== 'STAFF') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await connectDB()

  const customer = await Customer.findById(params.id).lean() as any
  if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 })

  const email = customer.email?.toLowerCase().trim()
  if (!email) {
    return NextResponse.json(
      { error: 'Customer has no email address.' },
      { status: 400 }
    )
  }

  const portalUser = await User.findOne({ email }) as any
  if (!portalUser) {
    return NextResponse.json(
      { error: 'No portal account found for this customer.' },
      { status: 404 }
    )
  }

  const tempPassword = generateTempPassword()
  const hashed = await hashPassword(tempPassword)

  portalUser.password = hashed
  portalUser.isActive = true
  await portalUser.save()

  const customerName =
    [customer.firstName, customer.lastName].filter(Boolean).join(' ') || 'Customer'

  try {
    await sendEmail({
      to: email,
      subject: 'Your Shadeotech Portal Password Has Been Reset',
      html: `
<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;color:#1f2937;max-width:560px;margin:0 auto;padding:24px;">
  <div style="background:linear-gradient(135deg,#111,#1a1a1a);padding:28px 24px;border-radius:12px 12px 0 0;text-align:center;">
    <h1 style="color:#c8864e;margin:0;font-size:22px;">Shadeotech</h1>
    <p style="color:rgba(255,255,255,0.5);margin:6px 0 0;font-size:12px;letter-spacing:3px;text-transform:uppercase;">Customer Portal</p>
  </div>
  <div style="background:#f9fafb;padding:28px 24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">
    <p style="font-size:15px;">Hi ${customerName},</p>
    <p>Your portal password has been reset by our team. Use the temporary password below to log in.</p>
    <div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:16px 20px;margin:20px 0;">
      <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">Login URL</p>
      <p style="margin:0 0 16px;font-weight:600;color:#111;">${process.env.NEXT_PUBLIC_APP_URL || 'https://app.shadeotech.com'}/login</p>
      <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">Email</p>
      <p style="margin:0 0 16px;font-weight:600;color:#111;">${email}</p>
      <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">New Temporary Password</p>
      <p style="margin:0;font-weight:700;font-size:18px;color:#c8864e;letter-spacing:1px;">${tempPassword}</p>
    </div>
    <p style="font-size:13px;color:#6b7280;">Please change your password after logging in.</p>
    <p style="color:#6b7280;font-size:12px;margin-top:24px;">Shadeotech &bull; billing@shadeotech.com</p>
  </div>
</body>
</html>`,
    })
  } catch (err) {
    console.error('[reset-password] Email failed:', err)
  }

  return NextResponse.json({ email, tempPassword })
}
