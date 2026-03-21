'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { SearchBar } from '@/components/search/SearchBar'
import { PropertyCard } from '@/components/search/PropertyCard'
import { Navbar } from '@/components/layout/Navbar'
import { searchProperties } from '@/lib/api'
import type { Property } from '@/lib/shared/types'

function SearchPageContent() {
  const searchParams = useSearchParams()
  const q = searchParams.get('q') ?? ''
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    if (!q) {
      setProperties([])
      setTotal(0)
      return
    }

    setLoading(true)
    searchProperties({ address: q })
      .then((result) => {
        setProperties(result.properties)
        setTotal(result.total)
      })
      .catch(() => {
        setProperties([])
        setTotal(0)
      })
      .finally(() => setLoading(false))
  }, [q])

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      {/* Search bar */}
      <div className="shrink-0 border-b border-gray-200 bg-white px-4 py-3 shadow-sm">
        <div className="mx-auto max-w-5xl">
          <SearchBar defaultValue={q} />
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 px-4 py-6">
        <div className="mx-auto max-w-5xl">
          {!q ? (
            <div className="flex h-64 items-center justify-center">
              <div className="text-center text-gray-400">
                <p className="text-lg font-medium">Search any US property</p>
                <p className="mt-1 text-sm">Enter an address, ZIP code, or APN / Parcel ID</p>
              </div>
            </div>
          ) : loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card h-28 animate-pulse bg-gray-100" />
              ))}
            </div>
          ) : properties.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-lg font-medium text-gray-700">No properties found for &quot;{q}&quot;</p>
              <p className="mt-2 text-gray-500">Try a different address or ZIP code</p>
            </div>
          ) : (
            <div>
              <p className="mb-4 text-sm text-gray-500">
                {total} result{total !== 1 ? 's' : ''} for &quot;{q}&quot;
              </p>
              <div className="space-y-4">
                {properties.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" /></div>}>
      <SearchPageContent />
    </Suspense>
  )
}
