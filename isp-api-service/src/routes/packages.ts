import { Router } from 'express'
import { z } from 'zod'
import { authRequired, requireAdmin } from '../middleware/auth.js'
import { HttpError } from '../middleware/error.js'
import * as packages from '../services/packages.js'

export const packagesRouter = Router()

function parseId(raw: string): number {
  const id = Number(raw)
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, 'invalid_id')
  return id
}

const packageSchema = z.object({
  name: z.string().min(1).max(100),
  price: z.number().int().min(0),
  speed_mbps: z.number().int().positive(),
  quota_gb: z.number().int().positive().nullable().default(null),
  fup_mbps: z.number().int().positive().nullable().default(null),
  is_active: z.boolean().optional(),
})

// Semua endpoint paket butuh admin (dipakai di form pelanggan juga).
packagesRouter.use(authRequired, requireAdmin)

packagesRouter.get('/', async (req, res, next) => {
  try {
    const includeInactive = req.query.all === 'true'
    res.json(await packages.listPackages(includeInactive))
  } catch (e) {
    next(e)
  }
})

packagesRouter.post('/', async (req, res, next) => {
  try {
    const input = packageSchema.parse(req.body)
    res.status(201).json(await packages.createPackage(input))
  } catch (e) {
    next(e)
  }
})

packagesRouter.get('/:id', async (req, res, next) => {
  try {
    const pkg = await packages.getPackage(parseId(req.params.id))
    if (!pkg) throw new HttpError(404, 'package_not_found')
    res.json(pkg)
  } catch (e) {
    next(e)
  }
})

packagesRouter.patch('/:id', async (req, res, next) => {
  try {
    const input = packageSchema.parse(req.body)
    const pkg = await packages.updatePackage(parseId(req.params.id), input)
    if (!pkg) throw new HttpError(404, 'package_not_found')
    res.json(pkg)
  } catch (e) {
    next(e)
  }
})

packagesRouter.delete('/:id', async (req, res, next) => {
  try {
    const ok = await packages.deactivatePackage(parseId(req.params.id))
    if (!ok) throw new HttpError(404, 'package_not_found')
    res.json({ ok: true })
  } catch (e) {
    next(e)
  }
})
