/**
 * SIPANDU - Logika murni Meja 4 (Pelayanan Kesehatan & Imunisasi)
 * Dipisah dari komponen UI agar dapat diuji langsung (audit MEJA-4).
 * Tidak ada dependency React/DB di sini.
 *
 * Mencakup:
 * - M4-003/M4-024: DTO canonical + mapper DB boundary (rujukan, imunisasi, TT)
 * - M4-004/M4-005/M4-011/M4-012: validator domain (min satu layanan, rujukan, TT, panjang)
 * - M4-009: hasAnyPelayanan semua jenis (antrean, detail, Rekap, dashboard)
 * - M4-014: helper keputusan auto Vitamin A (logic murni; effect hanya mengeksekusi)
 * - M4-015: resolusi visit sesi (aktif / selesai / tidak ada)
 * - M4-016: permission tindakan medis (imunisasi hanya Bidan/Admin)
 * - M4-020: draft key berversi (sessionId + visitId + schema version)
 * - M4-026: mapper baris DB -> form (round-trip testable)
 */

// ---------------------------------------------------------------------------
// DTO canonical (M4-003/M4-024) — satu-satunya bentuk di UI/store/service.
// Kolom DB dipetakan HANYA di boundary (toDbPelayananRow / toPelayananFormFields).
// ---------------------------------------------------------------------------

export interface PelayananFormInput {
  vitamin_a?: unknown;
  pmt?: unknown;
  pmt_jenis?: unknown;
  /** Canonical UI: SELALU string[] (DB: boolean + imunisasi_jenis). */
  imunisasi?: unknown;
  tablet_fe?: unknown;
  /** Canonical UI: number|null (DB: imunisasi_tt + imunisasi_tt_ke). */
  imunisasi_tt_ke?: unknown;
  rujukan?: unknown;
  /** Canonical UI (DB: rujukan_tujuan). */
  tujuan_rujukan?: unknown;
  /** Canonical UI (DB: rujukan_alasan, legacy rujukan_catatan). */
  alasan_rujukan?: unknown;
  konseling?: unknown;
  obat_rutin?: unknown;
  skrining_anemia?: unknown;
}

export interface PelayananNormalized {
  vitamin_a: boolean;
  pmt: boolean;
  pmt_jenis: string | null;
  imunisasi: string[];
  tablet_fe: boolean;
  imunisasi_tt_ke: number | null;
  rujukan: boolean;
  tujuan_rujukan: string;
  alasan_rujukan: string;
  konseling: boolean;
  obat_rutin: string;
  skrining_anemia: boolean;
}

export const OBAT_RUTIN_MAX_LEN = 200;
export const TUJUAN_RUJUKAN_MAX_LEN = 150;
export const ALASAN_RUJUKAN_MAX_LEN = 500;
export const PMT_JENIS_MAX_LEN = 100;

/** Versi skema draft Meja 4. */
export const DRAFT_SCHEMA_VERSION_M4 = 1;

function toBool(v: unknown): boolean {
  return v === true || v === "true" || v === 1 || v === "1";
}

function cleanStr(v: unknown): string {
  if (typeof v !== "string") return v === null || v === undefined ? "" : String(v).trim();
  return v.trim();
}

function cleanNullable(v: unknown): string | null {
  const s = cleanStr(v);
  return s ? s : null;
}

function toTtKe(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(String(v).trim());
  if (!Number.isInteger(n)) return null;
  return n;
}

