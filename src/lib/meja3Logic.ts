/**
 * SIPANDU - Logika murni Meja 3 (Pencatatan Digital)
 * Dipisah dari komponen UI agar dapat diuji langsung (audit MEJA-3).
 * Tidak ada dependency React/DB di sini.
 *
 * Mencakup:
 * - M3-008: penanda "sudah dicatat" semua field (keluhan/temuan/kader/bidan)
 * - M3-011: validator domain (trim, batas panjang, payload kosong ditolak)
 * - M3-012: draft key berversi (sessionId + visitId + schema version)
 * - M3-015: perbandingan versi concurrency (updated_at)
 * - M3-014: resolusi visit sesi (aktif / selesai / tidak ada)
 * - M3-018: mapper baris DB -> field form (round-trip testable)
 */

/** Batas panjang per field catatan (karakter, setelah trim). */
export const CATATAN_MAX_LEN = 500;

/** Versi skema draft Meja 3. Naikkan bila bentuk form berubah. */
export const DRAFT_SCHEMA_VERSION_M3 = 1;

export interface PencatatanForm {
  keluhan?: unknown;
  temuan?: unknown;
  catatan_kader?: unknown;
  catatan_bidan?: unknown;
}

export interface PencatatanNormalized {
  keluhan: string;
  temuan: string;
  catatan_kader: string;
  catatan_bidan: string;
}

// ---------------------------------------------------------------------------
// M3-011 — Validator domain (dipakai UI dan service)
// ---------------------------------------------------------------------------

export interface PencatatanValidation {
  valid: boolean;
  errors: Record<string, string>;
  firstError: string | null;
  /** Nilai ternormalisasi (trim). Hanya andal bila valid. */
  value: PencatatanNormalized;
}

function cleanField(v: unknown): string {
  return typeof v === "string" ? v.trim() : v === null || v === undefined ? "" : String(v).trim();
}

/** Normalisasi tanpa validasi (untuk draft/mapper). */
export function normalizePencatatan(input: PencatatanForm | undefined | null): PencatatanNormalized {
  const src = input && typeof input === "object" ? input : {};
  return {
    keluhan: cleanField((src as any).keluhan),
    temuan: cleanField((src as any).temuan),
    catatan_kader: cleanField((src as any).catatan_kader),
    catatan_bidan: cleanField((src as any).catatan_bidan),
  };
}

const FIELD_LABEL: Record<keyof PencatatanNormalized, string> = {
  keluhan: "Keluhan",
  temuan: "Temuan kader",
  catatan_kader: "Catatan kader",
  catatan_bidan: "Catatan bidan",
};

export function validatePencatatan(input: PencatatanForm | undefined | null): PencatatanValidation {
  const value = normalizePencatatan(input);
  const errors: Record<string, string> = {};
  (Object.keys(value) as Array<keyof PencatatanNormalized>).forEach((k) => {
    if (value[k].length > CATATAN_MAX_LEN) {
      errors[k] = `${FIELD_LABEL[k]} maksimal ${CATATAN_MAX_LEN} karakter (saat ini ${value[k].length}).`;
    }
  });
  const keys = Object.keys(errors);
  if (keys.length > 0) {
    return { valid: false, errors, firstError: errors[keys[0]], value };
  }
  // Payload kosong total ditolak — cegah baris catatan sampah.
  if (!catatanHasContent(value)) {
    return {
      valid: false,
      errors: { _form: "Minimal satu field terisi (keluhan, temuan, atau catatan)." },
      firstError: "Minimal satu field terisi (keluhan, temuan, atau catatan).",
      value,
    };
  }
  return { valid: true, errors: {}, firstError: null, value };
}

// ---------------------------------------------------------------------------
// M3-008 — "Sudah dicatat" bila SALAH SATU field terisi
// ---------------------------------------------------------------------------

/** True bila minimal satu dari keluhan/temuan/catatan_kader/catatan_bidan non-kosong. */
export function catatanHasContent(c: PencatatanForm | undefined | null): boolean {
  if (!c || typeof c !== "object") return false;
  const v = normalizePencatatan(c);
  return Boolean(v.keluhan || v.temuan || v.catatan_kader || v.catatan_bidan);
}

