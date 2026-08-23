import type { NextFunction, Request, Response } from 'express'
import { verify, type Claims } from '../lib/jwt.js'

declare module 'express-serve-static-core' {
  interface Request {
    auth?: Claims
  }
}

export function authRequired(req: Request, res: Response, next: NextFunction) {
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

export function requireCustomer(req: Request, res: Response, next: NextFunction) {
  if (req.auth?.type !== 'customer') {
    return res.status(403).json({ error: 'forbidden' })
  }
  next()
}
