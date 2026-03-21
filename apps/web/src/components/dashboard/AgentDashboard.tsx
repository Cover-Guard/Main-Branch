'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, Users, FileText, BarChart2, Plus, Building2, ArrowRight, GitCompare } from 'lucide-react'
import { SearchBar } from '@/components/search/SearchBar'
import { ClientsPanel } from './ClientsPanel'
import { SavedPropertiesPanel } from './SavedPropertiesPanel'
import { useCompare } from '@/lib/useCompare'

type Tab = 'overview' | 'clients' | 'properties'

export function AgentDashboard() {
  const [tab, setTab] = useState<Tab>('overview')
  const { ids: compareIds, compareUrl, clear: clearCompare } = useCompare()

  return (
    <div>
      {/* Search hero */}
      <div className="bg-brand-800 px-4 py-8 text-white">
        <div className="mx-auto max-w-5xl">
          <h1 className="mb-1 text-xl font-bold">Property Insurability Search</h1>
          <p className="mb-4 text-sm text-brand-200">
            Enter any US address or APN to get a full risk, insurability, and carrier availability report
          </p>
          <SearchBar className="max-w-3xl" />
        </div>
      </div>

      {/* Compare bar */}
      {compareIds.length >= 2 && compareUrl && (
        <div className="bg-brand-600 px-4 py-2.5 text-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <GitCompare className="h-4 w-4" />
              <span className="font-medium">{compareIds.length} properties selected for comparison</span>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={clearCompare} className="text-xs text-brand-200 hover:text-white">
                Clear
              </button>
              <Link href={compareUrl} className="rounded-lg bg-white px-4 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-50">
                Compare Now →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-5xl px-4">
          <nav className="-mb-px flex gap-6">
            {(['overview', 'clients', 'properties'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`border-b-2 py-3 text-sm font-medium capitalize transition-colors ${
                  tab === t
                    ? 'border-brand-600 text-brand-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {t === 'overview' ? 'Overview' : t === 'clients' ? 'Clients' : 'Saved Properties'}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8">
        {tab === 'overview' && <OverviewTab onNavigate={setTab} />}
        {tab === 'clients' && <ClientsPanel />}
        {tab === 'properties' && <SavedPropertiesPanel />}
      </div>
    </div>
  )
}

function OverviewTab({ onNavigate }: { onNavigate: (t: Tab) => void }) {
  return (
    <div className="space-y-8">
      {/* Quick actions */}
      <div className="grid gap-4 sm:grid-cols-3">
        <QuickAction
          icon={<Search className="h-6 w-6 text-brand-600" />}
          bg="bg-brand-50"
          title="Search a Property"
          description="Look up any US address or parcel ID"
          href="/search"
        />
        <QuickAction
          icon={<Users className="h-6 w-6 text-green-600" />}
          bg="bg-green-50"
          title="Manage Clients"
          description="Add clients and track their searches"
          onClick={() => onNavigate('clients')}
        />
        <QuickAction
          icon={<BarChart2 className="h-6 w-6 text-purple-600" />}
          bg="bg-purple-50"
          title="Analytics"
          description="See search trends and risk distribution"
          href="/analytics"
        />
      </div>

      {/* Recent saved properties */}
      <SavedPropertiesPanel limit={3} compact />

      <div className="flex justify-end">
        <button
          onClick={() => onNavigate('properties')}
          className="flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:underline"
        >
          View all saved properties <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

function QuickAction({
  icon, bg, title, description, href, onClick,
}: {
  icon: React.ReactNode
  bg: string
  title: string
  description: string
  href?: string
  onClick?: () => void
}) {
  const inner = (
    <div className="card flex items-start gap-4 p-5 transition-shadow hover:shadow-md">
      <div className={`rounded-xl p-3 ${bg}`}>{icon}</div>
      <div>
        <p className="font-semibold text-gray-900">{title}</p>
        <p className="mt-0.5 text-xs text-gray-500">{description}</p>
      </div>
    </div>
  )
  if (href) return <Link href={href}>{inner}</Link>
  return <button onClick={onClick} className="block w-full text-left">{inner}</button>
}
