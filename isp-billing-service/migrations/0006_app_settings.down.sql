-- =====================================================================
-- 0006_app_settings — pengaturan kecil aplikasi (key → value)
--
-- Tabel umum, agar pengaturan sederhana tidak butuh tabel sendiri-sendiri.
-- Pemakai pertama:
--
--   gmail_token_renewed_at → kapan admin terakhir menekan "Done" pada
--                            pengingat refresh token Gmail API. Selama OAuth
--                            app Google masih mode "Testing", token mati 7 hari
--                            setelah dibuat; banner muncul H-1 (hari ke-6).
--
-- value disimpan sebagai TEXT; pembaca meng-cast sesuai kebutuhan
-- (mis. value::timestamptz).
-- =====================================================================

CREATE TABLE app_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Token yang sedang dipakai dibuat 2026-09-26 sekitar 08.50 WIB.
INSERT INTO app_settings (key, value)
VALUES ('gmail_token_renewed_at', '2026-09-26 01:50:00+00');