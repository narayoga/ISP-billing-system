import { Router } from 'express'
import { authRequired, requireAdmin } from '../middleware/auth.js'
import { HttpError } from '../middleware/error.js'
import * as invoices from '../services/invoices.js'

export const invoicesRouter = Router()

invoicesRouter.use(authRequired, requireAdmin)

invoicesRouter.get('/', async (req, res, next) => {
  try {
    const status = typeof req.query.status === 'string' ? req.query.status : undefined
    const customerId = req.query.customer_id ? Number(req.query.customer_id) : undefined
    res.json(await invoices.listInvoices({ status, customerId }))
  } catch (e) {
    next(e)
  }
})

invoicesRouter.get('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, 'invalid_id')
    const inv = await invoices.getInvoice(id)
    if (!inv) throw new HttpError(404, 'invoice_not_found')
    res.json(inv)
  } catch (e) {
    next(e)
  }
})
