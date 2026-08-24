ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_phone_format;
ALTER TABLE customers ALTER COLUMN phone DROP NOT NULL;
