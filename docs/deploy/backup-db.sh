#!/usr/bin/env bash
# =====================================================================
#  Backup database ISP Billing System
#
#  Pemasangan di VPS:
#    sudo cp backup-db.sh /usr/local/bin/isp-backup
#    sudo chmod +x /usr/local/bin/isp-backup
#
#  Jadwalkan harian pukul 02:00 (crontab -e):
#    0 2 * * * /usr/local/bin/isp-backup >> /var/log/isp-backup.log 2>&1
#
#  Memulihkan:
#    gunzip -c isp_billing-2026-08-26.sql.gz | \
#      docker compose --env-file .env.prod -f docker-compose.prod.yml \
#      exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"
# =====================================================================
set -euo pipefail

# Sesuaikan bila lokasi proyek berbeda.
PROJECT_DIR="${PROJECT_DIR:-/opt/billing-system}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/isp-billing}"
RETENSI_HARI="${RETENSI_HARI:-14}"

cd "$PROJECT_DIR"

# Ambil kredensial dari .env.prod tanpa menuliskannya ke log.
# shellcheck disable=SC1091
set -a; source .env.prod; set +a

mkdir -p "$BACKUP_DIR"
STAMP=$(date +%Y-%m-%d_%H%M)
TUJUAN="$BACKUP_DIR/${POSTGRES_DB}-${STAMP}.sql.gz"

echo "[$(date -Is)] mulai backup → $TUJUAN"

# pg_dump dijalankan DI DALAM container agar tidak perlu memasang
# klien Postgres di host, dan versinya selalu cocok dengan servernya.
docker compose --env-file .env.prod -f docker-compose.prod.yml \
  exec -T postgres pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  | gzip > "$TUJUAN"

UKURAN=$(du -h "$TUJUAN" | cut -f1)

# Berkas kosong/terlalu kecil menandakan dump gagal walau exit code 0.
if [ ! -s "$TUJUAN" ] || [ "$(stat -c%s "$TUJUAN")" -lt 1024 ]; then
  echo "[$(date -Is)] GAGAL: hasil backup mencurigakan ($UKURAN)" >&2
  exit 1
fi

echo "[$(date -Is)] selesai — $UKURAN"

# Buang backup lama.
HAPUS=$(find "$BACKUP_DIR" -name "${POSTGRES_DB}-*.sql.gz" -mtime "+$RETENSI_HARI" -print -delete | wc -l)
[ "$HAPUS" -gt 0 ] && echo "[$(date -Is)] $HAPUS backup lama (>$RETENSI_HARI hari) dihapus"

# CATATAN: backup di server yang sama TIDAK melindungi dari kegagalan disk
# maupun server hilang. Salin berkas ini secara berkala ke tempat lain —
# S3/B2, Google Drive, atau sekadar unduh manual ke laptop.
exit 0
