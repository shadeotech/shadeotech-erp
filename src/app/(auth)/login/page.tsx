'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/components/ui/use-toast'
import type { User } from '@/types/database'

const getDashboardRoute = (role: User['role']): string => {
  switch (role) {
    case 'ADMIN': return '/dashboard'
    case 'STAFF': return '/dashboard'
    case 'DEALER': return '/dealer'
    case 'FRANCHISEE': return '/franchise/dashboard'
    case 'CUSTOMER': return '/portal'
    default: return '/dashboard'
  }
}

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export default function LoginPage() {
  const router = useRouter()
  const { login, isAuthenticated, isLoading: authLoading, user } = useAuthStore()
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      router.push(getDashboardRoute(user.role))
    }
  }, [isAuthenticated, authLoading, user, router])

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0d0d0d', gap: '1rem' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid #2a2a2a', borderTopColor: '#c8864e', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ fontSize: 12, color: '#555', letterSpacing: '3px', textTransform: 'uppercase', fontFamily: 'sans-serif' }}>Loading...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (isAuthenticated) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email.trim()) {
      toast({ title: 'Error', description: 'Email is required', variant: 'destructive' })
      return
    }
    if (!isValidEmail(email)) {
      toast({ title: 'Error', description: 'Invalid email format', variant: 'destructive' })
      return
    }
    if (!password.trim()) {
      toast({ title: 'Error', description: 'Password is required', variant: 'destructive' })
      return
    }
    if (password.length < 6) {
      toast({ title: 'Error', description: 'Password must be at least 6 characters', variant: 'destructive' })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await response.json()

      if (!response.ok) {
        let errorMessage = 'Login failed. Please try again.'
        if (data.error === 'Email does not exist') errorMessage = 'Email does not exist'
        else if (data.error === 'Wrong password') errorMessage = 'Wrong password'
        else if (data.error === 'Invalid email format') errorMessage = 'Invalid email format'
        else if (data.error === 'Password must be at least 6 characters') errorMessage = 'Password must be at least 6 characters'
        else if (data.error) errorMessage = data.error
        toast({ title: 'Login Failed', description: errorMessage, variant: 'destructive' })
        return
      }

      login(data.user, data.token)
      toast({ title: 'Success', description: 'Logged in successfully', variant: 'success' })
      router.push(getDashboardRoute(data.user.role))
      router.refresh()
    } catch (err) {
      console.error('Login error:', err)
      toast({ title: 'Error', description: 'An unexpected error occurred. Please try again.', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&family=Playfair+Display:wght@400;500;600&display=swap');

        .st-input::placeholder { color: #c4c4c4; }
        .st-input:focus {
          background: #fff !important;
          border-color: #c8864e !important;
          box-shadow: 0 0 0 4px rgba(200,134,78,0.1) !important;
        }

        .st-btn:hover:not(:disabled) {
          background: #c8864e !important;
          transform: translateY(-2px) !important;
          box-shadow: 0 10px 28px rgba(200,134,78,0.4) !important;
        }
        .st-btn:active:not(:disabled) { transform: translateY(0) !important; }
        .st-btn:disabled { opacity: 0.45; cursor: not-allowed; }

        .st-forgot:hover { color: #a86a38 !important; }
        .st-register-link { color: #c8864e; text-decoration: none; font-weight: 500; transition: color 0.2s; }
        .st-register-link:hover { color: #a86a38; }

        @keyframes stFadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .st-brand { animation: stFadeUp 0.9s cubic-bezier(0.16,1,0.3,1) both 0.05s; }
        .st-card  { animation: stFadeUp 0.9s cubic-bezier(0.16,1,0.3,1) both 0.2s; }

        @media (max-width: 900px) {
          .st-login-page {
            flex-direction: column !important;
            padding: 3rem 1.5rem !important;
          }
          .st-left-pane {
            width: 100% !important;
            padding: 2rem 1rem !important;
            justify-content: center !important;
          }
          .st-right-pane {
            width: 100% !important;
            padding: 0 1rem 3rem !important;
          }
          .st-logo { max-width: 260px !important; }
          .st-card  { max-width: 100% !important; }
        }
      `}</style>

      <div
        className="st-login-page"
        style={{
          minHeight: '100vh',
          background: '#0d0d0d',
          display: 'flex',
          position: 'relative',
          overflow: 'hidden',
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {/* Orb 1 */}
        <div style={{
          position: 'absolute',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(180,110,50,0.65) 0%, rgba(120,60,20,0.2) 70%, transparent 100%)',
          filter: 'blur(80px)',
          top: '-150px',
          left: '-100px',
          pointerEvents: 'none',
          zIndex: 1,
        }} />

        {/* Orb 2 */}
        <div style={{
          position: 'absolute',
          width: '420px',
          height: '420px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(200,149,108,0.45) 0%, rgba(100,50,10,0.12) 70%, transparent 100%)',
          filter: 'blur(80px)',
          bottom: '-130px',
          left: '30%',
          pointerEvents: 'none',
          zIndex: 1,
        }} />

        {/* Orb 3 */}
        <div style={{
          position: 'absolute',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(160,90,30,0.35) 0%, transparent 70%)',
          filter: 'blur(80px)',
          top: '38%',
          left: '34%',
          pointerEvents: 'none',
          zIndex: 1,
        }} />

        {/* Left pane — Logo */}
        <div
          className="st-left-pane st-brand"
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '3rem',
            zIndex: 2,
            marginTop: '-80px',
          }}
        >
          <img
            src="/images/logo.png"
            alt="Shadeotech Window Fashions"
            className="st-logo"
            style={{ width: '100%', maxWidth: 560, height: 'auto', display: 'block' }}
          />
          <div style={{ width: '100%', maxWidth: 560, height: '1px', background: 'rgba(200,134,78,0.2)', margin: '20px 0 16px' }} />
          <span style={{
            fontSize: 10,
            color: 'rgba(255,255,255,0.35)',
            letterSpacing: '5px',
            textTransform: 'uppercase',
            fontWeight: 500,
          }}>
            Dashboard Portal
          </span>
          <span style={{
            fontSize: 12,
            color: 'rgba(255,255,255,0.18)',
            fontWeight: 300,
            marginTop: 8,
            letterSpacing: '0.3px',
          }}>
            Blinds &amp; shade operations management
          </span>
        </div>

        {/* Right pane — Card */}
        <div
          className="st-right-pane"
          style={{
            width: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem 3rem',
            zIndex: 2,
          }}
        >

        {/* Card */}
        <div
          className="st-card"
          style={{
            width: '100%',
            maxWidth: 540,
            position: 'relative',
            zIndex: 3,
            background: '#fff',
            borderRadius: 24,
            padding: '0',
            boxShadow: '0 40px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.07)',
            overflow: 'hidden',
          }}
        >
          {/* Copper accent bar */}
          <div style={{ height: 4, background: 'linear-gradient(90deg, #c8864e, #e8a870, #c8864e)', width: '100%' }} />

          <div style={{ padding: '2.4rem 2.6rem 2.6rem' }}>
            <h1 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 28,
              fontWeight: 500,
              color: '#111',
              marginBottom: 5,
              letterSpacing: '-0.2px',
            }}>
              Welcome back
            </h1>
            <p style={{
              fontSize: 13,
              color: '#b0b0b0',
              marginBottom: '2rem',
              fontWeight: 300,
              lineHeight: 1.5,
            }}>
              Sign in to your Shadeotech dashboard
            </p>

            <form onSubmit={handleSubmit}>
              {/* Email field */}
              <div style={{ marginBottom: '1.1rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: 11,
                  fontWeight: 500,
                  color: '#888',
                  letterSpacing: '0.6px',
                  textTransform: 'uppercase',
                  marginBottom: 7,
                }}>
                  Email address
                </label>
                <input
                  className="st-input"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  style={{
                    width: '100%',
                    background: '#f7f7f7',
                    border: '1.5px solid #efefef',
                    borderRadius: 12,
                    padding: '13px 16px',
                    fontSize: 14,
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 400,
                    color: '#111',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                  }}
                />
              </div>

              {/* Password field */}
              <div style={{ marginBottom: '0.4rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                  <label style={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: '#888',
                    letterSpacing: '0.6px',
                    textTransform: 'uppercase',
                  }}>
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="st-forgot"
                    style={{
                      fontSize: 13,
                      color: '#c8864e',
                      textDecoration: 'none',
                      fontWeight: 500,
                      fontFamily: "'DM Sans', sans-serif",
                      transition: 'color 0.2s',
                    }}
                  >
                    Forgot password?
                  </Link>
                </div>
                <input
                  className="st-input"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  style={{
                    width: '100%',
                    background: '#f7f7f7',
                    border: '1.5px solid #efefef',
                    borderRadius: 12,
                    padding: '13px 16px',
                    fontSize: 14,
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 400,
                    color: '#111',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="st-btn"
                style={{
                  width: '100%',
                  marginTop: '1.6rem',
                  padding: '15px',
                  background: '#111',
                  border: 'none',
                  borderRadius: 12,
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 500,
                  fontFamily: "'DM Sans', sans-serif",
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  letterSpacing: '0.4px',
                }}
              >
                {isLoading ? 'Signing in…' : 'Sign In →'}
              </button>
            </form>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '1.6rem 0 1.3rem' }}>
              <div style={{ flex: 1, height: 1, background: '#f0f0f0' }} />
              <span style={{ fontSize: 11, color: '#d0d0d0', fontWeight: 400, letterSpacing: '0.5px' }}>OR</span>
              <div style={{ flex: 1, height: 1, background: '#f0f0f0' }} />
            </div>

            <p style={{
              textAlign: 'center',
              fontSize: 13,
              color: '#b0b0b0',
              fontWeight: 400,
              fontFamily: "'DM Sans', sans-serif",
            }}>
              Not a member yet?{' '}
              <Link href="/register" className="st-register-link" style={{
                color: '#c8864e',
                textDecoration: 'none',
                fontWeight: 500,
                fontFamily: "'DM Sans', sans-serif",
              }}>
                Request Access
              </Link>
            </p>
          </div>
        </div>
        </div>
      </div>
    </>
  )
}
