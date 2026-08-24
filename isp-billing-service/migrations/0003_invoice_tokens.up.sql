-- =====================================================================
-- 0003_invoice_tokens — akses tagihan tanpa login (PRD v3.0)
--
-- Pelanggan tidak lagi punya akun. Setiap invoice memiliki satu token
-- akses unik; tautan bertoken dikirim via WhatsApp/email (US-09).
-- =====================================================================

-- Token akses publik per invoice.
-- UNIQUE(invoice_id): satu invoice = satu token. "Kirim ulang tautan"
-- memperpanjang expires_at token yang sama (keputusan: perpanjang token lama),
-- sehingga tautan di pesan-pesan lama tetap berfungsi.
CREATE TABLE invoice_access_tokens (
  token         UUID         PRIMARY KEY,
  invoice_id    BIGINT       NOT NULL UNIQUE REFERENCES invoices(id) ON DELETE CASCADE,
  expires_at    TIMESTAMPTZ  NOT NULL,
  revoked_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Nomor WhatsApp — kanal notifikasi utama (PRD v3.0 §8).
-- Ditambahkan nullable dulu; dijadikan NOT NULL di migrasi 0004 setelah
-- data lama diisi (pola expand → migrate → contract).
ALTER TABLE customers ADD COLUMN phone VARCHAR(20);

-- Email menjadi opsional: kanal pendamping, bukan identitas login lagi.
-- UNIQUE tetap berlaku; Postgres mengizinkan banyak NULL pada kolom unique.
ALTER TABLE customers ALTER COLUMN email DROP NOT NULL;

-- Catatan: customers.password_hash sengaja dibiarkan (sudah nullable).
-- Kolom itu tidak lagi dipakai dan akan di-drop pada migrasi pembersihan
-- setelah alur login pelanggan benar-benar dihapus dari kode.
