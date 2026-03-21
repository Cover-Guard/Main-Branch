import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/Navbar'
import { AccountSettings } from '@/components/account/AccountSettings'

export const metadata: Metadata = { title: 'Account & Settings' }

export default async function AccountPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

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
