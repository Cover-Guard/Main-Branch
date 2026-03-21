// ═══════════════════════════════════════════════════════════════════════════════
// Property Types
// ═══════════════════════════════════════════════════════════════════════════════

export interface Property {
  id: string
  address: string
  city: string
  state: string
  zip: string
  county: string
  lat: number
  lng: number
  propertyType: PropertyType
  yearBuilt: number | null
  squareFeet: number | null
  bedrooms: number | null
  bathrooms: number | null
  lotSize: number | null
  estimatedValue: number | null
  lastSalePrice: number | null
  lastSaleDate: string | null
  parcelId: string | null
  createdAt: string
  updatedAt: string
}

export type PropertyType =
  | 'SINGLE_FAMILY'
  | 'MULTI_FAMILY'
  | 'CONDO'
  | 'TOWNHOUSE'
  | 'MOBILE_HOME'
  | 'COMMERCIAL'
  | 'LAND'

export interface PropertySearchParams {
  address?: string
  city?: string
  state?: string
  zip?: string
  parcelId?: string
  lat?: number
  lng?: number
  radiusMiles?: number
  page?: number
  limit?: number
}

export interface PropertySearchResult {
  properties: Property[]
  total: number
  page: number
  limit: number
}

// ═══════════════════════════════════════════════════════════════════════════════
// Risk Types
// ═══════════════════════════════════════════════════════════════════════════════

export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH' | 'EXTREME'

export type RiskTrend = 'IMPROVING' | 'STABLE' | 'WORSENING'

export interface RiskFactor {
  level: RiskLevel
  score: number // 0–100
  trend: RiskTrend
  description: string
  details: string[]
  dataSource: string
  lastUpdated: string
}

export interface FloodRisk extends RiskFactor {
  floodZone: string
  firmPanelId: string | null
  baseFloodElevation: number | null
  inSpecialFloodHazardArea: boolean
  annualChanceOfFlooding: number | null
}

export interface FireRisk extends RiskFactor {
  firHazardSeverityZone: string | null
  wildlandUrbanInterface: boolean
  nearestFireStation: number | null
  vegetationDensity: string | null
}

export interface WindRisk extends RiskFactor {
  designWindSpeed: number | null
  hurricaneRisk: boolean
  tornadoRisk: boolean
  hailRisk: boolean
}

export interface EarthquakeRisk extends RiskFactor {
  seismicZone: string | null
  nearestFaultLine: number | null
  soilType: string | null
  liquidationPotential: RiskLevel | null
}

export interface CrimeRisk extends RiskFactor {
  violentCrimeIndex: number
  propertyCrimeIndex: number
  nationalAverageDiff: number
}

export interface PropertyRiskProfile {
  propertyId: string
  overallRiskLevel: RiskLevel
  overallRiskScore: number
  flood: FloodRisk
  fire: FireRisk
  wind: WindRisk
  earthquake: EarthquakeRisk
  crime: CrimeRisk
  generatedAt: string
  cacheTtlSeconds: number
}

// ═══════════════════════════════════════════════════════════════════════════════
// Insurance Types
// ═══════════════════════════════════════════════════════════════════════════════

export interface InsuranceCoverageType {
  type: CoverageType
  required: boolean
  averageAnnualPremium: number
  lowEstimate: number
  highEstimate: number
  notes: string[]
}

export type CoverageType =
  | 'HOMEOWNERS'
  | 'FLOOD'
  | 'EARTHQUAKE'
  | 'WIND_HURRICANE'
  | 'UMBRELLA'
  | 'FIRE'

export interface InsuranceCostEstimate {
  propertyId: string
  estimatedAnnualTotal: number
  estimatedMonthlyTotal: number
  confidenceLevel: ConfidenceLevel
  coverages: InsuranceCoverageType[]
  keyRiskFactors: string[]
  recommendations: string[]
  disclaimers: string[]
  generatedAt: string
}

export type ConfidenceLevel = 'LOW' | 'MEDIUM' | 'HIGH'

export interface InsurabilityStatus {
  propertyId: string
  isInsurable: boolean
  difficultyLevel: RiskLevel
  potentialIssues: string[]
  recommendedActions: string[]
}

export interface Carrier {
  id: string
  name: string
  amBestRating: string
  writingStatus: CarrierWritingStatus
  coverageTypes: CoverageType[]
  avgPremiumModifier: number
  statesLicensed: string[]
  specialties: string[]
  notes: string | null
}

export type CarrierWritingStatus = 'ACTIVELY_WRITING' | 'LIMITED' | 'NOT_WRITING' | 'SURPLUS_LINES'

export interface CarriersResult {
  propertyId: string
  carriers: Carrier[]
  marketCondition: MarketCondition
  lastUpdated: string
}

export type MarketCondition = 'SOFT' | 'MODERATE' | 'HARD' | 'CRISIS'

// ═══════════════════════════════════════════════════════════════════════════════
// User Types
// ═══════════════════════════════════════════════════════════════════════════════

export interface User {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  role: UserRole
  company: string | null
  licenseNumber: string | null
  termsAcceptedAt: string | null
  createdAt: string
  updatedAt: string
}

export type UserRole = 'BUYER' | 'AGENT' | 'LENDER' | 'ADMIN'

export interface Client {
  id: string
  agentId: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  status: ClientStatus
  notes: string | null
  createdAt: string
  updatedAt: string
}

export type ClientStatus = 'PROSPECT' | 'ACTIVE' | 'CLOSED' | 'INACTIVE'

export interface SavedProperty {
  id: string
  userId: string
  propertyId: string
  notes: string | null
  tags: string[]
  createdAt: string
}

export interface AnalyticsSummary {
  totalSearches: number
  totalSavedProperties: number
  totalClients: number
  totalReports: number
  searchesByDay: Array<{ date: string; count: number }>
  riskDistribution: Array<{ level: RiskLevel; count: number }>
  topStates: Array<{ state: string; count: number }>
  recentActivity: Array<{ description: string; timestamp: string }>
}

// ═══════════════════════════════════════════════════════════════════════════════
// API Types
// ═══════════════════════════════════════════════════════════════════════════════

export interface ApiResponse<T> {
  success: boolean
  data: T
  error?: {
    code: string
    message: string
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Formatters
// ═══════════════════════════════════════════════════════════════════════════════

export function formatCurrency(amount: number, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
    ...options,
  }).format(amount)
}

export function formatAddress(parts: {
  city: string
  state: string
  zip: string
}): string {
  return `${parts.city}, ${parts.state} ${parts.zip}`
}

export function riskLevelToLabel(level: RiskLevel): string {
  const labels: Record<RiskLevel, string> = {
    LOW: 'Low',
    MODERATE: 'Moderate',
    HIGH: 'High',
    VERY_HIGH: 'Very High',
    EXTREME: 'Extreme',
  }
  return labels[level]
}

export function formatSquareFeet(sqft: number | null): string {
  if (!sqft) return 'Unknown'
  return new Intl.NumberFormat('en-US').format(sqft) + ' sq ft'
}

export function formatAcres(sqft: number | null): string {
  if (!sqft) return 'Unknown'
  const acres = sqft / 43560
  return acres.toFixed(2) + ' acres'
}
