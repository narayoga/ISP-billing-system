-- =====================================================================
-- 0001_init — skema awal MVP ISP
-- =====================================================================

CREATE TABLE packages (
  id              BIGSERIAL PRIMARY KEY,
  name            VARCHAR(100)   NOT NULL,
  price           BIGINT         NOT NULL CHECK (price >= 0),
  speed_mbps      INT            NOT NULL CHECK (speed_mbps > 0),
  quota_gb        INT,
  fup_mbps        INT,
  is_active       BOOLEAN        NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE TABLE admin_users (
  id              BIGSERIAL PRIMARY KEY,
  email           VARCHAR(255)   NOT NULL UNIQUE,
  password_hash   VARCHAR(255)   NOT NULL,
  name            VARCHAR(150)   NOT NULL,
  role            VARCHAR(20)    NOT NULL CHECK (role IN ('superadmin','cs')),
  is_active       BOOLEAN        NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE TABLE customers (
  id              BIGSERIAL PRIMARY KEY,
  name            VARCHAR(150)   NOT NULL,
  email           VARCHAR(255)   NOT NULL UNIQUE,
  password_hash   VARCHAR(255),
  address         TEXT           NOT NULL,
  package_id      BIGINT         NOT NULL REFERENCES packages(id),
  pppoe_username  VARCHAR(100)   NOT NULL UNIQUE,
  ip_address      VARCHAR(45),
  mac_address     VARCHAR(17),
  status          VARCHAR(30)    NOT NULL DEFAULT 'pending_provisioning'
                  CHECK (status IN ('pending_provisioning','active','overdue','isolated','inactive')),
  created_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_customers_status ON customers(status);

CREATE TABLE invoices (
  id              BIGSERIAL PRIMARY KEY,
  customer_id     BIGINT         NOT NULL REFERENCES customers(id),
  period          CHAR(7)        NOT NULL, -- YYYY-MM
  amount          BIGINT         NOT NULL CHECK (amount >= 0),
  due_date        DATE           NOT NULL,
  status          VARCHAR(30)    NOT NULL DEFAULT 'unpaid'
                  CHECK (status IN ('unpaid','awaiting_verification','paid','overdue')),
  created_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  UNIQUE(customer_id, period)
);
CREATE INDEX idx_invoices_status   ON invoices(status);
CREATE INDEX idx_invoices_customer ON invoices(customer_id);

CREATE TABLE payments (
  id              BIGSERIAL PRIMARY KEY,
  invoice_id      BIGINT         NOT NULL REFERENCES invoices(id),
  proof_path      VARCHAR(500)   NOT NULL,
  uploaded_at     TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  status          VARCHAR(20)    NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','approved','rejected')),
  verified_by     BIGINT         REFERENCES admin_users(id),
  verified_at     TIMESTAMPTZ,
  reject_reason   TEXT
);
CREATE INDEX idx_payments_invoice ON payments(invoice_id);
CREATE INDEX idx_payments_status  ON payments(status);

CREATE TABLE network_status (
  customer_id     BIGINT PRIMARY KEY REFERENCES customers(id),
  state           VARCHAR(20)    NOT NULL CHECK (state IN ('online','offline','unknown')),
  observed_at     TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE TABLE password_reset_tokens (
  token           UUID PRIMARY KEY,
  customer_id     BIGINT         NOT NULL REFERENCES customers(id),
  expires_at      TIMESTAMPTZ    NOT NULL,
  used_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_reset_tokens_customer ON password_reset_tokens(customer_id);

CREATE TABLE audit_log (
  id              BIGSERIAL PRIMARY KEY,
  admin_id        BIGINT         REFERENCES admin_users(id),
  action          VARCHAR(100)   NOT NULL,
  entity_type     VARCHAR(50),
  entity_id       BIGINT,
  payload         JSONB,
  created_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_audit_admin   ON audit_log(admin_id);
CREATE INDEX idx_audit_created ON audit_log(created_at DESC);
