import 'dotenv/config'
import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import compression from 'compression'
import morgan from 'morgan'
import { rateLimit } from 'express-rate-limit'

import { logger } from './utils/logger'
import { errorHandler } from './middleware/errorHandler'
import { propertiesRouter } from './routes/properties'
import { authRouter } from './routes/auth'

const app = express()
const PORT = parseInt(process.env.PORT ?? '4000', 10)

// ─── Security / middleware ────────────────────────────────────────────────────

app.use(helmet())
app.use(cors({
  origin: (process.env.CORS_ALLOWED_ORIGINS ?? 'http://localhost:3000').split(','),
  credentials: true,
}))
app.use(compression())
app.use(express.json({ limit: '1mb' }))
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev', {
  stream: { write: (msg) => logger.http(msg.trim()) },
}))

// ─── Rate limiting ────────────────────────────────────────────────────────────

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '60000', 10),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS ?? '100', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests, please try again later.' } },
})
app.use('/api', limiter)

// ─── Routes ───────────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/api/auth', authRouter)
app.use('/api/properties', propertiesRouter)

// ─── 404 ──────────────────────────────────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Route not found' } })
})

// ─── Error handler ────────────────────────────────────────────────────────────

app.use(errorHandler)

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  logger.info(`CoverGuard API running on port ${PORT} [${process.env.NODE_ENV ?? 'development'}]`)
})

export { app }
