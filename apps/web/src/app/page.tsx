import Link from 'next/link'
import { Shield, Search, TrendingUp, FileText } from 'lucide-react'
import { SearchBar } from '@/components/search/SearchBar'

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 px-4 py-24 text-white">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-blue-100">
            <Shield className="h-4 w-4" />
            Property Insurability Intelligence
          </div>

          <h1 className="mb-6 text-5xl font-bold leading-tight tracking-tight lg:text-6xl">
            Know the true cost of
            <span className="text-blue-300"> any property</span>
            <br />before you bid
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-xl text-blue-100">
            Search any US address to instantly see flood, fire, earthquake, and crime risks —
            plus a detailed insurance cost estimate. Built for buyers, agents, and lenders.
          </p>

          <SearchBar autoFocus className="mx-auto max-w-2xl" />

          <p className="mt-4 text-sm text-blue-200">
            Search by address, ZIP code, or parcel ID
          </p>
        </div>
      </section>

      {/* Feature grid */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-3 text-center text-3xl font-bold text-gray-900">
            Everything you need before closing
          </h2>
          <p className="mb-12 text-center text-gray-500">
            Stop being surprised by insurance costs. CoverGuard surfaces hidden risks in seconds.
          </p>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div key={f.title} className="card p-6">
                <div className={`mb-4 inline-flex rounded-lg p-3 ${f.iconBg}`}>
                  <f.icon className={`h-6 w-6 ${f.iconColor}`} />
                </div>
                <h3 className="mb-2 font-semibold text-gray-900">{f.title}</h3>
                <p className="text-sm text-gray-500">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-50 px-4 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-gray-900">Ready to make smarter bids?</h2>
          <p className="mb-8 text-gray-600">
            Create a free account to save properties, compare risks, and download reports.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/register" className="btn-primary px-6 py-3 text-base">
              Get started free
            </Link>
            <Link href="/search" className="btn-secondary px-6 py-3 text-base">
              Try a search
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}

const features = [
  {
    title: 'Risk Assessment',
    description: 'Flood, fire, earthquake, wind, and crime risk scores derived from FEMA, USGS, and FBI data.',
    icon: Shield,
    iconBg: 'bg-red-50',
    iconColor: 'text-red-600',
  },
  {
    title: 'Insurance Estimates',
    description: 'Estimated homeowners, flood, wind, and earthquake premiums based on property-specific risk.',
    icon: TrendingUp,
    iconBg: 'bg-green-50',
    iconColor: 'text-green-600',
  },
  {
    title: 'Address Search',
    description: 'Search any US address and get a complete risk and insurability profile in seconds.',
    icon: Search,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
  },
  {
    title: 'Shareable Reports',
    description: 'Download and share PDF reports for clients, underwriters, and lenders.',
    icon: FileText,
    iconBg: 'bg-purple-50',
    iconColor: 'text-purple-600',
  },
]
