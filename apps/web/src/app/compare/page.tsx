'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { CompareView } from '@/components/compare/CompareView'

function ComparePageContent() {
  const searchParams = useSearchParams()
  const ids = searchParams.get('ids')
  const propertyIds = ids ? ids.split(',').filter(Boolean).slice(0, 3) : []

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Compare Properties</h1>
          <p className="mt-1 text-gray-500">
            Side-by-side risk, insurability, and cost comparison for up to 3 properties.
          </p>
        </div>
        <CompareView propertyIds={propertyIds} />
      </div>
    </div>
  )
}

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" /></div>}>
      <ComparePageContent />
    </Suspense>
  )
}
