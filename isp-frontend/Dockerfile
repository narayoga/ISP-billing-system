# syntax=docker/dockerfile:1
# =====================================================================
# isp-frontend — React + Vite, disajikan sebagai file statis oleh nginx
#
# PENTING: variabel VITE_* di-"bake" ke dalam bundle saat BUILD, bukan dibaca
# saat container jalan. Karena itu nilainya dikirim sebagai build args:
#
#   docker build \
#     --build-arg VITE_API_BASE_URL=https://api.domain.com \
#     --build-arg VITE_BILLING_BASE_URL=https://billing.domain.com \
#     -t isp-frontend .
#
# Ganti URL → harus build ulang image (bukan sekadar restart container).
# =====================================================================

# --- Stage 1: build bundle
FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_API_BASE_URL=http://localhost:8080
ARG VITE_BILLING_BASE_URL=http://localhost:8081
ARG VITE_BANK_NAME=BCA
ARG VITE_BANK_ACCOUNT=5440281
ARG VITE_BANK_HOLDER=JITU
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_BILLING_BASE_URL=$VITE_BILLING_BASE_URL \
    VITE_BANK_NAME=$VITE_BANK_NAME \
    VITE_BANK_ACCOUNT=$VITE_BANK_ACCOUNT \
    VITE_BANK_HOLDER=$VITE_BANK_HOLDER

RUN npm run build

# --- Stage 2: nginx serve
FROM nginx:1.27-alpine AS runner
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/healthz >/dev/null || exit 1
