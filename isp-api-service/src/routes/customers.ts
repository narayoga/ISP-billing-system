import { Router } from 'express'
import { z } from 'zod'
import { authRequired, requireAdmin } from '../middleware/auth.js'
import { HttpError } from '../middleware/error.js'
import * as customers from '../services/customers.js'

export const customersRouter = Router()

function parseId(raw: string): number {
  const id = Number(raw)
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, 'invalid_id')
  return id
}

const ipRe = /^(\d{1,3}\.){3}\d{1,3}$/
const macRe = /^([0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}$/

// IP/MAC opsional (nullable di skema DB Fase 1). Divalidasi formatnya bila diisi.
const optionalIp = z.preprocess(
  (v) => (v === '' || v == null ? null : v),
  z.string().regex(ipRe, 'invalid_ip').nullable(),
)
const optionalMac = z.preprocess(
  (v) => (v === '' || v == null ? null : v),
  z.string().regex(macRe, 'invalid_mac').nullable(),
)

const customerSchema = z.object({
  name: z.string().min(1).max(150),
  email: z.string().email().max(255),
  address: z.string().min(1),
  package_id: z.number().int().positive(),
  pppoe_username: z.string().min(1).max(100),
  ip_address: optionalIp,
  mac_address: optionalMac,
})

customersRouter.use(authRequired, requireAdmin)

customersRouter.get('/', async (_req, res, next) => {
  try {
    res.json(await customers.listCustomers())
  } catch (e) {
    next(e)
  }
})

customersRouter.post('/', async (req, res, next) => {
  try {
    const input = customerSchema.parse(req.body)
    res.status(201).json(await customers.createCustomer(input))
  } catch (e) {
    next(e)
  }
})

customersRouter.get('/:id', async (req, res, next) => {
  try {
    const customer = await customers.getCustomer(parseId(req.params.id))
    if (!customer) throw new HttpError(404, 'customer_not_found')
    res.json(customer)
  } catch (e) {
    next(e)
  }
})

customersRouter.patch('/:id', async (req, res, next) => {
  try {
    const input = customerSchema.parse(req.body)
    const updated = await customers.updateCustomer(parseId(req.params.id), input, req.auth!.sub)
    if (!updated) throw new HttpError(404, 'customer_not_found')
    res.json(updated)
  } catch (e) {
    next(e)
  }
})

customersRouter.post('/:id/deactivate', async (req, res, next) => {
  try {
    const ok = await customers.setCustomerStatus(parseId(req.params.id), 'inactive')
    if (!ok) throw new HttpError(404, 'customer_not_found')
    res.json({ ok: true })
  } catch (e) {
    next(e)
  }
})

customersRouter.post('/:id/reactivate', async (req, res, next) => {
  try {
    const ok = await customers.setCustomerStatus(parseId(req.params.id), 'active')
    if (!ok) throw new HttpError(404, 'customer_not_found')
    res.json({ ok: true })
  } catch (e) {
    next(e)
  }
})
