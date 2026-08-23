import jwt from 'jsonwebtoken'

const secret = process.env.JWT_SECRET
if (!secret) {
  throw new Error('JWT_SECRET belum di-set')
}
const SECRET = secret
const EXPIRES_IN = (process.env.JWT_EXPIRES_IN ?? '12h') as jwt.SignOptions['expiresIn']

export type AdminClaims = {
  type: 'admin'
  sub: number
  email: string
  role: 'superadmin' | 'cs'
}

export type CustomerClaims = {
  type: 'customer'
  sub: number
  email: string
}

export type Claims = AdminClaims | CustomerClaims

export function sign(claims: Claims): string {
  return jwt.sign(claims, SECRET, { expiresIn: EXPIRES_IN })
}

export function verify(token: string): Claims {
  const decoded = jwt.verify(token, SECRET)
  if (typeof decoded === 'string') {
    throw new Error('invalid token payload')
  }
  return decoded as unknown as Claims
}
