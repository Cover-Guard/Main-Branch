import { Metadata } from 'next'
import { Navbar } from '@/components/layout/Navbar'
import { CompareView } from '@/components/compare/CompareView'

export const metadata: Metadata = { title: 'Compare Properties' }

interface ComparePageProps {
  searchParams: Promise<{ ids?: string }>
}

export default async function ComparePage({ searchParams }: ComparePageProps) {
  const { ids } = await searchParams
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
