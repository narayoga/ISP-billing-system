-- =====================================================================
-- 0002_network_jobs — antrian operasi jaringan yang gagal (PRD §10)
--
-- Saat Mikrotik tidak terjangkau, operasi isolir/reaktivasi disimpan di sini
-- lalu dicoba ulang berkala oleh worker sampai berhasil atau menyerah
-- (status 'failed' → alert ke admin).
-- =====================================================================

CREATE TABLE network_jobs (
  id            BIGSERIAL PRIMARY KEY,
  customer_id   BIGINT       NOT NULL REFERENCES customers(id),
  action        VARCHAR(20)  NOT NULL CHECK (action IN ('isolate','reactivate')),
  status        VARCHAR(20)  NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','done','failed')),
  attempts      INT          NOT NULL DEFAULT 0,
  last_error    TEXT,
  next_retry_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Satu job pending per (customer, action) — hindari antrian menumpuk duplikat.
CREATE UNIQUE INDEX idx_network_jobs_unique_pending
  ON network_jobs (customer_id, action)
  WHERE status = 'pending';

CREATE INDEX idx_network_jobs_due ON network_jobs (next_retry_at)
  WHERE status = 'pending';
