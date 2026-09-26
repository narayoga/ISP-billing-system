import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { api, ApiError } from '../lib/api'
import { formatDateTime } from '../lib/format'

type TokenReminderStatus = {
  renewedAt: string | null
  dueAt: string | null
  show: boolean
}

const POLL_MS = 5 * 60 * 1000
const GMAIL_SCOPE = 'https://www.googleapis.com/auth/gmail.send'
const EDIT_ENV_CMD = 'nano /opt/billing-system/.env.prod'
const RECREATE_CMD =
  'cd /opt/billing-system && IMAGE_TAG=$(git rev-parse HEAD) docker compose --env-file .env.prod -f docker-compose.prod.yml up -d api billing'

/**
 * Pengingat SEMENTARA refresh token Gmail API, melayang di atas semua halaman
 * admin. Sengaja tanpa tombol tutup: hilang hanya setelah "Done" (butuh PIN),
 * lalu muncul lagi 6 hari kemudian. Hapus setelah OAuth app lolos verifikasi.
 */
export default function EmailTokenBanner() {
  const [status, setStatus] = useState<TokenReminderStatus | null>(null)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [doneError, setDoneError] = useState<string | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const { pathname } = useLocation()

  const load = useCallback(() => {
    api<TokenReminderStatus>('/system/token-reminder')
      .then(setStatus)
      // Gagal cek status tidak boleh mengganggu halaman — coba lagi nanti.
      .catch(() => {})
  }, [])

  // Cek saat pindah halaman dan berkala, supaya Done dari perangkat lain ikut terlihat.
  useEffect(() => {
    load()
  }, [load, pathname])

  useEffect(() => {
    const poll = setInterval(load, POLL_MS)
    const tick = setInterval(() => setNow(Date.now()), 60_000)
    return () => {
      clearInterval(poll)
      clearInterval(tick)
    }
  }, [load])

  function markDone() {
    setSaving(true)
    setDoneError(null)
    // POST otomatis memunculkan modal PIN (lihat lib/api.ts).
    api<TokenReminderStatus>('/system/token-reminder/done', { method: 'POST' })
      .then((s) => {
        setStatus(s)
        setOpen(false)
      })
      .catch((e) => {
        // Modal PIN dibatalkan juga berakhir di sini — cukup diam.
        if (e instanceof ApiError) setDoneError(e.message)
      })
      .finally(() => setSaving(false))
  }

  if (!status?.show) return null

  const msLeft = status.dueAt ? new Date(status.dueAt).getTime() - now : null
  const overdue = msLeft !== null && msLeft <= 0
  const headline =
    msLeft === null
      ? 'Token email Gmail perlu diperbarui (tanggal pembaruan terakhir tidak diketahui).'
      : overdue
        ? `Token email Gmail sudah melewati batas 7 hari (${formatDateTime(status.dueAt!)}) — email pelanggan kemungkinan TIDAK terkirim.`
        : `Token email Gmail kedaluwarsa dalam ${formatLeft(msLeft)} (${formatDateTime(status.dueAt!)}).`

  const tone = overdue
    ? 'bg-red-600 text-white border-red-700'
    : 'bg-amber-400 text-amber-950 border-amber-500'

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 w-[min(42rem,calc(100vw-1.5rem))]">
      <div className={`rounded-xl border shadow-lg ${tone}`}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-medium"
        >
          <span aria-hidden className="text-lg leading-none">
            {overdue ? '✕' : '!'}
          </span>
          <span className="flex-1">
            {headline}{' '}
            <span className="underline underline-offset-2">
              {open ? 'Tutup panduan' : 'Cara memperbarui'}
            </span>
          </span>
          <span aria-hidden className={`transition-transform ${open ? 'rotate-180' : ''}`}>
            ▾
          </span>
        </button>

        {open && (
          <div className="max-h-[70vh] overflow-auto rounded-b-xl bg-white text-slate-800 px-5 py-4 text-sm space-y-4">
            <ol className="list-decimal pl-5 space-y-3">
              <li>
                Buka{' '}
                <ExtLink href="https://developers.google.com/oauthplayground">OAuth Playground</ExtLink>{' '}
                → klik ⚙️ di kanan atas:
                <ul className="list-disc pl-5 mt-1 space-y-0.5">
                  <li>
                    Centang <b>Use your own OAuth credentials</b> → isi Client ID &amp; Secret yang{' '}
                    <b>sama</b> dengan <code>GMAIL_CLIENT_ID</code>/<code>GMAIL_CLIENT_SECRET</code> di{' '}
                    <code>.env.prod</code> (lihat di{' '}
                    <ExtLink href="https://console.cloud.google.com/auth/clients?project=isp-billing-mail">
                      Google Auth Platform → Clients
                    </ExtLink>
                    ).
                  </li>
                  <li>
                    <b>Access type: Offline</b> dan <b>Force prompt: Consent Screen</b>.
                  </li>
                </ul>
              </li>
              <li>
                Di kotak scope kiri bawah, tempel scope ini → <b>Authorize APIs</b>:
                <CopyLine text={GMAIL_SCOPE} />
                Pilih akun Gmail pengirim → di layar "Google hasn't verified this app" klik{' '}
                <b>Continue</b> → <b>Allow</b>.
              </li>
              <li>
                Klik <b>Exchange authorization code for tokens</b> → salin <b>Refresh token</b>{' '}
                (diawali <code>1//</code>). Jangan dibagikan ke siapa pun.
              </li>
              <li>
                Di VPS, ganti nilai <code>GMAIL_REFRESH_TOKEN</code>:
                <CopyLine text={EDIT_ENV_CMD} />
              </li>
              <li>
                Muat ulang container agar token baru terbaca:
                <CopyLine text={RECREATE_CMD} />
              </li>
            </ol>

            <div className="border-t border-slate-200 pt-3 flex items-center gap-3">
              <p className="flex-1 text-xs text-slate-600">
                Sudah selesai? Klik <b>Done</b> (perlu PIN). Pengingat hilang di semua perangkat dan
                muncul lagi 6 hari dari sekarang.
              </p>
              <button
                type="button"
                onClick={markDone}
                disabled={saving}
                className="shrink-0 rounded-lg bg-slate-900 text-white px-4 py-2 text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
              >
                {saving ? 'Menyimpan…' : 'Done'}
              </button>
            </div>
            {doneError && <p className="text-xs text-red-700">Gagal menyimpan: {doneError}</p>}
          </div>
        )}
      </div>
    </div>
  )
}

function formatLeft(ms: number): string {
  const totalMin = Math.max(1, Math.round(ms / 60_000))
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (h === 0) return `${m} menit`
  return m === 0 ? `${h} jam` : `${h} jam ${m} menit`
}

function ExtLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="text-blue-700 underline underline-offset-2">
      {children}
    </a>
  )
}

function CopyLine({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      })
      .catch(() => {})
  }
  return (
    <div className="mt-1 mb-1 flex items-stretch gap-2">
      <code className="flex-1 min-w-0 overflow-x-auto whitespace-nowrap rounded-lg bg-slate-900 text-slate-100 px-3 py-2 text-xs">
        {text}
      </code>
      <button
        type="button"
        onClick={copy}
        className="shrink-0 rounded-lg border border-slate-300 px-3 text-xs hover:bg-slate-100"
      >
        {copied ? 'Tersalin' : 'Salin'}
      </button>
    </div>
  )
}