import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/Navbar'
import { AgentDashboard } from '@/components/dashboard/AgentDashboard'
import { ConsumerDashboard } from '@/components/dashboard/ConsumerDashboard'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch user profile from API
  let userRole: 'BUYER' | 'AGENT' | 'LENDER' | 'ADMIN' = 'BUYER'
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}` },
    })
    const json = await res.json()
    if (json.success) userRole = json.data.role
  } catch {
    // default to BUYER
  }

  const isAgent = userRole === 'AGENT' || userRole === 'LENDER' || userRole === 'ADMIN'

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      {isAgent ? <AgentDashboard /> : <ConsumerDashboard />}
    </div>
  )
}