/** Normalisasi input apa pun (form / draft lama / baris DB) ke DTO canonical. */
export function normalizePelayanan(input: PelayananFormInput | undefined | null): PelayananNormalized {
  const src = (input && typeof input === "object" ? input : {}) as Record<string, any>;
  // Terima alias legacy bila canonical kosong (boundary toleran).
  const tujuan = cleanStr(src.tujuan_rujukan ?? src.rujukan_tujuan);
  const alasan = cleanStr(src.alasan_rujukan ?? src.rujukan_alasan ?? src.rujukan_catatan ?? src.catatan_rujukan);
  let imunisasi: string[];
  if (Array.isArray(src.imunisasi)) {
    imunisasi = src.imunisasi.filter((j: unknown) => typeof j === "string").map((j: string) => j.trim()).filter(Boolean);
  } else if (typeof src.imunisasi === "string") {
    imunisasi = src.imunisasi.split(",").map((s) => s.trim()).filter(Boolean);
  } else if (src.imunisasi) {
    // boolean true legacy -> andalkan imunisasi_jenis.
    const jenis = src.imunisasi_jenis;
    imunisasi = typeof jenis === "string" ? jenis.split(",").map((s: string) => s.trim()).filter(Boolean) : [];
  } else {
    imunisasi = [];
  }
  return {
    vitamin_a: toBool(src.vitamin_a),
    pmt: toBool(src.pmt),
    pmt_jenis: cleanNullable(src.pmt_jenis),
    imunisasi,
    tablet_fe: toBool(src.tablet_fe),
    imunisasi_tt_ke: toTtKe(src.imunisasi_tt_ke),
    rujukan: toBool(src.rujukan),
    tujuan_rujukan: tujuan,
    alasan_rujukan: alasan,
    konseling: toBool(src.konseling),
    obat_rutin: cleanStr(src.obat_rutin),
    skrining_anemia: toBool(src.skrining_anemia),
  };
}

// ---------------------------------------------------------------------------
// M4-009 — hasAnyPelayanan: SEMUA jenis layanan dihitung
// ---------------------------------------------------------------------------

/** True bila minimal satu layanan tercatat (imunisasi/TT/konseling/obat/skrining ikut). */
export function hasAnyPelayanan(p: PelayananFormInput | undefined | null): boolean {
  if (!p || typeof p !== "object") return false;
  const v = normalizePelayanan(p);
  return Boolean(
    v.vitamin_a ||
      v.pmt ||
      v.imunisasi.length > 0 ||
      v.tablet_fe ||
      v.imunisasi_tt_ke !== null ||
      v.rujukan ||
      v.konseling ||
      v.obat_rutin ||
      v.skrining_anemia
  );
}

// ---------------------------------------------------------------------------
// M4-004/M4-005/M4-011/M4-012 — Validator domain (dipakai UI dan service)
// ---------------------------------------------------------------------------

export interface PelayananValidation {
  valid: boolean;
  errors: Record<string, string>;
  firstError: string | null;
  value: PelayananNormalized;
}

