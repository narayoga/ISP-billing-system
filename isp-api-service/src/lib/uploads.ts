import fs from 'node:fs'
import path from 'node:path'
import multer from 'multer'
import { HttpError } from '../middleware/error.js'

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? './var/uploads'
const MAX_BYTES = Number(process.env.UPLOAD_MAX_BYTES ?? 2 * 1024 * 1024)

export const uploadDirAbs = path.resolve(UPLOAD_DIR)
fs.mkdirSync(uploadDirAbs, { recursive: true })

// Hanya .jpg / .png / .pdf (US-02 AC1).
const ALLOWED = new Map<string, string>([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['application/pdf', 'pdf'],
])

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDirAbs),
  filename: (req, file, cb) => {
    const ext = ALLOWED.get(file.mimetype) ?? 'bin'
    const rand = Math.round(Math.random() * 1e6)
    cb(null, `inv${req.params.id}-${Date.now()}-${rand}.${ext}`)
  },
})

// Middleware single-file 'proof'. Batas 2MB (US-02 AC2). Filter tipe file.
export const uploadProof = multer({
  storage,
  limits: { fileSize: MAX_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED.has(file.mimetype)) {
      cb(new HttpError(400, 'invalid_file_type'))
      return
    }
    cb(null, true)
  },
}).single('proof')
