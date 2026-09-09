-- =============================================================
-- SIPANDU — Migrasi skema untuk fitur FASE 2–4 build 2026-09-06
-- Sesuai PRD v3.0.0 (Bab 10, 13, 31, 32, 35, 42).
-- Jalankan via dashboard InsForge / insforge CLI (K2).
-- Idempotent-friendly: gunakan IF NOT EXISTS / ADD COLUMN IF NOT EXISTS.
-- =============================================================

-- 1) Tabel imunisasi (PRD Bab 10, DDL 13.1)
CREATE TABLE IF NOT EXISTS imunisasi (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anggota_id   UUID NOT NULL REFERENCES anggota(id),
  jenis        VARCHAR(50) NOT NULL, -- HB-0, BCG, Polio 1, DPT-HB-Hib 1, ..., MR 2
  tanggal      DATE NOT NULL,
  diberikan_di VARCHAR(100),
  kunjungan_id UUID,
  created_by   UUID,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_imunisasi_anggota ON imunisasi(anggota_id);

-- 2) Tabel catatan_kunjungan (PRD DDL 13.1 — Meja 3 persist)
CREATE TABLE IF NOT EXISTS catatan_kunjungan (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kunjungan_id    UUID NOT NULL REFERENCES kunjungan(id),
  keluhan         TEXT,
  temuan          TEXT,
  catatan_kader   TEXT,
  catatan_bidan   TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_catatan_kunjungan_visit ON catatan_kunjungan(kunjungan_id);

-- 3) Tabel kehamilan (PRD F-03.3)
CREATE TABLE IF NOT EXISTS kehamilan (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anggota_id          UUID NOT NULL REFERENCES anggota(id),
  tanggal_hpht        DATE NOT NULL,
  taksiran_persalinan DATE,
  gravida             INTEGER,
  para                INTEGER,
  abortus             INTEGER,
  status              VARCHAR(10) DEFAULT 'aktif' CHECK (status IN ('aktif','selesai')),
  tanggal_selesai     DATE,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_kehamilan_anggota ON kehamilan(anggota_id);

-- 4) Tabel risiko (PRD F-07, state 35.4)
CREATE TABLE IF NOT EXISTS risiko (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kunjungan_id UUID NOT NULL REFERENCES kunjungan(id),
  anggota_id   UUID NOT NULL REFERENCES anggota(id),
  kode_risiko  VARCHAR(10) NOT NULL,
  deskripsi    TEXT NOT NULL,
  severity     VARCHAR(10) NOT NULL CHECK (severity IN ('info','warning','danger')),
  tindak_lanjut TEXT,
  status       VARCHAR(15) DEFAULT 'aktif' CHECK (status IN ('aktif','ditangani','diabaikan')),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_risiko_anggota ON risiko(anggota_id);
CREATE INDEX IF NOT EXISTS idx_risiko_status ON risiko(status);

-- 5) Tabel notifikasi (PRD F-12)
CREATE TABLE IF NOT EXISTS notifikasi (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID,
  judul        VARCHAR(200) NOT NULL,
  pesan        TEXT NOT NULL,
  tipe         VARCHAR(20) CHECK (tipe IN ('info','warning','danger','success')),
  sudah_dibaca BOOLEAN DEFAULT FALSE,
  link         VARCHAR(500),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 5b) Tabel audit_log (BUG #10: sebelumnya tidak dibuat di migrasi ini sehingga
--     seluruh penulisan/getAuditLogs gagal silent). Kolom selaras dengan pemanggilan
--     dbService.logAudit / getAuditLogs.
CREATE TABLE IF NOT EXISTS audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID,
  aksi        VARCHAR(50) NOT NULL,
  tabel       VARCHAR(50),
  record_id   VARCHAR(100),
  data_lama   JSONB,
  data_baru   JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);

-- 5c) Tabel penyuluhan (PRD Bab 9 F-06, Bab 13.1 lines 1248–1259, Meja 5 Edukasi Kelompok)
CREATE TABLE IF NOT EXISTS penyuluhan (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jadwal_id        UUID NOT NULL REFERENCES jadwal_posyandu(id),
  tema             VARCHAR(200) NOT NULL,
  narasumber       VARCHAR(100) NOT NULL,
  jumlah_peserta   INTEGER NOT NULL,
  metode           VARCHAR(50),
  media            TEXT,
  ringkasan        TEXT,
  created_by       UUID REFERENCES users(id),
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_penyuluhan_jadwal ON penyuluhan(jadwal_id);

-- 6) Kolom tambahan pelayanan (PRD F-06 item bumil/lansia/WUS)
ALTER TABLE pelayanan ADD COLUMN IF NOT EXISTS pmt_jenis          VARCHAR(50);
ALTER TABLE pelayanan ADD COLUMN IF NOT EXISTS imunisasi_tt       BOOLEAN DEFAULT FALSE;
ALTER TABLE pelayanan ADD COLUMN IF NOT EXISTS imunisasi_tt_ke    INTEGER;
ALTER TABLE pelayanan ADD COLUMN IF NOT EXISTS obat_rutin         TEXT;
ALTER TABLE pelayanan ADD COLUMN IF NOT EXISTS skrining_anemia    BOOLEAN DEFAULT FALSE;
ALTER TABLE pelayanan ADD COLUMN IF NOT EXISTS rujukan_alasan     TEXT;

