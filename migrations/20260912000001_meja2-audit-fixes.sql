-- =============================================================
-- SIPANDU — Perbaikan audit MEJA-2 (M2-006, M2-010, M2-027)
-- Idempotent: aman dijalankan berulang via dashboard InsForge / CLI.
-- =============================================================

-- M2-006: satu pengukuran per kunjungan (idempotensi double-submit).
-- Singkirkan duplikat lama dulu (simpan record terbaru per kunjungan).
DELETE FROM pengukuran p
WHERE p.id NOT IN (
  SELECT DISTINCT ON (kunjungan_id) id
  FROM pengukuran
  ORDER BY kunjungan_id, created_at DESC
);

ALTER TABLE pengukuran DROP CONSTRAINT IF EXISTS pengukuran_kunjungan_unique;
ALTER TABLE pengukuran ADD CONSTRAINT pengukuran_kunjungan_unique
  UNIQUE (kunjungan_id);
CREATE INDEX IF NOT EXISTS idx_pengukuran_kunjungan
  ON pengukuran (kunjungan_id);

-- M2-027: kolom catatan Meja 2 (form Umum "Catatan Pemeriksaan").
ALTER TABLE pengukuran ADD COLUMN IF NOT EXISTS catatan TEXT;

-- M2-010: izinkan status_pertumbuhan eksplisit "data_baru" + NULL.
-- Bila kolom memakai CHECK constraint, longgarkan.
DO $$
BEGIN
  ALTER TABLE pengukuran DROP CONSTRAINT IF EXISTS pengukuran_status_pertumbuhan_check;
  ALTER TABLE pengukuran ADD CONSTRAINT pengukuran_status_pertumbuhan_check
    CHECK (status_pertumbuhan IN ('naik', 'tidak_naik', 'turun', 'data_baru'));
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'skip pengukuran_status_pertumbuhan_check: %', SQLERRM;
END $$;

-- Bila kolom memakai tipe ENUM status_pertumbuhan_enum, tambah value yang kurang.
-- (Live DB 2026-09-12: enum hanya berisi naik/tidak_naik; normalizer app juga
--  dapat menghasilkan turun/data_baru.)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_pertumbuhan_enum') THEN
    ALTER TYPE status_pertumbuhan_enum ADD VALUE IF NOT EXISTS 'turun';
    ALTER TYPE status_pertumbuhan_enum ADD VALUE IF NOT EXISTS 'data_baru';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'skip enum status_pertumbuhan: %', SQLERRM;
END $$;

-- Pastikan kolom boleh NULL (tanpa baseline = NULL valid).
DO $$
BEGIN
  ALTER TABLE pengukuran ALTER COLUMN status_pertumbuhan DROP NOT NULL;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'skip drop not null: %', SQLERRM;
END $$;
