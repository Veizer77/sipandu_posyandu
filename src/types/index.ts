/**
 * SIPANDU - Domain Types
 * Selaras dengan skema InsForge (posyandu/migrations) + seed legacy v3
 */

export type UserRole = "super_admin" | "kader" | "bidan" | "ketua_pkk" | "kepala_desa";

export type SasaranKategori = "bayi" | "balita" | "wus" | "lansia" | "ibu_hamil" | "umum";
export type JenisKelamin = "L" | "P";
export type StatusVerifikasi = "draft" | "diperiksa" | "valid";
export type StatusAlur =
  | "meja_1_registrasi"
  | "meja_2_pengukuran"
  | "meja_3_pencatatan"
  | "meja_4_pelayanan"
  | "meja_5_penyuluhan"
  | "selesai";
// M2-010: "data_baru" = kunjungan pertama / tanpa baseline. Bukan "naik".
export type StatusPertumbuhan = "naik" | "tidak_naik" | "turun" | "data_baru";
export type StatusGizi = "buruk" | "kurang" | "normal" | "lebih" | "obesitas";

export interface Posyandu {
  id: string;
  nama: string;
  rw: string;
  desa: string;
  kecamatan: string;
  kota: string;
  provinsi?: string;
  telepon?: string;
  email?: string;
  jadwal_hari: string;
  jadwal_mulai: string;
  jadwal_selesai: string;
  lokasi: string;
}

export interface OrganisasiPosyandu {
  id: string;
  jabatan: string;
  nama: string;
  gelar?: string;
  nip_sip?: string;
  tugas?: string;
  urutan: number;
}

export interface User {
  id: string;
  nama_lengkap: string;
  peran: UserRole;
  email: string;
  foto?: string;
  posyandu_id?: string;
  status_aktif: boolean;
}

export interface Keluarga {
  id: string;
  nomor_kk: string;
  nama_kepala_keluarga: string;
  alamat: string;
  rt: string;
  rw: string;
  kelurahan: string;
  kecamatan: string;
  status_ekonomi?: "pra_sejahtera" | "sejahtera_1" | "sejahtera_2" | "sejahtera_3" | "sejahtera_3_plus";
  anggota?: Anggota[];
}

export interface Anggota {
  id: string;
  keluarga_id: string;
  nik: string;
  nama: string;
  jenis_kelamin: JenisKelamin;
  tanggal_lahir: string;
  hubungan_keluarga: string;
  kategori: SasaranKategori;
  status_aktif: boolean;
  status_hamil?: boolean;
  hpht?: string | null;
  status_kemandirian?: "mandiri" | "butuh_bantuan_penuh" | "butuh_bantuan_sebagian";
  sinduksadati_penduduk_id?: string | null; // linking key ke master RW 06 (PRD 42.5)
}

export interface JadwalPosyandu {
  id: string;
  tanggal: string;
  jenis: "bulanan" | "tambahan" | "khusus";
  /** Judul/tema sesi (ref legacy posyandu: "Penyuluhan Imunisasi", dsb.) */
  tema?: string;
  tempat: string;
  catatan?: string;
  status: "draft" | "aktif" | "selesai" | "dibatalkan";
  sasaran?: SasaranKategori[];
}

export interface Kunjungan {
  id: string;
  jadwal_posyandu_id: string;
  anggota_id: string;
  waktu_hadir: string;
  status_verifikasi: StatusVerifikasi;
  status_alur: StatusAlur;
}

export interface Pengukuran {
  id: string;
  kunjungan_id: string;
  berat_badan: number;
  tinggi_badan?: number | null;
  panjang_badan?: number | null;
  lingkar_kepala?: number | null;
  // Kanonis: lingkar_lengan (alias legacy: lingkar_lengan_atas) — M2-026
  lingkar_lengan?: number | null;
  lingkar_perut?: number | null;
  // Kanonis form: td_sistolik/td_diastolik (kolom DB: tekanan_darah_sistol/diastol) — M2-026
  td_sistolik?: number | null;
  td_diastolik?: number | null;
  tekanan_darah?: string | null;
  // Kanonis form: gula_darah_sewaktu (kolom DB: gula_darah) — M2-026
  gula_darah_sewaktu?: number | null;
  tinggi_fundus?: number | null;
  djj?: number | null;
  imt?: number | null;
  usia_saat_ukur?: number | null;
  z_score_bbu?: number | null;
  z_score_tbu?: number | null;
  z_score_bbtb?: number | null;
  status_gizi?: StatusGizi;
  status_pertumbuhan?: StatusPertumbuhan | null;
  catatan?: string | null;
  catatan_kader?: string | null;
}

