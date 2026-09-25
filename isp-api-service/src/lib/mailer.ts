import nodemailer, { type Transporter } from 'nodemailer'
import { logger } from './logger.js'

// Urutan kanal email:
//   1. Gmail API (HTTPS 443) bila GMAIL_* lengkap — dipakai di produksi karena
//      VPS memblokir port SMTP keluar (25/465/587).
//   2. SMTP bila SMTP_HOST di-set.
//   3. Log ke console (dev).
// Signature fungsi tetap sama supaya pemanggil (auth, customers, payments) tak berubah.

const from = process.env.EMAIL_FROM ?? 'ISP <no-reply@isp.local>'

// --- Gmail API ---------------------------------------------------------------

const GMAIL_CLIENT_ID = process.env.GMAIL_CLIENT_ID ?? ''
const GMAIL_CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET ?? ''
const GMAIL_REFRESH_TOKEN = process.env.GMAIL_REFRESH_TOKEN ?? ''
const gmailEnabled =
  GMAIL_CLIENT_ID !== '' && GMAIL_CLIENT_SECRET !== '' && GMAIL_REFRESH_TOKEN !== ''

// Gmail mengirim atas nama akun pemilik token, jadi alamat From memakai
// GMAIL_SENDER; nama tampilan tetap diambil dari EMAIL_FROM.
const fromMatch = /^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/.exec(from)
const gmailFrom = {
  name: fromMatch?.[1] ?? '',
  address: process.env.GMAIL_SENDER || fromMatch?.[2] || from,
}

// nodemailer di sini hanya menyusun pesan MIME mentah (UTF-8, multipart
// html+text) — pengirimannya lewat Gmail API, bukan SMTP.
const composer = nodemailer.createTransport({ streamTransport: true, buffer: true })

let cachedToken: { value: string; expiresAt: number } | null = null

async function gmailAccessToken(): Promise<string> {
  // Sisakan 60 detik agar token tidak kedaluwarsa di tengah request.
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) return cachedToken.value

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GMAIL_CLIENT_ID,
      client_secret: GMAIL_CLIENT_SECRET,
      refresh_token: GMAIL_REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }),
    signal: AbortSignal.timeout(10_000),
  })
  const body = (await res.json()) as {
    access_token?: string
    expires_in?: number
    error?: string
    error_description?: string
  }
  if (!res.ok || !body.access_token) {
    // OAuth app masih mode Testing: refresh token mati tiap 7 hari.
    if (body.error === 'invalid_grant') {
      throw new Error(
        'GMAIL_REFRESH_TOKEN kedaluwarsa/dicabut (invalid_grant) — ambil token baru di OAuth Playground, perbarui .env.prod, lalu restart api & billing',
      )
    }
    throw new Error(`refresh token Gmail gagal: ${body.error ?? res.status} ${body.error_description ?? ''}`)
  }
  cachedToken = { value: body.access_token, expiresAt: Date.now() + (body.expires_in ?? 3600) * 1000 }
  return cachedToken.value
}

async function sendViaGmail(to: string, subject: string, html: string, text: string): Promise<void> {
  const info = await composer.sendMail({ from: gmailFrom, to, subject, html, text })
  const raw = (info.message as Buffer).toString('base64url')

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${await gmailAccessToken()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw }),
    signal: AbortSignal.timeout(15_000),
  })
  if (!res.ok) {
    // Token ditolak: buang cache agar kiriman berikutnya minta token baru.
    if (res.status === 401) cachedToken = null
    throw new Error(`Gmail API HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`)
  }
}

// --- SMTP --------------------------------------------------------------------

let transporter: Transporter | null = null
if (gmailEnabled) {
  logger.info({ sender: gmailFrom.address }, 'Email via Gmail API aktif')
} else if (process.env.SMTP_HOST) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 2525),
    secure: process.env.SMTP_SECURE === 'true', // false = STARTTLS (port 2525/587)
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS ?? '' }
      : undefined,
  })
  logger.info({ host: process.env.SMTP_HOST }, 'SMTP aktif')
} else {
  logger.info('Email tidak dikonfigurasi — email di-log ke console')
}

async function send(to: string, subject: string, html: string, text: string): Promise<void> {
  if (!gmailEnabled && !transporter) {
    logger.info({ to, subject, text }, '[DEV-MAIL]')
    return
  }
  try {
    if (gmailEnabled) {
      await sendViaGmail(to, subject, html, text)
    } else {
      await transporter!.sendMail({ from, to, subject, html, text })
    }
    logger.info({ to, subject }, 'email terkirim')
  } catch (err) {
    logger.error({ err, to, subject }, 'gagal kirim email')
  }
}

export async function sendMagicLink(toEmail: string, link: string): Promise<void> {
  await send(
    toEmail,
    'Setel Password Akun Layanan Internet Anda',
    `<p>Halo,</p>
     <p>Akun layanan internet Anda telah dibuat. Klik tautan berikut untuk menyetel password (berlaku 24 jam, sekali pakai):</p>
     <p><a href="${link}">${link}</a></p>
     <p>Jika Anda tidak merasa mendaftar, abaikan email ini.</p>`,
    `Setel password akun Anda (berlaku 24 jam): ${link}`,
  )
}

export async function sendNotification(
  toEmail: string,
  subject: string,
  body: string,
): Promise<void> {
  await send(toEmail, subject, `<p>${body}</p>`, body)
}
