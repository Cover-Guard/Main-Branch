import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { SearchBar } from '@/components/search/SearchBar'
import { getSavedProperties } from '@/lib/api'
import { PropertyCard } from '@/components/search/PropertyCard'
import type { Property } from '@coverguard/shared'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let savedProperties: Array<{ property: Property }> = []
  try {
    const raw = await getSavedProperties() as Array<{ property: Property }>
    savedProperties = raw
  } catch {
    // Non-fatal — show empty state
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search hero */}
      <div className="bg-brand-800 px-4 py-10 text-white">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="mb-2 text-2xl font-bold">Search a Property</h1>
          <p className="mb-6 text-brand-200">Enter an address to get a full risk and insurance report</p>
          <SearchBar className="mx-auto max-w-2xl" />
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Saved Properties</h2>
        {savedProperties.length === 0 ? (
          <div className="card p-10 text-center text-gray-400">
            <p className="text-lg font-medium">No saved properties yet</p>
            <p className="mt-1 text-sm">Search for a property and save it to track it here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {savedProperties.map(({ property }) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
