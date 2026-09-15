-- =============================================================
-- SIPANDU — Perbaikan audit MEJA-4 (M4-006, M4-007, M4-008, M4-019, M4-023)
-- Idempotent: aman dijalankan berulang via dashboard InsForge / CLI.
--
-- Konteks live DB (2026-09-12): pelayanan berisi 119 baris untuk 12
-- kunjungan (107 duplikat). maybeSingle() gagal pada data duplikat,
-- setiap save INSERT baris baru. Tabel imunisasi bersih (tanpa duplikat).
-- =============================================================

-- M4-019: kolom updated_at sebagai versi concurrency pelayanan.
ALTER TABLE pelayanan ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

DROP TRIGGER IF EXISTS trg_pelayanan_updated_at ON pelayanan;
CREATE TRIGGER trg_pelayanan_updated_at
  BEFORE UPDATE ON pelayanan
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_now();

-- M4-008: singkirkan duplikat (simpan 1 terbaru per kunjungan),
-- lalu kunci dengan unique constraint.
DELETE FROM pelayanan s
WHERE s.id NOT IN (
  SELECT DISTINCT ON (kunjungan_id) id
  FROM pelayanan
  ORDER BY kunjungan_id, created_at DESC NULLS LAST, id DESC
);

ALTER TABLE pelayanan DROP CONSTRAINT IF EXISTS pelayanan_kunjungan_unique;
ALTER TABLE pelayanan ADD CONSTRAINT pelayanan_kunjungan_unique
  UNIQUE (kunjungan_id);
CREATE INDEX IF NOT EXISTS idx_pelayanan_kunjungan
  ON pelayanan (kunjungan_id);

-- M4-007: satu imunisasi per (anggota, jenis, tanggal).
DELETE FROM imunisasi i
WHERE i.id NOT IN (
  SELECT DISTINCT ON (anggota_id, jenis, tanggal) id
  FROM imunisasi
  ORDER BY anggota_id, jenis, tanggal, created_at DESC NULLS LAST, id DESC
);

ALTER TABLE imunisasi DROP CONSTRAINT IF EXISTS imunisasi_anggota_jenis_tanggal_unique;
ALTER TABLE imunisasi ADD CONSTRAINT imunisasi_anggota_jenis_tanggal_unique
  UNIQUE (anggota_id, jenis, tanggal);
CREATE INDEX IF NOT EXISTS idx_imunisasi_anggota_jenis
  ON imunisasi (anggota_id, jenis, tanggal);

