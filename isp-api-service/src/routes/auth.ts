import { Router } from 'express'
import { z } from 'zod'
import { pool } from '../db/pool.js'
import { verifyPassword } from '../lib/password.js'
import { sign } from '../lib/jwt.js'
import { writeAudit } from '../lib/audit.js'
import { HttpError } from '../middleware/error.js'
import { authRequired } from '../middleware/auth.js'
import { loginLimiter } from '../middleware/rateLimit.js'

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
// GET /auth/me — info user yang login
// ---------------------------------------------------------------------------
authRouter.get('/me', authRequired, (req, res) => {
  res.json({ auth: req.auth })
})
