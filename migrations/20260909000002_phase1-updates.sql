-- =============================================================
-- SIPANDU — Phase 1 Go-Live Blockers Fixes
-- Normalisasi data dan perbaikan CHECK constraint
-- =============================================================

-- 1) Normalisasi data lama `bumil` menjadi `ibu_hamil`
UPDATE anggota SET kategori = 'ibu_hamil' WHERE kategori = 'bumil';

-- 2) Verifikasi dan perbaiki CHECK constraint jadwal_posyandu.status
--    Sesuai PRD v3.0.0 (draft, aktif, selesai, dibatalkan)
ALTER TABLE jadwal_posyandu DROP CONSTRAINT IF EXISTS jadwal_posyandu_status_check;
ALTER TABLE jadwal_posyandu ADD CONSTRAINT jadwal_posyandu_status_check 
  CHECK (status IN ('draft', 'aktif', 'selesai', 'dibatalkan'));