-- M4-006/M4-021: transaksi atomik pelayanan (upsert pelayanan + insert
-- imunisasi idempoten + transisi maju-saja ke selesai) dalam SATU transaksi.
-- Dipanggil app via SDK .rpc('simpan_pelayanan').
-- Guard data-level di dalam fungsi. Permission tindakan medis (imunisasi hanya
-- Bidan/Admin) ditegakkan di layer aplikasi (UI/store/service) karena koneksi
-- memakai anon key.
CREATE OR REPLACE FUNCTION public.simpan_pelayanan(
  p_kunjungan_id uuid,
  p_anggota_id uuid,
  p_payload jsonb,
  p_imunisasi_jenis text[] DEFAULT '{}',
  p_tanggal date DEFAULT CURRENT_DATE,
  p_expected_updated_at timestamptz DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE
  v_visit kunjungan%ROWTYPE;
  v_jadwal jadwal_posyandu%ROWTYPE;
  v_has_existing boolean;
  v_existing_updated_at timestamptz;
  v_action text;
  v_row pelayanan%ROWTYPE;
  v_imunisasi_count integer := 0;
  v_jenis text;
BEGIN
  -- Kunci baris kunjungan: penulis bersamaan pada visit yang sama antre.
  SELECT * INTO v_visit FROM kunjungan WHERE id = p_kunjungan_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'code', 404, 'message', 'Kunjungan tidak ditemukan di database.');
  END IF;

  IF v_visit.anggota_id IS DISTINCT FROM p_anggota_id THEN
    RETURN jsonb_build_object('ok', false, 'code', 403, 'message', 'Kunjungan bukan milik peserta ini; mutasi ditolak.');
  END IF;

  IF v_visit.status_alur = 'selesai' THEN
    RETURN jsonb_build_object('ok', false, 'code', 409, 'message', 'Kunjungan sudah selesai; pelayanan ditolak.');
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

  -- Validasi minimal di level DB (validasi penuh di aplikasi).
  IF COALESCE((p_payload->>'rujukan')::boolean, false) THEN
    IF NULLIF(BTRIM(COALESCE(p_payload->>'tujuan_rujukan', '')), '') IS NULL
       OR NULLIF(BTRIM(COALESCE(p_payload->>'alasan_rujukan', '')), '') IS NULL THEN
      RETURN jsonb_build_object('ok', false, 'code', 422,
        'message', 'Rujukan wajib mencantumkan tujuan dan alasan.');
    END IF;
  END IF;

  -- M4-019: optimistic concurrency.
  SELECT true, updated_at INTO v_has_existing, v_existing_updated_at
    FROM pelayanan WHERE kunjungan_id = p_kunjungan_id;
  IF p_expected_updated_at IS NOT NULL AND v_has_existing THEN
    IF v_existing_updated_at IS DISTINCT FROM p_expected_updated_at THEN
      RETURN jsonb_build_object('ok', false, 'code', 409, 'conflict', true,
        'message', 'Pelayanan berubah oleh petugas lain. Muat ulang sebelum menyimpan.',
        'server_updated_at', v_existing_updated_at);
    END IF;
  END IF;

  -- Upsert pelayanan atomik.
  INSERT INTO pelayanan (
    kunjungan_id, vitamin_a, pmt, pmt_jenis,
    imunisasi, imunisasi_jenis, tablet_fe,
    imunisasi_tt, imunisasi_tt_ke,
    rujukan, rujukan_tujuan, rujukan_alasan, rujukan_catatan,
    konseling, konseling_catatan, obat_rutin, skrining_anemia
  ) VALUES (
    p_kunjungan_id,
    COALESCE((p_payload->>'vitamin_a')::boolean, false),
    COALESCE((p_payload->>'pmt')::boolean, false),
    NULLIF(p_payload->>'pmt_jenis', ''),
    COALESCE((p_payload->>'imunisasi')::boolean, false),
    NULLIF(p_payload->>'imunisasi_jenis', ''),
    COALESCE((p_payload->>'tablet_fe')::boolean, false),
    COALESCE((p_payload->>'imunisasi_tt')::boolean, false),
    NULLIF(p_payload->>'imunisasi_tt_ke', '')::integer,
    COALESCE((p_payload->>'rujukan')::boolean, false),
    NULLIF(BTRIM(COALESCE(p_payload->>'tujuan_rujukan', '')), ''),
    NULLIF(BTRIM(COALESCE(p_payload->>'alasan_rujukan', '')), ''),
    NULLIF(BTRIM(COALESCE(p_payload->>'alasan_rujukan', '')), ''),
    COALESCE((p_payload->>'konseling')::boolean, false),
    NULLIF(p_payload->>'konseling_catatan', ''),
    NULLIF(BTRIM(COALESCE(p_payload->>'obat_rutin', '')), ''),
    COALESCE((p_payload->>'skrining_anemia')::boolean, false)
  )
  ON CONFLICT (kunjungan_id) DO UPDATE SET
    vitamin_a = EXCLUDED.vitamin_a,
    pmt = EXCLUDED.pmt,
    pmt_jenis = EXCLUDED.pmt_jenis,
    imunisasi = EXCLUDED.imunisasi,
    imunisasi_jenis = EXCLUDED.imunisasi_jenis,
    tablet_fe = EXCLUDED.tablet_fe,
    imunisasi_tt = EXCLUDED.imunisasi_tt,
    imunisasi_tt_ke = EXCLUDED.imunisasi_tt_ke,
    rujukan = EXCLUDED.rujukan,
    rujukan_tujuan = EXCLUDED.rujukan_tujuan,
    rujukan_alasan = EXCLUDED.rujukan_alasan,
    rujukan_catatan = EXCLUDED.rujukan_catatan,
    konseling = EXCLUDED.konseling,
    konseling_catatan = EXCLUDED.konseling_catatan,
    obat_rutin = EXCLUDED.obat_rutin,
    skrining_anemia = EXCLUDED.skrining_anemia,
    updated_at = NOW()
  RETURNING * INTO v_row;

  v_action := CASE WHEN v_has_existing THEN 'updated' ELSE 'created' END;

  -- M4-007: insert imunisasi idempoten (duplikat diabaikan via constraint).
  IF p_imunisasi_jenis IS NOT NULL THEN
    FOREACH v_jenis IN ARRAY p_imunisasi_jenis LOOP
      IF NULLIF(BTRIM(v_jenis), '') IS NOT NULL THEN
        INSERT INTO imunisasi (anggota_id, jenis, tanggal, kunjungan_id)
        VALUES (v_visit.anggota_id, BTRIM(v_jenis), p_tanggal, p_kunjungan_id)
        ON CONFLICT (anggota_id, jenis, tanggal) DO NOTHING;
        IF FOUND THEN
          v_imunisasi_count := v_imunisasi_count + 1;
        END IF;
      END IF;
    END LOOP;
  END IF;

  -- M4-021/M4-023: status selesai HANYA setelah semua mutation di atas sukses,
  -- dan hanya maju dari tahap yang valid (tidak pernah regresi).
  UPDATE kunjungan SET status_alur = CASE
    WHEN status_alur IN ('meja_1_registrasi', 'meja_2_pengukuran', 'meja_3_pencatatan', 'meja_4_pelayanan')
      THEN 'selesai'::status_alur_enum
    ELSE status_alur
  END WHERE id = p_kunjungan_id;

  RETURN jsonb_build_object('ok', true, 'action', v_action, 'id', v_row.id,
    'updated_at', v_row.updated_at, 'imunisasi_disimpan', v_imunisasi_count);
END $$;

GRANT EXECUTE ON FUNCTION public.simpan_pelayanan(uuid, uuid, jsonb, text[], date, timestamptz) TO PUBLIC;
