#!/usr/bin/env bash
# =====================================================================
#  Pembuat secret produksi — ISP Billing System
#
#  Jalankan DI MESIN ANDA, lalu salin keluarannya ke .env.prod.
#  Nilai yang dihasilkan tidak boleh dikirim lewat chat, email, atau
#  WhatsApp. Simpan di pengelola kata sandi.
#
#    bash generate-secrets.sh
#
#  Windows (Git Bash) juga bisa menjalankan berkas ini.
# =====================================================================
set -euo pipefail

acak() {
  # 48 byte acak → 96 karakter heksadesimal.
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -hex 48
  elif command -v node >/dev/null 2>&1; then
    node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
  else
    echo "ERROR: butuh openssl atau node untuk membuat nilai acak" >&2
    exit 1
  fi
}

sandi() {
  # Kata sandi 32 karakter, aman dipakai di URL koneksi Postgres
  # (tanpa karakter yang perlu di-escape seperti @ : / #).
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -base64 48 | tr -dc 'A-Za-z0-9' | head -c 32
  else
    node -e "console.log(require('crypto').randomBytes(48).toString('base64').replace(/[^A-Za-z0-9]/g,'').slice(0,32))"
  fi
}

cat <<EOF
# =====================================================================
# Salin blok di bawah ke .env.prod, ganti nilai yang sudah ada.
# Dibuat: $(date -Is)
# =====================================================================

# --- Secret aplikasi ---
# JWT_SECRET dan INTERNAL_SECRET harus SAMA di service api dan billing.
JWT_SECRET=$(acak)
INTERNAL_SECRET=$(acak)

# Dipakai router Mikrotik pada header X-Webhook-Secret.
# Nilai yang sama harus dituliskan ke setup.rsc.
WEBHOOK_SECRET=$(acak)

# --- Database ---
POSTGRES_PASSWORD=$(sandi)

# --- Admin pertama ---
# Ganti sendiri setelah login pertama.
SEED_ADMIN_PASSWORD=$(sandi)

EOF

cat <<'CATATAN'
# ---------------------------------------------------------------------
# YANG MASIH HARUS DIISI MANUAL (tidak bisa dibuat otomatis):
#
#   POSTGRES_USER, POSTGRES_DB        nama basis data
#   CORS_ORIGINS, PUBLIC_BASE_URL     domain frontend
#   VITE_API_BASE_URL,
#   VITE_BILLING_BASE_URL             domain backend
#   SMTP_USER, SMTP_PASS              kredensial email
#   WABLAS_TOKEN, WABLAS_SECRET       dari dashboard Wablas
#   MIKROTIK_USER, MIKROTIK_PASSWORD  dari konfigurasi router
#   SEED_ADMIN_EMAIL, ALERT_EMAIL     alamat email Anda
#
# WAJIB DIROTASI sebelum produksi — nilai lama sudah pernah dipakai
# saat pengembangan sehingga tidak lagi rahasia:
#
#   - Kredensial Wablas (token & secret key)
#   - App Password Gmail untuk SMTP
#   - Password Postgres
#
# JANGAN:
#   - commit .env.prod ke git (sudah masuk .gitignore)
#   - mengirim nilainya lewat chat/WhatsApp/email
#   - memakai ulang nilai dev seperti "dev-shared-jwt-secret..."
# ---------------------------------------------------------------------
CATATAN
