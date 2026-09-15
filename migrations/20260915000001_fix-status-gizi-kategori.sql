-- =============================================================
-- SIPANDU — Koreksi integritas status gizi (audit 2026-09-15)
--
-- MASALAH:
--   Meja 2 lama menyimpan status_gizi = "Normal" (dan status_pertumbuhan)
--   untuk SEMUA kategori, padahal Z-score WHO hanya sah untuk bayi/balita
--   (0–60 bulan). Akibatnya WUS/Lansia/Bumil punya "status_gizi normal"
--   palsu di DB dan terkirim ke Citizen 360 SINDUKSADATI.
--
-- PERBAIKAN (standar WHO):
--   - Bayi/Balita     : status_gizi dari Z-score BB/U (dibiarkan apa adanya).
--   - Dewasa (wus/lansia/umum) : status_gizi dari IMT/BMI
--       <18.5 underweight · 18.5–24.9 normal · 25–29.9 overweight · >=30 obesitas
--   - Ibu hamil       : status_gizi = NULL (indikator LILA/TD, bukan IMT/z-score).
--   - status_pertumbuhan: hanya relevan bayi/balita -> NULL untuk kategori lain.
--   - Z-score non-balita dipaksa NULL (tidak sah).
--
-- Idempotent: aman dijalankan berulang.
-- =============================================================

-- 1) Bersihkan Z-score & status_pertumbuhan untuk SEMUA non-balita.
UPDATE pengukuran p
SET z_score_bbu = NULL,
    z_score_tbu = NULL,
    z_score_bbtb = NULL,
    status_pertumbuhan = NULL
FROM kunjungan k
JOIN anggota a ON a.id = k.anggota_id
WHERE p.kunjungan_id = k.id
  AND a.kategori NOT IN ('bayi', 'balita');

-- 2) Ibu hamil: status_gizi tidak berlaku (NULL).
UPDATE pengukuran p
SET status_gizi = NULL
FROM kunjungan k
JOIN anggota a ON a.id = k.anggota_id
WHERE p.kunjungan_id = k.id
  AND a.kategori = 'ibu_hamil';

-- 3) Dewasa (wus/lansia/umum): status_gizi dari IMT/BMI.
--    Kolom status_gizi bertipe enum (buruk|kurang|normal|lebih|obesitas),
--    dipetakan: underweight->kurang, normal->normal, overweight->lebih, obesitas->obesitas.
--    IMT dihitung ulang bila kolom imt kosong namun BB & TB tersedia.
DO $$
BEGIN
  -- 3a) Isi IMT yang kosong agar klasifikasi akurat.
  UPDATE pengukuran p
  SET imt = ROUND((p.berat_badan / POWER(p.tinggi_badan / 100.0, 2))::numeric, 2)
  FROM kunjungan k
  JOIN anggota a ON a.id = k.anggota_id
  WHERE p.kunjungan_id = k.id
    AND a.kategori IN ('wus', 'lansia')
    AND p.imt IS NULL
    AND p.berat_badan IS NOT NULL
    AND p.tinggi_badan IS NOT NULL
    AND p.tinggi_badan > 0;

  -- 3b) Klasifikasi IMT -> status_gizi (enum).
  UPDATE pengukuran p
  SET status_gizi = CASE
    WHEN p.imt < 18.5 THEN 'kurang'::status_gizi_enum
    WHEN p.imt < 25.0 THEN 'normal'::status_gizi_enum
    WHEN p.imt < 30.0 THEN 'lebih'::status_gizi_enum
    ELSE 'obesitas'::status_gizi_enum
  END
  FROM kunjungan k
  JOIN anggota a ON a.id = k.anggota_id
  WHERE p.kunjungan_id = k.id
    AND a.kategori IN ('wus', 'lansia')
    AND p.imt IS NOT NULL;
EXCEPTION WHEN undefined_object THEN
  -- Fallback bila status_gizi bertipe VARCHAR (bukan enum).
  UPDATE pengukuran p
  SET status_gizi = CASE
    WHEN p.imt < 18.5 THEN 'kurang'
    WHEN p.imt < 25.0 THEN 'normal'
    WHEN p.imt < 30.0 THEN 'lebih'
    ELSE 'obesitas'
  END
  FROM kunjungan k
  JOIN anggota a ON a.id = k.anggota_id
  WHERE p.kunjungan_id = k.id
    AND a.kategori IN ('wus', 'lansia')
    AND p.imt IS NOT NULL;
END $$;

-- 4) Dewasa tanpa data IMT: status_gizi NULL (jujur, tidak mengarang "normal").
UPDATE pengukuran p
SET status_gizi = NULL
FROM kunjungan k
JOIN anggota a ON a.id = k.anggota_id
WHERE p.kunjungan_id = k.id
  AND a.kategori IN ('wus', 'lansia')
  AND p.imt IS NULL;

-- =============================================================
-- VERIFIKASI:
--   SELECT a.kategori, count(*), count(p.z_score_bbu) AS zbbu,
--          count(p.status_gizi) AS ada_gizi
--   FROM pengukuran p JOIN kunjungan k ON k.id=p.kunjungan_id
--   JOIN anggota a ON a.id=k.anggota_id GROUP BY a.kategori;
--   -- harus: non-balita zbbu=0; bumil ada_gizi=0.
-- =============================================================
