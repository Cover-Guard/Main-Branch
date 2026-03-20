import { Suspense } from 'react'
import type { Metadata } from 'next'
import { SearchBar } from '@/components/search/SearchBar'
import { SearchResults } from '@/components/search/SearchResults'

export const metadata: Metadata = { title: 'Search Properties' }

interface SearchPageProps {
  searchParams: Promise<{ q?: string; page?: string }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q, page } = await searchParams

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="border-b border-gray-200 bg-white px-4 py-4 shadow-sm">
        <div className="mx-auto max-w-5xl">
          <SearchBar defaultValue={q ?? ''} />
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8">
        {q ? (
          <Suspense fallback={<SearchSkeleton />}>
            <SearchResults query={q} page={parseInt(page ?? '1', 10)} />
          </Suspense>
        ) : (
          <div className="py-24 text-center text-gray-500">
            Enter an address, city, or ZIP code to begin
          </div>
        )}
      </div>
    </div>
  )
}

function SearchSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="card h-32 animate-pulse bg-gray-100" />
      ))}
    </div>
  )
}
