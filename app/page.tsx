import Link from 'next/link'
import { Shield, Search, TrendingUp, FileText, Users, Home, ArrowRight } from 'lucide-react'

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* Nav */}
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
        <div className="flex items-center gap-2 text-brand-700">
          <Shield className="h-7 w-7" />
          <span className="text-xl font-bold">CoverGuard</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="btn-secondary px-4 py-2 text-sm">Consumer Sign In</Link>
          <Link href="/agents/login" className="btn-primary px-4 py-2 text-sm">Agent Login</Link>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 px-4 py-28 text-white">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-blue-100">
            <Shield className="h-4 w-4" />
            Property Insurability Intelligence
          </div>

          <h1 className="mb-6 text-5xl font-bold leading-tight tracking-tight lg:text-6xl text-balance">
            Know the insurability of
            <span className="text-blue-300"> any property</span>
            <br />before you bid
          </h1>

          <p className="mx-auto mb-12 max-w-2xl text-xl text-blue-100 leading-relaxed">
            Instantly see flood, fire, earthquake, wind, and crime risks — and find out which carriers are
            actively writing policies — before your client places an offer.
          </p>

          {/* Dual portal CTAs */}
          <div className="mx-auto grid max-w-2xl gap-4 sm:grid-cols-2">
            <PortalCard
              icon={<Users className="h-6 w-6" />}
              label="Agent / Team Portal"
              description="Manage clients, compare properties, and request binding quotes for your buyers."
              href="/agents/login"
              cta="Agent Login"
              variant="primary"
            />
            <PortalCard
              icon={<Home className="h-6 w-6" />}
              label="Homebuyer Portal"
              description="Search any address and understand your insurance costs before making an offer."
              href="/login"
              cta="Buyer Login"
              variant="secondary"
            />
          </div>

          <p className="mt-6 text-sm text-blue-200">
            No account? <Link href="/search" className="underline hover:text-white">Search a property first</Link>
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
            Stop being surprised by insurance costs. CoverGuard surfaces carrier availability and hidden risks in seconds.
          </p>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div key={f.title} className="card p-6">
                <div className={`mb-4 inline-flex rounded-lg p-3 ${f.iconBg}`}>
                  <f.icon className={`h-6 w-6 ${f.iconColor}`} />
                </div>
                <h3 className="mb-2 font-semibold text-gray-900">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.description}</p>
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
            Join agents and homebuyers who use CoverGuard to catch insurance issues before contract.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/agents/register" className="btn-primary px-6 py-3 text-base">
              Get started - Agents
            </Link>
            <Link href="/register" className="btn-secondary px-6 py-3 text-base">
              Get started - Buyers
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white px-4 py-8">
        <div className="mx-auto max-w-6xl flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2 text-brand-700">
            <Shield className="h-5 w-5" />
            <span className="font-semibold">CoverGuard</span>
          </div>
          <p className="text-sm text-gray-500">
            Property insurability intelligence platform
          </p>
        </div>
      </footer>
    </main>
  )
}

function PortalCard({
  icon, label, description, href, cta, variant,
}: {
  icon: React.ReactNode
  label: string
  description: string
  href: string
  cta: string
  variant: 'primary' | 'secondary'
}) {
  return (
    <Link
      href={href}
      className={`group flex flex-col rounded-2xl p-6 text-left transition-all hover:scale-[1.02] ${
        variant === 'primary'
          ? 'bg-white text-gray-900 shadow-lg'
          : 'border border-white/20 bg-white/10 text-white hover:bg-white/20'
      }`}
    >
      <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${
        variant === 'primary' ? 'bg-brand-100 text-brand-700' : 'bg-white/20 text-white'
      }`}>
        {icon}
      </div>
      <p className={`mb-1 text-xs font-semibold uppercase tracking-wider ${
        variant === 'primary' ? 'text-brand-600' : 'text-blue-200'
      }`}>{label}</p>
      <p className={`mb-4 text-sm leading-relaxed ${
        variant === 'primary' ? 'text-gray-600' : 'text-blue-100'
      }`}>{description}</p>
      <div className={`mt-auto flex items-center gap-2 text-sm font-semibold ${
        variant === 'primary' ? 'text-brand-700' : 'text-white'
      }`}>
        {cta}
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  )
}

const features = [
  {
    title: 'Carrier Availability',
    description: 'See which insurers are actively writing and binding policies for a specific property before bidding.',
    icon: Shield,
    iconBg: 'bg-brand-50',
    iconColor: 'text-brand-600',
  },
  {
    title: 'Risk Assessment',
    description: 'Flood, fire, earthquake, wind, and crime risk scores derived from FEMA, USGS, and FBI data.',
    icon: TrendingUp,
    iconBg: 'bg-red-50',
    iconColor: 'text-red-600',
  },
  {
    title: 'Insurance Estimates',
    description: 'Estimated annual premiums by coverage type, with low/high ranges based on property-specific risk.',
    icon: FileText,
    iconBg: 'bg-green-50',
    iconColor: 'text-green-600',
  },
  {
    title: 'Binding Quote Requests',
    description: 'Request a binding quote from an active carrier directly from the property report - in one click.',
    icon: Search,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
  },
]
