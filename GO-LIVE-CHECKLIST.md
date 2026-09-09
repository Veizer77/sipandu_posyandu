# Go-Live Checklist — SIPANDU Posyandu ILP Flamboyan (PRD Bagian 28)

## 1. Database (K2)
- [ ] Jalankan `migrations/2026-09-06_build_fase2-5.sql` di InsForge production
- [ ] Verifikasi tabel: `imunisasi`, `catatan_kunjungan`, `kehamilan`, `risiko`, `notifikasi`, `sinduksadati_event_log`
- [ ] Normalisasi data lama: `UPDATE anggota SET kategori='ibu_hamil' WHERE kategori='bumil';`
- [ ] Cek CHECK constraint `jadwal_posyandu.status` menerima `draft/aktif/selesai/dibatalkan`

## 2. Keamanan & RBAC (M-08, PRD 13.3)
- [ ] Aktifkan RLS Bab 13.3 (kader_posyandu + admin_all) di semua tabel klinis
- [ ] Nonaktifkan Role Switcher di produksi (sudah otomatis: hanya tampil di dev / `VITE_DEMO_MODE=true`)
- [ ] Buat akun riil per peran (kader, bidan, ketua_pkk, kepala_desa, super_admin) via menu Pengguna
- [ ] Hapus `.env.local` dari build produksi; set env di hosting (Vercel/InsForge)
- [ ] Verifikasi fallback demo login tidak aktif di produksi (auth-context: fallback terjadi bila `insforgeConfigured=false`)

## 3. Frontend
- [ ] `npm run typecheck && npm test && npm run build` hijau
- [ ] Uji alur lengkap hari H: check-in → pengukuran → pencatatan → pelayanan → rekap → tutup sesi
- [ ] Uji verifikasi Bidan: draft → diperiksa → valid (per item + bulk) → laporan hanya menghitung Valid
- [ ] Uji profil: edit keluarga/anggota, kehamilan aktif → selesai (kategori recalc), imunisasi per jenis
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
