import rateLimit from 'express-rate-limit'

/**
 * Rate limit untuk endpoint login (PRD §10 mitigasi "Password admin lemah / leak").
 * Default: 10 percobaan / 15 menit per IP. Percobaan yang sukses tidak dihitung,
 * sehingga user sah tidak terkunci karena sering login.
 */
export const loginLimiter = rateLimit({
  windowMs: Number(process.env.LOGIN_RATE_WINDOW_MS ?? 15 * 60 * 1000),
  limit: Number(process.env.LOGIN_RATE_MAX ?? 10),
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'too_many_attempts' },
})

/** Limit untuk endpoint yang memicu pengiriman email (cegah abuse/spam). */
export const emailLimiter = rateLimit({
  windowMs: Number(process.env.EMAIL_RATE_WINDOW_MS ?? 60 * 60 * 1000),
  limit: Number(process.env.EMAIL_RATE_MAX ?? 20),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'too_many_requests' },
})
