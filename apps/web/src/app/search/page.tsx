'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { SearchBar } from '@/components/search/SearchBar'
import { SearchResults } from '@/components/search/SearchResults'
import { Navbar } from '@/components/layout/Navbar'

const SearchMapClient = dynamic(
  () => import('@/components/map/SearchMapClient').then((m) => m.SearchMapClient),
  { ssr: false, loading: () => <div className="h-full w-full animate-pulse bg-gray-200" /> }
)

function SearchPageContent() {
  const searchParams = useSearchParams()
  const q = searchParams.get('q') ?? ''
  const page = parseInt(searchParams.get('page') ?? '1', 10)

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Navbar />

      {/* Search bar */}
      <div className="shrink-0 border-b border-gray-200 bg-white px-4 py-3 shadow-sm">
        <div className="mx-auto max-w-5xl">
          <SearchBar defaultValue={q} />
        </div>
      </div>

      {/* Body: results list + map */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: results list */}
        <div className="w-full overflow-y-auto px-4 py-6 md:w-[420px] md:shrink-0 lg:w-[480px]">
          {q ? (
            <Suspense fallback={<SearchSkeleton />}>
              <SearchResults query={q} page={page} />
            </Suspense>
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="text-center text-gray-400">
                <p className="text-lg font-medium">Search any US property</p>
                <p className="mt-1 text-sm">Enter an address, ZIP code, or APN / Parcel ID</p>
              </div>
            </div>
          )}
        </div>

        {/* Right: map */}
        <div className="hidden flex-1 md:block">
          <SearchMapClient query={q || null} />
        </div>
      </div>
    </div>
  )
}

function SearchSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="card h-28 animate-pulse bg-gray-100" />
      ))}
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