export function validatePelayanan(input: PelayananFormInput | undefined | null): PelayananValidation {
  const value = normalizePelayanan(input);
  const errors: Record<string, string> = {};

  // M4-004: form kosong tidak boleh menyelesaikan alur.
  if (!hasAnyPelayanan(value)) {
    return {
      valid: false,
      errors: {
        _form: "Minimal satu layanan wajib dicatat (mis. konseling/edukasi bila tidak ada tindakan lain).",
      },
      firstError: "Minimal satu layanan wajib dicatat (mis. konseling/edukasi bila tidak ada tindakan lain).",
      value,
    };
  }

  // M4-005/M4-013 minimal: rujukan wajib tujuan + alasan.
  if (value.rujukan) {
    if (!value.tujuan_rujukan) errors.tujuan_rujukan = "Tujuan fasilitas rujukan wajib diisi.";
    else if (value.tujuan_rujukan.length > TUJUAN_RUJUKAN_MAX_LEN) {
      errors.tujuan_rujukan = `Tujuan rujukan maksimal ${TUJUAN_RUJUKAN_MAX_LEN} karakter.`;
    }
    if (!value.alasan_rujukan) errors.alasan_rujukan = "Alasan/indikasi klinis rujukan wajib diisi.";
    else if (value.alasan_rujukan.length > ALASAN_RUJUKAN_MAX_LEN) {
      errors.alasan_rujukan = `Alasan rujukan maksimal ${ALASAN_RUJUKAN_MAX_LEN} karakter.`;
    }
  } else {
    if (value.tujuan_rujukan.length > TUJUAN_RUJUKAN_MAX_LEN) {
      errors.tujuan_rujukan = `Tujuan rujukan maksimal ${TUJUAN_RUJUKAN_MAX_LEN} karakter.`;
    }
    if (value.alasan_rujukan.length > ALASAN_RUJUKAN_MAX_LEN) {
      errors.alasan_rujukan = `Alasan rujukan maksimal ${ALASAN_RUJUKAN_MAX_LEN} karakter.`;
    }
  }

  // M4-011: TT ke-1..5.
  if (value.imunisasi_tt_ke !== null && (value.imunisasi_tt_ke < 1 || value.imunisasi_tt_ke > 5)) {
    errors.imunisasi_tt_ke = "Imunisasi TT hanya TT1–TT5.";
  }

  // M4-012: obat rutin trim + batas panjang.
  if (value.obat_rutin.length > OBAT_RUTIN_MAX_LEN) {
    errors.obat_rutin = `Obat rutin maksimal ${OBAT_RUTIN_MAX_LEN} karakter.`;
  }

  if (value.pmt_jenis !== null && value.pmt_jenis.length > PMT_JENIS_MAX_LEN) {
    errors.pmt_jenis = `Jenis PMT maksimal ${PMT_JENIS_MAX_LEN} karakter.`;
  }

  const keys = Object.keys(errors);
  return { valid: keys.length === 0, errors, firstError: keys.length > 0 ? errors[keys[0]] : null, value };
}

// ---------------------------------------------------------------------------
// M4-024 — Mapper DB boundary (satu arah per fungsi)
// ---------------------------------------------------------------------------

/** DTO canonical -> baris DB (ditulis service; rujukan_alasan + legacy rujukan_catatan). */
export function toDbPelayananRow(kunjunganId: string, v: PelayananNormalized): Record<string, any> {
  const catatanTambahan = [
    v.obat_rutin ? `Obat rutin: ${v.obat_rutin}` : null,
    v.skrining_anemia ? "Skrining anemia dilakukan" : null,
  ]
    .filter(Boolean)
    .join(" | ");
  return {
    kunjungan_id: kunjunganId,
    vitamin_a: v.vitamin_a,
    pmt: v.pmt,
    pmt_jenis: v.pmt && v.pmt_jenis ? v.pmt_jenis : null,
    imunisasi: v.imunisasi.length > 0,
    imunisasi_jenis: v.imunisasi.length > 0 ? v.imunisasi.join(", ") : null,
    tablet_fe: v.tablet_fe,
    imunisasi_tt: v.imunisasi_tt_ke !== null,
    imunisasi_tt_ke: v.imunisasi_tt_ke,
    rujukan: v.rujukan,
    rujukan_tujuan: v.rujukan ? v.tujuan_rujukan || null : null,
    rujukan_alasan: v.rujukan ? v.alasan_rujukan || null : null,
    // Kompatibilitas: baris lama menyimpan alasan di rujukan_catatan.
    rujukan_catatan: v.rujukan ? v.alasan_rujukan || null : null,
    konseling: v.konseling || Boolean(catatanTambahan),
    konseling_catatan: catatanTambahan || null,
    obat_rutin: v.obat_rutin || null,
    skrining_anemia: v.skrining_anemia,
  };
}

export interface PelayananFormFields extends PelayananNormalized {
  created_at?: string | null;
  updated_at?: string | null;
}

/** Baris DB -> DTO canonical + versi (M4-026 round-trip; alias legacy dipetakan). */
export function toPelayananFormFields(row: Record<string, any> | undefined | null): PelayananFormFields {
  const value = normalizePelayanan(row);
  return {
    ...value,
    created_at: (row as any)?.created_at ?? null,
    updated_at: (row as any)?.updated_at ?? null,
  };
}

