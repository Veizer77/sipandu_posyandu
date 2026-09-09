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
export type StatusPertumbuhan = "naik" | "tidak_naik" | "turun";
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
  lingkar_kepala?: number | null;
  lingkar_lengan?: number | null;
  tekanan_darah?: string | null;
  gula_darah_sewaktu?: number | null;
  z_score_bbu?: number | null;
  z_score_tbu?: number | null;
  z_score_bbtb?: number | null;
  status_pertumbuhan?: StatusPertumbuhan;
  catatan_kader?: string | null;
}

export interface Pelayanan {
  id: string;
  kunjungan_id: string;
  vitamin_a?: boolean;
  pmt?: boolean;
  imunisasi?: string[];
  tablet_fe?: boolean;
  obat_cacing?: boolean;
  rujukan?: boolean;
  tujuan_rujukan?: string | null;
  alasan_rujukan?: string | null;
}

export interface Penyuluhan {
  id: string;
  jadwal_id: string;
  jadwal_posyandu_id?: string;
  tema: string;
  narasumber: string;
  jumlah_peserta: number;
  jumlah?: number;
  metode?: string;
  media?: string;
  ringkasan?: string;
  created_by?: string;
  created_at?: string;
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
