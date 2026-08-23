import type { NextFunction, Request, Response } from 'express'
import { ZodError } from 'zod'
import multer from 'multer'
import { logger } from '../lib/logger.js'

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: 'validation_failed', issues: err.issues })
  }
  if (err instanceof multer.MulterError) {
    const tooBig = err.code === 'LIMIT_FILE_SIZE'
    return res.status(tooBig ? 413 : 400).json({ error: tooBig ? 'file_too_large' : 'upload_error' })
  }
  if (err instanceof Error && 'status' in err && typeof err.status === 'number') {
    const status = err.status as number
    return res.status(status).json({ error: err.message })
  }
  logger.error({ err }, 'unhandled error')
  return res.status(500).json({ error: 'internal_error' })
}

export class HttpError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}
