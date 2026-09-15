-- =============================================================
-- SIPANDU — Perbaikan audit MEJA-3 (M3-004, M3-005, M3-006, M3-015, M3-019)
-- Idempotent: aman dijalankan berulang via dashboard InsForge / CLI.
--
-- Konteks live DB (2026-09-12): catatan_kunjungan berisi 120 baris untuk
-- 10 kunjungan (110 duplikat). maybeSingle() gagal pada data duplikat,
-- error diabaikan, setiap save INSERT baris baru. Migrasi ini membersihkan
-- dan mengunci satu baris catatan per kunjungan.
-- =============================================================

-- M3-004/M3-015: kolom updated_at sebagai versi concurrency.
ALTER TABLE catatan_kunjungan ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Trigger penjaga updated_at (dibutuhkan M3-015; tanpa ini updated_at usang).
CREATE OR REPLACE FUNCTION public.set_updated_at_now()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_catatan_kunjungan_updated_at ON catatan_kunjungan;
CREATE TRIGGER trg_catatan_kunjungan_updated_at
  BEFORE UPDATE ON catatan_kunjungan
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_now();

-- M3-004/M3-019: singkirkan duplikat (simpan 1 terbaru per kunjungan),
-- lalu kunci dengan unique constraint.
DELETE FROM catatan_kunjungan c
WHERE c.id NOT IN (
  SELECT DISTINCT ON (kunjungan_id) id
  FROM catatan_kunjungan
  ORDER BY kunjungan_id, updated_at DESC NULLS LAST, created_at DESC NULLS LAST, id DESC
);

ALTER TABLE catatan_kunjungan DROP CONSTRAINT IF EXISTS catatan_kunjungan_visit_unique;
ALTER TABLE catatan_kunjungan ADD CONSTRAINT catatan_kunjungan_visit_unique
  UNIQUE (kunjungan_id);
CREATE INDEX IF NOT EXISTS idx_catatan_kunjungan_visit
  ON catatan_kunjungan (kunjungan_id);

-- M3-006: transaksi atomik pencatatan (upsert catatan + transisi status alur
-- dalam SATU transaksi DB). Dipanggil app via SDK .rpc('simpan_pencatatan').
-- Guard data-level di dalam fungsi (visit ada, sesi aktif, belum selesai /
-- terkunci, sudah diukur). Role (mis. catatan_bidan hanya Bidan) ditegakkan
-- di layer aplikasi (UI/store/service) karena koneksi memakai anon key.
CREATE OR REPLACE FUNCTION public.simpan_pencatatan(
  p_kunjungan_id uuid,
  p_keluhan text,
  p_temuan text,
  p_catatan_kader text,
  p_catatan_bidan text,
  p_expected_updated_at timestamptz DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE
  v_visit kunjungan%ROWTYPE;
  v_jadwal jadwal_posyandu%ROWTYPE;
  v_has_existing boolean;
  v_existing_updated_at timestamptz;
  v_action text;
  v_row catatan_kunjungan%ROWTYPE;
BEGIN
  -- Kunci baris kunjungan: penulis bersamaan pada visit yang sama antre (M3-005).
  SELECT * INTO v_visit FROM kunjungan WHERE id = p_kunjungan_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'code', 404, 'message', 'Kunjungan tidak ditemukan di database.');
  END IF;

  IF v_visit.status_alur = 'selesai' THEN
    RETURN jsonb_build_object('ok', false, 'code', 409, 'message', 'Kunjungan sudah selesai; pencatatan ditolak.');
  END IF;

  IF v_visit.status_verifikasi = 'valid' THEN
    RETURN jsonb_build_object('ok', false, 'code', 423, 'message', 'Kunjungan sudah tervalidasi Bidan dan terkunci.');
  END IF;

  IF v_visit.jadwal_posyandu_id IS NOT NULL THEN
    SELECT * INTO v_jadwal FROM jadwal_posyandu WHERE id = v_visit.jadwal_posyandu_id;
    IF NOT FOUND THEN
      RETURN jsonb_build_object('ok', false, 'code', 410, 'message', 'Sesi posyandu kunjungan ini tidak valid.');
    ELSIF v_jadwal.status IS DISTINCT FROM 'aktif' THEN
      RETURN jsonb_build_object('ok', false, 'code', 409, 'message',
        'Sesi posyandu berstatus "' || v_jadwal.status || '"; mutasi hanya pada sesi aktif.');
    END IF;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pengukuran WHERE kunjungan_id = p_kunjungan_id) THEN
    RETURN jsonb_build_object('ok', false, 'code', 422,
      'message', 'Pengukuran Meja 2 belum tercatat untuk kunjungan ini. Selesaikan Meja 2 dulu.');
  END IF;

  -- M3-015: optimistic concurrency — tolak overwrite bila server berubah.
  SELECT true, updated_at INTO v_has_existing, v_existing_updated_at
    FROM catatan_kunjungan WHERE kunjungan_id = p_kunjungan_id;
  IF p_expected_updated_at IS NOT NULL AND v_has_existing THEN
    IF v_existing_updated_at IS DISTINCT FROM p_expected_updated_at THEN
      RETURN jsonb_build_object('ok', false, 'code', 409, 'conflict', true,
        'message', 'Catatan berubah oleh petugas lain. Muat ulang sebelum menyimpan.',
        'server_updated_at', v_existing_updated_at);
    END IF;
  END IF;

  -- Upsert atomik (unique constraint menjamin satu baris per visit).
  INSERT INTO catatan_kunjungan (kunjungan_id, keluhan, temuan, catatan_kader, catatan_bidan)
  VALUES (p_kunjungan_id, p_keluhan, p_temuan, p_catatan_kader, p_catatan_bidan)
  ON CONFLICT (kunjungan_id) DO UPDATE SET
    keluhan = EXCLUDED.keluhan,
    temuan = EXCLUDED.temuan,
    catatan_kader = EXCLUDED.catatan_kader,
    catatan_bidan = EXCLUDED.catatan_bidan,
    updated_at = NOW()
  RETURNING * INTO v_row;

  v_action := CASE WHEN v_has_existing THEN 'updated' ELSE 'created' END;

  -- M3-020: maju hanya ke depan; jangan regresikan status yang sudah lewat.
  UPDATE kunjungan SET status_alur = CASE
    WHEN status_alur IN ('meja_1_registrasi', 'meja_2_pengukuran', 'meja_3_pencatatan')
      THEN 'meja_4_pelayanan'::status_alur_enum
    ELSE status_alur
  END WHERE id = p_kunjungan_id;

  RETURN jsonb_build_object('ok', true, 'action', v_action, 'id', v_row.id,
    'updated_at', v_row.updated_at);
END $$;

-- Pastikan dapat dipanggil via PostgREST RPC oleh anon key (RLS nonaktif;
-- guard ada di dalam fungsi + layer aplikasi).
GRANT EXECUTE ON FUNCTION public.simpan_pencatatan(uuid, text, text, text, text, timestamptz) TO PUBLIC;
