'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/layout/Navbar'
import { AccountSettings } from '@/components/account/AccountSettings'

export default function AccountPage() {
  const router = useRouter()

  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => {
      if (!user) router.replace('/login')
    })
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Account &amp; Settings</h1>
          <p className="mt-1 text-gray-500">Manage your profile, preferences, and security settings.</p>
        </div>
        <AccountSettings />
      </div>
    </div>
  )
}
