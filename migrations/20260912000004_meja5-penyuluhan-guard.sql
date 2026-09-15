-- =============================================================
-- SIPANDU — Perbaikan audit MEJA-5 (M5-007) + aktivasi status meja_5 (M5-018)
-- Idempotent: aman dijalankan berulang via dashboard InsForge / CLI.
--
-- Konteks live DB (2026-09-12): tabel penyuluhan TIDAK memiliki kolom
-- metode/media/ringkasan/jadwal_id (hanya id, jadwal_posyandu_id, tema,
-- narasumber, jumlah_peserta, catatan, created_at, jadwal_id). Insert aplikasi
-- selalu gagal -> error ditelan -> toast sukses palsu; tabel berisi 0 baris.
-- Migrasi ini menyelaraskan skema dengan kebutuhan aplikasi.
-- =============================================================

-- M5: kolom yang dipakai aplikasi (canonical FK tetap jadwal_posyandu_id).
ALTER TABLE penyuluhan ADD COLUMN IF NOT EXISTS metode   VARCHAR(100);
ALTER TABLE penyuluhan ADD COLUMN IF NOT EXISTS media    TEXT;
ALTER TABLE penyuluhan ADD COLUMN IF NOT EXISTS ringkasan TEXT;
ALTER TABLE penyuluhan ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

DROP TRIGGER IF EXISTS trg_penyuluhan_updated_at ON penyuluhan;
CREATE TRIGGER trg_penyuluhan_updated_at
  BEFORE UPDATE ON penyuluhan
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_now();

-- M5-007: idempotensi — satu tema per sesi (double submit/tab = satu baris).
DELETE FROM penyuluhan p
WHERE p.id NOT IN (
  SELECT DISTINCT ON (jadwal_posyandu_id, tema) id
  FROM penyuluhan
  ORDER BY jadwal_posyandu_id, tema, created_at DESC NULLS LAST, id DESC
);

ALTER TABLE penyuluhan DROP CONSTRAINT IF EXISTS penyuluhan_sesi_tema_unique;
ALTER TABLE penyuluhan ADD CONSTRAINT penyuluhan_sesi_tema_unique
  UNIQUE (jadwal_posyandu_id, tema);
CREATE INDEX IF NOT EXISTS idx_penyuluhan_sesi_tema
  ON penyuluhan (jadwal_posyandu_id, tema);

-- M5-018: aktifkan status meja_5_penyuluhan sebagaimana fungsinya.
-- Model alur per-visit: meja_1 -> meja_2 -> meja_3 -> meja_4 -> MEJA_5
-- (menunggu/mengikuti penyuluhan kelompok) -> SELESAI (saat sesi ditutup).
-- Meja 4 selesai klinis -> 'meja_5_penyuluhan' (jendela koreksi selama sesi
-- terbuka); penutupan sesi memfinalkan ke 'selesai'. Versi baru fungsi
-- simpan_pelayanan (ganti versi M4 yang terminal ke 'selesai').
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

  IF COALESCE((p_payload->>'rujukan')::boolean, false) THEN
    IF NULLIF(BTRIM(COALESCE(p_payload->>'tujuan_rujukan', '')), '') IS NULL
       OR NULLIF(BTRIM(COALESCE(p_payload->>'alasan_rujukan', '')), '') IS NULL THEN
      RETURN jsonb_build_object('ok', false, 'code', 422,
        'message', 'Rujukan wajib mencantumkan tujuan dan alasan.');
    END IF;
  END IF;

  SELECT true, updated_at INTO v_has_existing, v_existing_updated_at
    FROM pelayanan WHERE kunjungan_id = p_kunjungan_id;
  IF p_expected_updated_at IS NOT NULL AND v_has_existing THEN
    IF v_existing_updated_at IS DISTINCT FROM p_expected_updated_at THEN
      RETURN jsonb_build_object('ok', false, 'code', 409, 'conflict', true,
        'message', 'Pelayanan berubah oleh petugas lain. Muat ulang sebelum menyimpan.',
        'server_updated_at', v_existing_updated_at);
    END IF;
  END IF;

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

  -- M5-018: terminal Meja 4 = 'meja_5_penyuluhan' (bukan 'selesai').
  -- 'selesai' hanya oleh penutupan sesi. Tak pernah regresi.
  UPDATE kunjungan SET status_alur = CASE
    WHEN status_alur IN ('meja_1_registrasi', 'meja_2_pengukuran', 'meja_3_pencatatan', 'meja_4_pelayanan')
      THEN 'meja_5_penyuluhan'::status_alur_enum
    ELSE status_alur
  END WHERE id = p_kunjungan_id;

  RETURN jsonb_build_object('ok', true, 'action', v_action, 'id', v_row.id,
    'updated_at', v_row.updated_at, 'imunisasi_disimpan', v_imunisasi_count);
END $$;

GRANT EXECUTE ON FUNCTION public.simpan_pelayanan(uuid, uuid, jsonb, text[], date, timestamptz) TO PUBLIC;
