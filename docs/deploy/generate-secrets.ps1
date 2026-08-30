# =====================================================================
#  Pembuat secret produksi — ISP Billing System (versi PowerShell)
#
#  Jalankan DI MESIN ANDA, lalu salin keluarannya ke .env.prod.
#  Nilai yang dihasilkan jangan dikirim lewat chat, email, atau WhatsApp.
#  Simpan di pengelola kata sandi.
#
#    powershell -ExecutionPolicy Bypass -File docs\deploy\generate-secrets.ps1
#
#  Versi Bash tersedia di berkas generate-secrets.sh (untuk Linux/Git Bash).
# =====================================================================

# Memakai RNG kriptografis, bukan Get-Random (yang tidak aman untuk secret).
function New-Acak {
    param([int]$Byte = 48)
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $buf = New-Object byte[] $Byte
    $rng.GetBytes($buf)
    ([System.BitConverter]::ToString($buf) -replace '-', '').ToLower()
}

function New-Sandi {
    param([int]$Panjang = 32)
    # Hanya alfanumerik agar aman dipakai di URL koneksi Postgres —
    # karakter seperti @ : / # akan merusak string koneksi.
    $huruf = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $buf = New-Object byte[] $Panjang
    $rng.GetBytes($buf)
    -join ($buf | ForEach-Object { $huruf[$_ % $huruf.Length] })
}

$tanggal = Get-Date -Format 'yyyy-MM-ddTHH:mm:sszzz'

Write-Output @"
# =====================================================================
# Salin blok di bawah ke .env.prod, ganti nilai yang sudah ada.
# Dibuat: $tanggal
# =====================================================================

# --- Secret aplikasi ---
# JWT_SECRET dan INTERNAL_SECRET harus SAMA di service api dan billing.
JWT_SECRET=$(New-Acak)
INTERNAL_SECRET=$(New-Acak)

# Dipakai router Mikrotik pada header X-Webhook-Secret.
# Nilai yang sama harus dituliskan ke setup.rsc.
WEBHOOK_SECRET=$(New-Acak)

# --- Database ---
POSTGRES_PASSWORD=$(New-Sandi)

# --- Admin pertama ---
# Ganti sendiri setelah login pertama.
SEED_ADMIN_PASSWORD=$(New-Sandi)

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
# WAJIB DIROTASI sebelum produksi — nilai lama sudah pernah dipakai saat
# pengembangan sehingga tidak lagi rahasia:
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
"@
