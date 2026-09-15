-- =============================================================
-- SIPANDU — Perbaikan audit REKAP (RK-015)
-- Rencana tindak lanjut kunjungan rumah (Kemenkes mewajibkan untuk balita &
-- ibu hamil mangkir) sebelumnya hanya local state + toast palsu ("Agenda
-- Kader ILP" tidak ada; hilang saat refresh). Kini dipersist ke DB dengan
-- status Terjadwal -> Selesai/Dibatalkan, terlihat lintas sesi.
-- Idempotent: aman dijalankan berulang.
-- =============================================================

CREATE TABLE IF NOT EXISTS rencana_kunjungan_rumah (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anggota_id          UUID NOT NULL REFERENCES anggota(id) ON DELETE CASCADE,
  jadwal_posyandu_id  UUID REFERENCES jadwal_posyandu(id) ON DELETE SET NULL,
  alasan              TEXT,
  status              VARCHAR(15) NOT NULL DEFAULT 'terjadwal'
                      CHECK (status IN ('terjadwal', 'selesai', 'dibatalkan')),
  created_by          UUID,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_rencana_kr_updated_at ON rencana_kunjungan_rumah;
CREATE TRIGGER trg_rencana_kr_updated_at
  BEFORE UPDATE ON rencana_kunjungan_rumah
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_now();

CREATE INDEX IF NOT EXISTS idx_rencana_kr_anggota
  ON rencana_kunjungan_rumah (anggota_id);
CREATE INDEX IF NOT EXISTS idx_rencana_kr_status
  ON rencana_kunjungan_rumah (status);

-- Idempotensi: satu rencana aktif per anggota (jadwal ulang setelah
-- selesai/batal boleh dibuat lagi).
DROP INDEX IF EXISTS idx_rencana_kr_aktif_unique;
CREATE UNIQUE INDEX idx_rencana_kr_aktif_unique
  ON rencana_kunjungan_rumah (anggota_id) WHERE status = 'terjadwal';
