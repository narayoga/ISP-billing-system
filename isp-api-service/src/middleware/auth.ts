import type { NextFunction, Request, Response } from 'express'
import { verify, type Claims } from '../lib/jwt.js'

declare module 'express-serve-static-core' {
  interface Request {
    auth?: Claims
  }
}

const PIN = process.env.WRITE_PIN ?? ''

// anti brute-force middleware for write pin
const attempts = new Map<string, { fails: number; until: number }>()
const MAX_FAILS = 5
const COOLDOWN_MS = 30_000

const MUTATING = new Set(['POST', 'PATCH', 'PUT', 'DELETE'])

export function writePin(req: Request, res: Response, next: NextFunction) {
  if (!MUTATING.has(req.method)) return next()
  if (!PIN) return next()

  const ip = req.ip ?? 'unknown'
  const now = Date.now()
  const record = attempts.get(ip) ?? { fails: 0, until: 0 }


  if (record.until > now) {
    return res.status(429).json({ error: 'pin_locked' })
  }

  const pin = req.header('x-write-pin')
  if (!pin) return res.status(401).json({ error: 'pin_required' })

  if (pin !== PIN) {
    const fails = (record?.fails ?? 0) + 1
    // Setelah MAX_FAILS, kunci sementara dan reset penghitung.
    attempts.set(ip, {
      fails: fails >= MAX_FAILS ? 0 : fails,
      until: fails >= MAX_FAILS ? now + COOLDOWN_MS : 0,
    })
    return res.status(403).json({ error: 'pin_invalid' })
  }

  attempts.delete(ip) // benar → bersihkan catatan gagal
  next()

}

export function authRequired(req: Request, res: Response, next: NextFunction) {

  // bypass auth check for now, just set a fake admin account
  if (process.env.DISABLE_AUTH === 'true') {
    req.auth = {
      type: 'admin',
      sub: 1,
      email: 'admin@isp.local',
      role: 'superadmin'
    } as any; // (Tambahkan 'as any' jika TypeScript protes soal tipe data, atau hapus jika aman)
    return next();
  }

  const header = req.header('authorization')
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'unauthenticated' })
  }
  try {
    req.auth = verify(header.slice(7))
    next()
  } catch {
    return res.status(401).json({ error: 'invalid_token' })
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.auth?.type !== 'admin') {
    return res.status(403).json({ error: 'forbidden' })
  }
  next()
}

export function requireSuperadmin(req: Request, res: Response, next: NextFunction) {
  if (req.auth?.type !== 'admin' || req.auth.role !== 'superadmin') {
    return res.status(403).json({ error: 'forbidden' })
  }
  next()
}
