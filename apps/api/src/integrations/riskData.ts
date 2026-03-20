/**
 * Risk Data Integrations
 *
 * Aggregates risk data from multiple public and commercial sources:
 * - FEMA National Flood Hazard Layer (public API)
 * - USFS Fire Hazard Severity Zones
 * - USGS Seismic Hazard Data
 * - FBI Uniform Crime Reporting (UCR)
 *
 * Each function returns null if the source is unavailable, allowing
 * graceful degradation to computed scores.
 */

import { logger } from '../utils/logger'
import type { FloodRisk, FireRisk, EarthquakeRisk, CrimeRisk, WindRisk } from '@coverguard/shared'

// ─── Flood Risk (FEMA NFHL) ───────────────────────────────────────────────────

interface FemaFloodZoneResult {
  features: Array<{
    attributes: {
      FLD_ZONE: string
      STATIC_BFE: number | null
      PANEL_TYP: string
      FIRM_PAN: string
    }
  }>
}

export async function fetchFloodRisk(lat: number, lng: number): Promise<Partial<FloodRisk>> {
  const baseUrl = process.env.FEMA_API_BASE_URL ?? 'https://hazards.fema.gov/gis/nfhl/rest/services'
  const url = new URL(`${baseUrl}/public/NFHL/MapServer/28/query`)
  url.searchParams.set('geometry', `${lng},${lat}`)
  url.searchParams.set('geometryType', 'esriGeometryPoint')
  url.searchParams.set('inSR', '4326')
  url.searchParams.set('spatialRel', 'esriSpatialRelIntersects')
  url.searchParams.set('outFields', 'FLD_ZONE,STATIC_BFE,FIRM_PAN')
  url.searchParams.set('returnGeometry', 'false')
  url.searchParams.set('f', 'json')

  try {
    const res = await fetch(url.toString())
    if (!res.ok) throw new Error(`FEMA API ${res.status}`)

    const data = (await res.json()) as FemaFloodZoneResult
    const feature = data.features?.[0]?.attributes

    if (!feature) {
      return { floodZone: 'X', inSpecialFloodHazardArea: false }
    }

    const sfhaZones = ['A', 'AE', 'AH', 'AO', 'AR', 'A99', 'V', 'VE']
    const inSFHA = sfhaZones.some((z) => feature.FLD_ZONE?.startsWith(z))

    return {
      floodZone: feature.FLD_ZONE,
      firmPanelId: feature.FIRM_PAN ?? null,
      baseFloodElevation: feature.STATIC_BFE ?? null,
      inSpecialFloodHazardArea: inSFHA,
      annualChanceOfFlooding: inSFHA ? 1.0 : 0.2,
    }
  } catch (err) {
    logger.warn('FEMA flood API unavailable, using defaults', { err })
    return { floodZone: 'UNKNOWN', inSpecialFloodHazardArea: false }
  }
}

// ─── Fire Risk ────────────────────────────────────────────────────────────────

export async function fetchFireRisk(
  lat: number,
  lng: number,
  state: string
): Promise<Partial<FireRisk>> {
  // California-specific: Cal Fire FHSZ API
  if (state === 'CA') {
    try {
      const url = `https://services1.arcgis.com/jUJYIo9tSA7EHvfZ/arcgis/rest/services/FHSZ/FeatureServer/0/query?geometry=${lng},${lat}&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=HAZ_CLASS,AGENCY&f=json`
      const res = await fetch(url)
      if (res.ok) {
        const data = (await res.json()) as { features: Array<{ attributes: { HAZ_CLASS: string } }> }
        const hazClass = data.features?.[0]?.attributes?.HAZ_CLASS
        return {
          firHazardSeverityZone: hazClass ?? null,
          wildlandUrbanInterface: ['HIGH', 'VERY HIGH', 'EXTREME'].includes(hazClass ?? ''),
        }
      }
    } catch {
      logger.warn('Cal Fire FHSZ API unavailable')
    }
  }

  // Default: no data available
  return { firHazardSeverityZone: null, wildlandUrbanInterface: false }
}

// ─── Earthquake Risk (USGS) ───────────────────────────────────────────────────

export async function fetchEarthquakeRisk(lat: number, lng: number): Promise<Partial<EarthquakeRisk>> {
  try {
    // USGS Seismic Hazard Tool — 2% probability of exceedance in 50 years (PGA)
    const url = `https://earthquake.usgs.gov/ws/designmaps/asce7-22.json?latitude=${lat}&longitude=${lng}&riskCategory=II&siteClass=C&title=CoverGuard`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`USGS ${res.status}`)
    const data = (await res.json()) as { response: { data: { ss: number } } }
    const ss = data?.response?.data?.ss

    return {
      seismicZone: ss > 1.5 ? 'D' : ss > 0.75 ? 'C' : ss > 0.25 ? 'B' : 'A',
    }
  } catch {
    logger.warn('USGS earthquake API unavailable')
    return {}
  }
}

// ─── Crime Risk (Census + FBI UCR approximation) ──────────────────────────────

export async function fetchCrimeRisk(_lat: number, _lng: number, _zip: string): Promise<Partial<CrimeRisk>> {
  // FBI UCR API requires registration; return empty to fall back to computed score
  // TODO: integrate with https://cde.ucr.cjis.gov/LATEST/webapp/#/pages/docApi
  return {}
}

// ─── Wind Risk ────────────────────────────────────────────────────────────────

export async function fetchWindRisk(lat: number, _lng: number, state: string): Promise<Partial<WindRisk>> {
  // Hurricane risk: Gulf and Atlantic coast states
  const hurricaneStates = ['FL', 'TX', 'LA', 'MS', 'AL', 'GA', 'SC', 'NC', 'VA', 'MD', 'DE', 'NJ', 'NY', 'CT', 'RI', 'MA', 'ME']
  const hurricaneRisk = hurricaneStates.includes(state)

  // Tornado risk: Tornado Alley + Dixie Alley
  const tornadoStates = ['TX', 'OK', 'KS', 'NE', 'SD', 'ND', 'MO', 'IA', 'IL', 'IN', 'OH', 'AR', 'LA', 'MS', 'AL', 'TN', 'KY']
  const tornadoRisk = tornadoStates.includes(state)

  // Hail risk: Great Plains
  const hailStates = ['TX', 'OK', 'KS', 'NE', 'SD', 'ND', 'CO', 'WY', 'MT', 'MN', 'IA', 'MO']
  const hailRisk = hailStates.includes(state)

  // Design wind speed from ASCE 7 (simplified by latitude band)
  const designWindSpeed = lat < 25 ? 180 : lat < 30 ? 150 : lat < 35 ? 130 : 115

  return { hurricaneRisk, tornadoRisk, hailRisk, designWindSpeed }
}
