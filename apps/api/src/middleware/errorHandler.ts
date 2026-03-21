import type { Request, Response, NextFunction } from 'express'
import { logger } from '../utils/logger'
import { ZodError } from 'zod'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: err.flatten(),
      },
    })
    return
  }

  // Prisma "record not found" (findUniqueOrThrow / findFirstOrThrow / P2025)
  if (
    err instanceof PrismaClientKnownRequestError &&
    err.code === 'P2025'
  ) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Resource not found' },
    })
    return
  }

  if (err instanceof Error) {
    logger.error(err.message, { stack: err.stack })
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
      },
    })
    return
  }

  logger.error('Unknown error', { err })
  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
  })
}
