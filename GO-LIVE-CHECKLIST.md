# Go-Live Checklist — SIPANDU Posyandu ILP Flamboyan (PRD Bagian 28)

## 1. Database (K2)
- [x] Skema produksi sudah ter-build (`init-schema` + `rls-policies` terapply 2026-08-04/05)
- [x] Tabel terverifikasi ada: `imunisasi`, `catatan_kunjungan`, `kehamilan`, `risiko`, `penyuluhan`, `audit_log`, `riwayat_imunisasi`, `kunjungan_rumah`, `rujukan` (dari init-schema)
- [x] Tabel yang belum ada telah dibuat: `notifikasi`, `sinduksadati_event_log` (2026-09-09 via InsForge CLI)
- [x] File migrasi diselaraskan ke format kanonik: `migrations/20260909000000_buildschema.sql` (idempoten, sesuaikan `jadwal_id` → `jadwal_posyandu_id` mengikuti skema live)
- [x] Normalisasi data lama: `UPDATE anggota SET kategori='ibu_hamil' WHERE kategori='bumil';` (migrasi 20260909000002)
- [x] CHECK constraint `jadwal_posyandu.status` menerima `draft/aktif/selesai/dibatalkan` (migrasi 20260909000002)
- [x] **RLS hardening (migrasi `20260914000001_rls-hardening.sql`, audit 2026-09-14):** ENABLE RLS pada tabel transaksi yang tadinya OFF (`kunjungan`, `pengukuran`, `pelayanan`, `catatan_kunjungan`, `penyuluhan`, `jadwal_posyandu`, `users`, `rencana_kunjungan_rumah`) + policy `users`/`rencana`/`audit_log`. Verifikasi: anon=0 baris, login=penuh. Menutup kebocoran data klinis & `users.email` ke publik.

## 2. Keamanan & RBAC (M-08, PRD 13.3)
- [x] RLS aktif di semua tabel klinis (`rls-policies` terapply) + tambahan: `imunisasi`, `risiko`, `audit_log`, `notifikasi`, `sinduksadati_event_log` (2026-09-09)
- [x] **RLS kini konsisten di SELURUH tabel** (audit 2026-09-14). Sebelumnya 8 tabel transaksi RLS=OFF → anon bisa baca/tulis data klinis.
- [x] Role Switcher dinonaktifkan di produksi — kredensial cepat & autofill login digate `VITE_DEMO_MODE=true` (`src/pages/Login.tsx`)
- [x] **`VITE_DEMO_MODE=true` diset untuk build demo** (autofill kredensial aktif; sengaja, atas permintaan). Matikan (`false`) untuk produksi nyata.
- [ ] Buat akun riil per peran (kader, bidan, ketua_pkk, kepala_desa, super_admin) via menu Pengguna (amendemen v3.0.1: 5 akun tetap) — **5 akun sudah ada di DB live**
- [x] `.env.local` sudah di-`.gitignore` (tidak ter-commit); env diset di hosting (Vercel/InsForge)
- [x] Fallback demo login nonaktif di produksi (`import.meta.env.VITE_DEMO_MODE !== "true"`)
- [x] **`scratch/` & `.codebase-memory/` ditambahkan ke `.gitignore`** + file scratch berisi kredensial live telah DIHAPUS (audit 2026-09-14)

## 3. Frontend
- [x] `npm run typecheck && npm test && npm run build` hijau (**195 unit test**, 0 error) — audit 2026-09-14
- [x] Perbaikan integritas demo: hapus angka hardcoded dashboard (imunisasi/tren/stunting/APBDes), filter bulan Laporan fungsional, katalog L-01 & L-08 riil, L-02–L-07 "Segera hadir"
- [x] Satu jalur tutup sesi (`tutupSesiHariH`) — tombol "Tutup" PosyanduJadwal sudah pakai jalur resmi
- [x] Konsistensi nama tokoh via `SIPANDU_SEED.persona` + `currentUser.nama_lengkap`
- [x] Avatar inisialis menggantikan foto Unsplash placeholder (tanpa dependensi eksternal)
- [x] `getPosyandu()` dibuat deterministik (filter id kanonis/RW 06; hindari `maybeSingle()` error saat tabel >1 baris) — audit 2026-09-14
- [ ] Uji alur lengkap hari H manual: check-in → pengukuran → pencatatan → pelayanan → rekap → tutup sesi
- [ ] Uji verifikasi Bidan: draft → diperiksa → valid (per item + bulk, wajib catatan saat kembalikan ke Draft)
- [ ] Mobile: sidebar drawer, bottom nav, form Meja2 per kategori (bayi/balita/bumil/wus/lansia)

## 4. Environment
- [x] `VITE_INSFORGE_URL`, `VITE_INSFORGE_ANON_KEY` ter-set di `.env.local`
- [x] **Sesi demo aktif dibuat di DB live** (jadwal "Posyandu ILP Flamboyan RW 06 - Sesi Demo", status `aktif`) — audit 2026-09-14
- [ ] Set env di hosting (Vercel): `VITE_INSFORGE_URL`, `VITE_INSFORGE_ANON_KEY`, `VITE_DEMO_MODE`
- [x] `INSFORGE_API_KEY` + `ECOSYSTEM_SERVICE_KEY` di `.env.local` (server-side untuk `api/ecosystem/citizen-summary.ts`)
- [ ] Fase 4 (opsional): `SINDUKSADATI_API_URL`, `SINDUKSADATI_SERVICE_KEY`, `SINDUKSADATI_WEBHOOK_SECRET` di Edge Function secrets

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
- [x] **webhook-sinduksadati diperbaiki (audit 2026-09-14):** verifikasi HMAC SHA-256 timing-safe + fail-closed (sebelumnya stub `return true` & kolom salah). Belum di-deploy — siap saat Fase 4.

## 7. Temuan Audit Backend/DB (2026-09-14)
- Catatan: `data.posyandu` shape DB (`nama`,`desa`) ≠ shape seed (`nama_posyandu`,`desa_kelurahan`); UI laporan memakai teks kop hardcoded sehingga belum berdampak. Kandidat perbaikan lanjutan.
- Catatan: `audit_log` policy read hanya `super_admin`+`bidan`; tulisan audit dari sesi Kader kini diizinkan (policy baru), namun pembacaan tetap terbatas (sesuai desain).
