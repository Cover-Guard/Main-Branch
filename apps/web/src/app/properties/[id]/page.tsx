'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { getProperty, getPropertyRisk, getPropertyInsurance, getPropertyCarriers, getPropertyInsurability } from '@/lib/api'
import { RiskSummary } from '@/components/property/RiskSummary'
import { RiskBreakdown } from '@/components/property/RiskBreakdown'
import { InsuranceCostEstimate } from '@/components/property/InsuranceCostEstimate'
import { PropertyDetails } from '@/components/property/PropertyDetails'
import { InsurabilityPanel } from '@/components/property/InsurabilityPanel'
import { ActiveCarriers } from '@/components/property/ActiveCarriers'
import { Navbar } from '@/components/layout/Navbar'
import { PropertyMapInline } from '@/components/map/PropertyMapInline'
import { formatAddress, formatCurrency } from '@coverguard/shared'
import type { Property, PropertyRiskProfile, InsuranceCostEstimate as IInsuranceCostEstimate, CarriersResult, InsurabilityStatus } from '@coverguard/shared'

// Required for Next.js static export with dynamic segments
export function generateStaticParams() {
  return []
}

export default function PropertyPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id as string

  const [property, setProperty] = useState<Property | null>(null)
  const [risk, setRisk] = useState<PropertyRiskProfile | null>(null)
  const [insurance, setInsurance] = useState<IInsuranceCostEstimate | null>(null)
  const [carriers, setCarriers] = useState<CarriersResult | null>(null)
  const [insurability, setInsurability] = useState<InsurabilityStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)

    Promise.allSettled([
      getProperty(id),
      getPropertyRisk(id),
      getPropertyInsurance(id),
      getPropertyCarriers(id),
      getPropertyInsurability(id),
    ]).then(([prop, riskRes, insRes, carriersRes, insurabilityRes]) => {
      if (prop.status === 'rejected') {
        setNotFound(true)
        setLoading(false)
        return
      }
      setProperty(prop.value)
      if (riskRes.status === 'fulfilled') setRisk(riskRes.value)
      if (insRes.status === 'fulfilled') setInsurance(insRes.value)
      if (carriersRes.status === 'fulfilled') setCarriers(carriersRes.value)
      if (insurabilityRes.status === 'fulfilled') setInsurability(insurabilityRes.value)
      setLoading(false)
    })
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-lg bg-gray-200" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (notFound || !property) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="mx-auto max-w-7xl px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Property Not Found</h1>
          <p className="mt-2 text-gray-500">The property you&apos;re looking for doesn&apos;t exist.</p>
        </div>
      </div>
    )
  }

  const fullAddress = `${property.address}, ${property.city}, ${property.state} ${property.zip}`

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <p className="text-sm text-gray-500">Property Report</p>
          <h1 className="text-2xl font-bold text-gray-900">{property.address}</h1>
          <p className="text-gray-600">{formatAddress(property)}</p>
          <div className="mt-2 flex flex-wrap items-center gap-4">
            {property.estimatedValue && (
              <p className="text-lg font-semibold text-brand-700">
                Est. {formatCurrency(property.estimatedValue)}
              </p>
            )}
            {property.parcelId && (
              <p className="text-sm text-gray-500">
                APN / Parcel: <span className="font-mono font-medium text-gray-700">{property.parcelId}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left / main column */}
          <div className="space-y-8 lg:col-span-2">
            <PropertyMapInline property={property} riskProfile={risk} />
            {insurability && <InsurabilityPanel status={insurability} />}
            {risk && (
              <>
                <RiskSummary profile={risk} />
                <RiskBreakdown profile={risk} />
              </>
            )}
            <PropertyDetails property={property} />
          </div>

          {/* Right sidebar */}
          <div className="space-y-6">
            {carriers && (
              <ActiveCarriers
                data={carriers}
                propertyId={property.id}
                propertyAddress={fullAddress}
              />
            )}
            {insurance && <InsuranceCostEstimate estimate={insurance} />}
          </div>
        </div>
      </div>
    </div>
  )
}
