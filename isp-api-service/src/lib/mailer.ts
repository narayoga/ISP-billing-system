import nodemailer, { type Transporter } from 'nodemailer'
import { logger } from './logger.js'

// Kirim email via SMTP (mis. Elastic Email) bila SMTP_HOST di-set; kalau tidak,
// fallback log ke console (dev). Signature fungsi tetap sama supaya pemanggil
// (auth, customers, payments) tak berubah.

const from = process.env.EMAIL_FROM ?? 'ISP <no-reply@isp.local>'

let transporter: Transporter | null = null
if (process.env.SMTP_HOST) {
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
  logger.info('SMTP tidak dikonfigurasi — email di-log ke console')
}

async function send(to: string, subject: string, html: string, text: string): Promise<void> {
  if (!transporter) {
    logger.info({ to, subject, text }, '[DEV-MAIL]')
    return
  }
  try {
    await transporter.sendMail({ from, to, subject, html, text })
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
