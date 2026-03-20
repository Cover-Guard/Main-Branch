import type { RiskLevel } from './risk'

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
