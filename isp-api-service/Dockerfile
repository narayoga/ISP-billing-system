# syntax=docker/dockerfile:1
# =====================================================================
# isp-api-service — Node 22 + Express (TypeScript)
#
# Multi-stage: dependency di-install terpisah dari source agar layer cache
# tetap valid selama package.json tidak berubah → rebuild setelah ubah kode
# hanya perlu compile ulang (detik, bukan menit).
# =====================================================================

# --- Stage 1: dependency produksi (butuh toolchain untuk native module bcrypt)
FROM node:22-slim AS deps
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
      python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# --- Stage 2: build TypeScript → dist/
FROM node:22-slim AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
      python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# --- Stage 3: runtime (tanpa toolchain & tanpa devDependencies)
FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV TZ=Asia/Jakarta

# Folder bukti transfer — dipetakan ke Docker volume (PRD US-02 AC3).
ENV UPLOAD_DIR=/var/lib/isp/uploads
RUN mkdir -p /var/lib/isp/uploads && chown -R node:node /var/lib/isp

COPY --from=deps    /app/node_modules ./node_modules
COPY --from=builder /app/dist         ./dist
COPY package.json ./

USER node
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:8080/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/index.js"]