// M4-003/M4-024/M4-025: DTO canonical Meja 4 (UI/store/service).
// Kolom DB (rujukan_tujuan, rujukan_alasan, imunisasi boolean+jenis) dipetakan
// HANYA di boundary dbService. Legacy: rujukan_catatan, obat_cacing (kolom tak ada).
export interface Pelayanan {
  id: string;
  kunjungan_id: string;
  vitamin_a?: boolean;
  pmt?: boolean;
  pmt_jenis?: string | null;
  /** Canonical UI: SELALU string[]. */
  imunisasi?: string[];
  tablet_fe?: boolean;
  /** Hanya Bidan/Admin yang boleh memberikan (M4-016). */
  imunisasi_tt_ke?: number | null;
  rujukan?: boolean;
  tujuan_rujukan?: string | null;
  alasan_rujukan?: string | null;
  konseling?: boolean;
  obat_rutin?: string | null;
  skrining_anemia?: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface PelayananInput {
  vitamin_a?: boolean;
  pmt?: boolean;
  pmt_jenis?: string | null;
  imunisasi?: string[];
  tablet_fe?: boolean;
  imunisasi_tt?: boolean;
  imunisasi_tt_ke?: number | null;
  rujukan?: boolean;
  tujuan_rujukan?: string | null;
  alasan_rujukan?: string | null;
  konseling?: boolean;
  obat_rutin?: string | null;
  skrining_anemia?: boolean;
  anggota_id?: string;
}

/** Hasil simpan Meja 4: aksi + versi + imunisasi tersimpan (M4-019). */
export interface SavePelayananResult {
  action: "created" | "updated";
  id?: string;
  updatedAt?: string | null;
  imunisasiDisimpan?: number;
}

// M3-011/M3-018: input + record Meja 3 (satu row catatan per visit).
export interface PencatatanInput {
  keluhan?: string | null;
  temuan?: string | null;
  catatan_kader?: string | null;
  /** Hanya Bidan/Admin (M3-010). Service menolak bila pengirim role Kader. */
  catatan_bidan?: string | null;
  anggota_id?: string;
}

export interface CatatanKunjunganRecord {
  id: string;
  kunjungan_id: string;
  keluhan?: string | null;
  temuan?: string | null;
  catatan_kader?: string | null;
  catatan_bidan?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

/** Hasil simpan Meja 3: aksi + versi untuk concurrency (M3-015/M3-016). */
export interface SavePencatatanResult {
  action: "created" | "updated";
  id?: string;
  updatedAt?: string | null;
}

// M5-029: DTO canonical (jadwal_posyandu_id kanonis; alias legacy dipertahankan).
export interface Penyuluhan {
  id: string;
  /** Kanonis: FK sesi. */
  jadwal_posyandu_id: string;
  /** Alias legacy (mirror). */
  jadwal_id?: string;
  tema: string;
  narasumber: string;
  jumlah_peserta: number;
  /** Alias baca. */
  jumlah?: number;
  metode?: string | null;
  media?: string | null;
  ringkasan?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface PenyuluhanInput {
  tema: string;
  narasumber: string;
  jumlah_peserta: number;
  metode?: string | null;
  media?: string | null;
  ringkasan?: string | null;
}

export interface AuditLog {
  id: string;
  user_name: string;
  user_role: string;
  action: string;
  entity: string;
  record_code: string;
  details: string;
  timestamp: string;
}

export interface Notifikasi {
  id: string;
  judul: string;
  pesan: string;
  tipe: "info" | "warning" | "danger" | "success";
  waktu: string;
  dibaca: boolean;
}

export interface SipanduDB {
  posyandu: Posyandu;
  organisasi: OrganisasiPosyandu[];
  users: User[];
  jadwal: JadwalPosyandu[];
  keluarga: Keluarga[];
  anggota: Anggota[];
  kunjungan: Kunjungan[];
  pengukuran: Pengukuran[];
  pelayanan: Pelayanan[];
  penyuluhan: Penyuluhan[];
  audit_log: AuditLog[];
  notifikasi: Notifikasi[];
}
