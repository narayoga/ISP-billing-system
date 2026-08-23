import { Router } from 'express'
import { z } from 'zod'
import { pool } from '../db/pool.js'
import { hashPassword, verifyPassword } from '../lib/password.js'
import { sign } from '../lib/jwt.js'
import { sendMagicLink } from '../lib/mailer.js'
import { writeAudit } from '../lib/audit.js'
import { issueMagicLink, magicLinkUrl } from '../services/magicLink.js'
import { HttpError } from '../middleware/error.js'
import { authRequired, requireSuperadmin } from '../middleware/auth.js'
import { loginLimiter, emailLimiter } from '../middleware/rateLimit.js'

export const authRouter = Router()

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

// ---------------------------------------------------------------------------
// POST /auth/admin/login
// ---------------------------------------------------------------------------
authRouter.post('/admin/login', loginLimiter, async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body)
    const { rows } = await pool.query<{
      id: number
      email: string
      password_hash: string
      role: 'superadmin' | 'cs'
      is_active: boolean
    }>(
      `SELECT id, email, password_hash, role, is_active
       FROM admin_users WHERE email = $1`,
      [email],
    )
    const admin = rows[0]
    if (!admin || !admin.is_active) throw new HttpError(401, 'invalid_credentials')

    const ok = await verifyPassword(password, admin.password_hash)
    if (!ok) throw new HttpError(401, 'invalid_credentials')

    const token = sign({
      type: 'admin',
      sub: admin.id,
      email: admin.email,
      role: admin.role,
    })
    await writeAudit(pool, admin.id, 'admin_login', 'admin', admin.id, { email: admin.email })
    res.json({
      token,
      user: { id: admin.id, email: admin.email, role: admin.role },
    })
  } catch (e) {
    next(e)
  }
})

// ---------------------------------------------------------------------------
// POST /auth/customer/login
// ---------------------------------------------------------------------------
authRouter.post('/customer/login', loginLimiter, async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body)
    const { rows } = await pool.query<{
      id: number
      email: string
      password_hash: string | null
      status: string
    }>(
      `SELECT id, email, password_hash, status
       FROM customers WHERE email = $1`,
      [email],
    )
    const customer = rows[0]
    if (!customer || !customer.password_hash) {
      throw new HttpError(401, 'invalid_credentials')
    }
    if (customer.status === 'inactive') {
      throw new HttpError(403, 'account_inactive')
    }

    const ok = await verifyPassword(password, customer.password_hash)
    if (!ok) throw new HttpError(401, 'invalid_credentials')

    const token = sign({
      type: 'customer',
      sub: customer.id,
      email: customer.email,
    })
    res.json({
      token,
      user: { id: customer.id, email: customer.email },
    })
  } catch (e) {
    next(e)
  }
})

// ---------------------------------------------------------------------------
// POST /auth/customer/set-password — magic link token + password baru
// ---------------------------------------------------------------------------
const setPasswordSchema = z.object({
  token: z.string().uuid(),
  password: z.string().min(8).max(72),
})

authRouter.post('/customer/set-password', loginLimiter, async (req, res, next) => {
  const client = await pool.connect()
  try {
    const { token, password } = setPasswordSchema.parse(req.body)
    await client.query('BEGIN')

    const { rows } = await client.query<{
      customer_id: number
      expires_at: Date
      used_at: Date | null
    }>(
      `SELECT customer_id, expires_at, used_at
       FROM password_reset_tokens WHERE token = $1
       FOR UPDATE`,
      [token],
    )
    const row = rows[0]
    if (!row) throw new HttpError(404, 'token_not_found')
    if (row.used_at) throw new HttpError(400, 'token_already_used')
    if (row.expires_at.getTime() < Date.now()) throw new HttpError(400, 'token_expired')

    const hash = await hashPassword(password)
    await client.query(
      `UPDATE customers SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
      [hash, row.customer_id],
    )
    await client.query(
      `UPDATE password_reset_tokens SET used_at = NOW() WHERE token = $1`,
      [token],
    )
    await client.query('COMMIT')
    res.json({ ok: true })
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {})
    next(e)
  } finally {
    client.release()
  }
})

// ---------------------------------------------------------------------------
// POST /auth/admin/customers/:id/resend-magic-link  (superadmin only)
// ---------------------------------------------------------------------------
authRouter.post(
  '/admin/customers/:id/resend-magic-link',
  authRequired,
  requireSuperadmin,
  emailLimiter,
  async (req, res, next) => {
    const client = await pool.connect()
    try {
      const customerId = Number(req.params.id)
      if (!Number.isInteger(customerId) || customerId <= 0) {
        throw new HttpError(400, 'invalid_id')
      }
      await client.query('BEGIN')
      const { rows } = await client.query<{ email: string }>(
        `SELECT email FROM customers WHERE id = $1`,
        [customerId],
      )
      const customer = rows[0]
      if (!customer) throw new HttpError(404, 'customer_not_found')

      // Invalidasi token lama + terbitkan token baru (helper bersama).
      const { token, expiresAt } = await issueMagicLink(client, customerId)
      await writeAudit(client, req.auth!.sub, 'resend_magic_link', 'customer', customerId, {
        token_expires_at: expiresAt,
      })
      await client.query('COMMIT')

      await sendMagicLink(customer.email, magicLinkUrl(token))

      res.json({ ok: true })
    } catch (e) {
      await client.query('ROLLBACK').catch(() => {})
      next(e)
    } finally {
      client.release()
    }
  },
)

// ---------------------------------------------------------------------------
// GET /auth/me — info user yang login
// ---------------------------------------------------------------------------
authRouter.get('/me', authRequired, (req, res) => {
  res.json({ auth: req.auth })
})
