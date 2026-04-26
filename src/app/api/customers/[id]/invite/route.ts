import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { verifyAuth, hashPassword } from '@/lib/auth'
import Customer from '@/lib/models/Customer'
import User from '@/lib/models/User'
import { sendEmail } from '@/lib/email'

function generateTempPassword(): string {
  const letters = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz'
  const digits = '23456789'
  const specials = '!@#$'
  let pass = ''
  for (let i = 0; i < 8; i++) pass += letters[Math.floor(Math.random() * letters.length)]
  pass += digits[Math.floor(Math.random() * digits.length)]
  pass += specials[Math.floor(Math.random() * specials.length)]
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
      { error: 'Customer has no email address. Add one before sending a portal invite.' },
      { status: 400 }
    )
  }

  // Check if a portal account already exists
  const existing = await User.findOne({ email }).lean() as any
  if (existing) {
    if (!existing.isActive) {
      // Re-activate the account
      await User.updateOne({ email }, { isActive: true })
      return NextResponse.json({
        alreadyExists: true,
        reactivated: true,
        email,
        message: 'Portal account re-activated. Customer can now log in with their existing password.',
      })
    }
    return NextResponse.json({
      alreadyExists: true,
      reactivated: false,
      email,
      message: 'A portal account already exists for this email. The customer can log in at /login.',
    })
  }

  const tempPassword = generateTempPassword()
  const hashed = await hashPassword(tempPassword)

  await User.create({
    firstName: customer.firstName || 'Customer',
    lastName: customer.lastName || '',
    email,
    password: hashed,
    role: 'CUSTOMER',
    isActive: true,
    phone: customer.phone || customer.mobile || '',
  })

  const customerName = [customer.firstName, customer.lastName].filter(Boolean).join(' ') || 'Customer'

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://erpshadeotech.vercel.app'

  // Fire-and-forget — do NOT await; avoids Vercel 10s timeout
  sendEmail({
    to: email,
    subject: 'Your Shadeotech Customer Portal Access',
    html: `
<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;color:#1f2937;max-width:560px;margin:0 auto;padding:0;">
  <div style="background:linear-gradient(135deg,#111,#1a1a1a);padding:28px 24px;border-radius:12px 12px 0 0;text-align:center;">
    <img src="${appUrl}/images/logo.png" alt="Shadeotech" style="height:48px;object-fit:contain;margin-bottom:8px;" />
    <p style="color:rgba(255,255,255,0.5);margin:4px 0 0;font-size:12px;letter-spacing:3px;text-transform:uppercase;">Customer Portal</p>
  </div>
  <div style="background:#f9fafb;padding:28px 24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">
    <p style="font-size:15px;">Hi ${customerName},</p>
    <p>Your Shadeotech customer portal account is ready. Use the credentials below to log in and view your quotes, invoices, and project status.</p>
    <div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:16px 20px;margin:20px 0;">
      <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">Login URL</p>
      <p style="margin:0 0 16px;font-weight:600;color:#111;">${appUrl}/login</p>
      <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">Email</p>
      <p style="margin:0 0 16px;font-weight:600;color:#111;">${email}</p>
      <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">Temporary Password</p>
      <p style="margin:0;font-weight:700;font-size:18px;color:#c8864e;letter-spacing:1px;">${tempPassword}</p>
    </div>
    <p style="font-size:13px;color:#6b7280;">Please change your password after your first login.</p>
    <p style="color:#6b7280;font-size:12px;margin-top:24px;">Shadeotech &bull; office@shadeotech.com</p>
  </div>
</body>
</html>`,
  }).catch(err => console.error('[invite] Email failed:', err))

  return NextResponse.json({
    alreadyExists: false,
    email,
    tempPassword,
    message: `Portal account created for ${customerName}. Login credentials have been emailed.`,
  }, { status: 201 })
}
