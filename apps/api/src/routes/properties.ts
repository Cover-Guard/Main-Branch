import { Router } from 'express'
import { z } from 'zod'
import { searchProperties, getPropertyById } from '../services/propertyService'
import { getOrComputeRiskProfile } from '../services/riskService'
import { getOrComputeInsuranceEstimate } from '../services/insuranceService'
import { requireAuth } from '../middleware/auth'
import { prisma } from '../utils/prisma'
import type { AuthenticatedRequest } from '../middleware/auth'
import type { Request } from 'express'

export const propertiesRouter = Router()

// ─── Search ───────────────────────────────────────────────────────────────────

const searchSchema = z.object({
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().length(2).optional(),
  zip: z.string().regex(/^\d{5}$/).optional(),
  parcelId: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
})

propertiesRouter.get('/search', async (req, res, next) => {
  try {
    const params = searchSchema.parse(req.query)
    if (!params.address && !params.zip && !params.parcelId && !params.city) {
      res.status(400).json({ success: false, error: { code: 'MISSING_PARAM', message: 'Provide address, zip, city, or parcelId' } })
      return
    }
    const result = await searchProperties(params)
    res.json({ success: true, data: result })
  } catch (err) {
    next(err)
  }
})

// ─── Property detail ──────────────────────────────────────────────────────────

propertiesRouter.get('/:id', async (req, res, next) => {
  try {
    const property = await getPropertyById(req.params.id)
    if (!property) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Property not found' } })
      return
    }
    res.json({ success: true, data: property })
  } catch (err) {
    next(err)
  }
})

// ─── Risk profile ─────────────────────────────────────────────────────────────

propertiesRouter.get('/:id/risk', async (req, res, next) => {
  try {
    const profile = await getOrComputeRiskProfile(req.params.id)
    res.json({ success: true, data: profile })
  } catch (err) {
    next(err)
  }
})

// ─── Insurance estimate ───────────────────────────────────────────────────────

propertiesRouter.get('/:id/insurance', async (req, res, next) => {
  try {
    const estimate = await getOrComputeInsuranceEstimate(req.params.id)
    res.json({ success: true, data: estimate })
  } catch (err) {
    next(err)
  }
})

// ─── Full report (property + risk + insurance) ────────────────────────────────

propertiesRouter.get('/:id/report', async (req, res, next) => {
  try {
    const [property, risk, insurance] = await Promise.all([
      getPropertyById(req.params.id),
      getOrComputeRiskProfile(req.params.id),
      getOrComputeInsuranceEstimate(req.params.id),
    ])
    if (!property) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Property not found' } })
      return
    }
    res.json({ success: true, data: { property, risk, insurance } })
  } catch (err) {
    next(err)
  }
})

// ─── Save property (authenticated) ───────────────────────────────────────────

const saveSchema = z.object({
  notes: z.string().max(500).optional(),
  tags: z.array(z.string()).max(10).default([]),
})

propertiesRouter.post('/:id/save', requireAuth, async (req: Request, res, next) => {
  try {
    const { userId } = req as AuthenticatedRequest
    const body = saveSchema.parse(req.body)

    const saved = await prisma.savedProperty.upsert({
      where: { userId_propertyId: { userId, propertyId: req.params.id } },
      update: { notes: body.notes, tags: body.tags },
      create: { userId, propertyId: req.params.id, notes: body.notes, tags: body.tags },
    })
    res.json({ success: true, data: saved })
  } catch (err) {
    next(err)
  }
})

propertiesRouter.delete('/:id/save', requireAuth, async (req: Request, res, next) => {
  try {
    const { userId } = req as AuthenticatedRequest
    await prisma.savedProperty.deleteMany({ where: { userId, propertyId: req.params.id } })
    res.json({ success: true, data: null })
  } catch (err) {
    next(err)
  }
})
