'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'

type PasswordStrength = 'empty' | 'weak' | 'fair' | 'good' | 'strong'

function getPasswordStrength(password: string): PasswordStrength {
  if (!password) return 'empty'
  const hasLength = password.length >= 8
  const hasUppercase = /[A-Z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>_\-+=[\]\\';/`~]/.test(password)
  const isLong = password.length >= 12

  if (!hasLength) return 'weak'
  if (hasLength && !hasUppercase && !hasNumber) return 'weak'
  if (hasLength && (hasUppercase || hasNumber) && !(hasUppercase && hasNumber)) return 'fair'
  if (hasLength && hasUppercase && hasNumber && !hasSpecial && !isLong) return 'good'
  return 'strong'
}

function getStrengthBars(strength: PasswordStrength): number {
  return { empty: 0, weak: 1, fair: 2, good: 3, strong: 4 }[strength]
}

const STRENGTH_HINTS: Record<PasswordStrength, string> = {
  empty: 'Use 8 or more characters with a mix of letters, numbers & symbols.',
  weak: 'Add more characters (min 8), uppercase letter, and number.',
  fair: 'Add an uppercase letter and a number.',
  good: 'Password meets requirements.',
  strong: 'Strong password!',
}

// Apple Icon SVG (same as Sign In page)
const AppleIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
  </svg>
)

// Google Icon SVG (same as Sign In page)
const GoogleIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
)

