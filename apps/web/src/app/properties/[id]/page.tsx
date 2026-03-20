import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getProperty, getPropertyRisk, getPropertyInsurance } from '@/lib/api'
import { RiskSummary } from '@/components/property/RiskSummary'
import { RiskBreakdown } from '@/components/property/RiskBreakdown'
import { InsuranceCostEstimate } from '@/components/property/InsuranceCostEstimate'
import { PropertyDetails } from '@/components/property/PropertyDetails'
import { formatAddress, formatCurrency } from '@coverguard/shared'

interface PropertyPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PropertyPageProps): Promise<Metadata> {
  const { id } = await params
  try {
    const property = await getProperty(id)
    return { title: `${property.address}, ${property.city} ${property.state}` }
  } catch {
    return { title: 'Property Not Found' }
  }
}

export default async function PropertyPage({ params }: PropertyPageProps) {
  const { id } = await params

  const [property, risk, insurance] = await Promise.allSettled([
    getProperty(id),
    getPropertyRisk(id),
    getPropertyInsurance(id),
  ])

  if (property.status === 'rejected') notFound()

  const prop = property.value
  const riskProfile = risk.status === 'fulfilled' ? risk.value : null
  const insuranceEstimate = insurance.status === 'fulfilled' ? insurance.value : null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <p className="text-sm text-gray-500">Property Report</p>
          <h1 className="text-2xl font-bold text-gray-900">{prop.address}</h1>
          <p className="text-gray-600">{formatAddress(prop)}</p>
          {prop.estimatedValue && (
            <p className="mt-1 text-lg font-semibold text-brand-700">
              Est. {formatCurrency(prop.estimatedValue)}
            </p>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left / main column */}
          <div className="space-y-8 lg:col-span-2">
            {riskProfile && (
              <>
                <RiskSummary profile={riskProfile} />
                <RiskBreakdown profile={riskProfile} />
              </>
            )}
            <PropertyDetails property={prop} />
          </div>

          {/* Right sidebar */}
          <div className="space-y-6">
            {insuranceEstimate && (
              <InsuranceCostEstimate estimate={insuranceEstimate} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
