import 'dotenv/config'
import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import pinoHttp from 'pino-http'
import { logger } from './lib/logger.js'
import { pingDB } from './db/pool.js'
import { authRouter } from './routes/auth.js'
import { packagesRouter } from './routes/packages.js'
import { customersRouter } from './routes/customers.js'
import { invoicesRouter } from './routes/invoices.js'
import { meRouter } from './routes/me.js'
import { paymentsRouter } from './routes/payments.js'
import { auditRouter } from './routes/audit.js'
import { statsRouter } from './routes/stats.js'
import { errorHandler } from './middleware/error.js'

const app = express()
const port = Number(process.env.PORT ?? 8080)

// Di belakang reverse proxy (nginx) set TRUST_PROXY=1 agar rate limit membaca
// IP asli klien dari X-Forwarded-For, bukan IP proxy.
if (process.env.TRUST_PROXY) {
  app.set('trust proxy', Number(process.env.TRUST_PROXY))
}

app.use(helmet())
app.use(
  cors({
    origin: (process.env.CORS_ORIGINS ?? '*').split(',').map((s) => s.trim()),
    credentials: true,
  }),
)
app.use(express.json({ limit: '256kb' }))
app.use(pinoHttp({ logger }))

app.get('/healthz', async (_req, res) => {
  try {
    await pingDB()
    res.json({ status: 'ok', service: 'isp-api-service', db: 'ok' })
  } catch (err) {
    logger.error({ err }, 'db ping failed')
    res.status(503).json({ status: 'degraded', service: 'isp-api-service', db: 'down' })
  }
})

app.use('/auth', authRouter)
app.use('/packages', packagesRouter)
app.use('/customers', customersRouter)
app.use('/invoices', invoicesRouter)
app.use('/me', meRouter)
app.use('/payments', paymentsRouter)
app.use('/audit-log', auditRouter)
app.use('/stats', statsRouter)

app.use((_req, res) => res.status(404).json({ error: 'not_found' }))
app.use(errorHandler)

app.listen(port, () => {
  logger.info({ port }, 'isp-api-service listening')
})
