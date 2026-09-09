# SIPANDU — Sistem Informasi Posyandu ILP Flamboyan RW 06

Aplikasi Single Page Application (SPA) modern berbasis **React 18 + Vite + TypeScript + Tailwind CSS**, dibangun mengacu pada:
- [`SIPANDU-PRD-v3.0.0.md`](./SIPANDU-PRD-v3.0.0.md)
- Backend: **InsForge BaaS** (`https://6i9ja6g9.us-east.insforge.app`)
- Master Kependudukan: **SINDUKSADATI RW 06** (`https://sinduksadati.vercel.app`)

---

## Identitas Visual & Palet Warna
- **Primary**: Medical Cerulean Blue (`#0284c7`, `sky-600/700`)
- **Secondary**: Fresh Herbal Leaf Green (`#16a34a`, `emerald-600`)
- **Logo**: Tersedia di `/public/logo/logo_with_teks.png` & `/public/logo/logo_only.png`

---

## Fitur yang Telah Diimplementasikan (Plek Ketiplek)

1. **Multi-Peran & RBAC Matrix (5 Peran)**
   - Quick Role Switcher di header untuk pengujian instan: `Kader`, `Bidan Desa`, `Ketua TP PKK`, `Kepala Desa`, `Super Admin`.
2. **Alur 5 Meja Hari H Posyandu**
   - Meja 1: Registrasi & Presensi Digital (efek konfeti, counter hadir/belum).
   - Meja 2: Pengukuran & Antropometri (LMS Table WHO 2006 Z-Score real-time: BB/U, TB/U, BB/TB, SD23, status pertumbuhan Naik/T, deteksi risiko klinis otomatis).
   - Meja 3: Pencatatan Digital (agregasi otomatis dari Meja 1 & 2, keluhan utama).
   - Meja 4: Pelayanan Kesehatan (Vitamin A, PMT kudapan lokal, imunisasi dasar, rujukan Puskesmas Junrejo).
   - Meja 5: Edukasi & Penyuluhan Kelompok.
   - Rekapitulasi Sesi & Tutup Sesi (follow-up sasaran tidak hadir).
3. **Manajemen Master Kependudukan RW 06**
   - Daftar Kartu Keluarga (KK) per RT 01-04.
   - Tambah KK & Anggota Keluarga (auto-klasifikasi sasaran balita/bumil/lansia).
   - Profil Lengkap Anggota: Kurva pertumbuhan KMS, jadwal & matriks imunisasi lengkap.
4. **Monitoring Klinis & Eksekutif**
   - Bidan: Antrian verifikasi kunjungan (`Draft` → `Valid`), balita bermasalah gizi, bumil risti.
   - TP PKK: Capaian D/S per RT, prevalensi stunting, evaluasi PMT.
   - Kades: Rekapitulasi sasaran populasi RW 06, rekomendasi kebijakan dana desa.
5. **Pelaporan Resmi L-01**
   - Kop surat resmi Pemkot Batu, Desa Mojorejo, Posyandu ILP Flamboyan RW 06.
   - Rekapitulasi D/S, N/D, 2T, BGM, dan pelayanan.
   - Format cetak optimal (`@media print` / tombol "Cetak PDF").
6. **Integrasi SINDUKSADATI**
   - Status API connected, linking coverage, webhook event log, simulator output Citizen 360.
7. **Administrasi Sistem**
   - Profil Posyandu, Struktur Organisasi, Pengguna & Peran, Audit Log (Super Admin).

---

## Cara Menjalankan

```bash
# Development server
npm run dev

# Typecheck
npm run typecheck

# Production build
npm run build

# Preview build
npm run preview
```
