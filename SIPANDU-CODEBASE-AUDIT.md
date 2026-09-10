# 🔍 SIPANDU Codebase Audit — Full Report & Improvement Plan

> Audit dilakukan 9 September 2026 terhadap codebase **SIPANDU Posyandu ILP Flamboyan v3.0.0**
> Stack: React 18 + TypeScript + Vite + Tailwind CSS + InsForge BaaS

---

## Current Health Status

| Metric | Status | Detail |
|--------|--------|--------|
| TypeCheck (`tsc --noEmit`) | ✅ **Pass** | 0 errors |
| Unit Tests (`vitest run`) | ✅ **47/47 Pass** | 2 suites, 135ms |
| Production Build (`vite build`) | ⚠️ **Pass with warnings** | Build success; **929 KB JS chunk** (limit 500 KB) |
| CI Pipeline | ✅ **Configured** | GitHub Actions: checkout → npm ci → typecheck → test → build |
| TODO/FIXME markers | ✅ **Clean** | 0 found |
| Console.log pollution | ✅ **Clean** | 0 `console.log`; ~41 `console.warn` (intentional error fallbacks) |
| Error Boundary | ❌ **Missing** | Tidak ada React Error Boundary |

---

## 🔴 Temuan Kritis (P0 — Wajib Sebelum Go-Live)

