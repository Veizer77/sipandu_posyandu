# Go-Live Checklist — SIPANDU Posyandu ILP Flamboyan (PRD Bagian 28)

## 1. Database (K2)
- [x] Skema produksi sudah ter-build (`init-schema` + `rls-policies` terapply 2026-08-04/05)
- [x] Tabel terverifikasi ada: `imunisasi`, `catatan_kunjungan`, `kehamilan`, `risiko`, `penyuluhan`, `audit_log`, `riwayat_imunisasi`, `kunjungan_rumah`, `rujukan` (dari init-schema)
- [x] Tabel yang belum ada telah dibuat: `notifikasi`, `sinduksadati_event_log` (2026-09-09 via InsForge CLI)
- [x] File migrasi diselaraskan ke format kanonik: `migrations/20260909000000_buildschema.sql` (idempoten, sesuaikan `jadwal_id` → `jadwal_posyandu_id` mengikuti skema live)
- [ ] Normalisasi data lama: `UPDATE anggota SET kategori='ibu_hamil' WHERE kategori='bumil';` (jalankan saat cutover)
- [ ] Cek CHECK constraint `jadwal_posyandu.status` menerima `draft/aktif/selesai/dibatalkan`

## 2. Keamanan & RBAC (M-08, PRD 13.3)
- [x] RLS aktif di semua tabel klinis (`rls-policies` terapply) + tambahan: `imunisasi`, `risiko`, `audit_log`, `notifikasi`, `sinduksadati_event_log` (2026-09-09)
- [x] Role Switcher dinonaktifkan di produksi — kredensial cepat & autofill login digate `VITE_DEMO_MODE=true` (`src/pages/Login.tsx`)
- [ ] Buat akun riil per peran (kader, bidan, ketua_pkk, kepala_desa, super_admin) via menu Pengguna (amendemen v3.0.1: 5 akun tetap)
- [x] `.env.local` sudah di-`.gitignore` (tidak ter-commit); env diset di hosting (Vercel/InsForge)
- [x] Fallback demo login nonaktif di produksi (`import.meta.env.VITE_DEMO_MODE !== "true"`)

## 3. Frontend
- [x] `npm run typecheck && npm test && npm run build` hijau (47 unit test, 0 error)
- [x] Perbaikan integritas demo: hapus angka hardcoded dashboard (imunisasi/tren/stunting/APBDes), filter bulan Laporan fungsional, katalog L-01 & L-08 riil, L-02–L-07 "Segera hadir"
- [x] Satu jalur tutup sesi (`tutupSesiHariH`) — tombol "Tutup" PosyanduJadwal sudah pakai jalur resmi
- [x] Konsistensi nama tokoh via `SIPANDU_SEED.persona` + `currentUser.nama_lengkap`
- [x] Avatar inisial menggantikan foto Unsplash placeholder (tanpa dependensi eksternal)
- [ ] Uji alur lengkap hari H manual: check-in → pengukuran → pencatatan → pelayanan → rekap → tutup sesi
- [ ] Uji verifikasi Bidan: draft → diperiksa → valid (per item + bulk, wajib catatan saat kembalikan ke Draft)
- [ ] Mobile: sidebar drawer, bottom nav, form Meja2 per kategori (bayi/balita/bumil/wus/lansia)

## 4. Environment
- [ ] `VITE_INSFORGE_URL`, `VITE_INSFORGE_ANON_KEY` ter-set di hosting
- [ ] Fase 4 (opsional): `SINDUKSADATI_API_URL`, `SINDUKSADATI_API_KEY`, `SINDUKSADATI_SERVICE_KEY` di Edge Function secrets

## 5. Backup & Retensi (PRD 39)
- [ ] Jadwalkan backup otomatis InsForge DB
- [ ] Retensi: audit log 2 th, notifikasi 90 hr (belum ada job pembersih — follow-up)

## 6. Keputusan ★ (SELESAI — v3.0.1, PRD diamendemen)
- [x] D2: Bidan ikut alur 5 meja — diizinkan (PRD §6 amended)
- [x] H2: PDF = print-CSS (katalog no-print, page-break rapi)
- [x] J2: Notifikasi = polling 45 dtk (AppShell interval)
- [x] K1: z-score/risiko/laporan client-side; edge functions = kirim-notifikasi (prospektif) + sinduksadati-proxy (aktif) — PRD §31 amended
- [x] K3: LMS sparse client-side + validasi silang sekali vs WHO Anthro (bila deviasi > 0.05 SD → baru import tabel penuh)
- [x] L3: webhook receiver = InsForge Edge Function saat Fase 4 riil — PRD §42.7 amended
