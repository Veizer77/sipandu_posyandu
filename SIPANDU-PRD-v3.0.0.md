# PRD — SIPANDU: Sistem Informasi Posyandu ILP Flamboyan
**Product Requirements Document — Edisi Lengkap**

| Atribut | Detail |
|---|---|
| Nama Produk | SIPANDU — Sistem Informasi Posyandu ILP Flamboyan |
| Versi Dokumen | **3.0.0** |
| Tanggal | Agustus 2026 |
| Status | ✅ **Production-Ready** — Lengkap + Integrasi SINDUKSADATI |
| Penulis | Izzat |
| Lokasi | Posyandu Flamboyan RW 06, Desa Mojorejo, Kec. Junrejo, Kota Batu |
| Sifat Proyek | Deployment nyata + Portofolio pengembang |
| Sistem Terkait | **SINDUKSADATI** — Sistem Informasi Penduduk Satu Data Terintegrasi RW 06 |

> **Catatan v3.0.0:** Penambahan **Bagian 42 — Perencanaan Integrasi SINDUKSADATI** beserta pembaruan pada Bagian 4, 13, 20, dan 40. SINDUKSADATI berfungsi sebagai *Single Source of Truth* data kependudukan RW 06 yang akan dihubungkan ke SIPANDU mulai Fase 4.

---

## Daftar Isi

