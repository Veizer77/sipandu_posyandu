-- =============================================================
-- SIPANDU — Idempotensi Check-in Meja 1
-- Satu kunjungan per (jadwal_posyandu_id, anggota_id)
-- Mencegah duplikat lintas sesi dan race condition saat check-in.
-- =============================================================

-- 1) Singkirkan duplikat yang mungkin sudah ada sebelum menambah constraint unik
DELETE FROM kunjungan k
WHERE k.id NOT IN (
  SELECT DISTINCT ON (jadwal_posyandu_id, anggota_id) id
  FROM kunjungan
  ORDER BY jadwal_posyandu_id, anggota_id, created_at DESC
);

-- 2) Constraint unik: satu kehadiran per anggota per sesi posyandu
ALTER TABLE kunjungan DROP CONSTRAINT IF EXISTS kunjungan_sesi_anggota_unique;
ALTER TABLE kunjungan ADD CONSTRAINT kunjungan_sesi_anggota_unique
  UNIQUE (jadwal_posyandu_id, anggota_id);

-- 3) Index pendukung untuk lookup cepat per sesi
CREATE INDEX IF NOT EXISTS idx_kunjungan_sesi_anggota
  ON kunjungan (jadwal_posyandu_id, anggota_id);
