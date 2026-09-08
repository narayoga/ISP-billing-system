-- =====================================================================
-- 0005_custom_price — harga per pelanggan untuk paket bertarif negosiasi
--
-- Paket korporat (mis. "JituNet Bussiness") tidak punya satu harga tetap:
-- tarifnya disepakati per pelanggan. Dua kolom baru:
--
--   packages.is_custom_price  → paket ini ditagih dengan harga per pelanggan
--   customers.custom_price    → harga yang disepakati untuk pelanggan tsb
--
-- Nominal tagihan = COALESCE(customers.custom_price, packages.price), jadi
-- pelanggan paket biasa tetap memakai harga paket seperti sebelumnya.
-- Keterkaitan antara kedua kolom (custom_price wajib bila paketnya
-- is_custom_price) dijaga di lapisan aplikasi — CHECK lintas tabel tidak
-- tersedia di Postgres.
-- =====================================================================

ALTER TABLE packages  ADD COLUMN is_custom_price BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE customers ADD COLUMN custom_price    BIGINT CHECK (custom_price >= 0);

-- Data yang sudah ada: paket bisnis dibuat dengan harga 0 sebagai penanda
-- "harga menyusul". Tandai sebagai paket bertarif custom agar admin tidak
-- perlu menyetelnya manual setelah deploy.
UPDATE packages
SET is_custom_price = TRUE, updated_at = NOW()
WHERE name ILIKE '%business%' OR name ILIKE '%bussiness%';
