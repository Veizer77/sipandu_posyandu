-- =============================================================
-- SIPANDU — Perbaikan RLS (audit kesiapan demo/rilis)
-- Temuan audit 2026-09-14 (verifikasi langsung ke DB live):
--
--  1) Tabel transaksi RLS-nya BELUM di-ENABLE padahal policy sudah ada:
--     kunjungan, pengukuran, pelayanan, catatan_kunjungan, penyuluhan,
--     jadwal_posyandu, users, rencana_kunjungan_rumah.
--     Akibat: anon (tanpa login) bisa BACA bahkan TULIS data klinis,
--     dan `users` membocorkan email + peran ke publik.
--
--  2) `rencana_kunjungan_rumah` punya 0 policy → setelah RLS di-enable,
--     semua akses akan ditolak. Perlu policy eksplisit.
--
--  3) `users` hanya punya policy super_admin + own-profile. Namun aplikasi
--     (AppShell/data-store) membaca daftar `users` untuk nama & foto petugas
--     di seluruh peran. Tanpa policy tambahan, enable RLS = regresi UI.
--
--  4) `audit_log` RLS ON dengan policy hanya super_admin/bidan → tulisan
--     audit dari sesi Kader gagal senyap. Tambah policy INSERT untuk kader
--     (audit trail operasional hari H).
--
-- DESAIN: aplikasi berjalan dengan login InsForge (SDK menyisipkan
-- `Authorization: Bearer <accessToken>`), sehingga policy berbasis
-- `get_user_role()` bekerja. Anon TIDAK dibuka untuk master data.
--
-- Idempotent: aman dijalankan berulang.
-- =============================================================

-- ---------- 1) ENABLE RLS pada tabel transaksi ----------
ALTER TABLE kunjungan               ENABLE ROW LEVEL SECURITY;
ALTER TABLE pengukuran              ENABLE ROW LEVEL SECURITY;
ALTER TABLE pelayanan               ENABLE ROW LEVEL SECURITY;
ALTER TABLE catatan_kunjungan       ENABLE ROW LEVEL SECURITY;
ALTER TABLE penyuluhan              ENABLE ROW LEVEL SECURITY;
ALTER TABLE jadwal_posyandu         ENABLE ROW LEVEL SECURITY;
ALTER TABLE users                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE rencana_kunjungan_rumah ENABLE ROW LEVEL SECURITY;

-- ---------- 2) `users`: izinkan semua peran terautentikasi MEMBACA ----------
-- (dibutuhkan untuk menampilkan nama/foto petugas di seluruh UI).
-- Pola: TO public + kondisi `auth.uid() IS NOT NULL` (konsisten dengan
-- policy lama yang terbukti bekerja saat login; anon tetap diblokir).
DROP POLICY IF EXISTS users_read_authenticated ON users;
CREATE POLICY users_read_authenticated ON users
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- `users`: petugas boleh memperbarui baris profilnya sendiri.
DROP POLICY IF EXISTS users_update_own ON users;
CREATE POLICY users_update_own ON users
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ---------- 3) `rencana_kunjungan_rumah`: policy lengkap ----------
DROP POLICY IF EXISTS rkr_read ON rencana_kunjungan_rumah;
CREATE POLICY rkr_read ON rencana_kunjungan_rumah
  FOR SELECT
  USING (get_user_role() = ANY (ARRAY['super_admin'::peran_enum, 'kader'::peran_enum, 'bidan'::peran_enum, 'ketua_pkk'::peran_enum, 'kepala_desa'::peran_enum]));

DROP POLICY IF EXISTS rkr_write ON rencana_kunjungan_rumah;
CREATE POLICY rkr_write ON rencana_kunjungan_rumah
  FOR ALL
  USING (get_user_role() = ANY (ARRAY['super_admin'::peran_enum, 'kader'::peran_enum, 'bidan'::peran_enum]))
  WITH CHECK (get_user_role() = ANY (ARRAY['super_admin'::peran_enum, 'kader'::peran_enum, 'bidan'::peran_enum]));

-- ---------- 4) `audit_log`: kader boleh menulis jejak audit sendiri ----------
DROP POLICY IF EXISTS audit_log_insert_operational ON audit_log;
CREATE POLICY audit_log_insert_operational ON audit_log
  FOR INSERT
  WITH CHECK (get_user_role() = ANY (ARRAY['super_admin'::peran_enum, 'bidan'::peran_enum, 'kader'::peran_enum, 'ketua_pkk'::peran_enum, 'kepala_desa'::peran_enum]));

-- ---------- 5) Guard: policy ALL pada RPC ber-SECURITY INVOKER ----------
-- RPC simpan_pencatatan / simpan_pelayanan adalah SECURITY INVOKER, jadi
-- tunduk pada RLS pemanggil. Policy ALL "Kader can manage ..." sudah mencakup
-- INSERT/UPDATE untuk kader; Bidan punya SELECT + UPDATE eksplisit. Untuk
-- kelengkapan operasional Bidan (menambah catatan/pelayanan), pastikan Bidan
-- memiliki INSERT pada tabel terkait.
DROP POLICY IF EXISTS catatan_bidan_insert ON catatan_kunjungan;
CREATE POLICY catatan_bidan_insert ON catatan_kunjungan
  FOR INSERT
  WITH CHECK (get_user_role() = ANY (ARRAY['super_admin'::peran_enum, 'bidan'::peran_enum]));

DROP POLICY IF EXISTS pelayanan_bidan_insert ON pelayanan;
CREATE POLICY pelayanan_bidan_insert ON pelayanan
  FOR INSERT
  WITH CHECK (get_user_role() = ANY (ARRAY['super_admin'::peran_enum, 'bidan'::peran_enum]));

DROP POLICY IF EXISTS pengukuran_bidan_insert ON pengukuran;
CREATE POLICY pengukuran_bidan_insert ON pengukuran
  FOR INSERT
  WITH CHECK (get_user_role() = ANY (ARRAY['super_admin'::peran_enum, 'bidan'::peran_enum]));

-- =============================================================
-- VERIFIKASI (jalankan manual setelah apply):
--   SELECT relname, relrowsecurity FROM pg_class
--   WHERE relnamespace='public'::regnamespace AND relkind='r'
--   ORDER BY relrowsecurity, relname;
--
-- UJI (harus 0 rows tanpa login; >0 setelah login kader):
--   anon   : GET /api/database/records/anggota  -> []
--   kader  : GET /api/database/records/anggota  -> 27 rows
-- =============================================================
