import { Router } from 'express'
import { authRequired, requireSuperadmin } from '../middleware/auth.js'
import * as audit from '../services/audit.js'

export const auditRouter = Router()

// Audit log read-only, hanya superadmin (US-11 AC3).
auditRouter.get('/', authRequired, requireSuperadmin, async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 200, 1000)
    res.json(await audit.listAudit(limit))
  } catch (e) {
    next(e)
  }
})
