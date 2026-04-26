import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { connectDB } from '@/lib/mongodb'
import User from '@/lib/models/User'
import { sendEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  const { email } = await request.json()

  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  await connectDB()

  const user = await User.findOne({ email: email.toLowerCase().trim() })

  // Always respond 200 to prevent email enumeration
  if (!user || !user.isActive) {
    return NextResponse.json({ success: true })
  }

  const token = crypto.randomBytes(32).toString('hex')
  const expiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

  await User.updateOne(
    { _id: user._id },
    { resetToken: token, resetTokenExpiry: expiry }
  )

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.shadeotech.com'
  const resetUrl = `${appUrl}/reset-password?token=${token}`

  try {
    await sendEmail({
      to: user.email,
      subject: 'Reset Your Shadeotech Portal Password',
      html: `
<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;color:#1f2937;max-width:560px;margin:0 auto;padding:24px;">
  <div style="background:linear-gradient(135deg,#111,#1a1a1a);padding:28px 24px;border-radius:12px 12px 0 0;text-align:center;">
    <h1 style="color:#c8864e;margin:0;font-size:22px;">Shadeotech</h1>
    <p style="color:rgba(255,255,255,0.5);margin:6px 0 0;font-size:12px;letter-spacing:3px;text-transform:uppercase;">Customer Portal</p>
  </div>
  <div style="background:#f9fafb;padding:28px 24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">
    <p style="font-size:15px;">Hi ${user.firstName},</p>
    <p>We received a request to reset your password. Click the button below to set a new one. This link expires in 1 hour.</p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${resetUrl}" style="background:#c8864e;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:15px;display:inline-block;">Reset My Password</a>
    </div>
    <p style="font-size:13px;color:#6b7280;">If the button doesn't work, copy and paste this URL into your browser:</p>
    <p style="font-size:12px;color:#c8864e;word-break:break-all;">${resetUrl}</p>
    <p style="font-size:13px;color:#6b7280;margin-top:24px;">If you didn't request a password reset, you can safely ignore this email.</p>
    <p style="color:#6b7280;font-size:12px;margin-top:24px;">Shadeotech &bull; billing@shadeotech.com</p>
  </div>
</body>
</html>`,
    })
  } catch (err) {
    console.error('[forgot-password] Email failed:', err)
  }

  return NextResponse.json({ success: true })
}
