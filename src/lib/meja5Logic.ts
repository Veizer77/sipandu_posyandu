/**
 * SIPANDU - Logika murni Meja 5 (Edukasi & Penyuluhan Kelompok)
 * Dipisah dari komponen UI agar dapat diuji langsung (audit MEJA-5).
 * Tidak ada dependency React/DB di sini.
 *
 * Mencakup:
 * - M5-005/M5-008/M5-020: selector session-scoped (hadir + penyuluhan)
 * - M5-007: validator domain bersama (tema, narasumber, jumlah, media, ringkasan)
 * - M5-015: permission pengelolaan penyuluhan per role
 * - M5-021: template Kemenkes + relevansi demografi hadir
 * - M5-029: DTO canonical + mapper boundary (jadwal_posyandu_id kanonis)
 */

export const TEMA_MIN_LEN = 5;
export const TEMA_MAX_LEN = 200;
export const NARASUMBER_MAX_LEN = 100;
export const METODE_MAX_LEN = 100;
export const MEDIA_MAX_LEN = 500;
export const RINGKASAN_MAX_LEN = 2000;

export const METODE_OPTIONS = [
  "Ceramah & Demonstrasi",
  "Ceramah",
  "Demonstrasi",
  "Diskusi",
  "Konseling Kelompok & Diskusi",
  "Konseling Perorangan Antarpribadi",
  "Simulasi & Praktik Langsung",
  "Pemutaran Video & Diskusi",
  "Lainnya",
];

export interface PenyuluhanTemplate {
  kategori: string;
  /** Kategori sasaran untuk relevansi demografi (M5-021). */
  sasaran: string[];
  tema: string;
  ringkasan: string;
  metode: string;
  media: string;
}

export const TEMPLATES_KEMENKES: PenyuluhanTemplate[] = [
  {
    kategori: "Balita & Baduta",
    sasaran: ["bayi", "balita"],
    tema: "Pencegahan Stunting: MPASI Kaya Protein Hewani & Kapsul Vitamin A",
    ringkasan:
      "Edukasi pentingnya pemberian protein hewani (telur, ikan air tawar, daging ayam) pada setiap porsi MPASI balita usia 6-23 bulan, serta kepatuhan vitamin A dosis tinggi di bulan Februari dan Agustus.",
    metode: "Ceramah & Demonstrasi",
    media: "Lembar Balik & Sampel Pangan Lokal",
  },
  {
    kategori: "Ibu Hamil",
    sasaran: ["ibu_hamil"],
    tema: "Pencegahan Anemia & KEK: Kepatuhan Konsumsi Tablet Tambah Darah (TTD)",
    ringkasan:
      "Penyuluhan kepatuhan minum TTD minimal 90 tablet selama kehamilan dengan air putih/jeruk, pemenuhan gizi seimbang, dan pengukuran LILA rutin untuk mencegah bayi lahir BBLR.",
    metode: "Konseling Kelompok & Diskusi",
    media: "Buku KIA & Leaflet Nutrisi Bumil",
  },
  {
    kategori: "Imunisasi",
    sasaran: ["bayi", "balita"],
    tema: "Pentingnya Imunisasi Dasar Lengkap & Pemantauan KMS Digital",
    ringkasan:
      "Sosialisasi jadwal imunisasi dasar lengkap (HB-0 s.d. MR Booster), manfaat kurva KMS untuk deteksi dini balita tidak naik berat badan (2T) sebelum terjadi risiko stunting.",
    metode: "Ceramah & Tanya Jawab",
    media: "Poster Jadwal Imunisasi Kemenkes",
  },
  {
    kategori: "Lansia & Dewasa",
    sasaran: ["lansia", "wus", "umum"],
    tema: "Pengendalian Hipertensi & Diabetes Melalui Gerakan CERDIK",
    ringkasan:
      "Edukasi pembatasan asupan gula, garam, dan lemak (GGL), pentingnya aktivitas fisik 30 menit per hari, serta kepatuhan skrining tekanan darah dan gula darah sewaktu.",
    metode: "Ceramah & Diskusi",
    media: "Brosur CERDIK & Panduan Diet Rendah Garam",
  },
];

