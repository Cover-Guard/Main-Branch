'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/layout/Navbar'
import { AgentDashboard } from '@/components/dashboard/AgentDashboard'
import { ConsumerDashboard } from '@/components/dashboard/ConsumerDashboard'

export default function DashboardPage() {
  const router = useRouter()
  const [isAgent, setIsAgent] = useState<boolean | null>(null)

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/login')
        return
      }

      try {
        const session = (await supabase.auth.getSession()).data.session
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${session?.access_token}` },
        })
        const json = await res.json()
        const role = json.success ? json.data.role : 'BUYER'
        setIsAgent(role === 'AGENT' || role === 'LENDER' || role === 'ADMIN')
      } catch {
        setIsAgent(false)
      }
    }
    init()
  }, [router])

  if (isAgent === null) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex h-[80vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      {isAgent ? <AgentDashboard /> : <ConsumerDashboard />}
    </div>
  )
}
