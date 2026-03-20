'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Shield } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const schema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Must be at least 8 characters'),
  role: z.enum(['BUYER', 'AGENT', 'LENDER']),
  company: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'BUYER' },
  })

  const role = watch('role')

  async function onSubmit(data: FormData) {
    setError(null)

    // 1. Register via API (creates Supabase auth user + profile)
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    const json = await res.json()
    if (!json.success) {
      setError(json.error?.message ?? 'Registration failed')
      return
    }

    // 2. Sign in immediately
    const supabase = createClient()
    await supabase.auth.signInWithPassword({ email: data.email, password: data.password })

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-brand-700">
            <Shield className="h-8 w-8" />
            <span className="text-2xl font-bold">CoverGuard</span>
          </Link>
          <h1 className="mt-6 text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="mt-2 text-gray-500">
            Already have an account?{' '}
            <Link href="/login" className="text-brand-600 hover:underline">Sign in</Link>
          </p>
        </div>

        <div className="card p-8">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">First name</label>
                <input className="input mt-1" {...register('firstName')} />
                {errors.firstName && <p className="mt-1 text-xs text-red-600">{errors.firstName.message}</p>}
              </div>
              <div>
                <label className="label">Last name</label>
                <input className="input mt-1" {...register('lastName')} />
                {errors.lastName && <p className="mt-1 text-xs text-red-600">{errors.lastName.message}</p>}
              </div>
            </div>

            <div>
              <label className="label">Email</label>
              <input type="email" autoComplete="email" className="input mt-1" {...register('email')} />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
            </div>

            <div>
              <label className="label">Password</label>
              <input type="password" autoComplete="new-password" className="input mt-1" {...register('password')} />
              {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
            </div>

            <div>
              <label className="label">I am a…</label>
              <select className="input mt-1" {...register('role')}>
                <option value="BUYER">Home Buyer</option>
                <option value="AGENT">Real Estate Agent</option>
                <option value="LENDER">Lender / Underwriter</option>
              </select>
            </div>

            {(role === 'AGENT' || role === 'LENDER') && (
              <div>
                <label className="label">Company</label>
                <input className="input mt-1" {...register('company')} />
              </div>
            )}

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-2.5">
              {isSubmitting ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