// ---------------------------------------------------------------------------
// M3-018 — Mapper baris DB -> form (round-trip)
// ---------------------------------------------------------------------------

export interface CatatanFormFields extends PencatatanNormalized {
  created_at?: string | null;
  updated_at?: string | null;
}

/** Petakan satu baris catatan_kunjungan ke field form + versi. */
export function toCatatanFormFields(row: Record<string, any> | undefined | null): CatatanFormFields {
  const value = normalizePencatatan(row);
  return {
    ...value,
    created_at: (row as any)?.created_at ?? null,
    updated_at: (row as any)?.updated_at ?? null,
  };
}

// ---------------------------------------------------------------------------
// M3-014 — Resolusi visit sesi untuk detail Meja 3
// ---------------------------------------------------------------------------

export type Meja3VisitState =
  | { kind: "active"; visit: any }
  | { kind: "finished"; visit: any }
  | { kind: "none"; visit: undefined };

/**
 * Tentukan status route detail dari daftar visit sesi kanonis (merged).
 * - visit sesi berstatus selesai -> finished (blocked, lihat rekap)
 * - visit sesi non-selesai -> active (form)
 * - tidak ada -> none (blocked, belum check-in; tanpa auto-create)
 */
export function resolveMeja3Visit(sessionVisits: any[] | undefined | null, anggotaId: string): Meja3VisitState {
  const matches = (sessionVisits || []).filter((v: any) => v?.anggota_id === anggotaId);
  if (matches.length === 0) return { kind: "none", visit: undefined };
  const active = matches.find((v: any) => v?.status_alur !== "selesai");
  if (active) return { kind: "active", visit: active };
  return { kind: "finished", visit: matches[0] };
}

// ---------------------------------------------------------------------------
// M3-012 — Draft key berversi + envelope
// ---------------------------------------------------------------------------

export interface DraftKeyPartsM3 {
  anggotaId: string;
  sessionId: string;
  visitId: string;
}

/** Key memuat sessionId + visitId + anggotaId + versi skema. */
export function buildDraftKeyM3(parts: DraftKeyPartsM3): string {
  return `sipandu_draft_meja3_v${DRAFT_SCHEMA_VERSION_M3}_${parts.sessionId}_${parts.visitId}_${parts.anggotaId}`;
}

export interface DraftEnvelopeM3 {
  v: number;
  sessionId: string;
  visitId: string;
  anggotaId: string;
  savedAt: string;
  form: PencatatanNormalized;
}

export function packDraftM3(parts: DraftKeyPartsM3, form: PencatatanForm): DraftEnvelopeM3 {
  return {
    v: DRAFT_SCHEMA_VERSION_M3,
    sessionId: parts.sessionId,
    visitId: parts.visitId,
    anggotaId: parts.anggotaId,
    savedAt: new Date().toISOString(),
    form: normalizePencatatan(form),
  };
}

/** Urai draft; tolak bila versi/sesi/visit tidak cocok. */
export function unpackDraftM3(raw: string | null, expected: DraftKeyPartsM3): PencatatanNormalized | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    if (parsed.v !== DRAFT_SCHEMA_VERSION_M3) return null;
    if (parsed.sessionId !== expected.sessionId) return null;
    if (parsed.visitId !== expected.visitId) return null;
    if (parsed.anggotaId !== expected.anggotaId) return null;
    const form = parsed.form;
    if (!form || typeof form !== "object") return null;
    const norm = normalizePencatatan(form);
    if (!catatanHasContent(norm)) return null;
    return norm;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// M3-015 — Perbandingan versi concurrency
// ---------------------------------------------------------------------------

/** True bila versi server berbeda dari yang diharapkan pemanggil (konflik). */
export function isVersionConflict(
  expectedUpdatedAt: string | undefined | null,
  serverUpdatedAt: string | undefined | null,
  serverHasRow: boolean
): boolean {
  if (expectedUpdatedAt === null || expectedUpdatedAt === undefined) return false;
  if (!serverHasRow) return false;
  if (!serverUpdatedAt) return false;
  const tExp = Date.parse(expectedUpdatedAt);
  const tSrv = Date.parse(serverUpdatedAt);
  if (Number.isNaN(tExp) || Number.isNaN(tSrv)) return expectedUpdatedAt !== serverUpdatedAt;
  return tExp !== tSrv;
}
