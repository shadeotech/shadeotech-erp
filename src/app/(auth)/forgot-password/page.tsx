'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useToast } from '@/components/ui/use-toast'

export default function ForgotPasswordPage() {
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setLoading(true)
    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      setSent(true)
    } catch {
      toast({ title: 'Error', description: 'Something went wrong. Please try again.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0d0d0d', gap: '1rem' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
        .st-input { transition: border-color 0.2s, box-shadow 0.2s; }
        .st-input:focus { border-color: #c8864e !important; box-shadow: 0 0 0 3px rgba(200,134,78,0.12) !important; outline: none !important; }
        .st-btn { transition: background 0.18s, transform 0.1s; }
        .st-btn:hover:not(:disabled) { background: #b87640 !important; }
        .st-btn:active:not(:disabled) { transform: scale(0.98); }
        .st-btn:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#c8864e,#a86a38)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </div>
        <span style={{ color: '#fff', fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 20, letterSpacing: '-0.3px' }}>Shadeotech</span>
      </div>

      <div style={{ background: '#fff', borderRadius: 20, padding: '36px 32px', width: '100%', maxWidth: 400, boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}>
        {sent ? (
          <div style={{ textAlign: 'center', fontFamily: "'DM Sans', sans-serif" }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111', margin: '0 0 8px' }}>Check your email</h2>
            <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6, margin: '0 0 24px' }}>
              If an account exists for <strong>{email}</strong>, we've sent a password reset link. Check your inbox (and spam folder).
            </p>
            <Link href="/login" style={{ color: '#c8864e', fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>
              ← Back to login
            </Link>
          </div>
        ) : (
          <>
            <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 22, fontWeight: 700, color: '#111', margin: '0 0 6px' }}>Forgot password?</h2>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#6b7280', margin: '0 0 28px', lineHeight: 1.5 }}>
              Enter the email address for your account and we'll send you a reset link.
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, color: '#555', marginBottom: 8, letterSpacing: '0.6px', textTransform: 'uppercase' }}>
                  Email Address
                </label>
                <input
                  className="st-input"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  style={{ width: '100%', background: '#f7f7f7', border: '1.5px solid #efefef', borderRadius: 12, padding: '13px 16px', fontSize: 14, fontFamily: "'DM Sans', sans-serif", fontWeight: 400, color: '#111', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <button
                type="submit"
                className="st-btn"
                disabled={loading || !email.trim()}
                style={{ background: '#c8864e', color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontSize: 15, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, cursor: 'pointer', width: '100%' }}
              >
                {loading ? 'Sending…' : 'Send Reset Link'}
              </button>
            </form>

            <div style={{ marginTop: 24, textAlign: 'center' }}>
              <Link href="/login" style={{ fontFamily: "'DM Sans', sans-serif", color: '#c8864e', fontSize: 13, fontWeight: 500, textDecoration: 'none' }}>
                ← Back to login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