const registerSchema = z.object({
  signUpAs: z.enum(['DEALER', 'CUSTOMER'], {
    required_error: 'Please select Dealer or Customer',
  }),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type RegisterFormData = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      signUpAs: 'CUSTOMER',
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
    },
  })

  const password = form.watch('password')
  const strength = getPasswordStrength(password)
  const bars = getStrengthBars(strength)

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/register/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: data.firstName.trim(),
          lastName: data.lastName.trim(),
          email: data.email.trim(),
          password: data.password,
          role: data.signUpAs,
        }),
      })
      const json = await res.json()

      if (!res.ok) {
        toast({
          title: 'Registration failed',
          description: json.error || 'Please try again.',
          variant: 'destructive',
        })
        return
      }

      toast({
        title: 'Account created',
        description: 'You can now sign in with your email and password.',
      })
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Register error:', error)
      toast({
        title: 'Registration failed',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&family=Playfair+Display:wght@400;500;600&display=swap');

        .st-reg-input {
          width: 100%;
          background: #f7f7f7;
          border: 1.5px solid #efefef;
          border-radius: 12px;
          padding: 12px 16px;
          font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          font-weight: 400;
          color: #111;
          outline: none;
          transition: all 0.2s ease;
        }
        .st-reg-input::placeholder { color: #c4c4c4; }
        .st-reg-input:focus {
          background: #fff;
          border-color: #c8864e;
          box-shadow: 0 0 0 4px rgba(200,134,78,0.1);
        }

        .st-reg-btn {
          width: 100%;
          margin-top: 0.5rem;
          padding: 15px;
          background: #111;
          border: none;
          border-radius: 12px;
          color: #fff;
          font-size: 14px;
          font-weight: 500;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: all 0.25s ease;
          letter-spacing: 0.4px;
        }
        .st-reg-btn:hover:not(:disabled) {
          background: #c8864e;
          transform: translateY(-2px);
          box-shadow: 0 10px 28px rgba(200,134,78,0.4);
        }
        .st-reg-btn:active:not(:disabled) { transform: translateY(0); }
        .st-reg-btn:disabled { opacity: 0.45; cursor: not-allowed; }

        .st-reg-link { color: #c8864e; text-decoration: none; font-weight: 500; font-family: 'DM Sans', sans-serif; transition: color 0.2s; }
        .st-reg-link:hover { color: #a86a38; }

        @keyframes stRegFadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .st-reg-card { animation: stRegFadeUp 0.9s cubic-bezier(0.16,1,0.3,1) both 0.1s; }

        @media (max-width: 600px) {
          .st-reg-card { width: 100% !important; border-radius: 16px !important; }
        }
      `}</style>

      <div style={{
        minHeight: '100vh',
        background: '#0d0d0d',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1.5rem',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: "'DM Sans', sans-serif",
      }}>
        {/* Orb 1 */}
        <div style={{
          position: 'absolute', width: '600px', height: '600px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(180,110,50,0.65) 0%, rgba(120,60,20,0.2) 70%, transparent 100%)',
          filter: 'blur(80px)', top: '-150px', left: '-100px', pointerEvents: 'none', zIndex: 0,
        }} />
        {/* Orb 2 */}
        <div style={{
          position: 'absolute', width: '420px', height: '420px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(200,149,108,0.45) 0%, rgba(100,50,10,0.12) 70%, transparent 100%)',
          filter: 'blur(80px)', bottom: '-130px', right: '-80px', pointerEvents: 'none', zIndex: 0,
        }} />
        {/* Orb 3 */}
        <div style={{
          position: 'absolute', width: '300px', height: '300px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(160,90,30,0.35) 0%, transparent 70%)',
          filter: 'blur(80px)', top: '40%', left: '55%', pointerEvents: 'none', zIndex: 0,
        }} />

        {/* Card */}
        <div className="st-reg-card" style={{
          width: 460,
          position: 'relative',
          zIndex: 2,
          background: '#fff',
          borderRadius: 24,
          overflow: 'hidden',
          boxShadow: '0 40px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.07)',
        }}>
          {/* Copper accent bar */}
          <div style={{ height: 4, background: 'linear-gradient(90deg, #c8864e, #e8a870, #c8864e)', width: '100%' }} />

          <div style={{ padding: '2.2rem 2.4rem 2.4rem' }}>
            <h1 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 26,
              fontWeight: 500,
              color: '#111',
              marginBottom: 4,
              letterSpacing: '-0.2px',
            }}>
              Request Access
            </h1>
            <p style={{ fontSize: 13, color: '#b0b0b0', marginBottom: '1.6rem', fontWeight: 300 }}>
              Create your Shadeotech account
            </p>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                {/* First & Last Name */}
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <input placeholder="First name" className="st-reg-input" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <input placeholder="Last name" className="st-reg-input" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Email */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <input type="email" placeholder="you@example.com" className="st-reg-input" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Password */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div style={{ position: 'relative' }}>
                          <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Password"
                            className="st-reg-input"
                            style={{ paddingRight: 40 }}
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            style={{
                              position: 'absolute', top: '50%', right: 14,
                              transform: 'translateY(-50%)', background: 'none',
                              border: 'none', cursor: 'pointer', color: '#bbb', padding: 0,
                            }}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Password strength */}
                <div className="space-y-1">
                  <div className="flex gap-2 px-0.5">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={cn(
                          'h-1 flex-1 rounded-full transition-colors duration-200',
                          i <= bars
                            ? strength === 'weak' ? 'bg-red-400'
                              : strength === 'fair' ? 'bg-amber-400'
                              : strength === 'good' ? 'bg-green-500'
                              : 'bg-green-600'
                            : 'bg-gray-200'
                        )}
                      />
                    ))}
                  </div>
                  <p className={cn(
                    'text-xs px-0.5',
                    strength === 'weak' && 'text-red-500',
                    strength === 'fair' && 'text-amber-500',
                    (strength === 'good' || strength === 'strong') && 'text-green-600',
                    (strength === 'empty' || !password) && 'text-gray-400'
                  )}>
                    {STRENGTH_HINTS[strength]}
                  </p>
                </div>

                {/* Confirm Password */}
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <input type="password" placeholder="Repeat password" className="st-reg-input" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Signing up as */}
                <FormField
                  control={form.control}
                  name="signUpAs"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel style={{ fontSize: 11, fontWeight: 500, color: '#888', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
                        Signing up as
                      </FormLabel>
                      <FormControl>
                        <RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4 pt-1">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="DEALER" id="dealer" />
                            <Label htmlFor="dealer" style={{ fontSize: 14, fontWeight: 400, cursor: 'pointer', color: '#333' }}>Dealer</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="CUSTOMER" id="customer" />
                            <Label htmlFor="customer" style={{ fontSize: 14, fontWeight: 400, cursor: 'pointer', color: '#333' }}>Customer</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Accept Terms */}
                <FormField
                  control={form.control}
                  name="acceptTerms"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#888', cursor: 'pointer', userSelect: 'none' }}>
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300"
                            style={{ accentColor: '#c8864e' }}
                            checked={field.value}
                            onChange={(e) => field.onChange(e.target.checked)}
                          />
                          <span>
                            I accept the{' '}
                            <button type="button" style={{ color: '#c8864e', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>
                              Terms &amp; Conditions
                            </button>
                          </span>
                        </label>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Submit */}
                <button type="submit" disabled={isLoading} className="st-reg-btn">
                  {isLoading ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Signing up…
                    </span>
                  ) : 'Create Account →'}
                </button>
              </form>
            </Form>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '1.4rem 0 1.2rem' }}>
              <div style={{ flex: 1, height: 1, background: '#f0f0f0' }} />
              <span style={{ fontSize: 11, color: '#d0d0d0', letterSpacing: '0.5px' }}>OR</span>
              <div style={{ flex: 1, height: 1, background: '#f0f0f0' }} />
            </div>

            <p style={{ textAlign: 'center', fontSize: 13, color: '#b0b0b0', fontWeight: 400, fontFamily: "'DM Sans', sans-serif" }}>
              Already have an account?{' '}
              <Link href="/login" className="st-reg-link">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