-- 7) Kolom pengukuran (PRD DDL)
ALTER TABLE pengukuran ADD COLUMN IF NOT EXISTS lingkar_perut     DECIMAL(5,1);
ALTER TABLE pengukuran ADD COLUMN IF NOT EXISTS panjang_badan     DECIMAL(5,2);
ALTER TABLE pengukuran ADD COLUMN IF NOT EXISTS tinggi_fundus     DECIMAL(4,1);
ALTER TABLE pengukuran ADD COLUMN IF NOT EXISTS djj               INTEGER;
ALTER TABLE pengukuran ADD COLUMN IF NOT EXISTS usia_saat_ukur    INTEGER;
ALTER TABLE pengukuran ADD COLUMN IF NOT EXISTS imt               DECIMAL(5,2);

-- 8) Kolom anggota (PRD DDL + F-03.3)
ALTER TABLE anggota ADD COLUMN IF NOT EXISTS status_hamil         BOOLEAN DEFAULT FALSE;
ALTER TABLE anggota ADD COLUMN IF NOT EXISTS hpht                 DATE;
ALTER TABLE anggota ADD COLUMN IF NOT EXISTS nomor_telepon        VARCHAR(20);
ALTER TABLE anggota ADD COLUMN IF NOT EXISTS nomor_bpjs           VARCHAR(30);
ALTER TABLE anggota ADD COLUMN IF NOT EXISTS foto                 TEXT;

-- 8b) Tabel users: selaraskan dengan DDL PRD 13.1 (temuan investigasi login admin)
--     Tabel live hanya punya (id, nama_lengkap, peran, posyandu_id, created_at).
--     Tanpa kolom ini, fitur Pengguna (tambah user + aktif/nonaktif, PRD F-11) gagal.
ALTER TABLE users ADD COLUMN IF NOT EXISTS email        VARCHAR(255) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS status_aktif BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at   TIMESTAMPTZ DEFAULT NOW();
-- Backfill email dari auth.users via id (idempotent — hanya isi yang masih NULL)
UPDATE users u
SET email = au.email
FROM auth.users au
WHERE u.id = au.id AND u.email IS NULL;

-- 9) Kunjungan: kolom verifikasi (PRD F-08)
ALTER TABLE kunjungan ADD COLUMN IF NOT EXISTS verifikasi_at      TIMESTAMPTZ;
ALTER TABLE kunjungan ADD COLUMN IF NOT EXISTS waktu_verifikasi   TIMESTAMPTZ;

-- 10) Jadwal: tema sesi (ref legacy posyandu) + enum status lengkap (PRD 35.2). Jika kolom bertipe CHECK lama,
--     jalankan penyesuaian CHECK di dashboard (ALTER DROP/ADD CONSTRAINT).
ALTER TABLE jadwal_posyandu ADD COLUMN IF NOT EXISTS tema VARCHAR(200);
ALTER TABLE jadwal_posyandu ADD COLUMN IF NOT EXISTS catatan TEXT;

-- 11) Integrasi SINDUKSADATI (PRD 42.5 — nama kolom PRD)
ALTER TABLE anggota ADD COLUMN IF NOT EXISTS sinduksadati_penduduk_id UUID;
ALTER TABLE anggota ADD COLUMN IF NOT EXISTS sinduksadati_sync_at     TIMESTAMPTZ;
ALTER TABLE keluarga ADD COLUMN IF NOT EXISTS sinduksadati_keluarga_id UUID;
CREATE UNIQUE INDEX IF NOT EXISTS idx_anggota_sinduksadati_id
  ON anggota(sinduksadati_penduduk_id) WHERE sinduksadati_penduduk_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_keluarga_sinduksadati_id
  ON keluarga(sinduksadati_keluarga_id) WHERE sinduksadati_keluarga_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS sinduksadati_event_log (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type                VARCHAR(30) NOT NULL,
  sinduksadati_penduduk_id  UUID NOT NULL,
  anggota_id                UUID REFERENCES anggota(id),
  payload                   JSONB NOT NULL,
  status                    VARCHAR(15) NOT NULL DEFAULT 'received',
  error_message             TEXT,
  processed_at              TIMESTAMPTZ,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sdti_log_status     ON sinduksadati_event_log(status);
CREATE INDEX IF NOT EXISTS idx_sdti_log_event_type ON sinduksadati_event_log(event_type);
CREATE INDEX IF NOT EXISTS idx_sdti_log_created    ON sinduksadati_event_log(created_at DESC);

-- =============================================================
-- CATATAN:
-- - Status 'bumil' lama sudah dinormalisasi app-side ke 'ibu_hamil'
--   (data-store normalizeKategoriList). Untuk kebersihan data:
--   UPDATE anggota SET kategori='ibu_hamil' WHERE kategori='bumil';
-- - RLS Bab 13.3 belum terverifikasi aktif di production — cek via
--   insforge-debug skill / dashboard sebelum go-live (M3).
-- =============================================================