// ---------------------------------------------------------------------------
// M5-021 — Relevansi template terhadap demografi hadir
// ---------------------------------------------------------------------------

/**
 * Urutkan template: yang sasarannya hadir hari ini di depan (stabil).
 * hadirKategoris = kategori unik peserta sesi (mis. ["balita","ibu_hamil"]).
 */
export function rankTemplatesByHadir(
  templates: PenyuluhanTemplate[],
  hadirKategoris: string[]
): Array<PenyuluhanTemplate & { relevan: boolean }> {
  const hadir = new Set((hadirKategoris || []).map((k) => String(k).toLowerCase()));
  return templates
    .map((t, idx) => ({
      ...t,
      relevan: t.sasaran.some((s) => hadir.has(s.toLowerCase())),
      _idx: idx,
    }))
    .sort((a, b) => Number(b.relevan) - Number(a.relevan) || a._idx - b._idx)
    .map(({ _idx, ...rest }) => rest);
}

// ---------------------------------------------------------------------------
// M5-005 — Session-scoped hadir count
// ---------------------------------------------------------------------------

/** Jumlah kehadiran unik (per anggota) pada daftar visit sesi. */
export function countHadirUnik(sessionVisits: Array<{ anggota_id?: string } | undefined | null>): number {
  const set = new Set<string>();
  for (const v of sessionVisits || []) {
    if (v?.anggota_id) set.add(v.anggota_id);
  }
  return set.size;
}

// ---------------------------------------------------------------------------
// M5-008/M5-020 — Filter penyuluhan sesi (tanpa fallthrough)
// ---------------------------------------------------------------------------

/** Penyuluhan milik satu sesi; sesi kosong -> [] (jangan tampilkan semua sesi). */
export function getPenyuluhanSesi(
  all: Array<Record<string, any>> | undefined | null,
  sessionId: string | undefined | null
): Array<Record<string, any>> {
  if (!sessionId || !Array.isArray(all)) return [];
  return all.filter((p) => (p.jadwal_posyandu_id || p.jadwal_id || p.sesi_id) === sessionId);
}

// ---------------------------------------------------------------------------
// M5-007 — Validator domain bersama (dipakai UI dan service)
// ---------------------------------------------------------------------------

export interface PenyuluhanFormInput {
  tema?: unknown;
  narasumber?: unknown;
  jumlah_peserta?: unknown;
  jumlah?: unknown;
  metode?: unknown;
  media?: unknown;
  ringkasan?: unknown;
}

export interface PenyuluhanNormalized {
  tema: string;
  narasumber: string;
  jumlah_peserta: number;
  metode: string;
  media: string;
  ringkasan: string;
}

function cleanStr(v: unknown): string {
  if (typeof v === "string") return v.trim();
  return v === null || v === undefined ? "" : String(v).trim();
}

function toJumlah(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(String(v).trim());
  if (!Number.isFinite(n)) return null;
  return Math.trunc(n);
}

/** Normalisasi tanpa validasi. */
export function normalizePenyuluhan(input: PenyuluhanFormInput | undefined | null): PenyuluhanNormalized {
  const src = (input && typeof input === "object" ? input : {}) as Record<string, any>;
  return {
    tema: cleanStr(src.tema),
    narasumber: cleanStr(src.narasumber),
    jumlah_peserta: toJumlah(src.jumlah_peserta ?? src.jumlah) ?? 0,
    metode: cleanStr(src.metode) || "Ceramah",
    media: cleanStr(src.media),
    ringkasan: cleanStr(src.ringkasan),
  };
}

export interface PenyuluhanValidation {
  valid: boolean;
  errors: Record<string, string>;
  firstError: string | null;
  value: PenyuluhanNormalized;
}

