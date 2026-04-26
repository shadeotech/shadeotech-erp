'use client'

import Link from 'next/link'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (!token) router.replace('/forgot-password')
  }, [token, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) {
      toast({ title: 'Error', description: 'Password must be at least 8 characters', variant: 'destructive' })
      return
    }
    if (password !== confirm) {
      toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' })
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast({ title: 'Error', description: data.error, variant: 'destructive' })
        return
      }
      setDone(true)
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
        .pw-wrap { position: relative; }
        .pw-toggle { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #9ca3af; padding: 0; display: flex; }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#c8864e,#a86a38)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </div>
        <span style={{ color: '#fff', fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 20, letterSpacing: '-0.3px' }}>Shadeotech</span>
      </div>

      <div style={{ background: '#fff', borderRadius: 20, padding: '36px 32px', width: '100%', maxWidth: 400, boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}>
        {done ? (
          <div style={{ textAlign: 'center', fontFamily: "'DM Sans', sans-serif" }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111', margin: '0 0 8px' }}>Password updated!</h2>
            <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6, margin: '0 0 24px' }}>
              Your password has been changed. You can now log in with your new password.
            </p>
            <Link href="/login" style={{ display: 'inline-block', background: '#c8864e', color: '#fff', textDecoration: 'none', borderRadius: 12, padding: '13px 32px', fontSize: 15, fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>
              Go to Login
            </Link>
          </div>
        ) : (
          <>
            <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 22, fontWeight: 700, color: '#111', margin: '0 0 6px' }}>Set new password</h2>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#6b7280', margin: '0 0 28px', lineHeight: 1.5 }}>
              Choose a strong password for your account.
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, color: '#555', marginBottom: 8, letterSpacing: '0.6px', textTransform: 'uppercase' }}>
                  New Password
                </label>
                <div className="pw-wrap">
                  <input
                    className="st-input"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoFocus
                    style={{ width: '100%', background: '#f7f7f7', border: '1.5px solid #efefef', borderRadius: 12, padding: '13px 44px 13px 16px', fontSize: 14, fontFamily: "'DM Sans', sans-serif", fontWeight: 400, color: '#111', outline: 'none', boxSizing: 'border-box' }}
                  />
                  <button type="button" className="pw-toggle" onClick={() => setShowPassword(v => !v)}>
                    {showPassword
                      ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, color: '#555', marginBottom: 8, letterSpacing: '0.6px', textTransform: 'uppercase' }}>
                  Confirm Password
                </label>
                <input
                  className="st-input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Repeat your password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  style={{ width: '100%', background: '#f7f7f7', border: '1.5px solid #efefef', borderRadius: 12, padding: '13px 16px', fontSize: 14, fontFamily: "'DM Sans', sans-serif", fontWeight: 400, color: '#111', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              {password && confirm && password !== confirm && (
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#ef4444', margin: '-8px 0 0' }}>Passwords do not match</p>
              )}

              <button
                type="submit"
                className="st-btn"
                disabled={loading || !password || !confirm}
                style={{ background: '#c8864e', color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontSize: 15, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, cursor: 'pointer', width: '100%', marginTop: 4 }}
              >
                {loading ? 'Updating…' : 'Update Password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}
