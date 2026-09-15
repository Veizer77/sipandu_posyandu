-- =============================================================
-- SIPANDU — Seed data uji: lengkapi pengukuran kunjungan kosong
--   + perbaiki data kehamilan Nadia Safitri (audit 2026-09-15)
--
-- KONTEKS:
--   4 kunjungan uji berstatus 'selesai' namun TANPA baris pengukuran
--   (data di-input manual, bukan lewat alur Meja 2). Citizen 360 lalu
--   menampilkan BB/TB kosong. Migrasi ini mengisi pengukuran realistis
--   agar demo end-to-end terisi. Ini DATA UJI.
--
-- Idempotent: hanya mengisi kunjungan yang BELUM punya pengukuran
--   (INSERT ... WHERE NOT EXISTS). Aman dijalankan berulang.
-- =============================================================

-- ---------- 1) Pengukuran untuk 4 kunjungan kosong ----------
-- Nadia Safitri (ibu hamil): BB 58, TB 156, LILA 24 (tidak KEK), TD 115/75.
INSERT INTO pengukuran (kunjungan_id, berat_badan, tinggi_badan, lingkar_lengan,
  tekanan_darah_sistol, tekanan_darah_diastol, status_gizi)
SELECT 'be260c0a-34d2-452d-8733-4158125f2ab8', 58.00, 156.00, 24.0, 115, 75, NULL
WHERE NOT EXISTS (SELECT 1 FROM pengukuran WHERE kunjungan_id = 'be260c0a-34d2-452d-8733-4158125f2ab8');

-- Lestari Wulandari (wus, P): BB 54, TB 158 -> IMT 21.6 (normal).
INSERT INTO pengukuran (kunjungan_id, berat_badan, tinggi_badan, lingkar_lengan,
  tekanan_darah_sistol, tekanan_darah_diastol, imt, status_gizi)
SELECT 'd343688f-bef7-4fb5-a489-1d72ea99f0b0', 54.00, 158.00, 26.0, 118, 76, 21.63, 'normal'
WHERE NOT EXISTS (SELECT 1 FROM pengukuran WHERE kunjungan_id = 'd343688f-bef7-4fb5-a489-1d72ea99f0b0');

-- Sutrisno (wus, L): BB 68, TB 165 -> IMT 24.98 (normal atas).
INSERT INTO pengukuran (kunjungan_id, berat_badan, tinggi_badan,
  tekanan_darah_sistol, tekanan_darah_diastol, imt, status_gizi)
SELECT '12193fbe-e0e2-404c-9193-16785bc833de', 68.00, 165.00, 128, 82, 24.98, 'normal'
WHERE NOT EXISTS (SELECT 1 FROM pengukuran WHERE kunjungan_id = '12193fbe-e0e2-404c-9193-16785bc833de');

-- Dewi Anggraini (wus, P): BB 61, TB 155 -> IMT 25.39 (overweight).
INSERT INTO pengukuran (kunjungan_id, berat_badan, tinggi_badan, lingkar_lengan,
  tekanan_darah_sistol, tekanan_darah_diastol, imt, status_gizi)
SELECT 'ff72a188-27f1-4c37-a18a-72c810154cd0', 61.00, 155.00, 28.0, 122, 80, 25.39, 'lebih'
WHERE NOT EXISTS (SELECT 1 FROM pengukuran WHERE kunjungan_id = 'ff72a188-27f1-4c37-a18a-72c810154cd0');

-- ---------- 2) Perbaiki data kehamilan Nadia Safitri ----------
-- Inkonsistensi: kategori='ibu_hamil' tapi status_hamil=false & hpht NULL.
-- Set aktif: HPHT 2026-03-01 -> HPL = HPHT + 280 hari = 2026-12-06.
UPDATE anggota
SET status_hamil = TRUE,
    hpht = DATE '2026-03-01'
WHERE id = '840394cb-4850-4439-9a28-3adeecaa06e6';

-- Buat baris kehamilan aktif (idempoten: hanya bila belum ada yang aktif).
INSERT INTO kehamilan (anggota_id, tanggal_hpht, taksiran_persalinan, gravida, para, abortus, status)
SELECT '840394cb-4850-4439-9a28-3adeecaa06e6', DATE '2026-03-01', DATE '2026-12-06', 2, 1, 0, 'aktif'
WHERE NOT EXISTS (
  SELECT 1 FROM kehamilan
  WHERE anggota_id = '840394cb-4850-4439-9a28-3adeecaa06e6' AND status = 'aktif'
);

-- =============================================================
-- VERIFIKASI:
--   SELECT count(*) FROM kunjungan k LEFT JOIN pengukuran p
--     ON p.kunjungan_id=k.id WHERE p.id IS NULL;  -- harus 0
--   SELECT status_hamil, hpht FROM anggota
--     WHERE id='840394cb-4850-4439-9a28-3adeecaa06e6';  -- true, 2026-03-01
-- =============================================================
