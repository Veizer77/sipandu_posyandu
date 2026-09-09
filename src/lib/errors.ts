/**
 * SIPANDU - Error Codes Catalog (PRD Bab 37)
 * Satu sumber pesan pengguna untuk toast/feedback UI.
 */

export const ERROR_MESSAGES: Record<string, string> = {
  VALIDATION_ERROR: "Data yang dimasukkan tidak valid.",
  NIK_DUPLICATE: "NIK ini sudah terdaftar.",
  KK_DUPLICATE: "Nomor KK ini sudah terdaftar.",
  ANGGOTA_NOT_FOUND: "Data anggota tidak ditemukan.",
  KUNJUNGAN_DUPLICATE: "Peserta ini sudah terdaftar hadir hari ini.",
  SESI_NOT_ACTIVE: "Sesi posyandu belum aktif atau sudah ditutup.",
  SESI_ALREADY_CLOSED: "Sesi posyandu sudah ditutup.",
  PENGUKURAN_EXISTS: "Data pengukuran sudah ada untuk kunjungan ini.",
  LMS_NOT_FOUND: "Data referensi WHO tidak ditemukan.",
  ZSCORE_EXTREME: "Nilai z-score ekstrem, periksa kembali pengukuran.",
  UNAUTHORIZED: "Sesi Anda telah berakhir, silakan login kembali.",
  FORBIDDEN: "Anda tidak memiliki akses ke halaman ini.",
  STORAGE_ERROR: "Gagal menyimpan file, coba lagi.",
  PDF_GENERATION_FAILED: "Gagal membuat laporan PDF, coba beberapa saat lagi.",
  NO_VALID_DATA: "Tidak ada data valid untuk bulan ini. Minta Bidan untuk memverifikasi terlebih dahulu.",
  KEHAMILAN_GENDER_ERROR: "Anggota berjenis kelamin laki-laki tidak dapat ditandai hamil.",
  SERVER_ERROR: "Terjadi kesalahan pada server. Coba beberapa saat lagi.",
};

export function errorMessage(code: string, fallback?: string): string {
  return ERROR_MESSAGES[code] || fallback || ERROR_MESSAGES.SERVER_ERROR;
}
