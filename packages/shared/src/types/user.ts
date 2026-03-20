export type UserRole = 'BUYER' | 'AGENT' | 'LENDER' | 'ADMIN'

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  company: string | null
  licenseNumber: string | null // for agents
  avatarUrl: string | null
  createdAt: string
  updatedAt: string
}

export interface SavedProperty {
  id: string
  userId: string
  propertyId: string
  notes: string | null
  tags: string[]
  savedAt: string
}

export interface PropertyReport {
  id: string
  userId: string
  propertyId: string
  reportType: ReportType
  generatedAt: string
  pdfUrl: string | null
}

export type ReportType = 'FULL' | 'RISK_SUMMARY' | 'INSURANCE_ESTIMATE'