// ---------------------------------------------------------------------------
// M4-014 — Keputusan auto Vitamin A (logic murni; effect hanya mengeksekusi)
// ---------------------------------------------------------------------------

/** Bulan program nasional Vitamin A: Februari (1) & Agustus (7). */
export function isBulanVitaminA(monthIndex: number): boolean {
  return monthIndex === 1 || monthIndex === 7;
}

// ---------------------------------------------------------------------------
// M4-015 — Resolusi visit sesi untuk detail Meja 4
// ---------------------------------------------------------------------------

export type Meja4VisitState =
  | { kind: "active"; visit: any }
  | { kind: "finished"; visit: any }
  | { kind: "none"; visit: undefined };

export function resolveMeja4Visit(sessionVisits: any[] | undefined | null, anggotaId: string): Meja4VisitState {
  const matches = (sessionVisits || []).filter((v: any) => v?.anggota_id === anggotaId);
  if (matches.length === 0) return { kind: "none", visit: undefined };
  const active = matches.find((v: any) => v?.status_alur !== "selesai");
  if (active) return { kind: "active", visit: active };
  return { kind: "finished", visit: matches[0] };
}

// ---------------------------------------------------------------------------
// M4-016 — Permission tindakan medis
// ---------------------------------------------------------------------------

export type Meja4ActorRole = "kader" | "bidan" | "super_admin" | "ketua_pkk" | "kepala_desa" | string;

/**
 * Keputusan produk: Kader BOLEH menulis rujukan, tetapi TIDAK BOLEH memberikan
 * imunisasi (dasar/TT) secara langsung. Hanya Bidan/Admin (+ peran klinis lain
 * non-kader) yang boleh mencentang imunisasi.
 */
export function canGiveImunisasi(role: Meja4ActorRole | undefined | null): boolean {
  return role !== "kader";
}

/** Field imunisasi pada payload (untuk gate service). */
export function payloadHasImunisasiTindakan(input: PelayananFormInput | undefined | null): boolean {
  if (!input || typeof input !== "object") return false;
  const v = normalizePelayanan(input);
  return v.imunisasi.length > 0 || v.imunisasi_tt_ke !== null || toBool((input as any).imunisasi_tt);
}

// ---------------------------------------------------------------------------
// M4-020 — Draft key berversi + envelope
// ---------------------------------------------------------------------------

export interface DraftKeyPartsM4 {
  anggotaId: string;
  sessionId: string;
  visitId: string;
}

export function buildDraftKeyM4(parts: DraftKeyPartsM4): string {
  return `sipandu_draft_meja4_v${DRAFT_SCHEMA_VERSION_M4}_${parts.sessionId}_${parts.visitId}_${parts.anggotaId}`;
}

export interface DraftEnvelopeM4 {
  v: number;
  sessionId: string;
  visitId: string;
  anggotaId: string;
  savedAt: string;
  form: PelayananNormalized;
}

export function packDraftM4(parts: DraftKeyPartsM4, form: PelayananFormInput): DraftEnvelopeM4 {
  return {
    v: DRAFT_SCHEMA_VERSION_M4,
    sessionId: parts.sessionId,
    visitId: parts.visitId,
    anggotaId: parts.anggotaId,
    savedAt: new Date().toISOString(),
    form: normalizePelayanan(form),
  };
}

/** Urai draft; tolak bila versi/sesi/visit tidak cocok atau isi kosong total. */
export function unpackDraftM4(raw: string | null, expected: DraftKeyPartsM4): PelayananNormalized | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    if (parsed.v !== DRAFT_SCHEMA_VERSION_M4) return null;
    if (parsed.sessionId !== expected.sessionId) return null;
    if (parsed.visitId !== expected.visitId) return null;
    if (parsed.anggotaId !== expected.anggotaId) return null;
    const form = parsed.form;
    if (!form || typeof form !== "object") return null;
    const norm = normalizePelayanan(form);
    if (!hasAnyPelayanan(norm)) return null;
    return norm;
  } catch {
    return null;
  }
}
