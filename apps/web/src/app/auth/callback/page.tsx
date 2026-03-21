'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Suspense } from 'react'

function CallbackHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const handleCallback = async () => {
      const supabase = createClient()
      const code = searchParams.get('code')
      const next = searchParams.get('next') ?? '/dashboard'

      if (code) {
        const { data: { user } } = await supabase.auth.exchangeCodeForSession(code)

        if (user) {
          const termsAccepted = user.user_metadata?.termsAcceptedAt
          if (!termsAccepted) {
            router.replace('/onboarding')
            return
          }
        }
      }

      router.replace(next)
    }

    handleCallback()
  }, [router, searchParams])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
        <p className="mt-4 text-sm text-gray-500">Signing you in…</p>
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
      </div>
    }>
      <CallbackHandler />
    </Suspense>
  )
}
