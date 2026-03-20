import type {
  Property,
  PropertySearchParams,
  PropertySearchResult,
  PropertyRiskProfile,
  InsuranceCostEstimate,
  ApiResponse,
} from '@coverguard/shared'
import { createClient } from './supabase/client'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

async function getAuthHeaders(): Promise<Record<string, string>> {
  const supabase = createClient()
  const { data } = await supabase.auth.getSession()
  if (!data.session?.access_token) return {}
  return { Authorization: `Bearer ${data.session.access_token}` }
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const headers = await getAuthHeaders()
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
      ...options?.headers,
    },
  })

  const json = await res.json()
  if (!res.ok || !json.success) {
    throw new Error(json.error?.message ?? `API error ${res.status}`)
  }
  return (json as ApiResponse<T>).data
}

// ─── Properties ───────────────────────────────────────────────────────────────

export async function searchProperties(params: PropertySearchParams): Promise<PropertySearchResult> {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined) query.set(k, String(v)) })
  return apiFetch<PropertySearchResult>(`/api/properties/search?${query}`)
}

export async function getProperty(id: string): Promise<Property> {
  return apiFetch<Property>(`/api/properties/${id}`)
}

export async function getPropertyRisk(id: string): Promise<PropertyRiskProfile> {
  return apiFetch<PropertyRiskProfile>(`/api/properties/${id}/risk`)
}

export async function getPropertyInsurance(id: string): Promise<InsuranceCostEstimate> {
  return apiFetch<InsuranceCostEstimate>(`/api/properties/${id}/insurance`)
}

export async function getPropertyReport(id: string): Promise<{
  property: Property
  risk: PropertyRiskProfile
  insurance: InsuranceCostEstimate
}> {
  return apiFetch(`/api/properties/${id}/report`)
}

export async function saveProperty(id: string, notes?: string, tags?: string[]): Promise<void> {
  await apiFetch(`/api/properties/${id}/save`, {
    method: 'POST',
    body: JSON.stringify({ notes, tags: tags ?? [] }),
  })
}

export async function unsaveProperty(id: string): Promise<void> {
  await apiFetch(`/api/properties/${id}/save`, { method: 'DELETE' })
}

// ─── Auth / User ─────────────────────────────────────────────────────────────

export async function getMe() {
  return apiFetch('/api/auth/me')
}

export async function getSavedProperties() {
  return apiFetch('/api/auth/me/saved')
}
