# syntax=docker/dockerfile:1
# =====================================================================
# isp-billing-service — Go (billing engine, cron, Mikrotik, webhook)
#
# Menghasilkan 3 binary: billing (server), migrate (skema DB), seed-admin.
# Image akhir berbasis alpine + tzdata — WAJIB, karena cron tanggal 1/17/20/24
# memakai time.Local; tanpa tzdata semua jadwal akan jalan di UTC.
# =====================================================================

# --- Stage 1: build
FROM golang:1.26-alpine AS builder
WORKDIR /src

# Layer dependency terpisah → cache tetap valid selama go.mod/go.sum tak berubah.
COPY go.mod go.sum ./
RUN go mod download

COPY cmd ./cmd
COPY internal ./internal

# Static binary (CGO off) agar bisa jalan di image minimal.
ENV CGO_ENABLED=0 GOOS=linux
RUN go build -trimpath -ldflags="-s -w" -o /out/billing    ./cmd/billing \
 && go build -trimpath -ldflags="-s -w" -o /out/migrate    ./cmd/migrate \
 && go build -trimpath -ldflags="-s -w" -o /out/seed-admin ./cmd/seed-admin

# --- Stage 2: runtime
FROM alpine:3.20 AS runner
WORKDIR /app
RUN apk add --no-cache ca-certificates tzdata wget \
 && adduser -D -u 1000 app
ENV TZ=Asia/Jakarta

COPY --from=builder /out/billing    /usr/local/bin/billing
COPY --from=builder /out/migrate    /usr/local/bin/migrate
COPY --from=builder /out/seed-admin /usr/local/bin/seed-admin
# Migrasi dibutuhkan saat menjalankan: docker compose run --rm billing migrate up
COPY migrations ./migrations

USER app
EXPOSE 8081

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8081/healthz >/dev/null || exit 1

CMD ["billing"]
