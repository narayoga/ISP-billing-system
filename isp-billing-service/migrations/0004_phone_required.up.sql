-- =====================================================================
-- 0004_phone_required — kunci nomor WhatsApp menjadi wajib (PRD v3.0 US-08 AC1/AC3)
--
-- Tahap "contract" dari pola expand → migrate → contract:
--   0003  menambah kolom phone (nullable)
--   9.2   mengisi nomor untuk seluruh pelanggan yang ada
--   0004  mengunci kolom menjadi NOT NULL
--
-- Migrasi ini GAGAL bila masih ada pelanggan tanpa phone — itu disengaja,
-- sebagai pengaman agar data tidak diam-diam terisi nilai palsu.
-- =====================================================================

ALTER TABLE customers ALTER COLUMN phone SET NOT NULL;

-- Format internasional tanpa tanda '+' (mis. 628123456789) — dipakai Wablas.
ALTER TABLE customers ADD CONSTRAINT customers_phone_format
  CHECK (phone ~ '^[1-9][0-9]{7,19}$');
