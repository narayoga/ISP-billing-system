import { Router } from 'express'
import { z } from 'zod'
import { authRequired, requireAdmin, writePin } from '../middleware/auth.js'
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

/**
 * Nomor WhatsApp dinormalkan ke format internasional tanpa '+':
 *   0812-3456-789 → 628123456789
 *   +62 812 3456 789 → 628123456789
 * Admin tetap bisa mengetik dengan gaya lokal yang biasa.
 */
const phoneField = z.preprocess((v) => {
  if (typeof v !== 'string') return v
  const digits = v.replace(/\D/g, '')
  return digits.startsWith('0') ? '62' + digits.slice(1) : digits
}, z.string().regex(/^[1-9][0-9]{7,19}$/, 'invalid_phone'))

// Email opsional sejak PRD v3.0 (kanal pendamping, bukan identitas login).
const optionalEmail = z.preprocess(
  (v) => (v === '' || v == null ? null : v),
  z.string().email().max(255).nullable(),
)

/**
 * Harga khusus pelanggan untuk paket bertarif negosiasi. Dikirim kosong bila
 * paketnya bertarif tetap; wajib (dan diabaikan bila tidak relevan) ditentukan
 * di service, karena butuh membaca flag paketnya.
 */
const optionalCustomPrice = z.preprocess(
  (v) => (v === '' || v == null ? null : v),
  z.number().int().min(0).nullable(),
)

const customerSchema = z.object({
  name: z.string().min(1).max(150),
  phone: phoneField,
  email: optionalEmail,
  address: z.string().min(1),
  package_id: z.number().int().positive(),
  custom_price: optionalCustomPrice,
  pppoe_username: z.string().min(1).max(100),
  ip_address: optionalIp,
  mac_address: optionalMac,
})

customersRouter.use(authRequired, requireAdmin, writePin)

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