export function validatePenyuluhan(input: PenyuluhanFormInput | undefined | null): PenyuluhanValidation {
  const value = normalizePenyuluhan(input);
  const errors: Record<string, string> = {};

  if (!value.tema) errors.tema = "Tema penyuluhan wajib diisi.";
  else if (value.tema.length < TEMA_MIN_LEN) errors.tema = `Tema penyuluhan minimal ${TEMA_MIN_LEN} karakter.`;
  else if (value.tema.length > TEMA_MAX_LEN) errors.tema = `Tema penyuluhan maksimal ${TEMA_MAX_LEN} karakter.`;

  if (!value.narasumber) errors.narasumber = "Narasumber penyuluhan wajib diisi.";
  else if (value.narasumber.length > NARASUMBER_MAX_LEN) {
    errors.narasumber = `Nama narasumber maksimal ${NARASUMBER_MAX_LEN} karakter.`;
  }

  if (!value.jumlah_peserta || value.jumlah_peserta < 1) {
    errors.jumlah_peserta = "Jumlah peserta minimal 1 orang.";
  }

  if (value.metode.length > METODE_MAX_LEN) errors.metode = `Metode maksimal ${METODE_MAX_LEN} karakter.`;
  if (value.media.length > MEDIA_MAX_LEN) {
    errors.media = `Media maksimal ${MEDIA_MAX_LEN} karakter (saat ini ${value.media.length}).`;
  }
  if (value.ringkasan.length > RINGKASAN_MAX_LEN) {
    errors.ringkasan = `Ringkasan maksimal ${RINGKASAN_MAX_LEN} karakter (saat ini ${value.ringkasan.length}).`;
  }

  const keys = Object.keys(errors);
  return { valid: keys.length === 0, errors, firstError: keys.length > 0 ? errors[keys[0]] : null, value };
}

// ---------------------------------------------------------------------------
// M5-015 — Permission (Keputusan: Kader+Bidan penuh; PKK/Kades read-only)
// ---------------------------------------------------------------------------

export type PenyuluhanActorRole = "kader" | "bidan" | "super_admin" | "ketua_pkk" | "kepala_desa" | string;

/** Kader & Bidan (dan Admin) boleh buat/edit/hapus; peran monitoring read-only. */
export function canManagePenyuluhan(role: PenyuluhanActorRole | undefined | null): boolean {
  return role === "kader" || role === "bidan" || role === "super_admin";
}

// ---------------------------------------------------------------------------
// M5-029 — DTO canonical + mapper boundary
// ---------------------------------------------------------------------------

export interface PenyuluhanDbRow {
  jadwal_posyandu_id: string;
  /** Mirror kompatibilitas (kolom legacy). */
  jadwal_id: string;
  tema: string;
  narasumber: string;
  jumlah_peserta: number;
  metode: string | null;
  media: string | null;
  ringkasan: string | null;
}

/** Form ternormalisasi -> baris DB (canonical jadwal_posyandu_id + mirror jadwal_id). */
export function toDbPenyuluhanRow(sessionId: string, v: PenyuluhanNormalized): PenyuluhanDbRow {
  return {
    jadwal_posyandu_id: sessionId,
    jadwal_id: sessionId,
    tema: v.tema,
    narasumber: v.narasumber,
    jumlah_peserta: v.jumlah_peserta,
    metode: v.metode || null,
    media: v.media || null,
    ringkasan: v.ringkasan || null,
  };
}

export interface PenyuluhanRecord extends PenyuluhanNormalized {
  id?: string;
  jadwal_posyandu_id?: string | null;
  jadwal_id?: string | null;
  jumlah?: number;
  created_at?: string | null;
  updated_at?: string | null;
}

/** Baris DB -> record canonical + alias kompatibel (M5-029). */
export function fromDbPenyuluhan(row: Record<string, any> | undefined | null): PenyuluhanRecord {
  const value = normalizePenyuluhan(row);
  const jumlah = Number((row as any)?.jumlah_peserta ?? (row as any)?.jumlah ?? value.jumlah_peserta) || 0;
  return {
    ...value,
    jumlah_peserta: jumlah,
    jumlah,
    id: (row as any)?.id,
    jadwal_posyandu_id: (row as any)?.jadwal_posyandu_id ?? (row as any)?.jadwal_id ?? null,
    jadwal_id: (row as any)?.jadwal_id ?? (row as any)?.jadwal_posyandu_id ?? null,
    created_at: (row as any)?.created_at ?? null,
    updated_at: (row as any)?.updated_at ?? null,
  };
}
