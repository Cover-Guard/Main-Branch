'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, Users, BarChart2, Plus, ArrowRight, GitCompare, Building2 } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { SearchBar } from '@/components/search/SearchBar'
import { PropertyCard } from '@/components/search/PropertyCard'
import { useCompare } from '@/lib/useCompare'
import { getSavedProperties, getClients, createClient2, updateClient, deleteClient } from '@/lib/api'
import type { Property, Client, ClientStatus } from '@/lib/shared/types'
import { User, Mail, Phone, Trash2 } from 'lucide-react'

type Tab = 'overview' | 'clients' | 'properties'

export default function DashboardPage() {
  const [tab, setTab] = useState<Tab>('overview')
  const { ids: compareIds, compareUrl, clear: clearCompare } = useCompare()

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

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
                Compare Now
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
          icon={<BarChart2 className="h-6 w-6 text-amber-600" />}
          bg="bg-amber-50"
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

// ─── Clients Panel ───────────────────────────────────────────────────────────

const STATUS_COLORS: Record<ClientStatus, string> = {
  ACTIVE:   'bg-green-100 text-green-700',
  PROSPECT: 'bg-blue-100 text-blue-700',
  CLOSED:   'bg-gray-100 text-gray-600',
  INACTIVE: 'bg-yellow-100 text-yellow-700',
}

function ClientsPanel() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', notes: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getClients()
      .then(setClients)
      .catch(() => setClients([]))
      .finally(() => setLoading(false))
  }, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!form.firstName || !form.lastName || !form.email) return
    setSaving(true)
    setError(null)
    try {
      const client = await createClient2({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone || undefined,
        notes: form.notes || undefined,
      })
      setClients((prev) => [client, ...prev])
      setForm({ firstName: '', lastName: '', email: '', phone: '', notes: '' })
      setShowAddForm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add client')
    } finally {
      setSaving(false)
    }
  }

  async function handleStatusChange(id: string, status: ClientStatus) {
    try {
      const updated = await updateClient(id, { status })
      setClients((prev) => prev.map((c) => (c.id === id ? updated : c)))
    } catch {
      // silent
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this client?')) return
    try {
      await deleteClient(id)
      setClients((prev) => prev.filter((c) => c.id !== id))
    } catch {
      // silent
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Clients</h2>
          <p className="text-sm text-gray-500">{clients.length} client{clients.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setShowAddForm((v) => !v)}
          className="btn-primary flex items-center gap-2 px-4 py-2"
        >
          <Plus className="h-4 w-4" />
          Add Client
        </button>
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="card p-5">
          <h3 className="mb-4 font-semibold text-gray-900">New Client</h3>
          {error && <div className="mb-3 rounded bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          <form onSubmit={handleAdd} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label text-xs">First name</label>
                <input
                  required
                  className="input mt-0.5"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                />
              </div>
              <div>
                <label className="label text-xs">Last name</label>
                <input
                  required
                  className="input mt-0.5"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="label text-xs">Email</label>
              <input
                required
                type="email"
                className="input mt-0.5"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <label className="label text-xs">Phone (optional)</label>
              <input
                type="tel"
                className="input mt-0.5"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="btn-secondary px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button type="submit" disabled={saving} className="btn-primary px-4 py-2 text-sm">
                {saving ? 'Adding...' : 'Add Client'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Client list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card h-20 animate-pulse bg-gray-100" />
          ))}
        </div>
      ) : clients.length === 0 ? (
        <div className="card p-10 text-center text-gray-400">
          <User className="mx-auto mb-3 h-10 w-10 opacity-30" />
          <p className="font-medium">No clients yet</p>
          <p className="mt-1 text-sm">Add your first client to start tracking their property searches.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {clients.map((client) => (
            <div key={client.id} className="card flex items-center gap-4 px-5 py-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700 font-semibold text-sm">
                {client.firstName[0]}{client.lastName[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">
                  {client.firstName} {client.lastName}
                </p>
                <div className="flex flex-wrap items-center gap-3 mt-0.5">
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <Mail className="h-3 w-3" />
                    {client.email}
                  </span>
                  {client.phone && (
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Phone className="h-3 w-3" />
                      {client.phone}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <select
                  value={client.status}
                  onChange={(e) => handleStatusChange(client.id, e.target.value as ClientStatus)}
                  className={`rounded-full border-0 px-3 py-1 text-xs font-medium focus:ring-1 focus:ring-brand-400 ${STATUS_COLORS[client.status]}`}
                >
                  <option value="PROSPECT">Prospect</option>
                  <option value="ACTIVE">Active</option>
                  <option value="CLOSED">Closed</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
                <button
                  onClick={() => handleDelete(client.id)}
                  className="btn-ghost p-1.5 text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Saved Properties Panel ──────────────────────────────────────────────────

function SavedPropertiesPanel({ limit, compact }: { limit?: number; compact?: boolean }) {
  const [saved, setSaved] = useState<Array<{ property: Property }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSavedProperties()
      .then((data) => setSaved(data as Array<{ property: Property }>))
      .catch(() => setSaved([]))
      .finally(() => setLoading(false))
  }, [])

  const displayed = limit ? saved.slice(0, limit) : saved

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="card h-24 animate-pulse bg-gray-100" />
        ))}
      </div>
    )
  }

  if (saved.length === 0) {
    return (
      <div className="card p-10 text-center text-gray-400">
        <Building2 className="mx-auto mb-3 h-10 w-10 opacity-30" />
        <p className="font-medium">No saved properties yet</p>
        <p className="mt-1 text-sm">Search for a property and save it to track it here.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {!compact && (
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Saved Properties</h2>
          <p className="text-sm text-gray-500">{saved.length} saved</p>
        </div>
      )}
      {compact && <h3 className="font-semibold text-gray-800">Recent Saved Properties</h3>}
      {displayed.map(({ property }) => (
        <PropertyCard key={property.id} property={property} />
      ))}
    </div>
  )
}
