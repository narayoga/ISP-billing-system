import type { NextFunction, Request, Response } from 'express'
import { verify, type Claims } from '../lib/jwt.js'

declare module 'express-serve-static-core' {
  interface Request {
    auth?: Claims
  }
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
