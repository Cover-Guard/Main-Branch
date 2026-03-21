import type {
  Property,
  PropertySearchParams,
  PropertySearchResult,
  PropertyRiskProfile,
  InsuranceCostEstimate,
  InsurabilityStatus,
  CarriersResult,
  Client,
  AnalyticsSummary,
  User,
  CoverageType,
} from './shared/types'
import { mockProperties, mockRiskProfile, mockInsurance, mockCarriers, mockInsurability, mockAnalytics, mockClients, mockUser } from './mock-data'

// Use mock data for demo - in production, this would call the real API
const USE_MOCK = true

// ─── Properties ───────────────────────────────────────────────────────────────

export async function searchProperties(params: PropertySearchParams): Promise<PropertySearchResult> {
  if (USE_MOCK) {
    await delay(300)
    const query = (params.address || params.zip || '').toLowerCase()
    const filtered = mockProperties.filter(p => 
      p.address.toLowerCase().includes(query) ||
      p.city.toLowerCase().includes(query) ||
      p.state.toLowerCase().includes(query) ||
      p.zip.includes(query)
    )
    return {
      properties: filtered.length > 0 ? filtered : mockProperties,
      total: filtered.length > 0 ? filtered.length : mockProperties.length,
      page: params.page || 1,
      limit: params.limit || 20,
    }
  }
  throw new Error('API not configured')
}

export async function getProperty(id: string): Promise<Property> {
  if (USE_MOCK) {
    await delay(200)
    const property = mockProperties.find(p => p.id === id)
    if (property) return property
    return mockProperties[0]
  }
  throw new Error('API not configured')
}

export async function getPropertyRisk(id: string): Promise<PropertyRiskProfile> {
  if (USE_MOCK) {
    await delay(400)
    return { ...mockRiskProfile, propertyId: id }
  }
  throw new Error('API not configured')
}

export async function getPropertyInsurance(id: string): Promise<InsuranceCostEstimate> {
  if (USE_MOCK) {
    await delay(350)
    return { ...mockInsurance, propertyId: id }
  }
  throw new Error('API not configured')
}

export async function getPropertyInsurability(id: string): Promise<InsurabilityStatus> {
  if (USE_MOCK) {
    await delay(250)
    return { ...mockInsurability, propertyId: id }
  }
  throw new Error('API not configured')
}

export async function getPropertyCarriers(id: string): Promise<CarriersResult> {
  if (USE_MOCK) {
    await delay(300)
    return { ...mockCarriers, propertyId: id }
  }
  throw new Error('API not configured')
}

export async function saveProperty(id: string, notes?: string, tags?: string[]): Promise<void> {
  await delay(200)
  console.log('Saved property', id, notes, tags)
}

export async function unsaveProperty(id: string): Promise<void> {
  await delay(200)
  console.log('Unsaved property', id)
}

// ─── Quote Requests ────────────────────────────────────────────────────────────

export async function requestBindingQuote(
  propertyId: string,
  carrierId: string,
  coverageTypes: CoverageType[],
  notes?: string,
): Promise<{ quoteRequestId: string }> {
  await delay(500)
  console.log('Quote requested', { propertyId, carrierId, coverageTypes, notes })
  return { quoteRequestId: `qr_${Date.now()}` }
}

// ─── Auth / User ─────────────────────────────────────────────────────────────

export async function getMe(): Promise<User> {
  if (USE_MOCK) {
    await delay(200)
    return mockUser
  }
  throw new Error('API not configured')
}

export async function updateMe(data: Partial<Pick<User, 'firstName' | 'lastName' | 'company' | 'licenseNumber'>>): Promise<User> {
  await delay(300)
  return { ...mockUser, ...data }
}

export async function getSavedProperties() {
  if (USE_MOCK) {
    await delay(300)
    return mockProperties.slice(0, 3).map(p => ({ property: p }))
  }
  throw new Error('API not configured')
}

// ─── Clients (agents) ────────────────────────────────────────────────────────

export async function getClients(): Promise<Client[]> {
  if (USE_MOCK) {
    await delay(300)
    return mockClients
  }
  throw new Error('API not configured')
}

export async function createClient2(data: {
  firstName: string
  lastName: string
  email: string
  phone?: string
  notes?: string
}): Promise<Client> {
  await delay(300)
  const newClient: Client = {
    id: `client_${Date.now()}`,
    agentId: 'agent_1',
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phone || null,
    status: 'PROSPECT',
    notes: data.notes || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  return newClient
}

export async function updateClient(id: string, data: Partial<Client>): Promise<Client> {
  await delay(200)
  const client = mockClients.find(c => c.id === id) || mockClients[0]
  return { ...client, ...data, updatedAt: new Date().toISOString() }
}

export async function deleteClient(id: string): Promise<void> {
  await delay(200)
  console.log('Deleted client', id)
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export async function getAnalytics(): Promise<AnalyticsSummary> {
  if (USE_MOCK) {
    await delay(400)
    return mockAnalytics
  }
  throw new Error('API not configured')
}

// Helper
function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