### K1. Tidak Ada React Error Boundary
- **Risiko**: Crash white-screen pada error render apapun, user kehilangan seluruh data sesi
- **Lokasi**: [main.tsx](file:///C:/FLUTTER%20PROJEK/gabut/sipandu/src/main.tsx)
- **Rekomendasi**: Tambah `ErrorBoundary` wrapper di atas `<BrowserRouter>` dengan fallback UI "Terjadi kesalahan" + tombol reload

### K2. Bundle Size Terlalu Besar (929 KB single chunk)
- **Risiko**: Waktu loading lambat di jaringan Posyandu pedesaan (3G/4G lemah)
- **Build output**: `dist/assets/index-C_J0-pJm.js` = 929.89 KB (gzipped: 227 KB)
- **Penyebab**: Semua page + WHO LMS tables + landing page di-bundle satu chunk
- **Rekomendasi**:
  - Code-splitting via `React.lazy()` + `Suspense` untuk route-level
  - Pisahkan landing page components (97 KB total) ke chunk sendiri
  - Pisahkan WHO z-score tables (25 KB) ke dynamic import
  - Target: main chunk < 300 KB

### K3. `data-store.tsx` Terlalu Monolitik (1,050+ baris)
- **Risiko**: Sulit di-maintain, setiap perubahan kecil men-trigger re-render semua consumer
- **File**: [data-store.tsx](file:///C:/FLUTTER%20PROJEK/gabut/sipandu/src/lib/data-store.tsx) — 40,325 bytes
- **Rekomendasi**: 
  - Split context menjadi domain-specific contexts (JadwalContext, KunjunganContext, MasterDataContext)
  - Gunakan `useMemo` / `useCallback` yang lebih granular
  - Pertimbangkan state management library (zustand) untuk slicing

### K4. Pervasive `any` Types di Data Layer
- **Lokasi**: [data-store.tsx](file:///C:/FLUTTER%20PROJEK/gabut/sipandu/src/lib/data-store.tsx), [dbService.ts](file:///C:/FLUTTER%20PROJEK/gabut/sipandu/src/services/dbService.ts)
- **Risiko**: Runtime type errors tersembunyi, IDE autocomplete tidak bekerja
- **Detail**: `DataStoreState` menggunakan `any[]` untuk semua collections; `dbService` return `any` everywhere
- **Rekomendasi**: Gunakan types dari [types/index.ts](file:///C:/FLUTTER%20PROJEK/gabut/sipandu/src/types/index.ts) secara konsisten

### K5. Default Password di UI Login
- **File**: [Login.tsx](file:///C:/FLUTTER%20PROJEK/gabut/sipandu/src/pages/Login.tsx#L48-L54) — Line 48-54
- **Detail**: `QUICK_CREDENTIALS` dengan password `password123` ada di kode; label default password `password123` **visible pada UI** bahkan saat bukan demo mode (line ~347)
- **Risiko**: Default password hint visible di production, meskipun quick-login gate DEMO_MODE
- **Rekomendasi**: 
  - Pastikan seluruh referensi `password123` hanya muncul bila `DEMO_MODE === true`
  - Hapus teks "Default: password123" dari form production

### K6. Checklist Go-Live Item Tersisa
Berdasarkan [GO-LIVE-CHECKLIST.md](file:///C:/FLUTTER%20PROJEK/gabut/sipandu/GO-LIVE-CHECKLIST.md):

| # | Item | Status |
|---|------|--------|
| 1 | Normalisasi data lama `bumil→ibu_hamil` | ❌ Belum |
| 2 | Verifikasi CHECK constraint `jadwal_posyandu.status` | ❌ Belum |
| 3 | Buat 5 akun riil per peran | ❌ Belum |
| 4 | Uji alur lengkap hari H manual | ❌ Belum |
| 5 | Uji verifikasi Bidan end-to-end | ❌ Belum |
| 6 | Mobile responsive: sidebar drawer, bottom nav | ❌ Belum |
| 7 | Set env vars di hosting | ❌ Belum |
| 8 | Jadwalkan backup otomatis DB | ❌ Belum |
| 9 | Job pembersih retensi audit log/notifikasi | ❌ Belum |

---

## 🟡 Temuan Sedang (P1 — Sebaiknya Diperbaiki Segera)

### S1. Route Duplication & Boilerplate Explosion
- **File**: [main.tsx](file:///C:/FLUTTER%20PROJEK/gabut/sipandu/src/main.tsx) — 251 baris
- **Detail**: Setiap route ditulis 3-5x untuk setiap role prefix (`/admin/`, `/kader/`, `/bidan/`, dll.) — total ~140 `<Route>` definitions
- **Contoh**: `Meja1` didefinisikan di `/admin/meja1`, `/kader/meja1`, `/bidan/meja1` dengan wrapper identik
- **Rekomendasi**: Refactor ke dynamic route generation:
```tsx
const MEJA_ROUTES = ["meja1","meja2","meja3","meja4","meja5","rekap"];
const ROLE_PREFIXES = { super_admin: "/admin", kader: "/kader", bidan: "/bidan" };
// Generate routes programmatically
```

### S2. Monitoring.tsx — Dead Code
- **File**: [Monitoring.tsx](file:///C:/FLUTTER%20PROJEK/gabut/sipandu/src/pages/monitoring/Monitoring.tsx) — 421 bytes
- **Detail**: File ini ada tapi tidak di-import oleh router apapun; kemungkinan dead code
- **Rekomendasi**: Hapus atau integrasikan

### S3. Inkonsistensi Kolom Penyuluhan
- **Types**: [types/index.ts](file:///C:/FLUTTER%20PROJEK/gabut/sipandu/src/types/index.ts#L135-L148) — `jadwal_id` vs `jadwal_posyandu_id`
- **Detail**: Interface `Penyuluhan` punya KEDUA field `jadwal_id` dan `jadwal_posyandu_id` (optional), code mengecek keduanya
- **SQL**: Migration hanya punya `jadwal_id REFERENCES jadwal_posyandu(id)`
- **Rekomendasi**: Standardisasi ke satu nama kolom (`jadwal_posyandu_id`) dan migration update

### S4. `Pengaturan.tsx` — File Sangat Besar (58 KB)
- **File**: [Pengaturan.tsx](file:///C:/FLUTTER%20PROJEK/gabut/sipandu/src/pages/admin/Pengaturan.tsx) — 58,874 bytes
- **Detail**: Menggabungkan 3 page besar: Profil/Konfigurasi, Manajemen Pengguna, dan Audit Log
- **Rekomendasi**: Split menjadi 3 file terpisah: `ProfilPosyandu.tsx`, `ManajemenPengguna.tsx`, `AuditLogPage.tsx`

### S5. `Meja2.tsx` — File Monster (62 KB)
- **File**: [Meja2.tsx](file:///C:/FLUTTER%20PROJEK/gabut/sipandu/src/pages/meja/Meja2.tsx) — 61,996 bytes
- **Detail**: Seluruh form pengukuran untuk 6 kategori sasaran (bayi/balita/bumil/wus/lansia/umum) dalam satu file
- **Rekomendasi**: Extract form per kategori ke komponen terpisah (`Meja2Balita.tsx`, `Meja2Bumil.tsx`, dst.)

### S6. Silent Error Swallowing
- **Pattern**: 41 instance `console.warn` di `data-store.tsx` dan `dbService.ts` dimana error DB di-catch dan di-log tapi **user tidak diberi feedback**
- **Risiko**: Data gagal tersimpan ke DB tapi user mengira berhasil (hanya tersimpan di localStorage)
- **Rekomendasi**: 
  - Tambah `showToast("Data tersimpan lokal, sinkronisasi ke cloud tertunda.", "warning")` pada catch block yang relevan
  - Implementasi retry mechanism atau offline queue

### S7. Laporan Periode Hardcoded
- **File**: [Laporan.tsx](file:///C:/FLUTTER%20PROJEK/gabut/sipandu/src/pages/Laporan.tsx#L175-L179)
- **Detail**: Dropdown periode hanya menampilkan 3 option hardcoded (`Agustus 2026`, `Juli 2026`, `Juni 2026`)
- **Rekomendasi**: Generate dinamis berdasarkan data kunjungan yang ada

### S8. Mixed `insforge.database.from()` Direct Calls
- **Pattern**: `data-store.tsx` kadang menggunakan `dbService` (yang proper), kadang langsung `insforge.database.from()` (bypass service layer)
- **Contoh**: `insforgeUpdateJadwalStatus()`, `linkPendudukSinduksadati()` langsung import insforge
- **Rekomendasi**: Semua DB call via `dbService` untuk konsistensi dan centralized error handling

### S9. Tidak Ada Pagination untuk Data List
- **Affected**: `KeluargaList`, `BidanVerifikasi`, `BidanRisiko`, `AuditLog`
- **Risiko**: Performance degradation seiring pertumbuhan data
- **Rekomendasi**: Implement virtual scrolling atau server-side pagination

---

## 🟢 Temuan Ringan (P2 — Nice to Have)

### R1. Missing SEO & Accessibility
- Tidak ada `<meta description>` untuk landing page
- Tidak ada `aria-label` pada banyak button icon-only
- Tidak ada `alt` text yang deskriptif pada beberapa gambar
- Skip link untuk keyboard navigation tidak ada

### R2. Unsplash Photo URLs di Seed Data
- **File**: [seedData.ts](file:///C:/FLUTTER%20PROJEK/gabut/sipandu/src/lib/seedData.ts) — Lines 42-66
- **Detail**: User photos masih mengarah ke `images.unsplash.com`; external dependency
- **Catatan**: GO-LIVE-CHECKLIST sudah mention "Avatar inisial menggantikan foto Unsplash" (✅), tapi URL masih ada di seed

### R3. Tidak Ada Loading Skeleton
- Form dan halaman daftar langsung menampilkan konten atau kosong
- **Rekomendasi**: Tambah skeleton/shimmer UI untuk perceived performance

### R4. CSS Print Styling Bisa Diperbaiki
- Print CSS sudah ada (`.no-print`, `.printable-card`)
- **Improvement**: Tambah `@page` rules untuk margin dan orientasi konsisten

### R5. Tidak Ada PWA/Offline Support
- Proyek ini TIDAK memiliki service worker atau manifest.json
- **Konteks**: Operasi hari H di lapangan mungkin butuh offline-first capability
- **Rekomendasi**: Minimal tambah `vite-plugin-pwa` untuk cache shell

### R6. Test Coverage Rendah
- Hanya 2 test file (engine dan bug fixes) yang menguji utilities
- **Tidak ada test untuk**: React components, routing, auth flow, data-store mutations, dbService
- **Rekomendasi**: Tambah integration tests minimal untuk alur kritis (check-in → pengukuran → tutup sesi)

### R7. GitHub Actions CI Belum Punya Deploy Stage
- CI hanya menjalankan `typecheck + test + build`
- **Rekomendasi**: Tambah deploy ke staging (Vercel/Netlify preview) pada PR

### R8. `insforge.ts` Fallback ke Localhost
- **File**: [insforge.ts](file:///C:/FLUTTER%20PROJEK/gabut/sipandu/src/lib/insforge.ts#L16)
- **Detail**: Fallback `baseUrl: "http://localhost:3000"` dan `anonKey: "demo-not-configured"` — tidak menyebabkan masalah runtime tapi bisa membingungkan developer baru

---

## 🏗 Arsitektur & Kode Positif (Hal yang Sudah Baik)

| Aspek | Keterangan |
|-------|------------|
| ✅ **RBAC Security** | Role-based auth terimplementasi baik; privilege escalation dicegah (BUG #1 fixed); produksi vs demo digate |
| ✅ **WHO 2006 Engine** | z-score calculator LMS lengkap, ter-test, dan presisi dengan validasi silang |
| ✅ **Risk Detection** | `deteksiRisiko` dan `deteksiRisikoSesi` mencakup 12+ kode risiko (R-B01 s/d R-L06) |
| ✅ **Data Integrity** | Non-destructive polling merge, check-in lock set, immutable notification updates |
| ✅ **Seed Data Quality** | 10 KK, 27 warga sinkron dengan SINDUKSADATI, data realistis Desa Mojorejo |
| ✅ **Error Catalog** | Centralized error messages di `errors.ts` (PRD Bab 37) |
| ✅ **Audit Trail** | Setiap mutasi di-log ke `audit_log` table dan state lokal |
| ✅ **Edge Function** | `sinduksadati-proxy` proper: auth check + CORS + error handling |
| ✅ **CI/CD Foundation** | GitHub Actions CI configured dan passing |
| ✅ **Type System** | TypeScript strict mode, comprehensive domain types |

---

## 📋 Prioritized Improvement Plan

### Phase 1: Go-Live Blockers (1-2 hari)

| # | Task | Priority | Effort |
|---|------|----------|--------|
| 1 | Tambah React Error Boundary global | P0 | 30 min |
| 2 | Gate password hint `password123` behind DEMO_MODE | P0 | 15 min |
| 3 | Code splitting `React.lazy()` untuk routes | P0 | 2 jam |
| 4 | Run normalisasi data `bumil→ibu_hamil` di DB | P0 | 15 min |
| 5 | Verify CHECK constraint `jadwal_posyandu.status` | P0 | 30 min |
| 6 | Set env vars di hosting platform | P0 | 30 min |

### Phase 2: Quality & Maintainability (3-5 hari)

| # | Task | Priority | Effort |
|---|------|----------|--------|
| 7 | Refactor routing — dynamic route generation | P1 | 2 jam |
| 8 | Split `Pengaturan.tsx` (58KB) → 3 files | P1 | 2 jam |
| 9 | Split `Meja2.tsx` (62KB) → per-kategori components | P1 | 3 jam |
| 10 | Standardisasi `jadwal_id` → `jadwal_posyandu_id` | P1 | 1 jam |
| 11 | Type semua `any` di data-store dan dbService | P1 | 4 jam |
| 12 | User feedback pada silent DB errors | P1 | 2 jam |
| 13 | Dinamis periode Laporan | P1 | 1 jam |
| 14 | Consolidate DB calls via dbService only | P1 | 1 jam |
| 15 | Hapus Monitoring.tsx dead code | P1 | 5 min |

### Phase 3: Production Hardening (1 minggu)

| # | Task | Priority | Effort |
|---|------|----------|--------|
| 16 | Mobile responsive: sidebar drawer + bottom nav | P1 | 1 hari |
| 17 | Pagination untuk data lists | P1 | 1 hari |
| 18 | Integration tests untuk alur kritis | P2 | 1 hari |
| 19 | PWA/Service Worker untuk offline support | P2 | 1 hari |
| 20 | Accessibility audit & fixes | P2 | 4 jam |
| 21 | Loading skeletons | P2 | 2 jam |
| 22 | Backup otomatis DB schedule | P1 | 1 jam |
| 23 | Retention job: audit log 2 th, notifikasi 90 hr | P1 | 2 jam |
| 24 | Deploy pipeline (staging preview on PR) | P2 | 2 jam |

---

## Verification Plan

### Automated Tests (setelah perubahan)
```bash
npm run typecheck     # TypeScript compilation check
npm test              # Run vitest (47+ tests)  
npm run build         # Verify production build succeeds
```

### Manual Verification
1. ✅ Build output chunk size < 500 KB
2. ✅ Error Boundary menampilkan fallback UI saat crash
3. ✅ Login page production **tidak** menampilkan password hint
4. ✅ Alur 5 Meja berjalan end-to-end tanpa error
5. ✅ DB sync: data tersimpan di cloud, tidak hanya localStorage

---

## Open Questions

> [!IMPORTANT]
> **Q1**: Apakah target go-live sudah memiliki tanggal pasti? Ini menentukan apakah Phase 2-3 improvements bisa dilakukan sebelum atau sesudah go-live.

> [!IMPORTANT]  
> **Q2**: Apakah Anda ingin saya langsung mulai mengerjakan Phase 1 (Go-Live Blockers) setelah rencana ini disetujui?

> [!NOTE]
> **Q3**: Untuk mobile responsive (sidebar drawer + bottom nav), apakah ada wireframe/mockup yang sudah disiapkan, atau saya buat rancangan sendiri?
