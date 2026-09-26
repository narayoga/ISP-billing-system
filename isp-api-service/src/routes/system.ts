import { Router } from 'express'
import { pool } from '../db/pool.js'
import { authRequired, requireAdmin, writePin } from '../middleware/auth.js'

export const systemRouter = Router()

// Pengingat SEMENTARA untuk refresh token Gmail API. Selama OAuth app Google
// masih mode "Testing", token mati 7 hari setelah dibuat. Setelah app lolos
// verifikasi Google, hapus file ini beserta baris /system di index.ts.

const SETTING_KEY = 'gmail_token_renewed_at'
const DAY_MS = 24 * 60 * 60 * 1000
const REMIND_AFTER_MS = 6 * DAY_MS
const TOKEN_LIFETIME_MS = 7 * DAY_MS

export type TokenReminderStatus = {
    renewedAt: string | null
    dueAt: string | null
    show: boolean
}

// Dihitung di server agar tidak bergantung pada jam komputer masing-masing admin.
function toStatus(renewedAt: Date | string | null | undefined): TokenReminderStatus {
    // Baris hilang → tampilkan pengingat; lebih aman daripada diam.
    if (!renewedAt) return { renewedAt: null, dueAt: null, show: true }
    const renewed = new Date(renewedAt)
    return {
        renewedAt: renewed.toISOString(),
        dueAt: new Date(renewed.getTime() + TOKEN_LIFETIME_MS).toISOString(),
        show: Date.now() >= renewed.getTime() + REMIND_AFTER_MS,
    }
}

// Status pengingat — dipanggil banner di semua halaman admin. Hanya baca, tanpa PIN.
systemRouter.get('/token-reminder', authRequired, requireAdmin, async (_req, res, next) => {
    try {
        const { rows } = await pool.query<{ renewed_at: Date | string }>(
            `SELECT value::timestamptz AS renewed_at FROM app_settings WHERE key = $1`,
            [SETTING_KEY],
        )
        res.json(toStatus(rows[0]?.renewed_at))
    } catch (e) {
        next(e)
    }
})

// Klik "Done" → hitungan 6 hari mulai ulang. Sengaja tidak memeriksa apakah
// token benar-benar sudah diganti; cukup admin yang tahu PIN.
systemRouter.post(
    '/token-reminder/done',
    authRequired,
    requireAdmin,
    writePin,
    async (_req, res, next) => {
        try {
            const { rows } = await pool.query<{ renewed_at: Date | string }>(
                `INSERT INTO app_settings (key, value) VALUES ($1, NOW()::text)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
         RETURNING value::timestamptz AS renewed_at`,
                [SETTING_KEY],
            )
            res.json(toStatus(rows[0]!.renewed_at))
        } catch (e) {
            next(e)
        }
    },
)