1. [Latar Belakang](#1-latar-belakang)
2. [Pernyataan Masalah](#2-pernyataan-masalah)
3. [Tujuan Produk](#3-tujuan-produk)
4. [Ruang Lingkup](#4-ruang-lingkup)
5. [User Personas & Peran](#5-user-personas--peran)
6. [RBAC Matrix](#6-rbac-matrix)
7. [Alur Sistem Utama](#7-alur-sistem-utama)
8. [User Stories](#8-user-stories)
9. [Spesifikasi Fitur Lengkap](#9-spesifikasi-fitur-lengkap)
10. [Jadwal Imunisasi Dasar](#10-jadwal-imunisasi-dasar)
11. [Standar Kalkulasi Z-Score WHO 2006](#11-standar-kalkulasi-z-score-who-2006)
12. [Spesifikasi Halaman & Sitemap](#12-spesifikasi-halaman--sitemap)
13. [Database Schema Lengkap](#13-database-schema-lengkap)
14. [Arsitektur Teknis](#14-arsitektur-teknis)
15. [Validation Rules Per Field](#15-validation-rules-per-field)
16. [Error States & Edge Cases](#16-error-states--edge-cases)
17. [Persyaratan Non-Fungsional](#17-persyaratan-non-fungsional)
18. [Fase Pengembangan](#18-fase-pengembangan)
19. [Metrik Keberhasilan](#19-metrik-keberhasilan)
20. [Asumsi & Batasan](#20-asumsi--batasan) *(Diperbarui v3.0.0)*
21. [Glossary](#21-glossary)

> **Bagian tambahan (v2.1–v3.0):** 22. API Design · 23. Design System · 24. Testing Strategy · 25. Deployment · 26. Risk Register · 27. Dependencies · 28. Go-Live Checklist · 29. User Manual Outline · 30. Changelog · 31. Edge Functions · 32. DB Triggers · 33. Wireframes · 34. State Machines · 35. Seed Data · 36. Error Codes · 37. Accessibility · 38. Performance · 39. Data Retention · 40. Future Roadmap *(Diperbarui v3.0.0)* · 41. Stakeholder Sign-Off · **42. Integrasi SINDUKSADATI 🆕**

---

## 1. Latar Belakang

Posyandu ILP (Integrasi Layanan Primer) Flamboyan RW 06, Desa Mojorejo, Kecamatan Junrejo, Kota Batu adalah unit layanan kesehatan berbasis masyarakat tingkat kelurahan yang beroperasi minimal satu kali per bulan. Posyandu ini melayani lima kelompok sasaran utama: bayi (0–11 bulan), balita (12–59 bulan), wanita usia subur/WUS (15–49 tahun), ibu hamil, dan lansia (≥60 tahun).

Konsep ILP (Integrasi Layanan Primer) merupakan pendekatan Kementerian Kesehatan RI yang mengintegrasikan berbagai layanan kesehatan dasar dalam satu titik layanan. Pendekatan ini membutuhkan pencatatan yang terstruktur, terintegrasi, dan dapat dianalisis secara berkala untuk mendukung intervensi kesehatan masyarakat.

Saat ini, seluruh pencatatan Posyandu Flamboyan dilakukan secara manual menggunakan buku register, buku KIA, kartu menuju sehat (KMS), dan rekap Excel. Kondisi ini menciptakan hambatan administratif yang signifikan sekaligus menurunkan kualitas data yang dihasilkan.

---

## 2. Pernyataan Masalah

| Kode | Masalah | Dampak Langsung | Dampak Tidak Langsung |
|---|---|---|---|
| M-01 | Pencatatan manual di buku register dan kartu KMS rentan hilang, rusak, dan sulit dicari | Data peserta tidak bisa diakses cepat saat pelayanan | Riwayat pertumbuhan tidak terdokumentasi dengan baik |
| M-02 | Kader harus menghitung usia balita dan z-score status gizi secara manual menggunakan tabel | Risiko kesalahan kalkulasi tinggi, waktu pelayanan per peserta 5–7 menit | Kasus stunting bisa salah diklasifikasikan |
| M-03 | Pembuatan laporan bulanan memakan waktu 2–4 jam per kader dengan cara rekap manual | Kader kelelahan, laporan sering tidak tepat waktu | Keterlambatan intervensi program gizi desa |
| M-04 | Tidak ada sistem peringatan dini untuk balita berisiko (2T, gizi buruk) | Penanganan terlambat dilakukan | Angka stunting tidak tertangani sejak dini |
| M-05 | Pemangku kepentingan (Kades, PKK, Bidan) tidak dapat memantau data real-time | Intervensi lambat dan tidak berbasis data | Pengambilan keputusan tidak akurat |
| M-06 | Ketidakhadiran sasaran berturut-turut tidak terdeteksi secara sistematis | Sasaran absen tidak difollow-up | Dropout rate pelayanan tinggi |
| M-07 | Data imunisasi tidak terpadu dengan data pertumbuhan dan kunjungan | Status imunisasi sulit diverifikasi cross-referensi | Potensi anak belum imunisasi tidak terdeteksi |
| M-08 | Tidak ada pemisahan hak akses — semua kader bisa ubah semua data | Risiko data diubah tidak bertanggung jawab | Integritas data tidak terjamin |

---

## 3. Tujuan Produk

### 3.1 Tujuan Primer
1. Mendigitalisasi seluruh alur pencatatan Posyandu ILP mulai dari registrasi keluarga hingga laporan bulanan.
2. Mengotomasi semua perhitungan yang sebelumnya dilakukan manual: usia, z-score, status gizi, status pertumbuhan.
3. Menghasilkan laporan bulanan PDF secara otomatis tanpa rekap manual oleh kader.
4. Menyediakan sistem peringatan dini berbasis data untuk sasaran berisiko.

### 3.2 Tujuan Sekunder
1. Menyediakan dashboard monitoring real-time untuk Kepala Desa, TP PKK, dan Bidan Desa.
2. Menjadi sistem yang dapat dikembangkan dan diadopsi Posyandu lain di Kota Batu.
3. Menjadi karya portofolio pengembang yang menunjukkan kemampuan full-stack development dan domain knowledge kesehatan masyarakat.

---

## 4. Ruang Lingkup

### 4.1 Dalam Ruang Lingkup (In Scope — Fase 1 & 2)
- Manajemen data keluarga dan anggota keluarga
- Klasifikasi otomatis sasaran berdasarkan usia dan kondisi
- Alur pelayanan 5 meja lengkap untuk semua kategori sasaran
- Pemantauan pertumbuhan balita (BB/U, TB/U, BB/TB) berbasis standar WHO 2006
- Jadwal imunisasi dasar dan tracking status imunisasi
- Pencatatan dan pemantauan risiko ibu hamil
- Skrining lansia (TD, GDS, IMT, LILA)
- Analisis otomatis dan deteksi risiko
- Verifikasi data oleh Bidan Desa
- Laporan otomatis bulanan (PDF + on-screen)
- Dashboard per peran pengguna
- Notifikasi in-app untuk sasaran berisiko
- Multi-user dengan RBAC (Role-Based Access Control)
- Riwayat lengkap kunjungan per individu

### 4.2 Di Luar Ruang Lingkup (Out of Scope — Fase Mendatang)
- Notifikasi WhatsApp / SMS otomatis ke warga
- Aplikasi Android native (hanya web responsive)
- Integrasi dengan sistem Puskesmas, SIMKES, atau e-kohort Kemenkes (di luar ekosistem RW 06)
- Peta distribusi geografis sasaran
- Fitur pembayaran atau iuran
- Multi-tenant / multi-Posyandu dalam satu instance
- Mode offline-first (PWA dengan sinkronisasi)

### 4.3 Masuk Ruang Lingkup — Fase 4: Integrasi SINDUKSADATI *(Baru v3.0.0)*
- Integrasi identitas warga dengan **SINDUKSADATI** sebagai *Single Source of Truth* kependudukan RW 06
- Konsumsi API SINDUKSADATI untuk lookup warga, keluarga, dan KK saat registrasi
- Linking `anggota_id` SIPANDU ke `penduduk_id` SINDUKSADATI (identifier mapping)
- Sinkronisasi lifecycle warga: kelahiran baru, kematian, pindah domisili (event-driven)
- Ekspor ringkasan data kesehatan SIPANDU ke endpoint **Citizen 360** SINDUKSADATI

---

## 5. User Personas & Peran

### 5.1 Kader Posyandu (Peran: `kader`)

**Profil:**
- Relawan terlatih, biasanya ibu rumah tangga berusia 25–50 tahun
- Keahlian digital: Rendah–Menengah (familiar WhatsApp, belum tentu familiar form web)
- Menggunakan smartphone Android, jarang menggunakan laptop
- Bekerja di bawah tekanan waktu saat hari H Posyandu (banyak peserta antri)

**Pain Points Saat Ini:**
- Harus mencari nama di buku register fisik yang tebal
- Menghitung usia balita secara manual atau menggunakan kalkulator
- Membuat rekap di Excel setelah hari H hingga larut malam

**Kebutuhan Utama:**
- Antarmuka yang sangat sederhana: satu alur, tidak ada pilihan membingungkan
- Tidak ada input data ganda
- Tidak ada perhitungan manual
- Bisa dioperasikan dengan satu tangan di smartphone

**Ekspektasi Sistem:**
- Cari peserta → tap → data muncul → input ukuran → simpan → selesai
- Semua status dan rekomendasi muncul otomatis

---

### 5.2 Bidan Desa (Peran: `bidan`)

**Profil:**
- Tenaga kesehatan profesional (D3/S1 Kebidanan)
- Keahlian digital: Menengah–Tinggi
- Bertanggung jawab atas kualitas data dan validitas medis

**Pain Points Saat Ini:**
- Tidak bisa memantau data posyandu secara real-time
- Harus hadir fisik untuk cek data, tidak bisa remote
- Tidak ada sistem yang membantu identifikasi cepat sasaran risiko tinggi

**Kebutuhan Utama:**
- Bisa validasi data dari mana saja (remote)
- Dashboard yang menunjukkan sasaran berisiko secara langsung
- Bisa menambahkan catatan klinis tanpa menghapus catatan kader

---

### 5.3 Ketua TP PKK Desa (Peran: `ketua_pkk`)

**Profil:**
- Pemimpin organisasi PKK, latar belakang non-teknis
- Keahlian digital: Rendah–Menengah
- Membutuhkan informasi capaian program untuk laporan ke kecamatan

**Kebutuhan Utama:**
- Dashboard visual yang mudah dibaca tanpa pelatihan khusus
- Data capaian kegiatan, PMT, dan angka stunting
- Tidak perlu input data apapun

---

### 5.4 Kepala Desa (Peran: `kepala_desa`)

**Profil:**
- Pejabat desa, latar belakang non-teknis
- Keahlian digital: Rendah–Menengah
- Membutuhkan gambaran besar untuk pengambilan keputusan anggaran dan program desa

**Kebutuhan Utama:**
- Angka-angka kunci yang mudah dipahami (jumlah, persentase, tren)
- Status stunting dan sasaran prioritas intervensi
- Tidak perlu input data apapun

---

### 5.5 Super Admin (Peran: `super_admin`)

**Profil:**
- Pengembang atau pengelola sistem yang ditunjuk
- Keahlian digital: Tinggi

**Kebutuhan Utama:**
- Akses penuh konfigurasi sistem
- Manajemen pengguna dan peran
- Kemampuan audit log

---

## 6. RBAC Matrix

| Fitur / Aksi | Super Admin | Kader | Bidan | Ketua PKK | Kepala Desa |
|---|:---:|:---:|:---:|:---:|:---:|
| Kelola profil Posyandu | ✅ | ❌ | ❌ | ❌ | ❌ |
| Kelola struktur organisasi | ✅ | ❌ | ❌ | ❌ | ❌ |
| Kelola pengguna | ✅ | ❌ | ❌ | ❌ | ❌ |
| Tambah keluarga baru | ✅ | ✅ | ✅ | ❌ | ❌ |
| Edit data keluarga | ✅ | ✅ | ❌ | ❌ | ❌ |
| Tambah anggota keluarga | ✅ | ✅ | ✅ | ❌ | ❌ |
| Edit data anggota | ✅ | ✅ | ❌ | ❌ | ❌ |
| Buat jadwal posyandu | ✅ | ✅ | ❌ | ❌ | ❌ |
| Jalankan alur 5 meja | ✅ | ✅ | ✅ | ❌ | ❌ |
| Lihat semua data kunjungan | ✅ | ✅* | ✅ | ❌ | ❌ |
| Tambah catatan klinis | ✅ | ✅ | ✅ | ❌ | ❌ |
| Validasi / verifikasi data | ✅ | ❌ | ✅ | ❌ | ❌ |
| Generate laporan PDF | ✅ | ✅ | ✅ | ❌ | ❌ |
| Dashboard monitoring kesehatan | ✅ | ❌ | ✅ | ❌ | ❌ |
| Dashboard PKK | ✅ | ❌ | ❌ | ✅ | ❌ |
| Dashboard Kepala Desa | ✅ | ❌ | ❌ | ❌ | ✅ |
| Audit log | ✅ | ❌ | ❌ | ❌ | ❌ |

*Kader hanya bisa lihat data kunjungan yang berstatus Draft (belum divalidasi Bidan).

---

## 7. Alur Sistem Utama

```
┌─────────────────────────────────────────────────────────────┐
│                    SETUP AWAL (Sekali)                       │
│  Profil Posyandu → Struktur Organisasi → Akun Pengguna       │
└─────────────────────────┬───────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│              DATA MASTER (Berkelanjutan)                     │
│  Input KK → Input Anggota → Klasifikasi Otomatis            │
└─────────────────────────┬───────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│           PRA-POSYANDU (H-7 sampai H-1)                     │
│  Buat Jadwal → Generate Daftar Sasaran → Identifikasi       │
│  Sasaran Prioritas (tidak hadir 2+ bulan)                   │
└─────────────────────────┬───────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                    HARI H POSYANDU                           │
│                                                             │
│  MEJA 1          MEJA 2         MEJA 3                      │
│  Registrasi  →  Pengukuran  →  Pencatatan                   │
│  (Check-in)     (Antropometri)  (Otomatis)                  │
│                     ↓                                       │
│                 Kalkulasi                                   │
│                 Z-score +                                   │
│                 Status Gizi                                 │
│                 (Otomatis)                                  │
│                                                             │
│  MEJA 4                    MEJA 5                           │
│  Pelayanan Kesehatan  →  Penyuluhan                         │
│  (Checklist per                                             │
│   kategori)                                                 │
└─────────────────────────┬───────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│              PASCA POSYANDU (H+1 sampai H+3)                │
│  Analisis Otomatis → Deteksi Risiko → Notifikasi Bidan      │
│  Verifikasi Bidan → Status: Draft → Valid                   │
└─────────────────────────┬───────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                  PELAPORAN & MONITORING                      │
│  Generate Laporan PDF → Dashboard Real-time                 │
│  (Bidan, PKK, Kepala Desa)                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. User Stories

### 8.1 Kader Posyandu

| Kode | User Story | Acceptance Criteria |
|---|---|---|
| US-K01 | Sebagai Kader, saya ingin login dengan email dan password agar dapat mengakses sistem dengan aman. | Login berhasil → redirect ke dashboard kader. Login gagal → pesan error jelas. |
| US-K02 | Sebagai Kader, saya ingin menambahkan data keluarga baru dengan nomor KK agar database penduduk lengkap. | Form validasi NIK 16 digit. Nomor KK duplikat ditolak dengan pesan error. |
| US-K03 | Sebagai Kader, saya ingin menambahkan anggota keluarga beserta tanggal lahirnya agar sistem bisa mengklasifikasikan secara otomatis. | Setelah input tanggal lahir, sistem langsung tampilkan usia dan kategori sasaran. |
| US-K04 | Sebagai Kader, saya ingin mencari peserta posyandu via nama atau NIK agar registrasi hari H lebih cepat. | Hasil pencarian muncul < 1 detik. Tampilkan nama, foto (jika ada), usia, dan kategori. |
| US-K05 | Sebagai Kader, saya ingin klik "Daftar Hadir" untuk menandai peserta hadir agar data kehadiran terekam otomatis. | Sistem mencatat timestamp kehadiran. Peserta muncul di daftar hadir. |
| US-K06 | Sebagai Kader, saya ingin menginput berat badan dan tinggi badan balita agar status gizi terhitung otomatis. | Setelah simpan: tampil z-score BB/U, TB/U, BB/TB, status gizi, dan perbandingan bulan lalu. |
| US-K07 | Sebagai Kader, saya ingin melihat riwayat pengukuran bulan lalu saat menginput pengukuran baru agar bisa membandingkan. | Sisi kanan/bawah form tampilkan: BB bulan lalu, TB bulan lalu, status bulan lalu. |
| US-K08 | Sebagai Kader, saya ingin mencentang layanan yang diberikan (Vitamin A, PMT, Imunisasi) agar tercatat tanpa input panjang. | Checklist per kategori. Simpan satu klik. Data masuk ke laporan otomatis. |
| US-K09 | Sebagai Kader, saya ingin menambahkan catatan keluhan peserta agar Bidan bisa membaca temuan dari lapangan. | Textarea catatan tersedia di Meja 3. Data tersimpan dan visible untuk Bidan. |
| US-K10 | Sebagai Kader, saya ingin melihat daftar sasaran yang belum hadir agar bisa melakukan follow-up kunjungan rumah. | Daftar tersedia di dashboard pasca posyandu, dapat difilter per kategori. |
| US-K11 | Sebagai Kader, saya ingin men-generate laporan bulanan dengan satu klik agar tidak perlu rekap manual. | Klik "Generate Laporan" → PDF siap download dalam < 5 detik. |
| US-K12 | Sebagai Kader, saya ingin melihat daftar balita yang terdeteksi 2T agar bisa diprioritaskan untuk intervensi. | Daftar muncul otomatis setelah sesi posyandu selesai. |

---

### 8.2 Bidan Desa

| Kode | User Story | Acceptance Criteria |
|---|---|---|
| US-B01 | Sebagai Bidan, saya ingin melihat semua data kunjungan hari H dari jarak jauh agar bisa memantau tanpa harus hadir fisik. | Semua data kunjungan berstatus Draft visible di dashboard Bidan. |
| US-B02 | Sebagai Bidan, saya ingin memvalidasi data kunjungan dan mengubah statusnya menjadi "Valid" agar laporan resmi bisa digenerate. | Tombol "Validasi" tersedia. Setelah klik → status berubah ke Valid. |
| US-B03 | Sebagai Bidan, saya ingin menambahkan catatan klinis pada kunjungan peserta agar temuan medis terdokumentasi terpisah dari catatan kader. | Field catatan Bidan terpisah dari catatan Kader. Keduanya tampil di riwayat. |
| US-B04 | Sebagai Bidan, saya ingin melihat daftar ibu hamil dengan risiko tinggi agar bisa memprioritaskan konsultasi lanjutan. | Dashboard menampilkan list bumil berisiko dengan detail jenis risiko dan nama. |
| US-B05 | Sebagai Bidan, saya ingin melihat grafik pertumbuhan balita per individu agar dapat mengevaluasi tren pertumbuhan. | Grafik garis BB dan TB per bulan tersedia di halaman profil anggota. |
| US-B06 | Sebagai Bidan, saya ingin melihat daftar balita dengan status gizi buruk atau stunting agar bisa ditindaklanjuti segera. | List balita bermasalah tampil di dashboard dengan filter berdasarkan jenis masalah. |
| US-B07 | Sebagai Bidan, saya ingin melihat status imunisasi setiap bayi/balita agar bisa memantau kelengkapan imunisasi. | Halaman profil anggota menampilkan tabel status imunisasi lengkap. |

---

### 8.3 Ketua TP PKK Desa

| Kode | User Story | Acceptance Criteria |
|---|---|---|
| US-P01 | Sebagai Ketua PKK, saya ingin melihat jumlah kegiatan posyandu yang berjalan bulan ini agar bisa dilaporkan ke kecamatan. | Dashboard menampilkan angka kegiatan bulan berjalan dengan status masing-masing. |
| US-P02 | Sebagai Ketua PKK, saya ingin melihat capaian D/S (hadir/sasaran) agar bisa mengevaluasi kinerja posyandu. | Dashboard menampilkan persentase D/S per kategori dengan visualisasi grafis. |
| US-P03 | Sebagai Ketua PKK, saya ingin melihat jumlah anak yang menerima PMT agar bisa lapor capaian program PMT. | Angka PMT per bulan tampil di dashboard. |
| US-P04 | Sebagai Ketua PKK, saya ingin melihat angka stunting terkini agar bisa memantau tren program gizi. | Angka dan persentase stunting tampil dengan perbandingan bulan sebelumnya. |

---

### 8.4 Kepala Desa

| Kode | User Story | Acceptance Criteria |
|---|---|---|
| US-KD01 | Sebagai Kepala Desa, saya ingin melihat jumlah total sasaran (balita, bumil, lansia) agar tahu populasi yang dilayani. | Dashboard menampilkan angka per kategori sasaran. |
| US-KD02 | Sebagai Kepala Desa, saya ingin melihat angka stunting dan tren bulanan agar bisa memutuskan alokasi anggaran. | Grafik tren stunting 6 bulan terakhir tersedia di dashboard. |
| US-KD03 | Sebagai Kepala Desa, saya ingin melihat capaian layanan per bulan agar bisa mengevaluasi program kesehatan desa. | Ringkasan capaian (D/S, imunisasi, PMT) tampil per bulan. |

---

### 8.5 Super Admin

| Kode | User Story | Acceptance Criteria |
|---|---|---|
| US-A01 | Sebagai Admin, saya ingin menambahkan pengguna baru dan menetapkan perannya agar akses sistem terkontrol. | Form tambah user dengan dropdown peran. Email undangan terkirim. |
| US-A02 | Sebagai Admin, saya ingin menonaktifkan akun kader yang tidak lagi aktif agar sistem tetap aman. | Toggle aktif/nonaktif tersedia. Akun nonaktif tidak bisa login. |
| US-A03 | Sebagai Admin, saya ingin melihat audit log aktivitas pengguna agar bisa mendeteksi aktivitas mencurigakan. | Tabel log menampilkan: waktu, pengguna, aksi, data yang diubah. |
| US-A04 | Sebagai Admin, saya ingin mengkonfigurasi profil Posyandu dan struktur organisasi agar data laporan selalu akurat. | Semua field profil bisa diedit. Perubahan otomatis terefleksi di laporan baru. |

---

## 9. Spesifikasi Fitur Lengkap

### F-01 — Manajemen Profil & Organisasi Posyandu
**Prioritas:** P0 | **Peran:** Super Admin

#### F-01.1 Data Profil Posyandu
| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| Nama Posyandu | Text | Ya | Maks 100 karakter |
| RW | Text | Ya | Format: angka |
| Desa/Kelurahan | Text | Ya | |
| Kecamatan | Text | Ya | |
| Kota/Kabupaten | Text | Ya | |
| Nomor Telepon | Text | Tidak | Format telepon Indonesia |
| Jadwal Hari | Select | Ya | Enum hari |
| Jadwal Waktu Mulai | Time | Ya | |
| Jadwal Waktu Selesai | Time | Ya | |
| Jumlah Kader Aktif | Number | Tidak | Auto-count dari tabel users |

#### F-01.2 Struktur Organisasi
| Jabatan | Field |
|---|---|
| Kepala Desa | Nama, Gelar |
| Ketua TP PKK Desa | Nama, Gelar |
| Bidan Desa | Nama, NIP/SIP |
| Ketua Posyandu | Nama |
| Kader (multiple) | Nama, Tugas Utama |

**Aturan bisnis:**
- Data struktur organisasi digunakan otomatis sebagai kop dan tanda tangan pada laporan PDF.
- Setiap jabatan hanya dapat diisi oleh satu orang, kecuali Kader (multiple).
- Perubahan pada data organisasi tidak memengaruhi laporan yang sudah digenerate (snapshot).

---

### F-02 — Manajemen Data Keluarga
**Prioritas:** P0 | **Peran:** Kader, Admin

#### F-02.1 Input Data Keluarga
| Field | Tipe | Wajib | Validasi |
|---|---|---|---|
| Nomor KK | Text | Ya | 16 digit angka, unik |
| Nama Kepala Keluarga | Text | Ya | 2–100 karakter |
| Alamat Lengkap | Textarea | Ya | Maks 255 karakter |
| RT | Text | Ya | 2–3 digit angka |
| RW | Text | Ya | 2–3 digit angka |

**Aturan bisnis:**
- Sistem mencari Nomor KK yang sama sebelum membuat entri baru.
- Jika ditemukan: tampilkan modal konfirmasi "Keluarga dengan KK ini sudah terdaftar. Apakah Anda ingin melihat data keluarga tersebut?"
- Jika tidak ditemukan: lanjutkan ke form input.

#### F-02.2 Pencarian Keluarga
Pencarian dapat dilakukan via:
- Nomor KK (exact match)
- Nama Kepala Keluarga (partial match, case-insensitive)
- Nama Anggota Keluarga (partial match)
- NIK anggota (exact match)

---

### F-03 — Manajemen Anggota Keluarga
**Prioritas:** P0 | **Peran:** Kader, Admin

#### F-03.1 Input Data Anggota
| Field | Tipe | Wajib | Validasi |
|---|---|---|---|
| NIK | Text | Ya | 16 digit angka, unik |
| Nama Lengkap | Text | Ya | 2–100 karakter |
| Tanggal Lahir | Date | Ya | Tidak boleh di masa depan, tidak > 120 tahun lalu |
| Jenis Kelamin | Select | Ya | Laki-laki / Perempuan |
| Hubungan dengan KK | Select | Ya | Lihat enum di bawah |
| Status Aktif | Boolean | Ya | Default: aktif |

**Enum Hubungan dengan KK:**
`Kepala Keluarga | Istri | Anak | Menantu | Cucu | Orang Tua | Mertua | Saudara | Pembantu | Lainnya`

#### F-03.2 Kalkulasi Otomatis dari Tanggal Lahir
Setelah tanggal lahir diinput, sistem langsung menampilkan (tanpa simpan):
- **Usia dalam tahun dan bulan:** format "X Tahun Y Bulan" (untuk < 5 tahun), "X Tahun" (untuk ≥ 5 tahun)
- **Usia dalam bulan (total):** digunakan untuk z-score
- **Hari lahir:** nama hari dalam Bahasa Indonesia
- **Kategori sasaran:** Bayi / Balita / WUS / Lansia (otomatis)
- **Layanan yang akan didapatkan:** preview teks singkat

#### F-03.3 Penanda Status Hamil
- Status hamil diinput secara manual oleh kader dengan toggle "Sedang Hamil".
- Jika diaktifkan, sistem akan membuat entri di tabel `kehamilan` dan mengubah kategori anggota menjadi "Ibu Hamil" (override usia).
- Kader harus mengisi: HPHT (Hari Pertama Haid Terakhir).
- Sistem otomatis menghitung: Usia Kehamilan (dalam minggu) dan Taksiran Persalinan (HPL).

---

### F-04 — Klasifikasi Sasaran Otomatis
**Prioritas:** P0 | **Peran:** Sistem (otomatis)

#### Tabel Klasifikasi
| Kondisi | Prioritas Evaluasi | Kategori | Layanan Utama |
|---|---|---|---|
| Status hamil aktif = true | 1 (tertinggi) | Ibu Hamil | ANC, TD, Tablet Fe, TT |
| Usia 0–11 bulan | 2 | Bayi | Imunisasi, Timbang, ASI |
| Usia 12–59 bulan | 3 | Balita | Timbang, Vitamin A, PMT |
| Jenis kelamin P + usia 15–49 tahun (tidak hamil) | 4 | WUS | Skrining, LILA, Tablet Fe |
| Usia ≥ 60 tahun | 5 | Lansia | TD, GDS, Skrining |
| Selain semua kondisi di atas | 6 | Umum | Tidak termasuk sasaran rutin |

**Aturan bisnis:**
- Klasifikasi dievaluasi ulang setiap kali halaman profil anggota dibuka (real-time berdasarkan tanggal sekarang).
- Kategori tersimpan di database sebagai cache dan diperbarui saat ada perubahan data anggota.
- Saat status hamil dinonaktifkan (pasca persalinan), kategori kembali ke perhitungan usia.

---

### F-05 — Pra-Posyandu: Penjadwalan
**Prioritas:** P0 | **Peran:** Kader, Admin

#### F-05.1 Form Buat Jadwal
| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| Tanggal | Date | Ya | Tidak boleh di masa lalu |
| Jenis Kegiatan | Select | Ya | Bulanan / Tambahan / Khusus |
| Tempat | Text | Tidak | Default: nama Posyandu |
| Catatan | Textarea | Tidak | |

#### F-05.2 Generate Daftar Sasaran
Setelah jadwal dibuat, sistem otomatis:
1. Mengambil semua anggota aktif yang merupakan sasaran ILP (bukan kategori "Umum").
2. Mengelompokkan per kategori: Bayi, Balita, Ibu Hamil, WUS, Lansia.
3. Menandai sasaran prioritas:
   - Tidak hadir pada posyandu bulan lalu (1 bulan absen)
   - Tidak hadir pada 2 posyandu terakhir (2 bulan absen — prioritas tinggi)
   - Balita dengan status 2T pada kunjungan terakhir
   - Bumil dengan risiko pada kunjungan terakhir
4. Menampilkan total sasaran per kategori.

---

### F-06 — Alur Pelayanan 5 Meja
**Prioritas:** P0 | **Peran:** Kader

#### Meja 1 — Registrasi Digital

**Alur:**
1. Kader membuka menu "Hari H Posyandu" → pilih jadwal aktif.
2. Kader mencari peserta via kolom pencarian (NIK, nama, atau nomor KK).
3. Sistem menampilkan kartu peserta: nama, foto (jika ada), usia, kategori, orang tua (untuk balita), riwayat terakhir (BB, TB, status gizi).
4. Kader menekan tombol "Daftar Hadir".
5. Sistem membuat entri `kunjungan` dengan timestamp otomatis.
6. Peserta muncul di daftar "Sudah Hadir" di halaman sesi.

**Edge Case:**
- Peserta datang tanpa bisa dicari (nama tidak terdaftar): kader bisa tambah data keluarga/anggota baru langsung dari halaman ini tanpa keluar dari sesi.
- Peserta sudah terdaftar hadir (klik dua kali): sistem menampilkan pesan "Peserta sudah terdaftar hadir hari ini" dan tidak membuat duplikat.

---

#### Meja 2 — Pengukuran & Antropometri

**Input per Kategori Sasaran:**

**A. Bayi (0–11 bulan) & Balita (12–59 bulan):**
| Parameter | Tipe | Wajib | Satuan | Range Valid |
|---|---|---|---|---|
| Berat Badan | Decimal | Ya | kg | 0.5–50 |
| Panjang Badan (< 2 tahun) | Decimal | Kondisional | cm | 30–120 |
| Tinggi Badan (≥ 2 tahun) | Decimal | Kondisional | cm | 50–150 |
| Lingkar Kepala (< 2 tahun) | Decimal | Tidak | cm | 25–60 |
| Lingkar Lengan Atas | Decimal | Tidak | cm | 8–25 |

*Sistem otomatis menampilkan field Panjang Badan untuk usia < 2 tahun dan Tinggi Badan untuk usia ≥ 2 tahun.*

**B. Ibu Hamil:**
| Parameter | Tipe | Wajib | Satuan | Range Valid |
|---|---|---|---|---|
| Berat Badan | Decimal | Ya | kg | 30–150 |
| Lingkar Lengan Atas (LILA) | Decimal | Ya | cm | 15–40 |
| Tekanan Darah Sistolik | Integer | Ya | mmHg | 60–250 |
| Tekanan Darah Diastolik | Integer | Ya | mmHg | 40–150 |
| Tinggi Fundus Uteri | Decimal | Tidak | cm | |
| Denyut Jantung Janin (DJJ) | Integer | Tidak | bpm | |

**C. Lansia (≥ 60 tahun):**
| Parameter | Tipe | Wajib | Satuan | Range Valid |
|---|---|---|---|---|
| Berat Badan | Decimal | Tidak | kg | 20–200 |
| Tinggi Badan | Decimal | Tidak | cm | 100–220 |
| Lingkar Perut | Decimal | Tidak | cm | 40–200 |
| Tekanan Darah Sistolik | Integer | Ya | mmHg | 60–300 |
| Tekanan Darah Diastolik | Integer | Ya | mmHg | 40–200 |
| Gula Darah Sewaktu (GDS) | Integer | Tidak | mg/dL | 20–600 |

**D. WUS (Non-hamil, 15–49 tahun):**
| Parameter | Tipe | Wajib | Satuan | Range Valid |
|---|---|---|---|---|
| Berat Badan | Decimal | Tidak | kg | 20–200 |
| Tinggi Badan | Decimal | Tidak | cm | 100–220 |
| LILA | Decimal | Tidak | cm | 15–40 |

**Setelah input data Balita/Bayi dan klik Simpan — Sistem otomatis menghitung & menampilkan:**
- Usia dalam bulan (pada tanggal kunjungan)
- Z-score BB/U, TB/U, BB/TB (lihat Bab 11)
- Status gizi (Gizi Buruk / Kurang / Normal / Lebih / Obesitas)
- Status pertumbuhan vs bulan lalu (Naik / Tidak Naik / Turun)
- Selisih BB: "+X kg" atau "−X kg" dari bulan lalu
- Flag risiko (jika ada): 2T, Gizi Buruk, Stunting

---

#### Meja 3 — Pencatatan Digital

**Prinsip:** Tidak ada input ulang. Semua data dari Meja 1 dan Meja 2 otomatis masuk ke halaman ini.

**Yang ditampilkan otomatis:**
- Identitas peserta (dari Meja 1)
- Hasil pengukuran dan status gizi (dari Meja 2)
- Riwayat kunjungan 3 bulan terakhir

**Yang diinput kader di Meja 3:**
| Field | Tipe | Keterangan |
|---|---|---|
| Keluhan Utama | Textarea | Keluhan yang disampaikan peserta/orang tua |
| Temuan | Textarea | Temuan kader dari observasi fisik sederhana |
| Catatan Khusus | Textarea | Catatan tambahan lainnya |

---

#### Meja 4 — Pelayanan Kesehatan

**Checklist per Kategori:**

**A. Balita:**
| Layanan | Tipe Input | Keterangan |
|---|---|---|
| Vitamin A | Checkbox | Otomatis muncul di bulan Februari dan Agustus |
| PMT (Pemberian Makanan Tambahan) | Checkbox + Select jenis | Jenis: Biskuit / Makanan Lokal / Lainnya |
| Imunisasi | Checkbox + Select jenis | Jenis sesuai jadwal (lihat Bab 10) |
| Konseling Gizi | Checkbox | |
| Rujukan | Checkbox + Text alasan | Muncul otomatis jika ada flag risiko |

**B. Ibu Hamil:**
| Layanan | Tipe Input | Keterangan |
|---|---|---|
| Tablet Fe | Checkbox + Number jumlah | Dalam tablet |
| Imunisasi TT | Checkbox + Select TT ke- | TT1 / TT2 / TT3 / TT4 / TT5 |
| Kapsul Vitamin A | Checkbox | Untuk ibu nifas |
| Konseling | Checkbox | |
| Rujukan | Checkbox + Text | |

**C. Lansia:**
| Layanan | Tipe Input | Keterangan |
|---|---|---|
| Pemeriksaan Tekanan Darah | Checkbox (auto-checked jika diukur) | |
| Pemeriksaan Gula Darah | Checkbox (auto-checked jika diukur) | |
| Konseling | Checkbox | |
| Rujukan | Checkbox + Text | |
| Obat Rutin | Text | Nama obat yang diberikan |

**D. WUS:**
| Layanan | Tipe Input | Keterangan |
|---|---|---|
| Skrining Anemia | Checkbox | |
| Tablet Fe | Checkbox + Number | |
| Konseling Reproduksi | Checkbox | |

---

#### Meja 5 — Penyuluhan

| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| Tema Penyuluhan | Text | Ya | Maks 200 karakter |
| Narasumber | Text | Ya | |
| Jumlah Peserta | Integer | Ya | > 0 |
| Metode | Select | Tidak | Ceramah / Demonstrasi / Diskusi / Lainnya |
| Media | Text | Tidak | Contoh: leaflet, poster, video |
| Ringkasan Materi | Textarea | Tidak | |

---

### F-07 — Analisis Otomatis & Deteksi Risiko
**Prioritas:** P0 | **Peran:** Sistem (otomatis setelah simpan)

#### Aturan Deteksi Risiko Balita

| Kode | Kondisi | Trigger | Output | Tindak Lanjut |
|---|---|---|---|---|
| R-B01 | BB tidak naik atau turun 1 bulan | Input pengukuran | Status: "T" (Tidak Naik) | Catatan konseling |
| R-B02 | BB tidak naik 2 bulan berturut-turut | Input pengukuran bulan ke-2 | Status: "2T", flag merah | Rekomendasi kunjungan rumah |
| R-B03 | Z-score BB/U < -3 SD | Input pengukuran | Flag: "Gizi Buruk" | Notifikasi Bidan, rujukan prioritas |
| R-B04 | Z-score BB/U -3 s.d -2 SD | Input pengukuran | Flag: "Gizi Kurang" | Rekomendasi PMT |
| R-B05 | Z-score TB/U < -3 SD | Input pengukuran | Flag: "Stunting Berat" | Notifikasi Bidan |
| R-B06 | Z-score TB/U -3 s.d -2 SD | Input pengukuran | Flag: "Stunting" | Rekomendasi konseling |
| R-B07 | Tidak hadir 1 bulan | Tutup sesi posyandu | Masuk daftar "Absen 1 Bulan" | Reminder follow-up |
| R-B08 | Tidak hadir 2 bulan berturut-turut | Tutup sesi posyandu | Masuk daftar "Absen 2 Bulan", flag oranye | Kunjungan rumah wajib |
| R-B09 | Imunisasi terlambat | Kalkulasi jadwal imunisasi | Flag: "Imunisasi Tertunggak" | Prioritas imunisasi bulan ini |

#### Aturan Deteksi Risiko Ibu Hamil

| Kode | Kondisi | Trigger | Output | Tindak Lanjut |
|---|---|---|---|---|
| R-H01 | Tekanan darah ≥ 140/90 mmHg | Input pengukuran | Flag: "Hipertensi Kehamilan" | Notifikasi Bidan, rujukan |
| R-H02 | LILA < 23,5 cm | Input pengukuran | Flag: "KEK (Kurang Energi Kronik)" | PMT Bumil, konseling gizi |
| R-H03 | Kenaikan BB < 1 kg/bulan trimester 2–3 | Input pengukuran | Flag: "Kenaikan BB Kurang" | Konseling gizi |
| R-H04 | Tidak periksa ANC ≥ 2 bulan | Tutup sesi posyandu | Flag: "ANC Tidak Rutin" | Follow-up aktif |
| R-H05 | Usia kehamilan ≥ 37 minggu | Kalkulasi otomatis | Notifikasi: "Mendekati HPL" | Persiapan persalinan |

#### Aturan Deteksi Risiko Lansia

| Kode | Kondisi | Trigger | Output | Tindak Lanjut |
|---|---|---|---|---|
| R-L01 | TD ≥ 160/100 mmHg | Input pengukuran | Flag: "Hipertensi Grade 2" | Rujukan Puskesmas |
| R-L02 | TD ≥ 140/90 mmHg | Input pengukuran | Flag: "Hipertensi Grade 1" | Konseling, pantau rutin |
| R-L03 | GDS ≥ 200 mg/dL | Input pengukuran | Flag: "Hiperglikemia" | Rujukan Puskesmas |
| R-L04 | GDS 140–199 mg/dL | Input pengukuran | Flag: "Prediabetes" | Konseling diet |
| R-L05 | IMT > 30 | Kalkulasi otomatis | Flag: "Obesitas" | Konseling gizi |
| R-L06 | Lingkar perut P > 80 cm / L > 90 cm | Input pengukuran | Flag: "Obesitas Sentral" | Konseling aktivitas |

---

### F-08 — Verifikasi Data Pasca Posyandu
**Prioritas:** P1 | **Peran:** Bidan

#### Status Alur Verifikasi
```
Draft (kader input) 
    → Diperiksa (bidan review)
    → Valid (bidan approve) 
    → [Laporan bisa digenerate]
```

**Aturan bisnis:**
- Semua kunjungan baru otomatis berstatus "Draft".
- Bidan dapat memvalidasi per kunjungan individu atau bulk (semua kunjungan satu sesi).
- Laporan bulanan resmi hanya dapat digenerate jika semua kunjungan berstatus Valid.
- Jika ada catatan dari Bidan, status kembali ke "Draft" dan kader mendapat notifikasi.
- Data yang sudah Valid tidak bisa diubah oleh Kader (hanya Admin/Bidan yang bisa unlock).

---

### F-09 — Laporan Otomatis
**Prioritas:** P0 | **Peran:** Kader, Bidan, Admin

#### Daftar Laporan yang Tersedia

| Kode Laporan | Nama | Periode | Format | Isi |
|---|---|---|---|---|
| L-01 | Laporan Bulanan Posyandu | Per bulan | PDF + On-screen | Semua komponen |
| L-02 | Laporan Sasaran | Per bulan | PDF + On-screen | D/S per kategori |
| L-03 | Laporan Pertumbuhan Balita | Per bulan | PDF + On-screen | Naik/T/2T, stunting |
| L-04 | Laporan Pelayanan | Per bulan | PDF + On-screen | Vitamin A, PMT, Imunisasi |
| L-05 | Laporan Ibu Hamil | Per bulan | PDF + On-screen | Total, risiko, ANC |
| L-06 | Laporan Lansia | Per bulan | PDF + On-screen | Total, risiko |
| L-07 | Rekapitulasi Kumulatif | Per kuartal / per tahun | PDF | Tren semua indikator |
| L-08 | Daftar Hadir | Per sesi | PDF | List nama hadir |

#### Komponen Laporan Bulanan (L-01)
1. Kop surat dengan nama Posyandu, desa, kecamatan, kota
2. Bulan dan tahun laporan
3. Tabel sasaran: total, hadir (D), sasaran (S), persentase D/S
4. Tabel pertumbuhan balita: naik, T, 2T, stunting, gizi buruk
5. Tabel pelayanan: Vitamin A, PMT, imunisasi per jenis, tablet Fe
6. Tabel ibu hamil: total, risiko, ANC ke-
7. Tabel lansia: total, risiko hipertensi, DM
8. Catatan / rekomendasi (dari Bidan)
9. Kolom tanda tangan: Ketua Posyandu, Bidan Desa

**Teknologi generate PDF:** `@react-pdf/renderer` (server-side, Next.js Server Action)

---

### F-10 — Dashboard Monitoring
**Prioritas:** P1 | **Peran:** Berbeda per peran

#### Dashboard Kader
| Widget | Data | Update |
|---|---|---|
| Ringkasan hari ini | Hadir hari ini / Total sasaran | Real-time |
| Sasaran belum hadir | Daftar nama per kategori | Real-time |
| Balita berisiko | List 2T dan gizi buruk | Per sesi |
| Jadwal posyandu | Jadwal bulan ini dan bulan depan | Static |

#### Dashboard Bidan Desa
| Widget | Data | Update |
|---|---|---|
| Antrian verifikasi | Jumlah kunjungan Draft | Real-time |
| Balita bermasalah | List gizi buruk, stunting, 2T | Per sesi |
| Ibu hamil risiko tinggi | List dengan jenis risiko | Per sesi |
| Status imunisasi | % kelengkapan imunisasi | Per sesi |
| Grafik tren pertumbuhan | BB/U rata-rata per bulan | Per bulan |

#### Dashboard TP PKK
| Widget | Data | Update |
|---|---|---|
| Total kegiatan | Jumlah sesi posyandu bulan ini | Per bulan |
| Capaian D/S | Persentase kehadiran sasaran | Per bulan |
| Cakupan PMT | Jumlah anak penerima PMT | Per bulan |
| Angka stunting | Jumlah dan % dari total balita | Per bulan |
| Grafik D/S 6 bulan | Tren kehadiran | Per bulan |

#### Dashboard Kepala Desa
| Widget | Data | Update |
|---|---|---|
| Total sasaran | Balita, Bumil, Lansia | Per bulan |
| Status stunting | Jumlah, persentase, tren | Per bulan |
| Capaian layanan | D/S, imunisasi, PMT | Per bulan |
| Grafik tren stunting | 6 bulan terakhir | Per bulan |

---

### F-11 — Manajemen Pengguna & RBAC
**Prioritas:** P0 | **Peran:** Admin

#### F-11.1 Form Tambah Pengguna
| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| Nama Lengkap | Text | Ya | |
| Email | Email | Ya | Harus unik |
| Peran | Select | Ya | Enum peran |
| Status | Toggle | Ya | Default: aktif |

**Alur:** Admin input email → sistem kirim email undangan → pengguna buat password → aktif.

#### F-11.2 Aturan RBAC
- Setiap request ke API memvalidasi token JWT dari InsForge Auth.
- Peran tersimpan di tabel `users` dan di-claim dalam JWT.
- Row Level Security (RLS) di database memastikan kader hanya bisa akses data Posyandu-nya sendiri.
- Super Admin bypass semua RLS.

---

### F-12 — Notifikasi In-App
**Prioritas:** P2 | **Peran:** Sistem, Kader, Bidan

| Trigger | Penerima | Pesan |
|---|---|---|
| Balita Z-score BB/U < -3 SD | Kader + Bidan | "Balita [nama] terdeteksi gizi buruk. Segera lakukan rujukan." |
| Bumil TD ≥ 140/90 | Kader + Bidan | "Ibu [nama] memiliki tekanan darah tinggi. Rekomendasikan rujukan." |
| Balita 2T | Kader | "Balita [nama] tidak naik BB 2 bulan berturut-turut. Lakukan kunjungan rumah." |
| Sasaran absen 2 bulan | Kader | "[Nama] belum hadir selama 2 bulan. Lakukan kunjungan rumah." |
| Data tervalidasi Bidan | Kader | "Data kunjungan [tanggal] telah diverifikasi Bidan." |
| Data dikembalikan Bidan | Kader | "Data kunjungan [tanggal] perlu diperbaiki. Lihat catatan Bidan." |

**Implementasi:** Notifikasi disimpan di tabel `notifikasi` dan ditampilkan sebagai badge + dropdown di navbar. InsForge Realtime digunakan untuk push notifikasi real-time tanpa refresh.

---

## 10. Jadwal Imunisasi Dasar

Referensi: Permenkes RI No. 12 Tahun 2017 dan Jadwal Imunisasi Nasional terbaru.

| Usia | Jenis Imunisasi | Keterangan |
|---|---|---|
| 0–24 jam | Hepatitis B-0 (HB-0) | Diberikan di fasilitas persalinan |
| 1 bulan | BCG + Polio 1 | |
| 2 bulan | DPT-HB-Hib 1 + Polio 2 | |
| 3 bulan | DPT-HB-Hib 2 + Polio 3 | |
| 4 bulan | DPT-HB-Hib 3 + Polio 4 + IPV | |
| 9 bulan | MR (Campak-Rubella) 1 | |
| 18 bulan | DPT-HB-Hib 4 (Booster) + MR 2 | |

**Logika tracking imunisasi di sistem:**
- Sistem membuat checklist imunisasi untuk setiap anggota kategori Bayi/Balita.
- Status per jenis imunisasi: Belum / Sudah / Terlambat.
- "Terlambat" = usia saat ini > batas atas usia imunisasi tersebut dan belum diberikan.
- Kader mencentang imunisasi yang diberikan saat hari H.
- Sistem menampilkan imunisasi yang "seharusnya diberikan bulan ini" berdasarkan usia balita.

---

## 11. Standar Kalkulasi Z-Score WHO 2006

### 11.1 Referensi Standar
- **Standar:** WHO Child Growth Standards 2006
- **Regulasi:** Permenkes RI No. 2 Tahun 2020 tentang Standar Antropometri Anak
- **Tabel referensi:** WHO Anthro (L, M, S tables per usia dan jenis kelamin)

### 11.2 Formula Z-Score (Metode LMS)

```
Z-score = [(X / M)^L - 1] / (L × S)
```

**Keterangan:**
- **X** = nilai pengukuran anak
- **L** = nilai Box-Cox power transformation (dari tabel WHO)
- **M** = nilai median (dari tabel WHO)
- **S** = koefisien variasi generalized (dari tabel WHO)

*Untuk kasus di mana L mendekati 0, digunakan formula logaritmik:*
```
Z-score = ln(X/M) / S
```

### 11.3 Pembatasan Z-Score (WHO Cutoff)
Untuk menghindari outlier ekstrem, WHO membatasi z-score menggunakan SD3pos dan SD3neg:
```
Jika Z > 3: Z = 3 + [(X - SD3pos) / (SD4pos - SD3pos)]
Jika Z < -3: Z = -3 + [(X - SD3neg) / (SD3neg - SD4neg)]
```

### 11.4 Interpretasi Status Gizi

**BB/U (Berat Badan menurut Umur) — Untuk 0–60 bulan:**
| Z-Score | Status |
|---|---|
| < -3 SD | Berat Badan Sangat Kurang (Gizi Buruk) |
| -3 SD s.d < -2 SD | Berat Badan Kurang (Gizi Kurang) |
| -2 SD s.d +1 SD | Berat Badan Normal (Gizi Baik) |
| > +1 SD | Berat Badan Lebih (Risiko Gizi Lebih) |

**TB/U (Tinggi Badan menurut Umur) — Untuk 0–60 bulan:**
| Z-Score | Status |
|---|---|
| < -3 SD | Sangat Pendek (Stunting Berat) |
| -3 SD s.d < -2 SD | Pendek (Stunting) |
| -2 SD s.d +3 SD | Normal |
| > +3 SD | Tinggi |

**BB/TB (Berat Badan menurut Tinggi Badan) — Untuk 0–60 bulan:**
| Z-Score | Status |
|---|---|
| < -3 SD | Sangat Kurus (Wasting Berat) |
| -3 SD s.d < -2 SD | Kurus (Wasting) |
| -2 SD s.d +1 SD | Normal |
| +1 SD s.d +2 SD | Berisiko Gizi Lebih |
| +2 SD s.d +3 SD | Gizi Lebih (Overweight) |
| > +3 SD | Obesitas |

### 11.5 Implementasi Teknis

**Opsi implementasi (pilih satu):**

**Opsi A — Library siap pakai:**
```bash
npm install @whoicd/sdk-core
```
Package resmi WHO untuk kalkulasi z-score. Input: usia dalam hari, BB dalam gram, TB dalam mm. Output: z-score ketiga indikator.

**Opsi B — Custom kalkulasi dengan tabel LMS:**
- Import tabel LMS WHO (format CSV) ke database sebagai tabel `who_lms_reference`.
- Edge Function InsForge menerima: usia (bulan), BB (kg), TB (cm), jenis kelamin.
- Query tabel LMS sesuai usia dan jenis kelamin, hitung z-score menggunakan formula di atas.
- Return: `{ z_bbu, z_tbu, z_bbtb, status_bbu, status_tbu, status_bbtb }`.

**Rekomendasi:** Gunakan Opsi A untuk akurasi dan kemudahan maintenance.

### 11.6 Status Pertumbuhan (Bulan ke Bulan)

| Kondisi | Status |
|---|---|
| BB bulan ini > BB bulan lalu ≥ kenaikan minimum sesuai usia | Naik ✅ |
| BB bulan ini = BB bulan lalu | Tetap / Tidak Naik (T) ⚠️ |
| BB bulan ini < BB bulan lalu | Turun / Tidak Naik (T) ⚠️ |
| T pada 2 kunjungan berturut-turut | 2T 🔴 |
| Tidak ada data bulan lalu | Tidak bisa dihitung (tampilkan: "Data Baru") |

**Kenaikan BB minimum per usia (KMS Kemenkes):**
| Usia | Kenaikan Minimum/Bulan |
|---|---|
| 0–3 bulan | 600 g |
| 4–6 bulan | 500 g |
| 7–9 bulan | 400 g |
| 10–12 bulan | 300 g |
| 13–24 bulan | 200 g |
| 25–60 bulan | 200 g |

---

## 12. Spesifikasi Halaman & Sitemap

### 12.1 Sitemap Lengkap

```
/
├── /login
├── /dashboard                        ← Redirect sesuai peran
│
├── [KADER / ADMIN]
│   ├── /keluarga                     ← Daftar keluarga + search
│   ├── /keluarga/tambah              ← Form tambah keluarga
│   ├── /keluarga/[id]                ← Detail keluarga + daftar anggota
│   ├── /anggota/[id]                 ← Profil anggota + riwayat + grafik
│   ├── /anggota/[id]/edit            ← Edit data anggota
│   │
│   ├── /posyandu                     ← Daftar semua sesi posyandu
│   ├── /posyandu/buat                ← Form buat jadwal posyandu
│   ├── /posyandu/[id]                ← Detail sesi + daftar hadir
│   ├── /posyandu/[id]/meja-1         ← Registrasi kehadiran
│   ├── /posyandu/[id]/meja-2/[anggota_id]  ← Input pengukuran
│   ├── /posyandu/[id]/meja-3/[anggota_id]  ← Pencatatan (otomatis)
│   ├── /posyandu/[id]/meja-4/[anggota_id]  ← Checklist pelayanan
│   ├── /posyandu/[id]/meja-5         ← Input penyuluhan
│   ├── /posyandu/[id]/rekap          ← Rekap pasca sesi
│   │
│   └── /laporan                      ← Generate & lihat laporan
│       ├── /laporan/bulanan          ← Pilih bulan, generate PDF
│       └── /laporan/[id]             ← Preview laporan spesifik
│
├── [BIDAN]
│   ├── /monitoring/bidan             ← Dashboard bidan
│   ├── /monitoring/bidan/verifikasi  ← Antrian verifikasi data
│   ├── /monitoring/bidan/risiko      ← List sasaran berisiko
│   └── /monitoring/bidan/imunisasi   ← Status imunisasi
│
├── [KETUA PKK]
│   └── /monitoring/pkk               ← Dashboard PKK
│
├── [KEPALA DESA]
│   └── /monitoring/kades             ← Dashboard Kades
│
└── [ADMIN]
    └── /pengaturan
        ├── /pengaturan/profil        ← Profil Posyandu
        ├── /pengaturan/organisasi    ← Struktur organisasi
        ├── /pengaturan/pengguna      ← Manajemen akun & peran
        └── /pengaturan/audit-log     ← Log aktivitas
```

> **⚠ AMENDEMEN v3.0.1 (2026-09-06):** Sitemap di atas **tidak memetakan sitemap 1:1 ke menu sidebar**. Sidebar dirakit per peran sesuai kebutuhan (PRD §5): (1) Alur 5 meja TIDAK tampil sebagai item menu — semua meja hidup di halaman "Pelayanan (Hari H)" per sesi aktif; (2) KETUA PKK & KEPALA DESA tetap melihat **Data Keluarga dalam mode read-only** (di luar sitemap §12.1 — disengaja untuk konteks verifikasi data saat menyusun laporan kecamatan; data klinis tetap tersembunyi sesuai §39.2 dan terkunci di backend); (3) `/laporan` hanya untuk Kader/Bidan/Admin sesuai RBAC §6.

### 12.2 Detail Halaman Kritis

#### `/posyandu/[id]/meja-1` — Registrasi
**Layout:** Split screen (mobile: tab)
- Kiri/Tab 1: Search bar + hasil pencarian
- Kanan/Tab 2: Daftar hadir hari ini (real-time)

**Interaksi utama:**
1. Ketik nama/NIK → hasil muncul instant (debounce 300ms)
2. Klik hasil → modal konfirmasi dengan foto + detail
3. Klik "Daftar Hadir" → nama pindah ke daftar hadir
4. Badge counter hadir auto-update

---

#### `/posyandu/[id]/meja-2/[anggota_id]` — Pengukuran
**Layout:** Dua kolom (mobile: single column scroll)
- Kolom kiri: Form input pengukuran (field sesuai kategori)
- Kolom kanan: Riwayat 3 bulan terakhir (tabel kecil)

**Interaksi utama:**
1. Form field muncul sesuai kategori sasaran (tidak ada field tidak relevan)
2. Input BB → preview kalkulasi muncul live di bawah form (tanpa simpan)
3. Klik "Simpan" → kalkulasi final + tampil hasil lengkap
4. Hasil menampilkan: status gizi berwarna, selisih BB, flag risiko (jika ada)

---

#### `/anggota/[id]` — Profil Anggota
**Komponen:**
- Kartu identitas (foto, nama, usia, kategori, NIK)
- Status terkini (status gizi, BB terakhir, flag aktif)
- Grafik pertumbuhan BB & TB (line chart, 12 bulan terakhir)
- Tabel riwayat kunjungan (semua kunjungan, sortable)
- Tabel imunisasi (untuk bayi/balita)
- Riwayat kehamilan (untuk WUS)

---

## 13. Database Schema Lengkap

### 13.1 DDL PostgreSQL

```sql
-- =============================================
-- TABEL KONFIGURASI SISTEM
-- =============================================

CREATE TABLE posyandu (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama        VARCHAR(100) NOT NULL,
  rw          VARCHAR(5) NOT NULL,
  desa        VARCHAR(100) NOT NULL,
  kecamatan   VARCHAR(100) NOT NULL,
  kota        VARCHAR(100) NOT NULL,
  telepon     VARCHAR(20),
  jadwal_hari VARCHAR(20),
  jadwal_mulai TIME,
  jadwal_selesai TIME,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE organisasi_posyandu (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  posyandu_id UUID NOT NULL REFERENCES posyandu(id) ON DELETE CASCADE,
  jabatan     VARCHAR(50) NOT NULL 
              CHECK (jabatan IN ('kepala_desa','ketua_pkk','bidan_desa','ketua_posyandu','kader')),
  nama        VARCHAR(100) NOT NULL,
  gelar       VARCHAR(50),
  nip_sip     VARCHAR(50),
  urutan      INTEGER,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABEL PENGGUNA
-- =============================================

CREATE TABLE users (
  id            UUID PRIMARY KEY, -- linked ke InsForge Auth
  posyandu_id   UUID REFERENCES posyandu(id),
  nama_lengkap  VARCHAR(100) NOT NULL,
  peran         VARCHAR(20) NOT NULL
                CHECK (peran IN ('super_admin','kader','bidan','ketua_pkk','kepala_desa')),
  status_aktif  BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABEL DATA KELUARGA
-- =============================================

CREATE TABLE keluarga (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  posyandu_id           UUID NOT NULL REFERENCES posyandu(id),
  nomor_kk              VARCHAR(16) NOT NULL UNIQUE,
  nama_kepala_keluarga  VARCHAR(100) NOT NULL,
  alamat                TEXT NOT NULL,
  rt                    VARCHAR(5) NOT NULL,
  rw                    VARCHAR(5) NOT NULL,
  status_aktif          BOOLEAN DEFAULT TRUE,
  created_by            UUID REFERENCES users(id),
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABEL ANGGOTA KELUARGA
-- =============================================

CREATE TABLE anggota (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keluarga_id         UUID NOT NULL REFERENCES keluarga(id) ON DELETE CASCADE,
  nik                 VARCHAR(16) UNIQUE,
  nama                VARCHAR(100) NOT NULL,
  jenis_kelamin       CHAR(1) NOT NULL CHECK (jenis_kelamin IN ('L','P')),
  tanggal_lahir       DATE NOT NULL,
  hubungan_kk         VARCHAR(20) NOT NULL,
  -- Kalkulasi otomatis (di-update via trigger atau Edge Function)
  usia_bulan          INTEGER,
  kategori            VARCHAR(20) CHECK (kategori IN ('bayi','balita','wus','ibu_hamil','lansia','umum')),
  -- Status
  status_hamil_aktif  BOOLEAN DEFAULT FALSE,
  status_aktif        BOOLEAN DEFAULT TRUE,
  created_by          UUID REFERENCES users(id),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_anggota_keluarga ON anggota(keluarga_id);
CREATE INDEX idx_anggota_kategori ON anggota(kategori);
CREATE INDEX idx_anggota_nik ON anggota(nik);

-- =============================================
-- TABEL KEHAMILAN
-- =============================================

CREATE TABLE kehamilan (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anggota_id          UUID NOT NULL REFERENCES anggota(id),
  tanggal_hpht        DATE NOT NULL,
  taksiran_persalinan DATE,         -- Auto-hitung: HPHT + 280 hari
  gravida             INTEGER,
  para                INTEGER,
  abortus             INTEGER,
  status              VARCHAR(10) DEFAULT 'aktif' CHECK (status IN ('aktif','selesai')),
  tanggal_selesai     DATE,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABEL IMUNISASI
-- =============================================

CREATE TABLE imunisasi (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anggota_id   UUID NOT NULL REFERENCES anggota(id),
  jenis        VARCHAR(50) NOT NULL, -- HB0, BCG, Polio1, DPT1, dst
  tanggal      DATE NOT NULL,
  diberikan_di VARCHAR(100),
  kunjungan_id UUID,                -- nullable: bisa input di luar sesi posyandu
  created_by   UUID REFERENCES users(id),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_imunisasi_anggota ON imunisasi(anggota_id);

-- =============================================
-- TABEL JADWAL & SESI POSYANDU
-- =============================================

CREATE TABLE jadwal_posyandu (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  posyandu_id  UUID NOT NULL REFERENCES posyandu(id),
  tanggal      DATE NOT NULL,
  jenis        VARCHAR(20) DEFAULT 'bulanan' CHECK (jenis IN ('bulanan','tambahan','khusus')),
  tempat       VARCHAR(200),
  catatan      TEXT,
  status       VARCHAR(10) DEFAULT 'draft' CHECK (status IN ('draft','aktif','selesai','dibatalkan')),
  created_by   UUID REFERENCES users(id),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABEL KUNJUNGAN (per individu per sesi)
-- =============================================

CREATE TABLE kunjungan (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jadwal_id         UUID NOT NULL REFERENCES jadwal_posyandu(id),
  anggota_id        UUID NOT NULL REFERENCES anggota(id),
  waktu_hadir       TIMESTAMPTZ DEFAULT NOW(),
  status_verifikasi VARCHAR(15) DEFAULT 'draft'
                    CHECK (status_verifikasi IN ('draft','diperiksa','valid')),
  diverifikasi_oleh UUID REFERENCES users(id),
  waktu_verifikasi  TIMESTAMPTZ,
  created_by        UUID REFERENCES users(id),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (jadwal_id, anggota_id)  -- Satu anggota satu kunjungan per sesi
);

CREATE INDEX idx_kunjungan_jadwal ON kunjungan(jadwal_id);
CREATE INDEX idx_kunjungan_anggota ON kunjungan(anggota_id);

-- =============================================
-- TABEL PENGUKURAN ANTROPOMETRI
-- =============================================

CREATE TABLE pengukuran (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kunjungan_id            UUID NOT NULL UNIQUE REFERENCES kunjungan(id),
  -- Umum
  berat_badan             DECIMAL(5,2),    -- kg
  tinggi_badan            DECIMAL(5,2),    -- cm
  panjang_badan           DECIMAL(5,2),    -- cm (untuk bayi < 2 tahun)
  lingkar_kepala          DECIMAL(4,1),    -- cm
  lingkar_lengan          DECIMAL(4,1),    -- cm (LILA)
  lingkar_perut           DECIMAL(5,1),    -- cm
  -- Vital sign
  td_sistolik             INTEGER,         -- mmHg
  td_diastolik            INTEGER,         -- mmHg
  gula_darah_sewaktu      INTEGER,         -- mg/dL
  -- Ibu hamil
  tinggi_fundus           DECIMAL(4,1),    -- cm
  djj                     INTEGER,         -- bpm
  -- Kalkulasi otomatis (diisi sistem)
  usia_saat_ukur          INTEGER,         -- dalam bulan
  z_score_bbu             DECIMAL(6,4),
  z_score_tbu             DECIMAL(6,4),
  z_score_bbtb            DECIMAL(6,4),
  status_gizi             VARCHAR(20),
  status_pertumbuhan      VARCHAR(15),     -- naik, tidak_naik, turun
  imt                     DECIMAL(5,2),    -- Body Mass Index
  created_at              TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABEL PELAYANAN
-- =============================================

CREATE TABLE pelayanan (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kunjungan_id        UUID NOT NULL UNIQUE REFERENCES kunjungan(id),
  -- Balita
  vitamin_a           BOOLEAN DEFAULT FALSE,
  pmt                 BOOLEAN DEFAULT FALSE,
  pmt_jenis           VARCHAR(50),
  imunisasi           BOOLEAN DEFAULT FALSE,
  imunisasi_jenis     VARCHAR(100),
  -- Bumil
  tablet_fe           BOOLEAN DEFAULT FALSE,
  tablet_fe_jumlah    INTEGER,
  imunisasi_tt        BOOLEAN DEFAULT FALSE,
  imunisasi_tt_ke     INTEGER,
  -- Umum
  konseling           BOOLEAN DEFAULT FALSE,
  konseling_catatan   TEXT,
  rujukan             BOOLEAN DEFAULT FALSE,
  rujukan_tujuan      VARCHAR(200),
  rujukan_alasan      TEXT,
  -- Lansia
  obat_rutin          TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABEL PENYULUHAN
-- =============================================

CREATE TABLE penyuluhan (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jadwal_id        UUID NOT NULL REFERENCES jadwal_posyandu(id),
  tema             VARCHAR(200) NOT NULL,
  narasumber       VARCHAR(100) NOT NULL,
  jumlah_peserta   INTEGER NOT NULL,
  metode           VARCHAR(50),
  media            TEXT,
  ringkasan        TEXT,
  created_by       UUID REFERENCES users(id),
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABEL CATATAN KUNJUNGAN
-- =============================================

CREATE TABLE catatan_kunjungan (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kunjungan_id    UUID NOT NULL REFERENCES kunjungan(id),
  keluhan         TEXT,
  temuan          TEXT,
  catatan_kader   TEXT,
  catatan_bidan   TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABEL RISIKO (FLAG OTOMATIS)
-- =============================================

CREATE TABLE risiko (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kunjungan_id UUID NOT NULL REFERENCES kunjungan(id),
  anggota_id   UUID NOT NULL REFERENCES anggota(id),
  kode_risiko  VARCHAR(10) NOT NULL,   -- R-B01, R-H01, dst
  deskripsi    TEXT NOT NULL,
  severity     VARCHAR(10) NOT NULL CHECK (severity IN ('info','warning','danger')),
  tindak_lanjut TEXT,
  status       VARCHAR(15) DEFAULT 'aktif' CHECK (status IN ('aktif','ditangani','diabaikan')),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_risiko_anggota ON risiko(anggota_id);
CREATE INDEX idx_risiko_status ON risiko(status);

-- =============================================
-- TABEL NOTIFIKASI
-- =============================================

CREATE TABLE notifikasi (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id),
  judul        VARCHAR(200) NOT NULL,
  pesan        TEXT NOT NULL,
  tipe         VARCHAR(20) CHECK (tipe IN ('info','warning','danger','success')),
  sudah_dibaca BOOLEAN DEFAULT FALSE,
  link         VARCHAR(500),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABEL WHO LMS REFERENCE
-- =============================================

CREATE TABLE who_lms_reference (
  id           SERIAL PRIMARY KEY,
  indikator    VARCHAR(10) NOT NULL,  -- bbu, tbu, bbtb
  jenis_kelamin CHAR(1) NOT NULL,     -- L, P
  usia_bulan   INTEGER,               -- untuk bbu dan tbu
  panjang_cm   DECIMAL(5,1),          -- untuk bbtb
  l_value      DECIMAL(10,6) NOT NULL,
  m_value      DECIMAL(10,6) NOT NULL,
  s_value      DECIMAL(10,6) NOT NULL,
  sd3neg       DECIMAL(10,6),
  sd4neg       DECIMAL(10,6),
  sd3pos       DECIMAL(10,6),
  sd4pos       DECIMAL(10,6)
);

-- =============================================
-- TABEL AUDIT LOG
-- =============================================

CREATE TABLE audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id),
  aksi        VARCHAR(20) NOT NULL,  -- CREATE, UPDATE, DELETE
  tabel       VARCHAR(50) NOT NULL,
  record_id   UUID,
  data_lama   JSONB,
  data_baru   JSONB,
  ip_address  VARCHAR(50),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_tabel ON audit_log(tabel);
```

### 13.2 Diagram Relasi (ERD Ringkas)

```
posyandu 1──N organisasi_posyandu
posyandu 1──N keluarga
posyandu 1──N jadwal_posyandu
posyandu 1──N users

keluarga 1──N anggota

anggota 1──1 kehamilan (aktif)
anggota 1──N imunisasi
anggota 1──N kunjungan

jadwal_posyandu 1──N kunjungan
jadwal_posyandu 1──N penyuluhan

kunjungan 1──1 pengukuran
kunjungan 1──1 pelayanan
kunjungan 1──1 catatan_kunjungan
kunjungan 1──N risiko

users 1──N notifikasi
```

### 13.3 Row Level Security (RLS)

```sql
-- Kader hanya bisa akses data posyandu miliknya
ALTER TABLE keluarga ENABLE ROW LEVEL SECURITY;
CREATE POLICY kader_posyandu ON keluarga
  USING (posyandu_id = (SELECT posyandu_id FROM users WHERE id = auth.uid()));

-- Super admin bypass semua
CREATE POLICY admin_all ON keluarga
  USING ((SELECT peran FROM users WHERE id = auth.uid()) = 'super_admin');
```

---

## 14. Arsitektur Teknis

### 14.1 Diagram Arsitektur

```
┌─────────────────────────────────────────────────────────┐
│                   CLIENT LAYER                           │
│                                                         │
│   Browser (Chrome Android, Safari iOS, Desktop)         │
│   ┌─────────────────────────────────────────────────┐   │
│   │  Next.js 14 App Router + TypeScript             │   │
│   │  ├── Server Components (data fetching)          │   │
│   │  ├── Client Components (interaktif)             │   │
│   │  ├── Server Actions (mutasi data)               │   │
│   │  └── Route Handlers (webhook/callback)          │   │
│   │                                                 │   │
│   │  UI: Tailwind CSS + shadcn/ui                   │   │
│   │  Charts: Recharts                               │   │
│   │  PDF: @react-pdf/renderer (server-side)         │   │
│   └─────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS
┌──────────────────────▼──────────────────────────────────┐
│                  BACKEND LAYER — InsForge                 │
│                                                         │
│   ┌──────────┐  ┌──────────┐  ┌────────────────────┐   │
│   │ Database │  │   Auth   │  │   Edge Functions   │   │
│   │PostgreSQL│  │JWT+Email │  │ ├─ kalkulasi-zscore │   │
│   │+ RLS     │  │  RBAC    │  │ ├─ generate-laporan │   │
│   └──────────┘  └──────────┘  │ ├─ deteksi-risiko  │   │
│                               │ └─ klasifikasi      │   │
│   ┌──────────┐  ┌──────────┐  └────────────────────┘   │
│   │ Storage  │  │Realtime  │                            │
│   │PDF Lapor.│  │Websocket │                            │
│   │Foto      │  │Notif     │                            │
│   └──────────┘  └──────────┘                            │
└─────────────────────────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                  DEPLOYMENT                              │
│   Frontend: Vercel (Auto CI/CD dari GitHub)             │
│   Backend: InsForge Managed (Asia Southeast)            │
│   Domain: sipandu.vercel.app (atau custom domain)       │
└─────────────────────────────────────────────────────────┘
```

### 14.2 Stack Detail

| Layer | Teknologi | Versi | Alasan |
|---|---|---|---|
| Framework | Next.js | 14.x | SSR, App Router, Server Actions |
| Language | TypeScript | 5.x | Type safety, developer experience |
| Styling | Tailwind CSS | 3.x | Utility-first, konsisten |
| Komponen UI | shadcn/ui | Latest | Accessible, customizable |
| Grafik | Recharts | 2.x | React-native, lightweight |
| Database | InsForge PostgreSQL | Managed | Relasional, RLS, migrations |
| Auth | InsForge Auth | Built-in | JWT, email, RBAC |
| Storage | InsForge Storage | Built-in | PDF dan foto |
| Realtime | InsForge Realtime | Built-in | Notifikasi live |
| Edge Functions | InsForge (Deno) | Built-in | Z-score, PDF generation |
| PDF | @react-pdf/renderer | 3.x | Generate PDF server-side |
| Z-score | @whoicd/sdk-core atau custom LMS | - | Kalkulasi standar WHO |
| Validasi | Zod | 3.x | Schema validation frontend+backend |
| State | Zustand | 4.x | Global state ringan |
| Form | React Hook Form | 7.x | Performa, validasi |
| Deployment | Vercel | - | Zero-config Next.js |
| CI/CD | GitHub Actions | - | Auto-deploy ke Vercel |

### 14.3 Pola Pengambilan Data

```typescript
// Server Component — data fetching langsung
async function DaftarBalita() {
  const anggota = await db.anggota.findMany({
    where: { kategori: 'balita', status_aktif: true }
  });
  return <TabelBalita data={anggota} />;
}

// Server Action — mutasi data
async function simpanPengukuran(data: PengukuranInput) {
  'use server';
  // 1. Validasi dengan Zod
  // 2. Simpan ke database
  // 3. Panggil Edge Function kalkulasi z-score
  // 4. Update tabel pengukuran dengan hasil kalkulasi
  // 5. Jalankan deteksi risiko
  // 6. Buat notifikasi jika ada risiko
  revalidatePath(`/posyandu/${jadwalId}/meja-2`);
}
```

---

## 15. Validation Rules Per Field

### 15.1 Data Keluarga & Anggota

| Field | Tipe | Min | Maks | Format | Pesan Error |
|---|---|---|---|---|---|
| Nomor KK | String | 16 char | 16 char | Hanya angka | "Nomor KK harus 16 digit angka" |
| NIK | String | 16 char | 16 char | Hanya angka | "NIK harus 16 digit angka" |
| Nama | String | 2 char | 100 char | Huruf, spasi, tanda baca dasar | "Nama minimal 2 karakter" |
| Tanggal Lahir | Date | 120 tahun lalu | Hari ini | YYYY-MM-DD | "Tanggal lahir tidak valid" |
| RT/RW | String | 1 char | 5 char | Angka | "Format RT/RW tidak valid" |
| Alamat | String | 5 char | 255 char | - | "Alamat minimal 5 karakter" |

### 15.2 Data Pengukuran

| Field | Min | Maks | Satuan | Pesan Peringatan |
|---|---|---|---|---|
| Berat Badan Balita | 0.5 | 50 | kg | "Berat badan di luar rentang normal, periksa kembali" |
| Panjang/Tinggi Balita | 30 | 150 | cm | "Tinggi badan di luar rentang normal, periksa kembali" |
| Lingkar Kepala | 25 | 60 | cm | |
| LILA | 10 | 40 | cm | |
| TD Sistolik | 50 | 300 | mmHg | > 180: "Tekanan darah sangat tinggi, verifikasi ulang" |
| TD Diastolik | 30 | 200 | mmHg | |
| GDS | 20 | 600 | mg/dL | |
| BB Bumil | 30 | 150 | kg | |
| BB Lansia | 20 | 200 | kg | |

**Catatan:** Nilai di luar rentang tidak diblokir (sistem hanya menampilkan peringatan kuning), karena kasus ekstrem bisa saja nyata. Nilai yang sangat ekstrem (> 2× batas) membutuhkan konfirmasi sebelum disimpan.

### 15.3 Data Jadwal & Penyuluhan

| Field | Aturan |
|---|---|
| Tanggal Jadwal | Tidak boleh di masa lalu lebih dari 7 hari |
| Jumlah Peserta Penyuluhan | Integer, minimum 1 |
| Tema Penyuluhan | Minimum 5 karakter |

### 15.4 Data Pengguna

| Field | Aturan |
|---|---|
| Email | Format email valid, unik di sistem |
| Password | Minimum 8 karakter, ada huruf dan angka |

---

## 16. Error States & Edge Cases

### 16.1 Error States Koneksi

| Kondisi | Behavior Sistem |
|---|---|
| Koneksi putus saat mengisi form | Data form disimpan ke `sessionStorage` sementara. Banner muncul: "Koneksi terputus. Data tersimpan lokal." Saat koneksi kembali, data bisa dilanjutkan. |
| Koneksi putus saat POST/simpan | Tombol simpan loading state. Setelah timeout 10 detik, tampil error toast dengan opsi "Coba Lagi". |
| Server error 500 | Toast error: "Terjadi kesalahan pada server. Coba beberapa saat lagi." Log ke console. |
| Session expired (JWT kadaluarsa) | Redirect ke `/login` dengan query `?reason=session_expired`. Setelah login ulang, redirect kembali ke halaman sebelumnya. |

### 16.2 Edge Cases Data

| Kasus | Penanganan |
|---|---|
| NIK duplikat | Saat input NIK, sistem cek real-time. Jika ada: "NIK ini sudah terdaftar atas nama [nama]. Apakah ini orang yang sama?" |
| Nomor KK duplikat | Sama seperti NIK, dengan opsi: "Lihat keluarga yang sudah ada" atau "Tetap buat baru (KK berbeda)" |
| Tanggal lahir di masa depan | Diblokir: "Tanggal lahir tidak boleh di masa depan" |
| Usia < 0 bulan (lahir hari ini) | Kategori: Bayi. Usia ditampilkan: "0 Bulan" |
| Balita pindah kategori (ulang tahun ke-5 saat bulan ini) | Sistem otomatis reklasifikasi. Informasi banner di profil: "Kategori berubah dari Balita ke [kategori baru]" |
| Pengukuran tanpa data bulan lalu | Status pertumbuhan: "-" (tidak bisa dihitung). Keterangan: "Data baru, belum bisa dibandingkan" |
| Status hamil aktif untuk anggota laki-laki | Sistem memblokir: "Anggota berjenis kelamin laki-laki tidak bisa ditandai hamil" |
| Kunjungan duplikat hari H | UNIQUE constraint di database. Frontend mencegah dengan cek sebelum POST. |
| Generate laporan dengan 0 kunjungan | Laporan tetap bisa digenerate. Tabel menampilkan "0" dan keterangan "Tidak ada kunjungan pada bulan ini" |
| Bidan memvalidasi kunjungan yang sudah Valid | Tombol validasi disabled. Tooltip: "Data sudah divalidasi" |
| Kader mencoba akses dashboard bidan | Redirect ke `/dashboard` kader dengan toast: "Anda tidak memiliki akses ke halaman ini" |
| Upload foto profil ukuran > 5MB | Diblokir di frontend sebelum upload. Pesan: "Ukuran foto maksimal 5MB" |

### 16.3 Edge Cases Kalkulasi

| Kasus | Penanganan |
|---|---|
| Usia > 60 bulan (> 5 tahun) | Z-score tidak dihitung (keluar dari tabel WHO). Tampilkan: "Di luar rentang kalkulasi WHO (> 60 bulan)" |
| Nilai BB/TB menghasilkan z-score > 5 atau < -5 | Tampilkan peringatan: "Nilai z-score ekstrem, pastikan pengukuran benar" |
| HPHT tidak diisi untuk bumil | Usia kehamilan tidak bisa dihitung. Field HPHT wajib untuk status hamil |
| Lansia tanpa data BB (TB tidak diisi) | IMT tidak dihitung. Tampilkan: "-" |

---

## 17. Persyaratan Non-Fungsional

### 17.1 Performa
| Indikator | Target | Cara Ukur |
|---|---|---|
| LCP (Largest Contentful Paint) | < 2,5 detik | Lighthouse |
| FID (First Input Delay) | < 100 ms | Lighthouse |
| CLS (Cumulative Layout Shift) | < 0,1 | Lighthouse |
| Pencarian peserta | < 500 ms | Manual test |
| Simpan data kunjungan | < 2 detik | Manual test |
| Kalkulasi z-score | < 1 detik | Manual test |
| Generate laporan PDF | < 5 detik | Manual test |
| Load dashboard | < 3 detik | Manual test |

### 17.2 Keamanan
| Aspek | Implementasi |
|---|---|
| Autentikasi | InsForge Auth (JWT, refresh token 7 hari) |
| Otorisasi | RBAC di middleware Next.js + RLS di database |
| Data sensitif | NIK, tanggal lahir tidak tampil di URL |
| Transport | HTTPS wajib (enforced Vercel) |
| SQL Injection | Parameterized queries via InsForge SDK |
| XSS | Sanitasi output, CSP header |
| CSRF | SameSite cookie, CSRF token di Server Actions |
| Audit trail | Semua aksi CREATE/UPDATE/DELETE tercatat di audit_log |

### 17.3 Keandalan & Ketersediaan
| Aspek | Target |
|---|---|
| Uptime | ≥ 99% (InsForge SLA) |
| Data backup | Otomatis harian oleh InsForge |
| Recovery time objective | < 4 jam |
| Recovery point objective | < 24 jam |

### 17.4 Kemudahan Penggunaan (UX)
| Aspek | Standar |
|---|---|
| Bahasa antarmuka | Bahasa Indonesia penuh |
| Ukuran font minimum | 16px (body), 14px (label) |
| Ukuran touch target | ≥ 44×44px (WCAG 2.1) |
| Kontras warna | ≥ 4.5:1 (WCAG AA) |
| Viewport minimum | 360px lebar |
| Orientasi | Portrait dan landscape didukung |
| Tangan satu | Tombol utama bisa dijangkau jempol (bawah layar) |

### 17.5 Skalabilitas
| Aspek | Nilai |
|---|---|
| Jumlah sasaran (awal) | ±200 individu |
| Jumlah sasaran (proyeksi 2 tahun) | ±300 individu |
| Jumlah kunjungan per tahun | ±2.400 kunjungan |
| Jumlah pengguna aktif | ≤ 10 |
| Concurrent users | ≤ 5 (saat hari H) |

---

## 18. Fase Pengembangan

### Fase 0 — Setup (Minggu 1)
| Task | Detail |
|---|---|
| Inisialisasi project Next.js | `npx create-next-app@latest sipandu` |
| Setup InsForge | Login, link project, generate schema |
| Setup Tailwind + shadcn/ui | Konfigurasi tema, komponen dasar |
| Setup InsForge Auth | Email auth, JWT, middleware RBAC |
| Seed data awal | Profil Posyandu Flamboyan, tabel WHO LMS |
| Deploy ke Vercel | CI/CD dari GitHub |

### Fase 1 — MVP Core (Minggu 2–7)

**Minggu 2 — Data Master**
- [ ] CRUD Keluarga (form + list + search)
- [ ] CRUD Anggota (form + kalkulasi usia otomatis)
- [ ] Klasifikasi otomatis sasaran
- [ ] Form input status hamil

**Minggu 3 — Jadwal & Meja 1**
- [ ] CRUD Jadwal Posyandu
- [ ] Generate daftar sasaran
- [ ] Halaman Meja 1: search + check-in

**Minggu 4 — Meja 2 & Kalkulasi**
- [ ] Form pengukuran per kategori (adaptive)
- [ ] Integrasi kalkulasi z-score (library WHO)
- [ ] Status pertumbuhan dan perbandingan bulan lalu
- [ ] Deteksi risiko dasar (2T, gizi buruk)

**Minggu 5 — Meja 3, 4, 5**
- [ ] Halaman Meja 3 (otomatis dari data sebelumnya)
- [ ] Checklist pelayanan Meja 4 per kategori
- [ ] Form penyuluhan Meja 5
- [ ] Sistem notifikasi in-app dasar

**Minggu 6 — Imunisasi & Profil Anggota**
- [ ] Tracking jadwal imunisasi
- [ ] Halaman profil anggota lengkap
- [ ] Riwayat kunjungan

**Minggu 7 — Auth, RBAC & Polish**
- [ ] Middleware RBAC Next.js
- [ ] Row Level Security InsForge
- [ ] Testing + bugfix Fase 1
- [ ] UI polish mobile responsiveness

---

### Fase 2 — Monitoring & Laporan (Minggu 8–11)

**Minggu 8 — Laporan PDF**
- [ ] Engine generate laporan menggunakan @react-pdf/renderer
- [ ] Laporan Bulanan (L-01) lengkap
- [ ] Laporan Pertumbuhan (L-03)
- [ ] Laporan Sasaran (L-02)

**Minggu 9 — Verifikasi & Dashboard Bidan**
- [ ] Alur verifikasi status Draft → Valid
- [ ] Dashboard Bidan (risiko, antrian verifikasi)
- [ ] Catatan klinis Bidan

**Minggu 10 — Dashboard PKK & Kades**
- [ ] Dashboard TP PKK
- [ ] Dashboard Kepala Desa
- [ ] Grafik tren pertumbuhan (Recharts)

**Minggu 11 — Laporan Lanjutan & Polish**
- [ ] Laporan Ibu Hamil (L-05)
- [ ] Laporan Lansia (L-06)
- [ ] Rekapitulasi Kumulatif (L-07)
- [ ] Testing + bugfix Fase 2

---

### Fase 3 — Optimasi (Minggu 12–14)

**Minggu 12 — Pra-Posyandu & Notifikasi**
- [ ] Sistem pra-posyandu (reminder sasaran prioritas)
- [ ] Notifikasi real-time via InsForge Realtime
- [ ] Audit log

**Minggu 13 — Pengaturan & Admin**
- [ ] Halaman pengaturan profil Posyandu
- [ ] Manajemen pengguna dan peran
- [ ] Halaman audit log

**Minggu 14 — Testing & Deployment Final**
- [ ] User acceptance testing (UAT) bersama kader
- [ ] Performance optimization
- [ ] Security review
- [ ] Dokumentasi penggunaan (user manual)
- [ ] Go-live

---

## 19. Metrik Keberhasilan

### 19.1 Metrik Operasional

| Metrik | Baseline (Manual) | Target (Digital) | Cara Ukur |
|---|---|---|---|
| Waktu pelayanan per peserta | 5–7 menit | ≤ 3 menit | Stopwatch saat hari H |
| Waktu buat laporan bulanan | 2–4 jam | ≤ 1 menit | Observasi langsung |
| Tingkat kesalahan hitung usia | ~10% | < 1% | Audit sampel |
| Tingkat kesalahan status gizi | ~15% | < 2% | Audit vs kalkulasi manual |
| Deteksi kasus 2T bulan berjalan | ~60% | 100% | Cross-check data |
| Follow-up sasaran absen | ~40% | ≥ 80% | Tracking kunjungan rumah |

### 19.2 Metrik Adopsi

| Metrik | Target |
|---|---|
| Kader menggunakan sistem pada hari H pertama | 100% |
| Kader puas dengan sistem (skala 1–5) | ≥ 4.0 |
| Error kritis saat hari H pertama | 0 |
| Laporan berhasil digenerate bulan pertama | ✅ |

### 19.3 Metrik Teknis

| Metrik | Target |
|---|---|
| Lighthouse Performance Score | ≥ 80 |
| Lighthouse Accessibility Score | ≥ 90 |
| Zero downtime saat hari H | ✅ |
| Test coverage (unit + integration) | ≥ 70% |

---

## 20. Asumsi & Batasan

### 20.1 Asumsi

| # | Asumsi |
|---|---|
| A-01 | Setiap kader memiliki smartphone Android dengan browser Chrome versi terbaru |
| A-02 | Lokasi Posyandu memiliki koneksi internet minimal 3G saat hari H |
| A-03 | Data keluarga dimulai dari nol — tidak ada migrasi dari sistem lama |
| A-04 | Jadwal posyandu rutin: 1 kali per bulan pada hari dan tanggal tetap |
| A-05 | Standar gizi: WHO 2006 Child Growth Standards + Permenkes RI No. 2/2020 |
| A-06 | Standar imunisasi: Permenkes RI No. 12/2017 (Program Imunisasi Nasional) |
| A-07 | Kader bersedia mengikuti 1–2 sesi pelatihan sistem (1–2 jam) |
| A-08 | Super Admin (pengembang) tersedia untuk support teknis minimal 3 bulan pertama |

### 20.2 Batasan Fase Ini

| # | Batasan |
|---|---|
| B-01 | Tidak ada fitur offline — sistem membutuhkan koneksi internet aktif |
| B-02 | Tidak ada integrasi dengan Puskesmas, SIMKES, atau e-Kohort Kemenkes (di luar ekosistem RW 06). Integrasi **SINDUKSADATI** (dalam ekosistem RW 06) direncanakan di Fase 4 — lihat Bagian 42. |
| B-03 | Laporan hanya dalam Bahasa Indonesia |
| B-04 | Single-tenant: hanya untuk Posyandu Flamboyan RW 06 |
| B-05 | Tidak ada aplikasi Android native — hanya web responsive |
| B-06 | Tidak ada notifikasi WhatsApp atau SMS ke warga |
| B-07 | Foto profil opsional — sistem bisa berjalan tanpa foto |
| B-08 | Tidak ada backup data oleh pengguna (ditangani InsForge secara otomatis) |

---

## 21. Glossary

| Istilah | Definisi |
|---|---|
| **2T** | Status pertumbuhan balita yang berat badannya tidak naik selama 2 bulan berturut-turut (Tidak Naik 2 kali) |
| **ANC** | Antenatal Care — pemeriksaan rutin selama kehamilan |
| **BB/U** | Indikator Berat Badan menurut Umur, digunakan untuk mendeteksi gizi kurang/buruk |
| **BB/TB** | Indikator Berat Badan menurut Tinggi Badan, digunakan untuk mendeteksi wasting |
| **Bumil** | Ibu hamil |
| **D/S** | Rasio hadir dibagi sasaran (D = yang datang, S = seluruh sasaran). Indikator cakupan Posyandu |
| **DJJ** | Denyut Jantung Janin |
| **GDS** | Gula Darah Sewaktu — pemeriksaan kadar gula darah tanpa puasa |
| **HPHT** | Hari Pertama Haid Terakhir — titik awal perhitungan usia kehamilan |
| **HPL** | Hari Perkiraan Lahir = HPHT + 280 hari |
| **ILP** | Integrasi Layanan Primer — pendekatan Kemenkes RI yang mengintegrasikan layanan kesehatan dasar |
| **IMT** | Indeks Massa Tubuh = BB (kg) / [TB (m)]² |
| **KEK** | Kurang Energi Kronik — kondisi defisiensi energi kronik pada bumil, ditandai LILA < 23,5 cm |
| **KIA** | Kesehatan Ibu dan Anak — buku catatan kesehatan standar |
| **KMS** | Kartu Menuju Sehat — kartu pemantauan pertumbuhan balita |
| **LILA** | Lingkar Lengan Atas — digunakan untuk skrining KEK pada bumil dan WUS |
| **LMS** | Lambda-Mu-Sigma — metode statistik WHO untuk menghitung z-score pertumbuhan anak |
| **PMT** | Pemberian Makanan Tambahan — program suplementasi gizi untuk balita dan bumil |
| **Posyandu** | Pos Pelayanan Terpadu — unit layanan kesehatan berbasis masyarakat |
| **RBAC** | Role-Based Access Control — sistem otorisasi berdasarkan peran pengguna |
| **RLS** | Row Level Security — fitur keamanan PostgreSQL yang membatasi akses data per baris |
| **RW** | Rukun Warga — unit administrasi warga di bawah kelurahan/desa |
| **SD** | Standar Deviasi — ukuran penyebaran data dalam statistik |
| **Stunting** | Kondisi gagal tumbuh pada anak akibat kekurangan gizi kronik. Ditandai TB/U < -2 SD |
| **T** | Status pertumbuhan "Tidak Naik" — BB anak tidak naik dibanding bulan sebelumnya |
| **TB/U** | Indikator Tinggi Badan menurut Umur, digunakan untuk mendeteksi stunting |
| **TP PKK** | Tim Penggerak Pemberdayaan dan Kesejahteraan Keluarga |
| **TT** | Tetanus Toksoid — imunisasi untuk ibu hamil |
| **WUS** | Wanita Usia Subur — perempuan berusia 15–49 tahun |
| **Wasting** | Kurus — kondisi BB/TB < -2 SD, menunjukkan kekurangan gizi akut |
| **Z-score** | Nilai standar yang menunjukkan seberapa jauh suatu pengukuran dari nilai median referensi WHO |

---

*Dokumen ini adalah living document. Setiap perubahan signifikan pada fitur atau arsitektur harus diperbarui di sini sebelum implementasi.*

**Versi:** 2.0.0 | **Terakhir diperbarui:** Agustus 2026 | **Status:** Final Draft

---

## 22. API Design — Server Actions & Route Handlers

### 22.1 Konvensi Umum

Seluruh mutasi data menggunakan **Next.js Server Actions** (bukan REST API terpisah). Data fetching menggunakan **Server Components** langsung via InsForge SDK. Route Handlers (`/api/*`) hanya digunakan untuk webhook dan callback eksternal.

**Konvensi penamaan Server Action:**
```
[kata kerja][Entitas]    →  simpanPengukuran, hapusAnggota, validasiKunjungan
```

**Response standar:**
```typescript
type ActionResult<T> = 
  | { success: true; data: T }
  | { success: false; error: string; code?: string }
```

---

### 22.2 Server Actions — Keluarga & Anggota

```typescript
// === KELUARGA ===

// Tambah keluarga baru
tambahKeluarga(data: {
  nomor_kk: string       // 16 digit
  nama_kepala_keluarga: string
  alamat: string
  rt: string
  rw: string
}): Promise<ActionResult<Keluarga>>

// Update data keluarga
updateKeluarga(id: string, data: Partial<KeluargaInput>): Promise<ActionResult<Keluarga>>

// Nonaktifkan keluarga (soft delete)
nonaktifkanKeluarga(id: string): Promise<ActionResult<void>>

// Cek duplikasi nomor KK sebelum submit
cekDuplicateKK(nomor_kk: string): Promise<{ exists: boolean; keluarga?: Keluarga }>

// === ANGGOTA ===

// Tambah anggota ke keluarga
tambahAnggota(data: {
  keluarga_id: string
  nik?: string
  nama: string
  jenis_kelamin: 'L' | 'P'
  tanggal_lahir: Date
  hubungan_kk: string
}): Promise<ActionResult<Anggota>>

// Update data anggota
updateAnggota(id: string, data: Partial<AnggotaInput>): Promise<ActionResult<Anggota>>

// Toggle status hamil
setStatusHamil(anggota_id: string, aktif: boolean, hpht?: Date): Promise<ActionResult<Kehamilan | null>>

// Update kehamilan
updateKehamilan(id: string, data: Partial<KehamilanInput>): Promise<ActionResult<Kehamilan>>

// Selesaikan kehamilan (pasca persalinan)
selesaikanKehamilan(id: string, tanggal_selesai: Date): Promise<ActionResult<void>>
```

---

### 22.3 Server Actions — Jadwal & Sesi Posyandu

```typescript
// Buat jadwal posyandu baru
buatJadwal(data: {
  tanggal: Date
  jenis: 'bulanan' | 'tambahan' | 'khusus'
  tempat?: string
  catatan?: string
}): Promise<ActionResult<JadwalPosyandu>>

// Aktifkan sesi (mulai hari H)
aktifkanSesi(jadwal_id: string): Promise<ActionResult<JadwalPosyandu>>

// Tutup sesi (akhir hari H)
// Trigger: hitung ketidakhadiran, deteksi risiko batch, kirim notifikasi
tutupSesi(jadwal_id: string): Promise<ActionResult<{
  total_hadir: number
  total_tidak_hadir: number
  total_risiko_baru: number
}>>

// === KUNJUNGAN (MEJA 1) ===

// Daftarkan kehadiran
daftarHadir(data: {
  jadwal_id: string
  anggota_id: string
}): Promise<ActionResult<Kunjungan>>

// Batalkan kehadiran (jika salah input)
batalHadir(kunjungan_id: string): Promise<ActionResult<void>>
```

---

### 22.4 Server Actions — Pengukuran & Pelayanan

```typescript
// === MEJA 2 — PENGUKURAN ===

// Simpan pengukuran + trigger kalkulasi otomatis
simpanPengukuran(data: {
  kunjungan_id: string
  // Balita
  berat_badan?: number
  tinggi_badan?: number
  panjang_badan?: number
  lingkar_kepala?: number
  lingkar_lengan?: number
  // Bumil
  lingkar_lengan?: number
  td_sistolik?: number
  td_diastolik?: number
  tinggi_fundus?: number
  djj?: number
  // Lansia
  lingkar_perut?: number
  gula_darah_sewaktu?: number
}): Promise<ActionResult<{
  pengukuran: Pengukuran
  kalkulasi: {
    z_score_bbu?: number
    z_score_tbu?: number
    z_score_bbtb?: number
    status_gizi?: string
    status_pertumbuhan?: string
    selisih_bb?: number
    flag_risiko: RisikoItem[]
  }
}>>

// === MEJA 4 — PELAYANAN ===

simpanPelayanan(data: {
  kunjungan_id: string
  vitamin_a?: boolean
  pmt?: boolean
  pmt_jenis?: string
  imunisasi?: boolean
  imunisasi_jenis?: string
  tablet_fe?: boolean
  tablet_fe_jumlah?: number
  imunisasi_tt?: boolean
  imunisasi_tt_ke?: number
  konseling?: boolean
  konseling_catatan?: string
  rujukan?: boolean
  rujukan_tujuan?: string
  rujukan_alasan?: string
  obat_rutin?: string
}): Promise<ActionResult<Pelayanan>>

// === MEJA 3 — CATATAN ===

simpanCatatan(data: {
  kunjungan_id: string
  keluhan?: string
  temuan?: string
  catatan_kader?: string
}): Promise<ActionResult<CatatanKunjungan>>

// Tambah catatan Bidan (terpisah dari catatan kader)
tambahCatatanBidan(data: {
  kunjungan_id: string
  catatan_bidan: string
}): Promise<ActionResult<CatatanKunjungan>>

// === MEJA 5 — PENYULUHAN ===

simpanPenyuluhan(data: {
  jadwal_id: string
  tema: string
  narasumber: string
  jumlah_peserta: number
  metode?: string
  media?: string
  ringkasan?: string
}): Promise<ActionResult<Penyuluhan>>
```

---

### 22.5 Server Actions — Imunisasi & Verifikasi

```typescript
// Catat pemberian imunisasi
catatImunisasi(data: {
  anggota_id: string
  jenis: string        // HB0, BCG, Polio1, DPT1, dst
  tanggal: Date
  kunjungan_id?: string
  diberikan_di?: string
}): Promise<ActionResult<Imunisasi>>

// Hapus catatan imunisasi (jika salah input)
hapusImunisasi(id: string): Promise<ActionResult<void>>

// === VERIFIKASI (BIDAN) ===

// Verifikasi satu kunjungan
verifikasiKunjungan(kunjungan_id: string): Promise<ActionResult<Kunjungan>>

// Verifikasi semua kunjungan satu sesi
verifikasiSemuaKunjungan(jadwal_id: string): Promise<ActionResult<{ total_diverifikasi: number }>>

// Kembalikan ke draft (butuh perbaikan)
kembalikanKeDraft(kunjungan_id: string, catatan: string): Promise<ActionResult<Kunjungan>>
```

---

### 22.6 Server Actions — Laporan & Notifikasi

```typescript
// Generate laporan bulanan (return URL PDF di Storage)
generateLaporanBulanan(data: {
  bulan: number   // 1-12
  tahun: number
}): Promise<ActionResult<{ url_pdf: string; laporan_id: string }>>

// Tandai notifikasi sudah dibaca
bacaNotifikasi(notifikasi_id: string): Promise<ActionResult<void>>

// Tandai semua notifikasi sudah dibaca
bacaSemuaNotifikasi(): Promise<ActionResult<void>>
```

---

### 22.7 Route Handlers (REST — minimal)

```
GET  /api/health           → Health check endpoint untuk monitoring
POST /api/webhook/auth     → Callback dari InsForge Auth (user signup)
GET  /api/laporan/[id]/pdf → Stream PDF file dari InsForge Storage
```

---

## 23. Design System & UI Guidelines

### 23.1 Palet Warna

```css
/* Warna Utama */
--color-primary:       #16A34A;  /* Hijau — identitas kesehatan */
--color-primary-hover: #15803D;
--color-primary-light: #DCFCE7;

/* Status Gizi */
--color-status-baik:      #16A34A;  /* Hijau */
--color-status-kurang:    #F59E0B;  /* Kuning/amber */
--color-status-buruk:     #DC2626;  /* Merah */
--color-status-lebih:     #7C3AED;  /* Ungu */

/* Risiko */
--color-risiko-danger:    #DC2626;  /* Merah — gizi buruk, hipertensi berat */
--color-risiko-warning:   #F59E0B;  /* Kuning — 2T, KEK, prediabetes */
--color-risiko-info:      #3B82F6;  /* Biru — imunisasi tertunggak */

/* Netral */
--color-bg:        #F9FAFB;
--color-surface:   #FFFFFF;
--color-border:    #E5E7EB;
--color-text:      #111827;
--color-muted:     #6B7280;
```

### 23.2 Tipografi

| Elemen | Font | Size | Weight |
|---|---|---|---|
| Heading H1 | Inter | 24px | 700 |
| Heading H2 | Inter | 20px | 600 |
| Heading H3 | Inter | 18px | 600 |
| Body / Label | Inter | 16px | 400 |
| Caption / Helper | Inter | 14px | 400 |
| Badge | Inter | 12px | 500 |
| Input | Inter | 16px | 400 |

*Ukuran minimum font di form input: 16px (mencegah zoom otomatis di iOS Safari)*

### 23.3 Komponen Kritis

#### Badge Status Gizi
```
Gizi Baik   → bg-green-100  text-green-800  border-green-200
Gizi Kurang → bg-yellow-100 text-yellow-800 border-yellow-200
Gizi Buruk  → bg-red-100    text-red-800    border-red-200   + icon ⚠️
Stunting    → bg-red-100    text-red-800    border-red-200
```

#### Kartu Peserta (Meja 1)
```
┌─────────────────────────────────────┐
│ 👤 [Foto]  Rina Putri              │
│            3 Tahun 2 Bulan | Balita │
│            Orang tua: Ahmad         │
│                                     │
│ BB Terakhir: 12,5 kg (Jul 2026)    │
│ Status: Gizi Baik ✅               │
│                                     │
│           [DAFTAR HADIR]            │
└─────────────────────────────────────┘
```

#### Kartu Hasil Pengukuran (Meja 2)
```
┌─────────────────────────────────────┐
│ HASIL PENGUKURAN                    │
├─────────────────────────────────────┤
│ BB: 13 kg    TB: 92 cm             │
│                                     │
│ BB/U:  Normal (-0.5 SD)    ✅      │
│ TB/U:  Normal (-1.2 SD)    ✅      │
│ BB/TB: Normal (+0.3 SD)    ✅      │
├─────────────────────────────────────┤
│ Pertumbuhan: NAIK +0.5 kg  ⬆️     │
│ (dari 12.5 kg bulan Juli)          │
└─────────────────────────────────────┘
```

#### Flag Risiko (Alert)
```
🔴 GIZI BURUK — BB/U < -3 SD
   Segera lakukan rujukan ke Puskesmas.
   [Tandai Rujukan] [Lihat Riwayat]

🟡 2T — Tidak Naik 2 Bulan Berturut-turut
   Rekomendasikan kunjungan rumah.
   [Buat Catatan Follow-up]
```

### 23.4 Layout Mobile

```
NAVBAR (fixed top, 56px)
├── Hamburger menu (kiri)
├── Logo / Nama Halaman (tengah)
└── Notifikasi badge (kanan)

CONTENT AREA (full width, padding 16px)

BOTTOM NAVIGATION (fixed bottom, 64px) — Khusus kader hari H
├── 🏠 Dashboard
├── 👥 Peserta
├── 📋 Layanan
└── 📊 Rekap
```

### 23.5 Prinsip UX Kritis

| Prinsip | Implementasi |
|---|---|
| Zero redundant input | Data yang sudah ada tidak pernah diminta ulang di langkah berikutnya |
| Feedback instan | Setiap aksi memiliki loading state + success/error feedback dalam < 200ms |
| Mobile-first | Semua interaksi utama bisa dilakukan dengan jempol satu tangan |
| Fail-safe form | sessionStorage menyimpan draft form jika halaman tidak sengaja ditutup |
| Konfirmasi destruktif | Setiap hapus/nonaktifkan wajib ada dialog konfirmasi |
| Error yang manusiawi | Pesan error dalam Bahasa Indonesia yang jelas: TIDAK "Error 422", YA "Nomor KK sudah terdaftar" |

---

## 24. Testing Strategy

### 24.1 Piramida Testing

```
          E2E Tests (Playwright)
         ──────────────────────
        Integration Tests (Vitest)
       ────────────────────────────
      Unit Tests (Vitest)
     ──────────────────────────────
```

### 24.2 Unit Tests

**Target coverage: ≥ 70%**

File yang WAJIB ditest:

| File | Yang Ditest |
|---|---|
| `lib/kalkulasi-usia.ts` | Hitung usia dari tanggal lahir, hari lahir, kategori sasaran |
| `lib/kalkulasi-zscore.ts` | Formula LMS, interpretasi status gizi, status pertumbuhan |
| `lib/klasifikasi-sasaran.ts` | Semua path klasifikasi (bayi/balita/WUS/bumil/lansia/umum) |
| `lib/deteksi-risiko.ts` | Semua rule R-B01 s.d R-L06 |
| `lib/validasi-pengukuran.ts` | Range valid, peringatan ekstrem |
| `lib/hitung-hpl.ts` | HPL dari HPHT, usia kehamilan dalam minggu |

**Contoh unit test:**
```typescript
// kalkulasi-zscore.test.ts
describe('interpretasiStatusGizi', () => {
  it('mengembalikan Gizi Buruk jika z-score BB/U < -3', () => {
    expect(interpretasiBBU(-3.5)).toBe('gizi_buruk');
  });
  it('mengembalikan Normal jika z-score BB/U antara -2 dan +1', () => {
    expect(interpretasiBBU(0.5)).toBe('normal');
  });
});
```

### 24.3 Integration Tests

**Yang ditest:**
- Server Action `simpanPengukuran` → memastikan kalkulasi z-score tersimpan benar ke DB
- Server Action `daftarHadir` → memastikan UNIQUE constraint bekerja
- Server Action `tutupSesi` → memastikan deteksi ketidakhadiran batch berjalan
- RLS Policy → memastikan kader tidak bisa akses data Posyandu lain

### 24.4 E2E Tests (Playwright)

**Skenario kritis yang WAJIB ditest:**

| Skenario | Langkah |
|---|---|
| E2E-01: Alur lengkap hari H | Login kader → buka sesi → cari peserta → daftar hadir → input pengukuran → checklist layanan → verifikasi hasil z-score muncul |
| E2E-02: Deteksi 2T | Input BB tidak naik 2 bulan berturut → verifikasi flag 2T muncul di dashboard |
| E2E-03: Generate laporan | Login kader → laporan → pilih bulan → generate → verifikasi PDF bisa didownload |
| E2E-04: Verifikasi Bidan | Login bidan → buka kunjungan Draft → tambah catatan → klik validasi → verifikasi status Valid |
| E2E-05: RBAC | Login sebagai kepala_desa → coba akses /posyandu → verifikasi redirect |

### 24.5 UAT (User Acceptance Testing)

**Peserta:** 2–3 kader Posyandu Flamboyan + 1 Bidan Desa

**Skenario UAT:**
1. Kader mendaftarkan keluarga baru
2. Kader menjalankan alur hari H untuk 5 peserta berbeda kategori
3. Bidan memverifikasi data dari smartphone-nya sendiri
4. Kader generate laporan bulanan

**Kriteria lulus:**
- Tidak ada kader yang bingung lebih dari 30 detik pada satu langkah
- Tidak ada data yang hilang atau salah hitung
- Laporan PDF tergenerate dengan benar

---

## 25. Deployment & DevOps

### 25.1 Environment

| Environment | URL | Tujuan |
|---|---|---|
| Development | `localhost:3000` | Pengembangan lokal |
| Staging | `sipandu-staging.vercel.app` | Testing sebelum go-live |
| Production | `sipandu.vercel.app` (atau custom domain) | Pengguna nyata |

Setiap environment memiliki project InsForge terpisah (dev, staging, prod).

### 25.2 Environment Variables

```bash
# InsForge
NEXT_PUBLIC_INSFORGE_URL=https://a5wcfqfy.ap-southeast.insforge.app
NEXT_PUBLIC_INSFORGE_ANON_KEY=          # Public anon key dari InsForge
INSFORGE_SERVICE_ROLE_KEY=              # Secret key — JANGAN expose ke client

# App
NEXT_PUBLIC_APP_URL=https://sipandu.vercel.app
NODE_ENV=production

# PDF Storage (InsForge Storage bucket)
INSFORGE_STORAGE_BUCKET_LAPORAN=laporan-pdf
INSFORGE_STORAGE_BUCKET_FOTO=foto-anggota
```

**Aturan:**
- `NEXT_PUBLIC_*` → aman di-expose ke browser
- Key tanpa prefix → hanya di server (Server Actions, Route Handlers)
- Semua secret disimpan di Vercel Environment Variables — TIDAK di `.env` yang di-commit

### 25.3 CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy.yml

on:
  push:
    branches: [main]     # Deploy ke production
  pull_request:
    branches: [main]     # Run tests saja

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - Checkout
      - Install dependencies (npm ci)
      - Run unit tests (vitest)
      - Run integration tests
      - TypeScript type check (tsc --noEmit)
      - Lint (ESLint)

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    steps:
      - Deploy ke Vercel (otomatis via Vercel GitHub integration)
```

### 25.4 Branching Strategy

```
main          ← Production-ready, auto-deploy ke Vercel
  └── staging ← Staging branch, deploy ke staging Vercel
        └── feature/[nama-fitur]  ← Development branch
              └── fix/[nama-bug]
```

**Aturan:**
- Tidak boleh push langsung ke `main`
- PR ke `main` wajib: tests pass + minimal 1 review
- Commit message: `feat:`, `fix:`, `chore:`, `docs:`

### 25.5 Struktur Direktori Project

```
sipandu/
├── app/                          # Next.js App Router
│   ├── (auth)/
│   │   └── login/
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   ├── keluarga/
│   │   │   ├── page.tsx          # Daftar keluarga
│   │   │   ├── tambah/
│   │   │   └── [id]/
│   │   ├── anggota/[id]/
│   │   ├── posyandu/
│   │   │   ├── page.tsx
│   │   │   ├── buat/
│   │   │   └── [id]/
│   │   │       ├── page.tsx      # Detail sesi
│   │   │       ├── meja-1/
│   │   │       ├── meja-2/[anggota_id]/
│   │   │       ├── meja-3/[anggota_id]/
│   │   │       ├── meja-4/[anggota_id]/
│   │   │       ├── meja-5/
│   │   │       └── rekap/
│   │   ├── laporan/
│   │   ├── monitoring/
│   │   │   ├── bidan/
│   │   │   ├── pkk/
│   │   │   └── kades/
│   │   └── pengaturan/
│   ├── api/
│   │   ├── health/
│   │   └── laporan/[id]/pdf/
│   ├── layout.tsx
│   └── globals.css
│
├── components/
│   ├── ui/                       # shadcn/ui components
│   ├── forms/                    # Form components per entitas
│   │   ├── FormKeluarga.tsx
│   │   ├── FormAnggota.tsx
│   │   ├── FormPengukuranBalita.tsx
│   │   ├── FormPengukuranBumil.tsx
│   │   └── FormPengukuranLansia.tsx
│   ├── cards/
│   │   ├── KartuPeserta.tsx
│   │   ├── KartuHasilPengukuran.tsx
│   │   └── KartuRisiko.tsx
│   ├── dashboard/
│   │   ├── DashboardKader.tsx
│   │   ├── DashboardBidan.tsx
│   │   ├── DashboardPKK.tsx
│   │   └── DashboardKades.tsx
│   └── layout/
│       ├── Navbar.tsx
│       ├── Sidebar.tsx
│       └── BottomNav.tsx
│
├── lib/
│   ├── insforge.ts               # InsForge client config
│   ├── auth.ts                   # Auth helpers
│   ├── kalkulasi-usia.ts         # Hitung usia, hari lahir
│   ├── kalkulasi-zscore.ts       # Z-score, status gizi
│   ├── klasifikasi-sasaran.ts    # Kategori ILP
│   ├── deteksi-risiko.ts         # Semua rule risiko
│   ├── generate-laporan.ts       # PDF generation logic
│   └── validasi.ts               # Zod schemas
│
├── actions/
│   ├── keluarga.ts               # Server Actions keluarga
│   ├── anggota.ts                # Server Actions anggota
│   ├── jadwal.ts                 # Server Actions jadwal
│   ├── kunjungan.ts              # Server Actions kunjungan
│   ├── pengukuran.ts             # Server Actions pengukuran
│   ├── pelayanan.ts              # Server Actions pelayanan
│   ├── imunisasi.ts              # Server Actions imunisasi
│   ├── laporan.ts                # Server Actions laporan
│   └── notifikasi.ts             # Server Actions notifikasi
│
├── types/
│   ├── database.ts               # Tipe dari schema InsForge
│   └── app.ts                    # Tipe aplikasi (ActionResult, dll)
│
├── hooks/
│   ├── useRealtime.ts            # InsForge Realtime subscription
│   └── useNotifikasi.ts          # Notifikasi in-app
│
├── data/
│   └── who-lms/                  # Tabel referensi WHO LMS (CSV/JSON)
│       ├── bbu-laki.json
│       ├── bbu-perempuan.json
│       ├── tbu-laki.json
│       ├── tbu-perempuan.json
│       ├── bbtb-laki.json
│       └── bbtb-perempuan.json
│
├── public/
│   ├── logo-posyandu.png
│   └── icons/
│
├── tests/
│   ├── unit/
│   └── e2e/
│
├── .env.local                    # Local env (di .gitignore)
├── .env.example                  # Template env (di-commit)
├── next.config.ts
├── tailwind.config.ts
├── components.json               # shadcn/ui config
└── package.json
```

---

## 26. Risk Register

| Kode | Risiko | Probabilitas | Dampak | Mitigasi |
|---|---|---|---|---|
| RK-01 | Kader tidak mau adopsi sistem digital | Sedang | Tinggi | Pelatihan intensif + tampilan semaksimal mungkin mirip alur manual |
| RK-02 | Koneksi internet tidak stabil saat hari H | Sedang | Tinggi | Simpan form di sessionStorage, retry otomatis, UI yang jelas saat offline |
| RK-03 | Data salah input oleh kader (NIK, tanggal lahir) | Tinggi | Sedang | Validasi real-time, konfirmasi sebelum simpan, log perubahan data |
| RK-04 | InsForge outage saat hari H Posyandu | Rendah | Sangat Tinggi | Status page monitoring, backup catatan manual tetap disiapkan di awal |
| RK-05 | Perubahan regulasi Kemenkes (format laporan) | Rendah | Sedang | Laporan dibuat modular, mudah diubah template-nya |
| RK-06 | Scope creep — kader minta fitur terus | Tinggi | Sedang | PRD ini jadi acuan resmi, permintaan baru masuk ke backlog fase berikutnya |
| RK-07 | Keamanan data pribadi warga (NIK, kesehatan) | Rendah | Sangat Tinggi | RLS di DB, HTTPS, tidak ada data di URL, audit log |
| RK-08 | Developer tidak available untuk maintenance | Rendah | Tinggi | Dokumentasi kode lengkap, README jelas, hindari dependensi esoterik |
| RK-09 | Tabel WHO LMS tidak akurat untuk populasi lokal | Rendah | Sedang | Gunakan referensi resmi WHO 2006 yang sama dengan Kemenkes RI |
| RK-10 | Pengembangan melebihi timeline 14 minggu | Sedang | Sedang | Fase 1 MVP sudah cukup untuk go-live, Fase 2–3 bisa menyusul |

---

## 27. Dependencies & Third-Party Packages

### 27.1 Dependencies Produksi

| Package | Versi | Tujuan |
|---|---|---|
| `next` | 14.x | Framework utama |
| `react` | 18.x | UI library |
| `typescript` | 5.x | Type safety |
| `tailwindcss` | 3.x | Styling |
| `@radix-ui/*` | Latest | Komponen accessible (via shadcn) |
| `class-variance-authority` | Latest | Variant styling untuk komponen |
| `clsx` | Latest | Utility className |
| `lucide-react` | Latest | Icon library |
| `react-hook-form` | 7.x | Form management |
| `zod` | 3.x | Schema validation |
| `@hookform/resolvers` | Latest | Integrasi zod + react-hook-form |
| `zustand` | 4.x | Global state management |
| `recharts` | 2.x | Chart/grafik |
| `@react-pdf/renderer` | 3.x | Generate PDF server-side |
| `date-fns` | 3.x | Manipulasi tanggal (hitung usia, HPL) |
| `@insforge/js` | Latest | InsForge SDK (DB, Auth, Storage, Realtime) |
| `sonner` | Latest | Toast notifications |
| `next-themes` | Latest | Dark/light mode (opsional) |

### 27.2 Dependencies Development

| Package | Tujuan |
|---|---|
| `vitest` | Unit & integration testing |
| `@playwright/test` | E2E testing |
| `@testing-library/react` | Component testing |
| `eslint` + `eslint-config-next` | Linting |
| `prettier` | Code formatting |
| `husky` + `lint-staged` | Pre-commit hooks |

---

## 28. Checklist Pre-Launch

### 28.1 Teknis
- [ ] Semua unit test pass (coverage ≥ 70%)
- [ ] Semua E2E test pass
- [ ] TypeScript tidak ada error (`tsc --noEmit`)
- [ ] ESLint tidak ada warning kritis
- [ ] Lighthouse Performance ≥ 80
- [ ] Lighthouse Accessibility ≥ 90
- [ ] RLS aktif di semua tabel sensitif
- [ ] Environment variables production sudah di-set di Vercel
- [ ] Custom domain terkonfigurasi (jika ada)
- [ ] SSL certificate aktif
- [ ] Error tracking (opsional: Sentry)

### 28.2 Data & Konten
- [ ] Profil Posyandu Flamboyan sudah diisi
- [ ] Struktur organisasi sudah diisi (Kades, PKK, Bidan, Kader)
- [ ] Akun semua kader sudah dibuat dan dicoba login
- [ ] Akun Bidan sudah dibuat
- [ ] Akun Kepala Desa dan PKK sudah dibuat
- [ ] Tabel WHO LMS sudah di-seed ke database
- [ ] Data awal keluarga/anggota minimal 10 untuk testing UAT

### 28.3 Operasional
- [ ] Kader sudah mengikuti pelatihan (minimal 1 sesi)
- [ ] Bidan sudah mencoba akses dashboard
- [ ] User manual sudah dibagikan ke kader (PDF/WhatsApp)
- [ ] Nomor kontak pengembang untuk support sudah dibagikan
- [ ] Rencana backup catatan manual sebagai fallback hari H pertama sudah ada

---

## 29. User Manual — Outline

*(Dokumen terpisah — diisi setelah sistem selesai dibangun)*

### Bab 1 — Pengenalan SIPANDU
- Apa itu SIPANDU
- Manfaat untuk kader dan warga
- Cara login dan logout

### Bab 2 — Sebelum Hari Posyandu
- Menambah keluarga baru
- Menambah anggota keluarga
- Membuat jadwal posyandu

### Bab 3 — Hari H Posyandu
- Meja 1: Cara mendaftarkan peserta
- Meja 2: Cara mengisi pengukuran
- Meja 3: Cara mengisi catatan
- Meja 4: Cara mencatat layanan
- Meja 5: Cara mencatat penyuluhan
- Menutup sesi posyandu

### Bab 4 — Setelah Posyandu
- Melihat daftar sasaran berisiko
- Melihat daftar sasaran yang tidak hadir
- Membuat laporan bulanan

### Bab 5 — Untuk Bidan Desa
- Memantau dashboard
- Memverifikasi data
- Menambah catatan klinis

### Bab 6 — Untuk Pimpinan (PKK & Kepala Desa)
- Cara membaca dashboard

### Bab 7 — Pertanyaan yang Sering Ditanya (FAQ)
- Bagaimana jika koneksi internet putus?
- Bagaimana jika salah input data?
- Bagaimana jika peserta tidak ditemukan di sistem?

---

## 30. Changelog

| Versi | Tanggal | Perubahan |
|---|---|---|
| 1.0.0 | Agustus 2026 | Versi awal: struktur dasar 21 bab |
| 2.0.0 | Agustus 2026 | Edisi lengkap: tambah User Stories, Validasi, Edge Cases, Z-score detail, Imunisasi, Glossary |
| 2.1.0 | Agustus 2026 | Tambah: API Design, Design System, Testing Strategy, Deployment, Risk Register, Dependencies, Checklist, User Manual outline |

---

## 31. InsForge Edge Functions — Spesifikasi Detail

> **⚠ AMENDEMEN v3.0.1 (2026-09-06):** Implementasi riil (SPA Vite + InsForge, bukan Next.js) menetapkan **kalkulasi z-score, deteksi risiko, dan generate laporan berjalan client-side** (`src/utils/zscoreCalculator.ts` — pure function, ter-cover 32 unit test). Bagian 31.1–31.3 di bawah DIPERTAHANKAN sebagai referensi spesifikasi, bukan arsitektur aktif. Satu-satunya edge function yang disepakati: **`kirim-notifikasi`** (31.4) — karena membutuhkan secret (email/push) yang tidak boleh berada di client. Fungsi aktif saat ini: `sinduksadati-proxy` (`functions/sinduksadati-proxy.ts`).

Edge Functions berjalan di runtime Deno pada infrastruktur InsForge. Dipanggil via Server Action Next.js menggunakan InsForge SDK.

---

### 31.1 `kalkulasi-zscore`

**Endpoint:** `POST /functions/v1/kalkulasi-zscore`

**Tujuan:** Menghitung z-score BB/U, TB/U, BB/TB berdasarkan data pengukuran balita dan tabel referensi WHO 2006.

**Request:**
```typescript
{
  usia_bulan: number        // Usia anak dalam bulan penuh
  jenis_kelamin: 'L' | 'P'
  berat_badan: number       // kg, max 2 desimal
  tinggi_badan?: number     // cm, untuk usia ≥ 24 bulan
  panjang_badan?: number    // cm, untuk usia < 24 bulan
}
```

**Response:**
```typescript
{
  z_score_bbu: number | null    // null jika usia > 60 bulan
  z_score_tbu: number | null
  z_score_bbtb: number | null
  imt: number | null
  status_gizi: {
    bbu: 'gizi_buruk' | 'gizi_kurang' | 'normal' | 'berisiko_lebih' | null
    tbu: 'sangat_pendek' | 'pendek' | 'normal' | 'tinggi' | null
    bbtb: 'sangat_kurus' | 'kurus' | 'normal' | 'berisiko_lebih' | 'lebih' | 'obesitas' | null
  }
  catatan: string | null        // Misal: "Di luar rentang kalkulasi WHO (>60 bulan)"
}
```

**Logika Internal:**
```typescript
// Pseudocode Edge Function
async function handler(req: Request) {
  const { usia_bulan, jenis_kelamin, berat_badan, tinggi_badan, panjang_badan } = await req.json()

  // 1. Validasi input
  if (usia_bulan > 60) return { catatan: 'Di luar rentang kalkulasi WHO' }

  // 2. Query tabel who_lms_reference dari database
  const lms_bbu = await db.who_lms_reference.findFirst({
    where: { indikator: 'bbu', jenis_kelamin, usia_bulan }
  })

  // 3. Hitung z-score dengan formula LMS
  const z_bbu = hitungZScore(berat_badan, lms_bbu.l, lms_bbu.m, lms_bbu.s)

  // 4. Terapkan batas WHO (SD3 cutoff)
  const z_bbu_bounded = terapkanBatas(z_bbu, lms_bbu)

  // 5. Interpretasi status
  const status_bbu = interpretasiBBU(z_bbu_bounded)

  // ... ulangi untuk TB/U dan BB/TB
  return { z_score_bbu: z_bbu_bounded, status_gizi: { bbu: status_bbu }, ... }
}

function hitungZScore(X: number, L: number, M: number, S: number): number {
  if (Math.abs(L) < 0.0001) return Math.log(X / M) / S  // L ≈ 0
  return (Math.pow(X / M, L) - 1) / (L * S)
}
```

**Error Handling:**
```typescript
// Jika data LMS tidak ditemukan (usia di luar tabel)
if (!lms_bbu) return { error: 'LMS_NOT_FOUND', z_score_bbu: null }

// Jika nilai pengukuran ekstrem (z > 5 atau < -5)
if (Math.abs(z_score) > 5) return { ...hasil, peringatan: 'Z_SCORE_EKSTREM' }
```

---

### 31.2 `deteksi-risiko`

**Endpoint:** `POST /functions/v1/deteksi-risiko`

**Tujuan:** Menjalankan semua aturan deteksi risiko setelah pengukuran disimpan atau sesi ditutup.

**Request:**
```typescript
{
  kunjungan_id: string
  anggota_id: string
  kategori: 'bayi' | 'balita' | 'ibu_hamil' | 'lansia' | 'wus'
  pengukuran: PengukuranData
  riwayat_bulan_lalu?: PengukuranData  // null jika kunjungan pertama
  riwayat_2_bulan_lalu?: PengukuranData
}
```

**Response:**
```typescript
{
  risiko_baru: Array<{
    kode: string          // R-B01, R-H01, dst
    deskripsi: string
    severity: 'info' | 'warning' | 'danger'
    tindak_lanjut: string
  }>
  total_risiko: number
}
```

**Aturan yang dievaluasi (berurutan):**
```typescript
const rules = [
  // Balita
  { kode: 'R-B03', cek: (d) => d.z_bbu < -3,         severity: 'danger'  },
  { kode: 'R-B04', cek: (d) => d.z_bbu < -2,         severity: 'warning' },
  { kode: 'R-B05', cek: (d) => d.z_tbu < -3,         severity: 'danger'  },
  { kode: 'R-B06', cek: (d) => d.z_tbu < -2,         severity: 'warning' },
  { kode: 'R-B01', cek: (d, hist) => hist && d.bb <= hist.bb, severity: 'warning' },
  { kode: 'R-B02', cek: (d, h1, h2) => h1?.bb <= h1?.prev_bb && d.bb <= h1.bb, severity: 'danger' },
  // Ibu Hamil
  { kode: 'R-H01', cek: (d) => d.td_sistolik >= 140 || d.td_diastolik >= 90, severity: 'danger' },
  { kode: 'R-H02', cek: (d) => d.lingkar_lengan < 23.5, severity: 'warning' },
  // Lansia
  { kode: 'R-L01', cek: (d) => d.td_sistolik >= 160 || d.td_diastolik >= 100, severity: 'danger' },
  { kode: 'R-L02', cek: (d) => d.td_sistolik >= 140,  severity: 'warning' },
  { kode: 'R-L03', cek: (d) => d.gds >= 200,          severity: 'danger'  },
  { kode: 'R-L04', cek: (d) => d.gds >= 140,          severity: 'warning' },
]
```

---

### 31.3 `generate-laporan`

**Endpoint:** `POST /functions/v1/generate-laporan`

**Tujuan:** Mengagregasi data satu bulan dan menghasilkan file PDF laporan bulanan, lalu menyimpannya ke InsForge Storage.

**Request:**
```typescript
{
  posyandu_id: string
  bulan: number   // 1–12
  tahun: number
  jenis: 'bulanan' | 'sasaran' | 'pertumbuhan' | 'pelayanan' | 'bumil' | 'lansia'
}
```

**Proses:**
```
1. Query semua jadwal_posyandu bulan tersebut
2. Query semua kunjungan dengan status = 'valid'
3. Agregasi data:
   - Total sasaran per kategori
   - Total hadir per kategori (D/S)
   - Status gizi balita (naik/T/2T/stunting/gizi buruk)
   - Pelayanan: Vit A, PMT, imunisasi, tablet Fe
   - Bumil: total, risiko, ANC
   - Lansia: total, risiko hipertensi, DM
4. Query profil posyandu + organisasi untuk kop surat
5. Render PDF menggunakan @react-pdf/renderer (atau Deno-compatible PDF lib)
6. Upload PDF ke InsForge Storage bucket 'laporan-pdf'
   Path: laporan-pdf/{posyandu_id}/{tahun}/{bulan}/laporan-bulanan.pdf
7. Return signed URL (berlaku 24 jam) + laporan_id
```

**Response:**
```typescript
{
  url: string         // Signed URL ke PDF di Storage
  expires_at: string  // ISO 8601
  laporan_id: string
  ringkasan: {
    total_sasaran: number
    total_hadir: number
    persen_ds: number
    total_stunting: number
    total_gizi_buruk: number
    total_2t: number
  }
}
```

---

### 31.4 `kirim-notifikasi`

**Endpoint:** `POST /functions/v1/kirim-notifikasi`

**Tujuan:** Membuat entri notifikasi in-app untuk pengguna yang relevan setelah deteksi risiko.

**Request:**
```typescript
{
  risiko: RisikoItem[]
  anggota: { id: string; nama: string; kategori: string }
  posyandu_id: string
}
```

**Logika:**
```typescript
// Tentukan penerima notifikasi berdasarkan severity
const penerima = risiko.severity === 'danger'
  ? ['kader', 'bidan']   // Gizi buruk, hipertensi berat → kader + bidan
  : ['kader']             // Warning → kader saja

// Ambil user_id semua kader + bidan di posyandu ini
const users = await db.users.findMany({
  where: { posyandu_id, peran: { in: penerima }, status_aktif: true }
})

// Buat notifikasi untuk setiap user
await db.notifikasi.createMany({
  data: users.map(u => ({
    user_id: u.id,
    judul: judulDariRisiko(risiko),
    pesan: pesanDariRisiko(risiko, anggota.nama),
    tipe: risiko.severity,
    link: `/anggota/${anggota.id}`
  }))
})

// Broadcast via InsForge Realtime ke channel `notifikasi:{user_id}`
```

---

## 32. Database Triggers & Functions PostgreSQL

Trigger dan function ini dijalankan otomatis oleh database setiap kali data berubah, sehingga field kalkulasi selalu up-to-date.

---

### 32.1 Trigger: Auto-update `usia_bulan` dan `kategori`

```sql
-- Function yang dipanggil trigger
CREATE OR REPLACE FUNCTION update_klasifikasi_anggota()
RETURNS TRIGGER AS $$
DECLARE
  v_usia_bulan INTEGER;
  v_kategori   VARCHAR(20);
BEGIN
  -- Hitung usia dalam bulan (dari tanggal_lahir ke SEKARANG)
  v_usia_bulan := EXTRACT(YEAR FROM AGE(NOW(), NEW.tanggal_lahir)) * 12
                + EXTRACT(MONTH FROM AGE(NOW(), NEW.tanggal_lahir));

  -- Klasifikasi (dengan prioritas: hamil > bayi > balita > wus > lansia > umum)
  IF NEW.status_hamil_aktif = TRUE THEN
    v_kategori := 'ibu_hamil';
  ELSIF v_usia_bulan < 12 THEN
    v_kategori := 'bayi';
  ELSIF v_usia_bulan < 60 THEN
    v_kategori := 'balita';
  ELSIF NEW.jenis_kelamin = 'P' AND v_usia_bulan BETWEEN 180 AND 588 THEN
    -- Perempuan 15–49 tahun (15*12=180, 49*12=588)
    v_kategori := 'wus';
  ELSIF v_usia_bulan >= 720 THEN
    -- 60 tahun ke atas (60*12=720)
    v_kategori := 'lansia';
  ELSE
    v_kategori := 'umum';
  END IF;

  NEW.usia_bulan := v_usia_bulan;
  NEW.kategori   := v_kategori;
  NEW.updated_at := NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Pasang trigger ke tabel anggota
CREATE TRIGGER trg_anggota_klasifikasi
  BEFORE INSERT OR UPDATE OF tanggal_lahir, jenis_kelamin, status_hamil_aktif
  ON anggota
  FOR EACH ROW
  EXECUTE FUNCTION update_klasifikasi_anggota();
```

---

### 32.2 Trigger: Auto-update `taksiran_persalinan`

```sql
CREATE OR REPLACE FUNCTION update_taksiran_persalinan()
RETURNS TRIGGER AS $$
BEGIN
  -- HPL = HPHT + 280 hari (Naegele's Rule)
  NEW.taksiran_persalinan := NEW.tanggal_hpht + INTERVAL '280 days';
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_kehamilan_hpl
  BEFORE INSERT OR UPDATE OF tanggal_hpht
  ON kehamilan
  FOR EACH ROW
  EXECUTE FUNCTION update_taksiran_persalinan();
```

---

### 32.3 Trigger: Auto-create `catatan_kunjungan` & `pelayanan` setelah kunjungan baru

```sql
CREATE OR REPLACE FUNCTION init_kunjungan_records()
RETURNS TRIGGER AS $$
BEGIN
  -- Buat row kosong di pelayanan
  INSERT INTO pelayanan (kunjungan_id) VALUES (NEW.id);
  -- Buat row kosong di catatan_kunjungan
  INSERT INTO catatan_kunjungan (kunjungan_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_kunjungan_init
  AFTER INSERT ON kunjungan
  FOR EACH ROW
  EXECUTE FUNCTION init_kunjungan_records();
```

---

### 32.4 Trigger: Audit Log otomatis

```sql
CREATE OR REPLACE FUNCTION log_perubahan()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (
    user_id, aksi, tabel, record_id, data_lama, data_baru
  ) VALUES (
    auth.uid(),
    TG_OP,         -- 'INSERT', 'UPDATE', atau 'DELETE'
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP != 'DELETE' THEN to_jsonb(NEW) ELSE NULL END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Pasang ke tabel-tabel sensitif
CREATE TRIGGER trg_audit_anggota
  AFTER INSERT OR UPDATE OR DELETE ON anggota
  FOR EACH ROW EXECUTE FUNCTION log_perubahan();

CREATE TRIGGER trg_audit_pengukuran
  AFTER INSERT OR UPDATE OR DELETE ON pengukuran
  FOR EACH ROW EXECUTE FUNCTION log_perubahan();

CREATE TRIGGER trg_audit_kunjungan
  AFTER INSERT OR UPDATE OR DELETE ON kunjungan
  FOR EACH ROW EXECUTE FUNCTION log_perubahan();
```

---

### 32.5 Function: Cek status ketidakhadiran batch

```sql
-- Dipanggil setelah sesi posyandu ditutup
CREATE OR REPLACE FUNCTION cek_ketidakhadiran(p_jadwal_id UUID)
RETURNS TABLE(anggota_id UUID, nama VARCHAR, absen_berturut INTEGER) AS $$
BEGIN
  RETURN QUERY
  WITH sasaran AS (
    -- Semua anggota aktif yang bukan kategori 'umum' di posyandu ini
    SELECT a.id, a.nama
    FROM anggota a
    JOIN keluarga k ON k.id = a.keluarga_id
    JOIN jadwal_posyandu jp ON jp.posyandu_id = k.posyandu_id
    WHERE jp.id = p_jadwal_id
      AND a.status_aktif = TRUE
      AND a.kategori != 'umum'
  ),
  hadir_bulan_ini AS (
    SELECT DISTINCT anggota_id FROM kunjungan WHERE jadwal_id = p_jadwal_id
  ),
  hadir_bulan_lalu AS (
    SELECT DISTINCT k.anggota_id
    FROM kunjungan k
    JOIN jadwal_posyandu jp ON jp.id = k.jadwal_id
    WHERE jp.posyandu_id = (SELECT posyandu_id FROM jadwal_posyandu WHERE id = p_jadwal_id)
      AND jp.tanggal < (SELECT tanggal FROM jadwal_posyandu WHERE id = p_jadwal_id)
    ORDER BY jp.tanggal DESC
    LIMIT 1
  )
  SELECT
    s.id,
    s.nama,
    CASE
      WHEN s.id NOT IN (SELECT anggota_id FROM hadir_bulan_lalu) THEN 2
      ELSE 1
    END AS absen_berturut
  FROM sasaran s
  WHERE s.id NOT IN (SELECT anggota_id FROM hadir_bulan_ini);
END;
$$ LANGUAGE plpgsql;
```

---

## 33. InsForge Storage — Struktur Bucket

### 33.1 Bucket: `laporan-pdf`

```
laporan-pdf/
└── {posyandu_id}/
    └── {tahun}/
        └── {bulan-2-digit}/
            ├── laporan-bulanan.pdf
            ├── laporan-sasaran.pdf
            ├── laporan-pertumbuhan.pdf
            ├── laporan-pelayanan.pdf
            ├── laporan-bumil.pdf
            ├── laporan-lansia.pdf
            └── daftar-hadir-{jadwal_id}.pdf
```

**Contoh path:**
```
laporan-pdf/a1b2c3/2026/08/laporan-bulanan.pdf
```

**Kebijakan akses:**
- Read: kader, bidan, admin (posyandu_id harus cocok)
- Write: hanya Edge Function `generate-laporan` (via service role key)
- Public: tidak (semua akses via signed URL)

---

### 33.2 Bucket: `foto-anggota`

```
foto-anggota/
└── {posyandu_id}/
    └── {anggota_id}.webp    ← Format standar, max 200KB, 256×256px
```

**Kebijakan akses:**
- Read: semua pengguna terautentikasi di posyandu yang sama
- Write: kader, admin
- Transform: resize otomatis saat upload (via InsForge Image Transform jika tersedia, atau client-side canvas sebelum upload)

---

### 33.3 Signed URL Policy

```typescript
// Laporan PDF: berlaku 1 jam
const { data } = await insforge.storage
  .from('laporan-pdf')
  .createSignedUrl(path, 3600)

// Foto anggota: berlaku 1 hari (di-cache browser)
const { data } = await insforge.storage
  .from('foto-anggota')
  .createSignedUrl(path, 86400)
```

---

## 34. Wireframe Descriptions — Halaman Kritis

Deskripsi teks wireframe per halaman. Wireframe visual dibuat terpisah menggunakan Figma atau di-render langsung dari komponen.

---

### 34.1 `/login`

```
┌─────────────────────────────────────┐
│           [Logo SIPANDU]             │
│     Sistem Informasi Posyandu        │
│         ILP Flamboyan               │
├─────────────────────────────────────┤
│                                     │
│  Email                              │
│  ┌───────────────────────────────┐  │
│  │ kader@flamboyan.id            │  │
│  └───────────────────────────────┘  │
│                                     │
│  Password                           │
│  ┌───────────────────────────────┐  │
│  │ ••••••••             [👁 Lihat]│  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │          MASUK                │  │
│  └───────────────────────────────┘  │
│                                     │
│  [Lupa password?]                   │
│                                     │
│  v2.1.0 — Posyandu Flamboyan RW 06  │
└─────────────────────────────────────┘
```

**Behavior:**
- Email input: `type="email"`, autocomplete="username"
- Password input: toggle show/hide
- Enter key submit form
- Loading state: tombol disabled + spinner
- Error: banner merah di atas form ("Email atau password salah")
- Sukses: redirect ke `/dashboard`

---

### 34.2 `/dashboard` (Kader)

```
NAVBAR ─ SIPANDU | [🔔2] | [☰]
─────────────────────────────────────
HEADER
  Selamat datang, Bu Sari! 👋
  Posyandu Flamboyan · Agustus 2026

─────────────────────────────────────
[KARTU] Posyandu Berikutnya
  📅 15 Agustus 2026 (3 hari lagi)
  [Mulai Persiapan]

─────────────────────────────────────
STATISTIK BULAN INI (3 kartu grid)
┌─────────┐ ┌─────────┐ ┌─────────┐
│ Sasaran │ │  Hadir  │ │  D/S   │
│   192   │ │   156   │ │  81%   │
└─────────┘ └─────────┘ └─────────┘

─────────────────────────────────────
[SECTION] Perlu Perhatian 🔴
  ▸ 3 Balita status 2T
  ▸ 5 Anak belum hadir 2 bulan
  ▸ 1 Bumil risiko hipertensi
  [Lihat Semua]

─────────────────────────────────────
[SECTION] Menu Cepat
  [👥 Data Keluarga] [📋 Hari H]
  [📊 Laporan]       [⚙ Pengaturan]
```

---

### 34.3 `/posyandu/[id]/meja-1` (Registrasi)

```
NAVBAR ─ Meja 1: Registrasi | [✕ Keluar Sesi]
─────────────────────────────────────
📅 Posyandu 15 Agustus 2026
Sudah hadir: 43 | Belum: 149

─────────────────────────────────────
SEARCH
┌─────────────────────────── [🔍] ──┐
│ Cari nama atau NIK...              │
└────────────────────────────────────┘

─ HASIL PENCARIAN ────────────────────
┌────────────────────────────────────┐
│ 👤 Rina Putri Sari                │
│    3 Th 2 Bl · Balita             │
│    Orang tua: Ahmad               │
│    BB Juli: 12,5 kg · Gizi Baik ✅│
│                  [DAFTAR HADIR →] │
└────────────────────────────────────┘
┌────────────────────────────────────┐
│ 👤 Rina Kusuma                    │
│    28 Th · WUS                    │
│                  [DAFTAR HADIR →] │
└────────────────────────────────────┘

─ SUDAH HADIR (43) ──────────────────
  ✅ Adi Pratama · Balita · 09:14
  ✅ Siti Aminah · Bumil · 09:22
  ... [Tampilkan semua]
```

---

### 34.4 `/posyandu/[id]/meja-2/[anggota_id]` (Pengukuran Balita)

```
NAVBAR ─ Meja 2: Pengukuran
─────────────────────────────────────
👤 Rina Putri Sari · 3 Th 2 Bl · Balita
─────────────────────────────────────
       RIWAYAT 3 BULAN TERAKHIR
  ┌───────┬────────┬────────┬───────┐
  │ Bulan │  BB   │   TB   │Status │
  ├───────┼────────┼────────┼───────┤
  │ Jun   │ 12.0  │  90.0  │ Naik  │
  │ Jul   │ 12.5  │  91.5  │ Naik  │
  │ Agt ← │  —   │   —    │  —   │
  └───────┴────────┴────────┴───────┘

─────────────────────────────────────
INPUT PENGUKURAN
  Berat Badan *
  ┌──────────────────┐
  │ 13.0         kg  │
  └──────────────────┘

  Tinggi Badan *
  ┌──────────────────┐
  │ 93.0         cm  │
  └──────────────────┘

  Lingkar Kepala
  ┌──────────────────┐
  │              cm  │
  └──────────────────┘

  Lingkar Lengan Atas
  ┌──────────────────┐
  │              cm  │
  └──────────────────┘

─────────────────────────────────────
  [  PREVIEW HASIL  ]

─ PREVIEW (muncul setelah klik) ─────
  BB/U:  Normal  (-0.4 SD)  ✅
  TB/U:  Normal  (-1.1 SD)  ✅
  BB/TB: Normal  (+0.2 SD)  ✅
  Pertumbuhan: ⬆ NAIK +0.5 kg
─────────────────────────────────────
       [← Batal]  [Simpan →]
```

---

### 34.5 `/anggota/[id]` (Profil Anggota)

```
NAVBAR ─ Profil Anggota | [Edit ✏]
─────────────────────────────────────
┌─────┐  Rina Putri Sari
│ 👤  │  NIK: 3572****1021
│ foto│  3 Tahun 2 Bulan · Perempuan
└─────┘  Balita · Keluarga Ahmad
         Lahir: Selasa, 17 Jun 2023

─────────────────────────────────────
STATUS TERKINI
  BB: 12.5 kg  TB: 91.5 cm  (Jul 26)
  ┌──────────────────────────────┐
  │ Gizi Baik  ·  Normal  ✅    │
  └──────────────────────────────┘

─────────────────────────────────────
GRAFIK PERTUMBUHAN (Recharts)
  [BB ─] [TB ─]    [6Bl | 12Bl | All]
  ▲
  │   ·──·──·
  │  ·
  │ ·
  └──────────────────────────────→
  Mar Apr Mei Jun Jul Agt

─────────────────────────────────────
STATUS IMUNISASI
  ✅ HB-0      ✅ BCG
  ✅ DPT-1     ✅ DPT-2
  ✅ DPT-3     ✅ Polio-4
  ✅ MR-1      ⏳ DPT-4 (18 bln)
  ⏳ MR-2  (18 bln)

─────────────────────────────────────
RIWAYAT KUNJUNGAN
  ▸ 15 Jul 2026 · BB: 12.5 · Naik ✅
  ▸ 17 Jun 2026 · BB: 12.0 · Naik ✅
  ▸ 20 Mei 2026 · BB: 11.5 · Naik ✅
  [Lihat semua (12 kunjungan)]
```

---

### 34.6 `/monitoring/bidan` (Dashboard Bidan)

```
NAVBAR ─ Monitoring Kesehatan · Bidan
─────────────────────────────────────
HEADER  Agustus 2026 · Flamboyan RW06

─ ANTRIAN VERIFIKASI ────────────────
  🔴 47 kunjungan menunggu verifikasi
  [Verifikasi Semua] [Review Satu-Satu]

─ BALITA BERMASALAH ─────────────────
  Filter: [Gizi Buruk▾] [Stunting] [2T]

  ┌──────────────────────────────────┐
  │ 🔴 Budi Santoso · 18 Bln       │
  │     Gizi Buruk · BB/U: -3.2 SD  │
  │     [Lihat Detail] [Buat Catatan]│
  └──────────────────────────────────┘
  ┌──────────────────────────────────┐
  │ 🟡 Sari Dewi · 24 Bln          │
  │     2T · Tidak naik 2 bulan      │
  │     [Lihat Detail] [Buat Catatan]│
  └──────────────────────────────────┘

─ BUMIL RISIKO TINGGI ───────────────
  ┌──────────────────────────────────┐
  │ 🔴 Ny. Ani · 32 Mgg            │
  │     TD: 150/95 · Hipertensi      │
  │     [Lihat Detail]               │
  └──────────────────────────────────┘

─ GRAFIK TREN GIZI ──────────────────
  [Stunting %] [Gizi Buruk] [2T]
  ▲
  │ ···  ──  ··
  │   ──
  └──────────────────────────────→
    Mar Apr Mei Jun Jul Agt
```

---

## 35. State Machine Diagram

### 35.1 Status Kunjungan

```
                   ┌─────────────────┐
  [Kader klik      │                 │
   Daftar Hadir]   │     DRAFT       │◄─────────────────┐
                   │                 │                  │
                   └────────┬────────┘            [Bidan klik
                            │                    "Kembalikan"]
                   [Bidan klik         │
                    "Periksa"]         │
                            │          │
                   ┌────────▼────────┐ │
                   │                 │ │
                   │   DIPERIKSA     │─┘
                   │                 │
                   └────────┬────────┘
                            │
                   [Bidan klik
                    "Validasi"]
                            │
                   ┌────────▼────────┐
                   │                 │
                   │     VALID       │
                   │  (final state)  │
                   │                 │
                   └─────────────────┘
                            │
                   [Kader generate laporan]
                            │
                   Hanya kunjungan VALID
                   masuk ke laporan resmi
```

---

### 35.2 Status Jadwal Posyandu

```
  [Admin buat jadwal]
          │
  ┌───────▼──────┐
  │    DRAFT     │
  └───────┬──────┘
          │ [Kader klik "Mulai Sesi"]
  ┌───────▼──────┐
  │    AKTIF     │◄─── Hari H berjalan
  └───────┬──────┘
          │ [Kader klik "Tutup Sesi"]
          │ [Trigger: cek ketidakhadiran,
          │  hitung statistik, notifikasi]
  ┌───────▼──────┐
  │   SELESAI    │  ← Laporan bisa digenerate
  └──────────────┘

  Dari DRAFT atau AKTIF:
  [Admin klik "Batalkan"] → DIBATALKAN (final)
```

---

### 35.3 Status Kehamilan

```
  [Kader aktifkan toggle hamil + isi HPHT]
          │
  ┌───────▼──────────────┐
  │   AKTIF              │
  │   usia_minggu++      │
  │   kategori=ibu_hamil │
  └───────┬──────────────┘
          │ [Kader klik "Selesaikan Kehamilan"]
  ┌───────▼──────────────┐
  │   SELESAI            │
  │   status_hamil=false │
  │   kategori recalc    │
  └──────────────────────┘
```

---

### 35.4 Status Risiko

```
  [deteksi-risiko Edge Function]
          │
  ┌───────▼──────┐
  │    AKTIF     │  ← Muncul di dashboard & notifikasi
  └───────┬──────┘
          │               │
  [Kader/Bidan     [Kader/Bidan klik
   klik "Tangani"]  "Abaikan" + alasan]
          │               │
  ┌───────▼──────┐ ┌──────▼──────────┐
  │  DITANGANI   │ │   DIABAIKAN     │
  └──────────────┘ └─────────────────┘
```

---

## 36. Seed Data Specification

Data awal yang harus dimasukkan ke database sebelum sistem dapat digunakan.

---

### 36.1 Profil Posyandu (Wajib — Setup Awal)

```sql
INSERT INTO posyandu (
  nama, rw, desa, kecamatan, kota,
  jadwal_hari, jadwal_mulai, jadwal_selesai
) VALUES (
  'Posyandu Flamboyan', '06', 'Mojorejo',
  'Junrejo', 'Batu',
  'Sabtu', '08:00', '12:00'
);
```

---

### 36.2 Struktur Organisasi (Wajib — Setup Awal)

```sql
-- Template (nama diisi saat setup)
INSERT INTO organisasi_posyandu (posyandu_id, jabatan, nama, urutan) VALUES
  (posyandu_id, 'kepala_desa',     'Nama Kepala Desa',    1),
  (posyandu_id, 'ketua_pkk',       'Nama Ketua PKK',      2),
  (posyandu_id, 'bidan_desa',      'Nama Bidan Desa',     3),
  (posyandu_id, 'ketua_posyandu',  'Nama Ketua Posyandu', 4);
```

---

### 36.3 Tabel WHO LMS Reference (Wajib — Otomatis via Migration)

Tabel ini berisi ribuan baris data L, M, S dari standar WHO 2006. Harus di-seed sekali saat setup database.

**Sumber data resmi:**
- https://www.who.int/tools/child-growth-standards/standards (download CSV tables)
- File: `wfa-boys-zscore-expanded-tables.xlsx` dan equivalents untuk girls, height

**Script seed:**
```bash
# Di package.json scripts
"db:seed:who-lms": "node scripts/seed-who-lms.mjs"
```

```javascript
// scripts/seed-who-lms.mjs
import { parse } from 'csv-parse/sync'
import { readFileSync } from 'fs'
import { insforge } from '../lib/insforge.js'

const files = [
  { file: 'data/who-lms/wfa-boys.csv',    indikator: 'bbu', jenis_kelamin: 'L' },
  { file: 'data/who-lms/wfa-girls.csv',   indikator: 'bbu', jenis_kelamin: 'P' },
  { file: 'data/who-lms/lhfa-boys.csv',   indikator: 'tbu', jenis_kelamin: 'L' },
  { file: 'data/who-lms/lhfa-girls.csv',  indikator: 'tbu', jenis_kelamin: 'P' },
  { file: 'data/who-lms/wfh-boys.csv',    indikator: 'bbtb', jenis_kelamin: 'L' },
  { file: 'data/who-lms/wfh-girls.csv',   indikator: 'bbtb', jenis_kelamin: 'P' },
]

for (const { file, indikator, jenis_kelamin } of files) {
  const csv = readFileSync(file, 'utf8')
  const rows = parse(csv, { columns: true })
  await insforge.from('who_lms_reference').insert(
    rows.map(r => ({
      indikator, jenis_kelamin,
      usia_bulan: r.Month ?? null,
      panjang_cm: r.Height ?? null,
      l_value: r.L, m_value: r.M, s_value: r.S,
      sd3neg: r.SD3neg, sd4neg: r.SD4neg,
      sd3pos: r.SD3pos, sd4pos: r.SD4pos,
    }))
  )
  console.log(`✅ Seeded ${rows.length} rows untuk ${indikator} ${jenis_kelamin}`)
}
```

---

### 36.4 Akun Super Admin (Wajib — Setup Awal)

```typescript
// Dijalankan sekali via script setup
const { data, error } = await insforge.auth.signUp({
  email: 'admin@sipandu-flamboyan.id',
  password: process.env.ADMIN_INITIAL_PASSWORD
})

await insforge.from('users').insert({
  id: data.user.id,
  nama_lengkap: 'Administrator SIPANDU',
  peran: 'super_admin',
  posyandu_id: POSYANDU_ID
})
```

---

## 37. Error Codes Catalog

Daftar kode error standar yang dikembalikan oleh Server Actions dan Edge Functions.

| Kode Error | HTTP | Pesan Pengguna (ID) | Penyebab |
|---|---|---|---|
| `VALIDATION_ERROR` | 400 | "Data yang dimasukkan tidak valid" | Zod schema gagal |
| `NIK_DUPLICATE` | 409 | "NIK ini sudah terdaftar atas nama [nama]" | NIK sudah ada di DB |
| `KK_DUPLICATE` | 409 | "Nomor KK ini sudah terdaftar" | KK sudah ada di DB |
| `ANGGOTA_NOT_FOUND` | 404 | "Data anggota tidak ditemukan" | ID tidak ada di DB |
| `KUNJUNGAN_DUPLICATE` | 409 | "Peserta ini sudah terdaftar hadir hari ini" | UNIQUE constraint |
| `SESI_NOT_ACTIVE` | 400 | "Sesi posyandu belum aktif atau sudah ditutup" | Status bukan 'aktif' |
| `SESI_ALREADY_CLOSED` | 400 | "Sesi posyandu sudah ditutup" | Status 'selesai' |
| `PENGUKURAN_EXISTS` | 409 | "Data pengukuran sudah ada untuk kunjungan ini" | UNIQUE di pengukuran |
| `LMS_NOT_FOUND` | 404 | "Data referensi WHO tidak ditemukan" | Usia di luar tabel LMS |
| `ZSCORE_EXTREME` | 200 | "Nilai z-score ekstrem, periksa kembali pengukuran" | Z > 5 atau Z < -5 |
| `UNAUTHORIZED` | 401 | "Sesi Anda telah berakhir, silakan login kembali" | JWT expired |
| `FORBIDDEN` | 403 | "Anda tidak memiliki akses ke halaman ini" | Peran tidak cukup |
| `STORAGE_ERROR` | 500 | "Gagal menyimpan file, coba lagi" | InsForge Storage error |
| `PDF_GENERATION_FAILED` | 500 | "Gagal membuat laporan PDF, coba beberapa saat lagi" | Edge Function error |
| `NO_VALID_DATA` | 400 | "Tidak ada data valid untuk bulan ini. Minta Bidan untuk memverifikasi terlebih dahulu" | Belum ada kunjungan Valid |
| `KEHAMILAN_GENDER_ERROR` | 400 | "Anggota berjenis kelamin laki-laki tidak dapat ditandai hamil" | jenis_kelamin = 'L' |
| `SERVER_ERROR` | 500 | "Terjadi kesalahan pada server. Coba beberapa saat lagi" | Unhandled exception |

---

## 38. Performance & Caching Strategy

### 38.1 Strategi Caching Next.js

```typescript
// app/keluarga/page.tsx — daftar keluarga, cache 1 menit
export const revalidate = 60

// app/anggota/[id]/page.tsx — profil anggota, cache 30 detik
export const revalidate = 30

// app/posyandu/[id]/meja-1/page.tsx — REAL-TIME, no cache
export const dynamic = 'force-dynamic'

// app/monitoring/*/page.tsx — dashboard, cache 5 menit
export const revalidate = 300
```

### 38.2 Database Query Optimization

```sql
-- Index komposit untuk query pencarian kunjungan
CREATE INDEX idx_kunjungan_jadwal_anggota
  ON kunjungan(jadwal_id, anggota_id);

-- Index untuk query laporan bulanan (JOIN besar)
CREATE INDEX idx_jadwal_posyandu_posyandu_tanggal
  ON jadwal_posyandu(posyandu_id, tanggal);

-- Index untuk filter kategori + status aktif (query paling sering)
CREATE INDEX idx_anggota_aktif_kategori
  ON anggota(status_aktif, kategori)
  WHERE status_aktif = TRUE;

-- Index untuk pencarian nama (case-insensitive)
CREATE INDEX idx_anggota_nama_gin
  ON anggota USING gin(to_tsvector('indonesian', nama));

-- Partial index untuk risiko aktif saja
CREATE INDEX idx_risiko_aktif
  ON risiko(anggota_id)
  WHERE status = 'aktif';
```

### 38.3 Pagination

Semua list view yang berpotensi besar menggunakan cursor-based pagination:

```typescript
// Daftar keluarga — 20 per halaman
const keluarga = await db.keluarga
  .select('*')
  .order('nama_kepala_keluarga')
  .range(page * 20, (page + 1) * 20 - 1)

// Riwayat kunjungan anggota — 10 per halaman
const kunjungan = await db.kunjungan
  .select('*, pengukuran(*), pelayanan(*)')
  .eq('anggota_id', id)
  .order('created_at', { ascending: false })
  .range(cursor, cursor + 9)
```

### 38.4 Search Optimization

Pencarian peserta di Meja 1 (paling sering digunakan):

```typescript
// Gunakan PostgreSQL full-text search + ILIKE fallback
const hasil = await db.rpc('cari_anggota', {
  p_query: query,
  p_posyandu_id: posyanduId,
  p_limit: 10
})

// Function PostgreSQL
CREATE FUNCTION cari_anggota(p_query TEXT, p_posyandu_id UUID, p_limit INT)
RETURNS SETOF anggota AS $$
  SELECT a.* FROM anggota a
  JOIN keluarga k ON k.id = a.keluarga_id
  WHERE k.posyandu_id = p_posyandu_id
    AND a.status_aktif = TRUE
    AND (
      a.nama ILIKE '%' || p_query || '%'    -- Pencarian nama
      OR a.nik LIKE p_query || '%'           -- Pencarian NIK (prefix)
      OR k.nomor_kk LIKE p_query || '%'      -- Pencarian KK
    )
  ORDER BY
    CASE WHEN a.nama ILIKE p_query || '%' THEN 0 ELSE 1 END,
    a.nama
  LIMIT p_limit;
$$ LANGUAGE sql;
```

### 38.5 Image Optimization

```typescript
// Foto anggota — resize sebelum upload
async function uploadFotoAnggota(file: File, anggotaId: string) {
  // 1. Resize di client menggunakan canvas
  const resized = await resizeImage(file, { width: 256, height: 256, format: 'webp' })

  // 2. Upload ke Storage
  await insforge.storage
    .from('foto-anggota')
    .upload(`${posyanduId}/${anggotaId}.webp`, resized, {
      contentType: 'image/webp',
      upsert: true
    })
}
```

---

## 39. Data Retention & Privacy Policy

### 39.1 Kebijakan Retensi Data

| Jenis Data | Retensi | Alasan |
|---|---|---|
| Data kunjungan | Permanen | Rekam medis, diperlukan untuk tren jangka panjang |
| Data anggota | Permanen (atau sampai diminta hapus) | Riwayat pertumbuhan anak |
| Audit log | 2 tahun | Keperluan audit dan investigasi |
| Laporan PDF | 5 tahun | Arsip administratif Posyandu |
| Notifikasi | 90 hari | Tidak relevan setelah lama |
| Session/token | 7 hari | Keamanan |
| Foto anggota | Permanen (atau sampai dihapus) | |

### 39.2 Data Sensitif

Data berikut diklasifikasikan sebagai sensitif dan mendapat perlindungan ekstra:

| Data | Perlindungan |
|---|---|
| NIK anggota | Tidak tampil di URL, masked di UI (tampil 6 digit pertama + `****`) |
| Tanggal lahir | Hanya tampil di halaman profil, tidak di list umum |
| Data kesehatan (BB, TD, GDS, dll.) | RLS ketat, tidak ada public endpoint |
| Status kehamilan | Hanya visible untuk kader + bidan |
| Status risiko kesehatan | Hanya visible untuk kader + bidan, tidak untuk PKK/Kades |

### 39.3 Hak Pengguna atas Data

Karena ini adalah sistem layanan kesehatan pemerintah:
- Data warga dapat diminta untuk dilihat oleh warga yang bersangkutan (via kader)
- Penghapusan data hanya bisa dilakukan oleh Admin dengan persetujuan tertulis
- Data tidak dibagikan ke pihak ketiga tanpa persetujuan Kepala Desa + Bidan

---

## 40. Future Roadmap (Fase 4+) *(Diperbarui v3.0.0)*

### Fase 4 — Integrasi Ekosistem RW 06 (Target: Segera setelah go-live Fase 3)

**Prioritas utama Fase 4 adalah integrasi dengan SINDUKSADATI.** Detail teknis lengkap ada di Bagian 42.

| Fitur | Prioritas | Deskripsi |
|---|---|---|
| **Integrasi SINDUKSADATI** | **🔴 Tinggi** | **Hubungkan SIPANDU ke SINDUKSADATI sebagai master kependudukan RW 06 — lihat Bagian 42** |
| Notifikasi WhatsApp | Tinggi | Kirim reminder jadwal ke warga via WhatsApp Business API |
| Export Excel | Sedang | Ekspor data ke format .xlsx untuk kebutuhan pelaporan kecamatan |
| PWA Offline | Sedang | Alur hari H bisa berjalan tanpa internet, sync saat online |
| Skrining EDD | Sedang | Early developmental delay screening untuk bayi 0–2 tahun |
| Multi-Posyandu | Sedang | Satu instalasi untuk banyak Posyandu di Kota Batu |

### Fase 5 — Integrasi Ekosistem Kesehatan Nasional

| Fitur | Prioritas | Deskripsi |
|---|---|---|
| Integrasi e-Kohort Kemenkes | Sedang | Sinkronisasi data dengan sistem pusat Kemenkes RI |
| Integrasi SIMKES Puskesmas | Sedang | Rujukan digital langsung ke Puskesmas |
| Peta distribusi stunting | Rendah | Visualisasi geografis sebaran stunting per RT/RW (data dari SINDUKSADATI GIS) |
| Aplikasi Android Native | Rendah | Flutter app untuk kader dengan mode offline penuh |
| AI-powered insight | Rendah | Rekomendasi intervensi otomatis berbasis data historis |

---

## 41. Stakeholder Sign-Off

Dokumen ini menjadi acuan resmi pengembangan SIPANDU. Setiap perubahan fitur yang signifikan harus mendapat persetujuan dari pihak berikut sebelum diimplementasikan.

| Pihak | Nama | Peran | Tanggal | Tanda Tangan |
|---|---|---|---|---|
| Pengembang | Izzat | Arsitek sistem & developer | ___ | ___ |
| Ketua Posyandu | _______ | Pengguna utama (kader) | ___ | ___ |
| Bidan Desa | _______ | Validator data & domain expert | ___ | ___ |
| Kepala Desa | _______ | Pemangku kepentingan | ___ | ___ |

---

## 30. Changelog (Diperbarui)

| Versi | Tanggal | Perubahan |
|---|---|---|
| 1.0.0 | Agustus 2026 | Versi awal: 21 bab — struktur dasar |
| 2.0.0 | Agustus 2026 | Edisi lengkap: User Stories, Validasi, Edge Cases, Z-score, Imunisasi, Glossary |
| 2.1.0 | Agustus 2026 | Tambah: API Design, Design System, Testing Strategy, Deployment, Risk Register, Dependencies, Checklist, User Manual outline |
| 2.2.0 | Agustus 2026 | Final: Edge Functions spec, DB Triggers, Wireframes, State Machines, Seed Data, Error Codes, Performance, Data Retention, Roadmap, Sign-Off |
| **3.0.0** | **Agustus 2026** | **Integrasi SINDUKSADATI: Bagian 42 baru (lengkap), update §4, §13, §20, §40. PRD kini mencakup seluruh ekosistem RW 06.** |
| **3.0.1** | **September 2026** | **Amendemen kepatuhan implementasi (audit build): (1) §6 — Bidan ikut jalankan alur 5 meja & tambah keluarga/anggota (realitas lapangan, integritas dijaga lock data Valid + audit log). (2) §31 — kalkulasi-zscore/deteksi-risiko/generate-laporan resmi client-side; edge function tersisa kirim-notifikasi + sinduksadati-proxy. (3) §42.7 — webhook receiver = InsForge Edge Function, bukan Route Handler Next.js. (4) Notifikasi = polling 45 dtk (bukan realtime). (5) PDF = print-CSS. (6) Sesi Hari H: alur 5 meja butuh sesi aktif berjudul tema; menu sidebar = 1 item "Pelayanan (Hari H)".** |

---

*Dokumen ini adalah living document. Versi terbaru selalu tersedia di repository GitHub project SIPANDU.*

**Versi:** 3.0.0 | **Terakhir diperbarui:** Agustus 2026 | **Status:** ✅ PRODUCTION-READY + SINDUKSADATI INTEGRATION PLANNED

---

## 42. Perencanaan Integrasi SINDUKSADATI *(Baru v3.0.0)*

> **Konteks:** SINDUKSADATI (*Sistem Informasi Penduduk Satu Data Terintegrasi*) adalah sistem pendataan kependudukan tingkat RW yang dibangun secara terpisah untuk RW 06 Desa Mojorejo. SINDUKSADATI menjadi *Single Source of Truth* untuk identitas warga, keluarga, KK, domisili, dan lifecycle kependudukan. SIPANDU dan SINDUKSADATI adalah **dua sistem independen** yang akan dihubungkan melalui API — bukan digabungkan menjadi satu aplikasi.

---

### 42.1 Mengapa Integrasi Ini Penting

Tanpa integrasi, kedua sistem menciptakan **duplikasi master data warga** yang akan menimbulkan:
- Inkonsistensi nama, tanggal lahir, atau status warga di dua sistem berbeda
- Kader harus input data yang sama dua kali (di SIPANDU dan SINDUKSADATI)
- Jika warga meninggal atau pindah, SIPANDU tidak tahu secara otomatis
- Dashboard Citizen 360 SINDUKSADATI tidak bisa menampilkan data kesehatan warga

Dengan integrasi, SIPANDU berhenti menjadi "pemilik" data identitas warga dan fokus sepenuhnya pada domain **kesehatan dan pelayanan Posyandu**.

---

### 42.2 Prinsip Integrasi

| Prinsip | Penjelasan |
|---|---|
| **No Duplicate Master** | SIPANDU tidak membuat Person Master baru setelah integrasi. Anggota baru di-link ke `penduduk_id` SINDUKSADATI. |
| **Domain Separation** | SINDUKSADATI = identitas & kependudukan. SIPANDU = klinis & pelayanan kesehatan. |
| **API-Only** | Tidak ada direct database access antar sistem. Semua komunikasi melalui REST API atau webhook. |
| **Data Minimization** | SIPANDU hanya minta scope API yang benar-benar dibutuhkan untuk fungsi Posyandu. |
| **Health Data Stays in SIPANDU** | Data pengukuran, imunisasi, status gizi, riwayat kunjungan tidak pindah ke SINDUKSADATI. Hanya ringkasan agregat yang dibagikan ke Citizen 360. |
| **Graceful Fallback** | Jika SINDUKSADATI API down, SIPANDU tetap bisa beroperasi penuh (input manual tetap tersedia). |
| **Fase 1–3 Independen** | Integrasi ini bukan blocker. SIPANDU Fase 1–3 berjalan tanpa SINDUKSADATI. Fase 4 dimulai setelah SINDUKSADATI Phase 6 (Integration Platform) aktif. |

---

### 42.3 Pembagian Domain Data

| Domain Data | Dikelola oleh | Dibaca oleh |
|---|---|---|
| Identitas warga (nama, NIK, tanggal lahir, jenis kelamin) | **SINDUKSADATI** | SIPANDU (read-only) |
| Struktur keluarga & Kartu Keluarga | **SINDUKSADATI** | SIPANDU (read-only) |
| Domisili aktif (RT/RW) | **SINDUKSADATI** | SIPANDU (filter wilayah Posyandu) |
| Status kependudukan (hidup, meninggal, pindah) | **SINDUKSADATI** | SIPANDU (lifecycle trigger) |
| Data pengukuran antropometri | **SIPANDU** | SINDUKSADATI Citizen 360 (summary saja) |
| Riwayat imunisasi | **SIPANDU** | SINDUKSADATI Citizen 360 (summary saja) |
| Status gizi & pertumbuhan balita | **SIPANDU** | SINDUKSADATI Citizen 360 (summary saja) |
| Kunjungan & pelayanan Posyandu | **SIPANDU** | — |
| Flag risiko aktif (2T, bumil risiko, dll.) | **SIPANDU** | SINDUKSADATI Citizen 360 (flag saja) |
| Laporan Posyandu PDF | **SIPANDU** | — |
| Surat RT/RW, administrasi kependudukan | **SINDUKSADATI** | — |

---

### 42.4 Arsitektur Integrasi

```
┌───────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                           │
│  SIPANDU (Next.js)              SINDUKSADATI (Next.js)    │
│  sipandu.vercel.app             satudata-rw.vercel.app    │
└──────────────┬─────────────────────────┬──────────────────┘
               │ API call (Bearer JWT)    │ Webhook push
               │                         │ (event lifecycle)
               ↓                         ↓
┌──────────────────────┐    ┌────────────────────────────────┐
│  SIPANDU API Routes  │    │  SINDUKSADATI API Gateway      │
│  /api/sipandu/       │    │  /api/v1/penduduk/:id          │
│  citizen-summary     │←───┤  /api/v1/keluarga/:id          │
│  (health summary)    │    │  /api/v1/events (webhook)      │
│  /api/webhook/       │←───┤  citizen-360/:penduduk_id      │
│  sinduksadati        │    └────────────────────────────────┘
└──────────┬───────────┘
           │
┌──────────▼───────────┐
│  InsForge PostgreSQL  │
│  (SIPANDU DB)         │
│  anggota.             │
│  sinduksadati_        │
│  penduduk_id ─────────┼──► logical FK ke SINDUKSADATI
└──────────────────────┘
```

**Catatan arsitektur:**
- SIPANDU mendaftar sebagai `integration_app` di SINDUKSADATI, mendapat API key dan allowed scopes.
- Webhook dari SINDUKSADATI diterima di `POST /api/webhook/sinduksadati` (Route Handler SIPANDU).
- Semua event webhook divalidasi dengan `WEBHOOK_SECRET` sebelum diproses.
- Tidak ada shared InsForge instance. Masing-masing sistem punya project InsForge sendiri.

> **⚠ AMENDEMEN v3.0.1 (2026-09-06):** SIPANDU adalah **SPA Vite** (bukan Next.js), sehingga webhook receiver TIDAK diimplementasikan sebagai Route Handler `app/api/...` seperti contoh di bawah. Saat Fase 4 riil dimulai, receiver diimplementasikan sebagai **InsForge Edge Function** (`functions/webhook-sinduksadati.ts`) dengan validasi HMAC `WEBHOOK_SECRET` yang setara. Implementasi integrasi aktif saat ini: lookup NIK + linking manual via `sinduksadati-proxy`. Tabel `sinduksadati_event_log` sudah disiapkan di migrasi.

---

### 42.5 Perubahan Database SIPANDU

Kolom baru ditambahkan melalui migration terpisah di Fase 4 — tidak memecah Fase 1–3.

```sql
-- =============================================
-- MIGRATION: 020_add_sinduksadati_integration.sql
-- Jalankan setelah SIPANDU Fase 3 go-live
-- =============================================

-- Kolom integrasi di tabel anggota
ALTER TABLE anggota
  ADD COLUMN sinduksadati_penduduk_id  UUID UNIQUE,
  ADD COLUMN sinduksadati_sync_at      TIMESTAMPTZ;

-- Index untuk lookup cepat
CREATE UNIQUE INDEX idx_anggota_sinduksadati_id
  ON anggota(sinduksadati_penduduk_id)
  WHERE sinduksadati_penduduk_id IS NOT NULL;

-- Kolom integrasi di tabel keluarga
ALTER TABLE keluarga
  ADD COLUMN sinduksadati_keluarga_id  UUID UNIQUE;

CREATE UNIQUE INDEX idx_keluarga_sinduksadati_id
  ON keluarga(sinduksadati_keluarga_id)
  WHERE sinduksadati_keluarga_id IS NOT NULL;

-- Tabel log event yang masuk dari SINDUKSADATI
CREATE TABLE sinduksadati_event_log (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type                VARCHAR(30) NOT NULL,
    -- PERSON_CREATED | PERSON_UPDATED | PERSON_DECEASED
    -- PERSON_MOVED   | FAMILY_CHANGED | LINKED_MANUAL
  sinduksadati_penduduk_id  UUID NOT NULL,
  anggota_id                UUID REFERENCES anggota(id),
  payload                   JSONB NOT NULL,
  status                    VARCHAR(15) NOT NULL DEFAULT 'received',
    -- received | processed | ignored | error
  error_message             TEXT,
  processed_at              TIMESTAMPTZ,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sdti_log_status     ON sinduksadati_event_log(status);
CREATE INDEX idx_sdti_log_event_type ON sinduksadati_event_log(event_type);
CREATE INDEX idx_sdti_log_created    ON sinduksadati_event_log(created_at DESC);
```

**Update ERD Relasi (tambahan):**
```
anggota.sinduksadati_penduduk_id ──► SINDUKSADATI.penduduk.penduduk_id  (logical FK)
keluarga.sinduksadati_keluarga_id ──► SINDUKSADATI.keluarga.id          (logical FK)
```

---

### 42.6 Environment Variables Baru (Fase 4)

Tambahkan ke Vercel Dashboard (jangan di-commit ke repo):

```bash
# SINDUKSADATI Integration
SINDUKSADATI_API_URL=https://satudata-rw.vercel.app/api/v1
SINDUKSADATI_API_KEY=sk_live_...          # Didapat setelah registrasi integration app
SINDUKSADATI_SERVICE_TOKEN=...            # Service-to-service token (untuk Citizen 360)
SINDUKSADATI_WEBHOOK_SECRET=whsec_...     # Untuk validasi webhook masuk
```

---

### 42.7 Cara Mendaftarkan SIPANDU ke SINDUKSADATI

Langkah teknis menghubungkan kedua sistem:

**Langkah 1 — Registrasi sebagai Integration App**

Masuk ke panel admin SINDUKSADATI sebagai `super_admin`, buka menu **Integrasi → Aplikasi Terintegrasi → Daftarkan Aplikasi Baru**, lalu isi:

```json
{
  "nama_aplikasi": "SIPANDU",
  "deskripsi": "Sistem Informasi Posyandu ILP Flamboyan RW 06",
  "callback_url": "https://sipandu.vercel.app/api/webhook/sinduksadati",
  "allowed_scopes": [
    "resident.basic.read",
    "resident.restricted.read",
    "family.basic.read",
    "child.profile.read",
    "domicile.read",
    "events.subscribe"
  ],
  "contact_email": "izzat@email.com"
}
```

Setelah pendaftaran, SINDUKSADATI akan mengeluarkan:
- `API_KEY` → simpan sebagai `SINDUKSADATI_API_KEY`
- `SERVICE_TOKEN` → simpan sebagai `SINDUKSADATI_SERVICE_TOKEN`
- `WEBHOOK_SECRET` → simpan sebagai `SINDUKSADATI_WEBHOOK_SECRET`

**Langkah 2 — Daftarkan Webhook Events**

Di panel SINDUKSADATI, aktifkan event berikut untuk dikirim ke SIPANDU:
- `PERSON_CREATED`
- `PERSON_UPDATED`
- `PERSON_DECEASED`
- `PERSON_MOVED`
- `FAMILY_CHANGED`

**Langkah 3 — Implementasi Route Handler Webhook di SIPANDU**

```typescript
// app/api/webhook/sinduksadati/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';

export async function POST(req: NextRequest) {
  // 1. Validasi signature webhook
  const signature = req.headers.get('X-Sinduksadati-Signature');
  const body = await req.text();

  const expectedSig = createHmac('sha256', process.env.SINDUKSADATI_WEBHOOK_SECRET!)
    .update(body)
    .digest('hex');

  if (!timingSafeEqual(Buffer.from(signature!), Buffer.from(`sha256=${expectedSig}`))) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // 2. Parse payload
  const event = JSON.parse(body);

  // 3. Log ke sinduksadati_event_log
  await db.from('sinduksadati_event_log').insert({
    event_type: event.event_type,
    sinduksadati_penduduk_id: event.data.penduduk_id,
    payload: event,
    status: 'received',
  });

  // 4. Proses event secara async (Edge Function)
  await processEvent(event);

  return NextResponse.json({ received: true });
}
```

**Langkah 4 — Implementasi Event Processor (Edge Function)**

```typescript
// InsForge Edge Function: process-sinduksadati-event

async function processEvent(event: SinduksadatiEvent) {
  const { event_type, data } = event;

  switch (event_type) {
    case 'PERSON_DECEASED':
      // Cari anggota yang ter-link, arsipkan
      const anggota = await db.from('anggota')
        .select('id')
        .eq('sinduksadati_penduduk_id', data.penduduk_id)
        .single();

      if (anggota.data) {
        await db.from('anggota')
          .update({ status_aktif: false })
          .eq('id', anggota.data.id);
        // Kirim notifikasi ke Bidan
        await kirimNotifikasi({
          tipe: 'warga_meninggal',
          anggota_id: anggota.data.id,
          pesan: `${data.nama_lengkap} telah meninggal per ${data.tanggal_peristiwa}`
        });
      }
      break;

    case 'PERSON_MOVED':
      // Flag sebagai "domisili berubah — perlu verifikasi kader"
      await db.from('anggota')
        .update({ catatan_kader: `[SISTEM] Domisili berubah per SINDUKSADATI (${data.tanggal_peristiwa}). Verifikasi kader diperlukan.` })
        .eq('sinduksadati_penduduk_id', data.penduduk_id);
      break;

    case 'PERSON_CREATED':
      // Notifikasi kader: ada warga baru potensial sebagai sasaran
      if (data.kategori_usia === 'bayi' || data.kategori_usia === 'balita') {
        await kirimNotifikasi({
          tipe: 'sasaran_baru_potensial',
          pesan: `Warga baru terdaftar di SINDUKSADATI: ${data.nama_lengkap}. Pertimbangkan untuk mendaftarkan ke Posyandu.`
        });
      }
      break;

    case 'PERSON_UPDATED':
      // Sinkronisasi nama/profil dasar
      await db.from('anggota')
        .update({ nama: data.nama_lengkap })
        .eq('sinduksadati_penduduk_id', data.penduduk_id);
      break;
  }

  // Update status log
  await db.from('sinduksadati_event_log')
    .update({ status: 'processed', processed_at: new Date().toISOString() })
    .eq('sinduksadati_penduduk_id', data.penduduk_id)
    .eq('status', 'received');
}
```

---

### 42.8 API Scopes yang Diminta SIPANDU

| Scope | Digunakan untuk | Data yang diterima |
|---|---|---|
| `resident.basic.read` | Lookup warga saat registrasi baru | nama, tanggal_lahir, jenis_kelamin, status_penduduk |
| `resident.restricted.read` | Validasi NIK saat linking manual | NIK (hanya verifikasi, tidak disimpan) |
| `family.basic.read` | Lookup struktur keluarga & KK | hubungan keluarga, nomor KK (masked) |
| `child.profile.read` | Akses data bayi/balita | nama, tanggal lahir anak, relasi orang tua |
| `domicile.read` | Verifikasi warga masih di RW 06 | RT, RW, status domisili aktif |
| `events.subscribe` | Terima webhook lifecycle | event payload (lihat §42.9) |

**Scope yang TIDAK diminta SIPANDU:**
- Data keuangan/iuran warga
- Koordinat GIS hunian
- Data surat menyurat RT/RW
- Warga di luar RW 06

---

### 42.9 Event Integration — SINDUKSADATI → SIPANDU

| Event | Trigger di SINDUKSADATI | Aksi di SIPANDU | Prioritas |
|---|---|---|---|
| `PERSON_CREATED` | Warga baru terdaftar (terutama bayi) | Notifikasi kader: ada potensi sasaran baru | P1 |
| `PERSON_DECEASED` | Warga meninggal, status diupdate | Arsipkan `anggota` terkait (`status_aktif = false`) | **P0** |
| `PERSON_MOVED` | Warga pindah domisili keluar RW 06 | Flag anggota: "domisili berubah — verifikasi kader" | **P0** |
| `PERSON_UPDATED` | Perubahan nama/profil di SINDUKSADATI | Sinkronisasi nama di tabel `anggota` | P1 |
| `FAMILY_CHANGED` | Perubahan struktur KK | Update relasi keluarga; notifikasi kader jika struktural | P2 |

**Contoh payload event `PERSON_DECEASED`:**
```json
{
  "event_type": "PERSON_DECEASED",
  "schema_version": "1.0",
  "occurred_at": "2026-08-30T10:00:00Z",
  "source": "sinduksadati",
  "data": {
    "penduduk_id": "550e8400-e29b-41d4-a716-446655440000",
    "resident_code": "PDK-000123",
    "nik_masked": "3579**********0001",
    "nama_lengkap": "Budi Santoso",
    "tanggal_peristiwa": "2026-08-29"
  }
}
```

---

### 42.10 Citizen 360 — Kontribusi Data Kesehatan SIPANDU

SINDUKSADATI menyediakan endpoint `GET /citizen-360/:penduduk_id` yang mengagregasi data warga dari semua sistem terintegrasi. SIPANDU berkontribusi menyediakan ringkasan kesehatan melalui endpoint berikut.

**Endpoint yang diimplementasikan di SIPANDU:**
```
GET /api/sipandu/citizen-summary/:penduduk_id
Authorization: Bearer <SINDUKSADATI_SERVICE_TOKEN>
```

**Implementasi di SIPANDU:**
```typescript
// app/api/sipandu/citizen-summary/[penduduk_id]/route.ts

export async function GET(
  req: NextRequest,
  { params }: { params: { penduduk_id: string } }
) {
  // 1. Verifikasi service token dari SINDUKSADATI
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (token !== process.env.SINDUKSADATI_SERVICE_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Cari anggota yang ter-link ke penduduk_id ini
  const { data: anggota } = await db.from('anggota')
    .select(`
      id, nama, kategori, status_aktif,
      kunjungan(
        id, created_at,
        pengukuran(status_gizi, status_pertumbuhan),
        pelayanan(imunisasi, imunisasi_jenis, vitamin_a, pmt),
        risiko(jenis_risiko, status)
      )
    `)
    .eq('sinduksadati_penduduk_id', params.penduduk_id)
    .single();

  if (!anggota) {
    return NextResponse.json({ error: 'Not found in SIPANDU' }, { status: 404 });
  }

  // 3. Hitung summary (tanpa detail klinis)
  const kunjunganTerakhir = anggota.kunjungan?.[0];
  const risikoAktif = anggota.kunjungan
    ?.flatMap(k => k.risiko ?? [])
    .filter(r => r.status === 'aktif') ?? [];

  return NextResponse.json({
    penduduk_id: params.penduduk_id,
    sipandu_anggota_id: anggota.id,
    posyandu: 'Flamboyan RW 06',
    last_updated: new Date().toISOString(),
    summary: {
      kunjungan_terakhir: kunjunganTerakhir?.created_at ?? null,
      total_kunjungan_tahun_ini: anggota.kunjungan?.length ?? 0,
      status_aktif_posyandu: anggota.status_aktif
    },
    pertumbuhan: {
      status_gizi: kunjunganTerakhir?.pengukuran?.status_gizi ?? null,
      status_pertumbuhan: kunjunganTerakhir?.pengukuran?.status_pertumbuhan ?? null,
      bulan_terakhir_diukur: kunjunganTerakhir?.created_at ?? null
    },
    imunisasi: {
      // Hanya flag lengkap/tidak, bukan detail
      status_dasar_lengkap: hitungStatusImunisasi(anggota.id)
    },
    risiko: {
      ada_flag_aktif: risikoAktif.length > 0,
      jumlah_risiko: risikoAktif.length
      // Tidak menyertakan detail jenis risiko (data klinis sensitif)
    }
  });
}
```

---

### 42.11 Alur Registrasi Sasaran Baru (Post-Integrasi)

Setelah integrasi Fase 4 aktif, alur input anggota baru berubah:

```
Kader buka form "Tambah Anggota"
         ↓
[Field baru] NIK atau Nama → tombol "Cari di SINDUKSADATI"
         ↓
SIPANDU call: GET /api/v1/penduduk?nik={nik}
(SINDUKSADATI API, scope: resident.basic.read)
         ↓
SINDUKSADATI return: penduduk_id, nama, tanggal_lahir, jenis_kelamin, status
         ↓
SIPANDU tampilkan preview kartu warga:
┌──────────────────────────────────────┐
│ ✅ Ditemukan di SINDUKSADATI          │
│ Nama: Andi Pratama                   │
│ Lahir: 15 Februari 2024 (18 bln)     │
│ Kategori: Balita                     │
│ Status: Aktif, Domisili RW 06        │
│ [Gunakan data ini] [Cari Lagi]       │
└──────────────────────────────────────┘
         ↓
Kader klik "Gunakan data ini"
         ↓
SIPANDU buat record anggota baru
  dengan sinduksadati_penduduk_id = <penduduk_id>
  Data identitas otomatis ter-populate (tidak perlu input manual)
         ↓
[Fallback jika tidak ditemukan]
Kader klik "Input Manual" → form lama tetap tersedia
Anggota tersimpan dengan sinduksadati_penduduk_id = NULL
Bisa di-link nanti via halaman Linking (§42.12)
```

---

### 42.12 Halaman Baru di SIPANDU untuk Integrasi

| Route | Peran | Deskripsi |
|---|---|---|
| `/pengaturan/integrasi` | Admin | Dashboard status integrasi: coverage mapping, koneksi API |
| `/pengaturan/integrasi/linking` | Admin | UI linking manual anggota ke penduduk_id SINDUKSADATI |
| `/pengaturan/integrasi/log` | Admin | Audit log event dari SINDUKSADATI |
| `/api/webhook/sinduksadati` | System | Endpoint penerima webhook (tidak ada UI) |
| `/api/sipandu/citizen-summary/[id]` | System | API response ke SINDUKSADATI Citizen 360 |

**Halaman Linking Manual (`/pengaturan/integrasi/linking`):**
```
┌──────────────────────────────────────────────────────┐
│  🔗 Linking Anggota SIPANDU ↔ SINDUKSADATI           │
│  ──────────────────────────────────────────────────  │
│  Coverage: 87 / 120 anggota ter-link (72,5%)         │
│  ──────────────────────────────────────────────────  │
│                                                      │
│  Belum Ter-Link (33 anggota):                        │
│  ┌────────────────────────────────────────────────┐  │
│  │ Andi Pratama  •  Balita  •  NIK: 3579****0001  │  │
│  │ 🔍 Kandidat SINDUKSADATI: Andi Pratama (cocok) │  │
│  │ [✅ Konfirmasi Link]  [❌ Lewati]               │  │
│  └────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────┐  │
│  │ Siti Rahmah  •  Lansia  •  NIK: tidak ada      │  │
│  │ 🔍 Kandidat: Tidak ditemukan otomatis          │  │
│  │ [🔎 Cari Manual di SINDUKSADATI]  [❌ Lewati]  │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

---

### 42.13 RBAC Tambahan untuk Fitur Integrasi

| Fitur | Super Admin | Kader | Bidan | Ketua PKK | Kepala Desa |
|:---|:---:|:---:|:---:|:---:|:---:|
| Dashboard Integrasi SINDUKSADATI | ✅ | ❌ | 👁️ | ❌ | ❌ |
| Linking Manual Anggota | ✅ | ❌ | ❌ | ❌ | ❌ |
| Event Log SINDUKSADATI | ✅ | ❌ | ❌ | ❌ | ❌ |
| Citizen Summary API (SINDUKSADATI call) | Service token | — | — | — | — |

---

### 42.14 Fase Implementasi Integrasi

Integrasi dilakukan dalam 4 sub-fase setelah SIPANDU Fase 3 go-live, dan setelah SINDUKSADATI Phase 6 (Integration Platform) aktif.

#### Sub-Fase 4A — Registrasi & Konfigurasi (Minggu 1)

- [ ] Daftarkan SIPANDU sebagai `integration_app` di panel SINDUKSADATI
- [ ] Simpan API Key, Service Token, Webhook Secret ke Vercel environment
- [ ] Tambah migration `020_add_sinduksadati_integration.sql`
- [ ] Implementasi Route Handler `POST /api/webhook/sinduksadati`
- [ ] Implementasi event processor Edge Function
- [ ] Halaman `/pengaturan/integrasi` (dashboard status)

#### Sub-Fase 4B — Linking Data Existing (Minggu 2)

- [ ] Halaman `/pengaturan/integrasi/linking` untuk linking manual
- [ ] Script batch: lookup otomatis kandidat SINDUKSADATI per anggota (NIK + nama + tanggal lahir)
- [ ] UI konfirmasi linking per anggota
- [ ] Progress bar coverage (X/Y anggota ter-link)
- [ ] Log `/pengaturan/integrasi/log`
- [ ] Target: ≥ 80% anggota aktif ter-link dalam 2 minggu

#### Sub-Fase 4C — Integrasi Registrasi Baru (Minggu 3)

- [ ] Update form "Tambah Anggota" dengan search SINDUKSADATI
- [ ] Autocomplete dari SINDUKSADATI saat input NIK
- [ ] Preview kartu warga SINDUKSADATI sebelum konfirmasi
- [ ] Fallback "Input Manual" tetap tersedia jika tidak ditemukan
- [ ] Update form "Tambah Keluarga" dengan search KK dari SINDUKSADATI

#### Sub-Fase 4D — Citizen 360 API & Event Processor (Minggu 4)

- [ ] Implementasi `GET /api/sipandu/citizen-summary/:penduduk_id`
- [ ] Testing end-to-end: SINDUKSADATI request → SIPANDU response
- [ ] Verifikasi semua 5 event types diproses dengan benar
- [ ] Load test: 100 event dalam 1 menit tidak menyebabkan error
- [ ] Dokumentasi API endpoint untuk tim SINDUKSADATI

---

### 42.15 Metrik Keberhasilan Integrasi

| Metrik | Target |
|---|---|
| Coverage linking anggota aktif | ≥ 90% dalam 1 bulan setelah Sub-Fase 4B |
| Event `PERSON_DECEASED` diproses tanpa error | 100% |
| Event `PERSON_MOVED` diproses tanpa error | 100% |
| Latency API lookup SINDUKSADATI (saat registrasi) | ≤ 1,5 detik |
| Citizen 360 health summary tersedia | 100% anggota yang ter-link |
| Zero duplikasi Person Master lintas sistem | 0 setelah linking selesai |

---

### 42.16 Risiko & Mitigasi Integrasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| SINDUKSADATI Phase 6 belum siap saat dijadwalkan | Fase 4 tertunda | Fase 4 opsional — SIPANDU Fase 1–3 tetap jalan. Mulai Fase 4 hanya setelah sandbox SINDUKSADATI tersedia. |
| Warga di SIPANDU tidak ada di SINDUKSADATI | Linking gagal | Pertahankan fallback input manual. Tandai `sinduksadati_penduduk_id = NULL` dan selesaikan bertahap. |
| Webhook SINDUKSADATI gagal kirim (timeout, down) | Status anggota tidak update otomatis | Semua event di-log di `sinduksadati_event_log`. Implementasi retry. Kader tetap bisa update manual. |
| Data berbeda antara SIPANDU dan SINDUKSADATI | Inkonsistensi | SINDUKSADATI sebagai otoritas untuk identitas. Tampilkan notifikasi konflik ke Admin. |
| API SINDUKSADATI down saat hari H | Tidak bisa lookup warga baru | Fallback ke input manual. SIPANDU tidak bergantung SINDUKSADATI untuk operasi klinis harian. |
| Data klinis SIPANDU terbawa ke SINDUKSADATI | Privacy violation | Citizen 360 API hanya mengembalikan summary agregat — tidak ada data pengukuran detail, catatan klinis, atau status risiko spesifik. |

---

### 42.17 Glossary Tambahan — Istilah Integrasi

| Istilah | Definisi |
|---|---|
| **penduduk_id** | UUID unik yang dikeluarkan SINDUKSADATI untuk setiap warga. Ini adalah *primary identifier* dalam ekosistem integrasi. |
| **Citizen 360** | Fitur SINDUKSADATI yang menampilkan profil lengkap seorang warga beserta data dari semua sistem terintegrasi (termasuk SIPANDU). |
| **integration_app** | Entitas terdaftar di SINDUKSADATI yang boleh mengakses API. SIPANDU harus terdaftar sebagai integration_app sebelum bisa memanggil API SINDUKSADATI. |
| **API Scope** | Izin spesifik yang diberikan kepada integration_app. SIPANDU hanya mendapat scope yang relevan untuk fungsi Posyandu. |
| **Webhook Secret** | String rahasia yang digunakan untuk memvalidasi bahwa event yang masuk ke SIPANDU benar-benar dari SINDUKSADATI (bukan spoofed request). |
| **Linking** | Proses menghubungkan satu record `anggota` di SIPANDU ke satu record `penduduk` di SINDUKSADATI via `sinduksadati_penduduk_id`. |
| **Coverage** | Persentase anggota aktif SIPANDU yang sudah ter-link ke SINDUKSADATI. Target ≥ 90%. |
| **Graceful Fallback** | Kemampuan SIPANDU untuk tetap beroperasi penuh meskipun SINDUKSADATI sedang down — dengan menggunakan input manual. |
