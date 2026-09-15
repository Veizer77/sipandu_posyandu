/**
 * SIPANDU - Logika murni Meja 2 (Pengukuran & Antropometri)
 * Dipisah dari komponen UI agar dapat diuji langsung (audit MEJA-2 M2-028/M2-029).
 * Tidak ada dependency React/DB di sini.
 *
 * Mencakup:
 * - M2-001/M2-002: selector kunjungan berbasis sesi aktif
 * - M2-012/M2-013: normalisasi & validasi kategori kanonis
 * - M2-014/M2-015: validator domain per kategori + cross-field TD
 * - M2-016/M2-017: baseline BB terbaru & riwayat eksplisit
 * - M2-019: normalisasi bentuk data imunisasi
 * - M2-020: key risiko stabil
 * - M2-021/M2-022: draft key berversi (sessionId + visitId + schema version)
 * - M2-026: field kanonis tunggal + mapper DB boundary
 */

export interface VisitLike {
  id: string;
  anggota_id: string;
  jadwal_posyandu_id?: string | null;
  jadwal_id?: string | null;
  waktu_hadir?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  status_alur?: string | null;
  status_verifikasi?: string | null;
  pengukuran?: Record<string, any> | null;
  pelayanan?: Record<string, any> | null;
  [key: string]: any;
}

export interface JadwalLike {
  id: string;
  status?: string | null;
  [key: string]: any;
}

/** Versi skema draft. Naikkan bila bentuk form berubah agar draft lama tidak terbaca. */
export const DRAFT_SCHEMA_VERSION = 1;

// ---------------------------------------------------------------------------
// M2-001/M2-002 — Session selectors
// ---------------------------------------------------------------------------

/** ID sesi aktif; null bila tidak ada / ada lebih dari satu (ambigu). */
export function getActiveSessionId(jadwal: JadwalLike[] | undefined | null): string | null {
  const aktif = (jadwal || []).filter((j) => j?.status === "aktif");
  if (aktif.length !== 1) return null;
  return aktif[0]?.id ?? null;
}

/** Semua kunjungan milik satu sesi (gabung aktif + history). */
export function getVisitsForActiveSession(
  allVisits: VisitLike[] | undefined | null,
  sessionId: string | undefined | null
): VisitLike[] {
  if (!sessionId || !Array.isArray(allVisits)) return [];
  return allVisits.filter((v) => (v.jadwal_posyandu_id || v.jadwal_id) === sessionId);
}

/** Cari visit anggota pada sesi aktif. Undefined bila tidak ada (route harus blocked). */
export function findVisitForActiveSession(
  allVisits: VisitLike[] | undefined | null,
  anggotaId: string | undefined | null,
  sessionId: string | undefined | null
): VisitLike | undefined {
  if (!sessionId || !anggotaId || !Array.isArray(allVisits)) return undefined;
  return allVisits.find(
    (k) => k.anggota_id === anggotaId && (k.jadwal_posyandu_id || k.jadwal_id) === sessionId
  );
}

// ---------------------------------------------------------------------------
// M2-012/M2-013 — Canonical category
// ---------------------------------------------------------------------------

export const KATEGORI_VALID = ["bayi", "balita", "ibu_hamil", "wus", "lansia", "umum"] as const;
export type KategoriKanonis = (typeof KATEGORI_VALID)[number];

/** Alias legacy -> kanonis. */
export function normalizeKategori(kategoriRaw: unknown): string {
  const s = String(kategoriRaw ?? "").trim().toLowerCase();
  if (s === "bumil") return "ibu_hamil";
  return s;
}

export interface KategoriResolution {
  valid: boolean;
  canonical: KategoriKanonis | null;
  reason?: string;
}

/**
 * Resolusi kategori untuk Meja 2.
 * - Alias `bumil` dinormalisasi ke `ibu_hamil` (M2-012).
 * - Kategori tak dikenal -> invalid (MUST block, bukan form Umum) (M2-013).
 * - Laki-laki berkategori wus/ibu_hamil -> invalid (M2-013).
 */
export function resolveKategoriMeja2(kategoriRaw: unknown, jenisKelamin?: unknown): KategoriResolution {
  const kanonis = normalizeKategori(kategoriRaw);
  if (!(KATEGORI_VALID as readonly string[]).includes(kanonis)) {
    return { valid: false, canonical: null, reason: `Kategori "${String(kategoriRaw ?? "")}" tidak dikenal.` };
  }
  if (jenisKelamin === "L" && (kanonis === "wus" || kanonis === "ibu_hamil")) {
    return {
      valid: false,
      canonical: null,
      reason: "Peserta laki-laki tidak dapat berkategori WUS/Ibu Hamil.",
    };
  }
  return { valid: true, canonical: kanonis as KategoriKanonis };
}

// ---------------------------------------------------------------------------
// M2-026 — Canonical fields (single source of truth di layer form)
// ---------------------------------------------------------------------------
//
// Kanonis form: lingkar_lengan, td_sistolik, td_diastolik, gula_darah_sewaktu.
// Alias DB/legacy dipetakan HANYA di boundary (fungsi di bawah).

const FIELD_ALIASES: Record<string, string> = {
  lingkar_lengan_atas: "lingkar_lengan",
  lila: "lingkar_lengan",
  tekanan_darah_sistol: "td_sistolik",
  tekanan_darah_diastol: "td_diastolik",
  sistolik: "td_sistolik",
  diastolik: "td_diastolik",
  gula_darah: "gula_darah_sewaktu",
  gds: "gula_darah_sewaktu",
};

/** Petakan objek pengukuran apa pun (DB row / history / draft lama) ke field kanonis form. */
export function canonicalizePengukuranForm(input: Record<string, any> | undefined | null): Record<string, any> {
  if (!input || typeof input !== "object") return {};
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(input)) {
    const canon = FIELD_ALIASES[k] ?? k;
    // Field kanonis yang sudah ada menang atas alias.
    if (canon in out && k !== canon) continue;
    out[canon] = v;
  }
  return out;
}

// ---------------------------------------------------------------------------
// M2-014/M2-015 — Domain validators
// ---------------------------------------------------------------------------

function toFiniteNumber(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(String(v).trim());
  return Number.isFinite(n) ? n : null;
}

interface NumRule {
  required: boolean;
  min: number;
  max: number;
  label: string;
}

function checkNum(form: Record<string, any>, field: string, rule: NumRule, errors: Record<string, string>) {
  const raw = form[field];
  const n = toFiniteNumber(raw);
  if (raw === undefined || raw === null || raw === "") {
    if (rule.required) errors[field] = `${rule.label} wajib diisi.`;
    return;
  }
  if (n === null) {
    errors[field] = `${rule.label} harus berupa angka.`;
    return;
  }
  if (n < rule.min || n > rule.max) {
    errors[field] = `${rule.label} harus antara ${rule.min}–${rule.max}.`;
  }
}

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
  firstError: string | null;
}

/**
 * Validator domain Meja 2 per kategori kanonis.
 * HTML min/max/required TIDAK cukup (M2-014); cross-field TD wajib (M2-015).
 */
export function validatePengukuran(
  kategori: KategoriKanonis,
  formRaw: Record<string, any> | undefined | null
): ValidationResult {
  const errors: Record<string, string> = {};
  const form = canonicalizePengukuranForm(formRaw);

  const BB = (r: Partial<NumRule> & { label: string }) =>
    ({ required: false, min: 0, max: 0, ...r }) as NumRule;

  switch (kategori) {
    case "bayi":
    case "balita":
      checkNum(form, "berat_badan", BB({ required: true, min: 0.5, max: 50, label: "Berat badan" }), errors);
      checkNum(form, "tinggi_badan", BB({ required: true, min: 30, max: 150, label: "Panjang/tinggi badan" }), errors);
      checkNum(form, "lingkar_kepala", BB({ min: 25, max: 60, label: "Lingkar kepala" }), errors);
      checkNum(form, "lingkar_lengan", BB({ min: 8, max: 25, label: "LILA" }), errors);
      break;
    case "ibu_hamil":
      checkNum(form, "berat_badan", BB({ required: true, min: 30, max: 150, label: "Berat badan ibu" }), errors);
      checkNum(form, "tinggi_badan", BB({ min: 100, max: 200, label: "Tinggi badan" }), errors);
      checkNum(form, "lingkar_lengan", BB({ required: true, min: 15, max: 40, label: "LILA" }), errors);
      checkNum(form, "td_sistolik", BB({ required: true, min: 60, max: 250, label: "TD sistolik" }), errors);
      checkNum(form, "td_diastolik", BB({ required: true, min: 40, max: 150, label: "TD diastolik" }), errors);
      checkNum(form, "tinggi_fundus", BB({ min: 10, max: 50, label: "Tinggi fundus uteri" }), errors);
      checkNum(form, "djj", BB({ min: 50, max: 220, label: "DJJ" }), errors);
      break;
    case "lansia":
      checkNum(form, "berat_badan", BB({ min: 20, max: 200, label: "Berat badan" }), errors);
      checkNum(form, "tinggi_badan", BB({ min: 100, max: 220, label: "Tinggi badan" }), errors);
      checkNum(form, "td_sistolik", BB({ required: true, min: 60, max: 300, label: "TD sistolik" }), errors);
      checkNum(form, "td_diastolik", BB({ required: true, min: 40, max: 200, label: "TD diastolik" }), errors);
      checkNum(form, "gula_darah_sewaktu", BB({ min: 20, max: 600, label: "Gula darah sewaktu" }), errors);
      checkNum(form, "lingkar_perut", BB({ min: 40, max: 200, label: "Lingkar perut" }), errors);
      break;
    case "wus":
      checkNum(form, "berat_badan", BB({ min: 20, max: 200, label: "Berat badan" }), errors);
      checkNum(form, "tinggi_badan", BB({ min: 100, max: 220, label: "Tinggi badan" }), errors);
      checkNum(form, "lingkar_lengan", BB({ min: 15, max: 40, label: "LILA" }), errors);
      // TD opsional untuk WUS, tetapi bila salah satu diisi keduanya wajib + cross-check.
      if (form.td_sistolik !== undefined && form.td_sistolik !== "" && form.td_sistolik !== null) {
        checkNum(form, "td_sistolik", BB({ required: true, min: 60, max: 300, label: "TD sistolik" }), errors);
        checkNum(form, "td_diastolik", BB({ required: true, min: 40, max: 200, label: "TD diastolik" }), errors);
      } else if (form.td_diastolik !== undefined && form.td_diastolik !== "" && form.td_diastolik !== null) {
        checkNum(form, "td_sistolik", BB({ required: true, min: 60, max: 300, label: "TD sistolik" }), errors);
        checkNum(form, "td_diastolik", BB({ required: true, min: 40, max: 200, label: "TD diastolik" }), errors);
      }
      break;
    case "umum":
      checkNum(form, "berat_badan", BB({ required: true, min: 20, max: 250, label: "Berat badan" }), errors);
      checkNum(form, "tinggi_badan", BB({ required: true, min: 100, max: 230, label: "Tinggi badan" }), errors);
      if (
        (form.td_sistolik !== undefined && form.td_sistolik !== "" && form.td_sistolik !== null) ||
        (form.td_diastolik !== undefined && form.td_diastolik !== "" && form.td_diastolik !== null)
      ) {
        checkNum(form, "td_sistolik", BB({ required: true, min: 60, max: 300, label: "TD sistolik" }), errors);
        checkNum(form, "td_diastolik", BB({ required: true, min: 40, max: 200, label: "TD diastolik" }), errors);
      }
      checkNum(form, "gula_darah_sewaktu", BB({ min: 20, max: 600, label: "Gula darah sewaktu" }), errors);
      checkNum(form, "lingkar_perut", BB({ min: 40, max: 200, label: "Lingkar perut" }), errors);
      break;
  }

  // M2-015: cross-field — sistolik harus lebih besar dari diastolik (mis. 80/120 ditolak).
  const s = toFiniteNumber(form.td_sistolik);
  const d = toFiniteNumber(form.td_diastolik);
  if (s !== null && d !== null && !errors.td_sistolik && !errors.td_diastolik) {
    if (s <= d) {
      errors.td_sistolik = "TD sistolik harus lebih besar dari diastolik (contoh: 120/80).";
    }
  }

  const keys = Object.keys(errors);
  return { valid: keys.length === 0, errors, firstError: keys.length > 0 ? errors[keys[0]] : null };
}

// ---------------------------------------------------------------------------
// M2-016/M2-017 — Baseline & history eksplisit
// ---------------------------------------------------------------------------

function visitTimeMs(v: VisitLike): number {
  const t = v.waktu_hadir || v.created_at;
  const ms = t ? new Date(t).getTime() : NaN;
  return Number.isFinite(ms) ? (ms as number) : 0;
}

function hasMeasurement(v: VisitLike): boolean {
  const p = v.pengukuran;
  if (!p || typeof p !== "object") return false;
  const c = canonicalizePengukuranForm(p);
  return (
    toFiniteNumber(c.berat_badan) !== null ||
    toFiniteNumber(c.tinggi_badan) !== null ||
    toFiniteNumber(c.td_sistolik) !== null
  );
}

/**
 * Guard alur: Meja 3/4 wajib didahului pengukuran Meja 2 pada kunjungan yang sama.
 * True bila ada baris pengukuran (semantik sama dengan badge antrean legacy:
 * objek pengukuran non-kosong). False -> UI blocked, service menolak.
 */
export function visitHasPengukuran(visit: VisitLike | undefined | null): boolean {
  const p = (visit as any)?.pengukuran;
  return Boolean(p && typeof p === "object" && Object.keys(p).length > 0);
}

/**
 * Baseline BB terbaru SEBELUM visit saat ini (M2-016).
 * Diurut berdasarkan waktu (bukan .find() tanpa sort), exclude visit aktif.
 */
export function getLatestWeightBefore(
  allVisits: VisitLike[] | undefined | null,
  anggotaId: string,
  excludeVisitId?: string | null
): number | null {
  if (!Array.isArray(allVisits)) return null;
  const sorted = (allVisits || [])
    .filter((v) => v.anggota_id === anggotaId && v.id !== excludeVisitId)
    .sort((a, b) => visitTimeMs(b) - visitTimeMs(a));
  for (const v of sorted) {
    const bb = toFiniteNumber(canonicalizePengukuranForm(v.pengukuran).berat_badan);
    if (bb !== null && bb > 0) return bb;
  }
  return null;
}

/** Waktu pengukuran terbaru untuk penentuan baseline (pengayaan info UI). */
export function getLatestMeasurementBefore(
  allVisits: VisitLike[] | undefined | null,
  anggotaId: string,
  excludeVisitId?: string | null
): VisitLike | undefined {
  if (!Array.isArray(allVisits)) return undefined;
  const sorted = (allVisits || [])
    .filter((v) => v.anggota_id === anggotaId && v.id !== excludeVisitId && hasMeasurement(v))
    .sort((a, b) => visitTimeMs(b) - visitTimeMs(a));
  return sorted[0];
}

/**
 * Riwayat kunjungan berpengukuran untuk 1 anggota (M2-017):
 * semua sesi sebelumnya, dedup ID, sort terbaru, exclude visit aktif.
 */
export function getHistoryForAnggota(
  allVisits: VisitLike[] | undefined | null,
  anggotaId: string,
  excludeVisitId?: string | null,
  limit = 3
): VisitLike[] {
  if (!Array.isArray(allVisits)) return [];
  const seen = new Set<string>();
  return (allVisits || [])
    .filter((v) => {
      if (v.anggota_id !== anggotaId) return false;
      if (v.id === excludeVisitId) return false;
      if (!hasMeasurement(v)) return false;
      if (seen.has(v.id)) return false;
      seen.add(v.id);
      return true;
    })
    .sort((a, b) => visitTimeMs(b) - visitTimeMs(a))
    .slice(0, limit);
}

// ---------------------------------------------------------------------------
// M2-019 — Normalisasi imunisasi boundary ke string[]
// ---------------------------------------------------------------------------

/**
 * UI mengasumsikan array; service dapat membawa boolean/string via imunisasi_jenis.
 * Selalu kembalikan string[] agar tidak crash.
 */
export function normalizeImunisasiList(pelayanan?: any, anggotaImunisasi?: any): string[] {
  const out = new Set<string>();
  const push = (v: unknown) => {
    if (typeof v !== "string") return;
    v.split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((s) => out.add(s));
  };

  if (pelayanan && typeof pelayanan === "object") {
    const im = (pelayanan as any).imunisasi;
    if (Array.isArray(im)) im.forEach((j) => (typeof j === "string" ? out.add(j.trim()) : null));
    else if (typeof im === "string") push(im);
    // boolean true tanpa jenis -> andalkan imunisasi_jenis
    push((pelayanan as any).imunisasi_jenis);
  } else if (typeof pelayanan === "string") {
    push(pelayanan);
  }

  if (Array.isArray(anggotaImunisasi)) {
    for (const r of anggotaImunisasi) {
      if (typeof r === "string") out.add(r.trim());
      else if (r && typeof r === "object" && typeof (r as any).jenis === "string") {
        out.add((r as any).jenis.trim());
      }
    }
  }
  return Array.from(out).filter(Boolean);
}

// ---------------------------------------------------------------------------
// Boundary pelayanan: imunisasi SELALU string[] di layer baca
// ---------------------------------------------------------------------------

/**
 * Kolom DB `pelayanan.imunisasi` bertipe boolean (true/false), sedangkan
 * `imunisasi_jenis` menyimpan daftar jenis ("BCG, Polio 1").
 * Normalisasi di boundary agar konsumen tidak pernah menerima boolean —
 * `(true || []).forEach` adalah TypeError yang men-crash dashboard Bidan.
 */
export function normalizePelayananRow(s: Record<string, any> | undefined | null): Record<string, any> {
  if (!s || typeof s !== "object") return {};
  return { ...s, imunisasi: normalizeImunisasiList(s) };
}

// ---------------------------------------------------------------------------
// M2-020 — Key risiko stabil
// ---------------------------------------------------------------------------

/** Key stabil untuk render list risiko: visitId + kode + index (bukan kode saja). */
export function buildRisikoKey(visitId: string, kode: string | undefined | null, index: number): string {
  return `${visitId}::${kode || `R-${index + 1}`}::${index}`;
}

// ---------------------------------------------------------------------------
// M2-021/M2-022 — Draft key berversi + envelope
// ---------------------------------------------------------------------------

export interface DraftKeyParts {
  anggotaId: string;
  sessionId: string;
  visitId: string;
}

/** Key memuat sessionId + visitId + anggotaId + versi skema (M2-021). */
export function buildDraftKey(parts: DraftKeyParts): string {
  return `sipandu_draft_meja2_v${DRAFT_SCHEMA_VERSION}_${parts.sessionId}_${parts.visitId}_${parts.anggotaId}`;
}

export interface DraftEnvelope {
  v: number;
  sessionId: string;
  visitId: string;
  anggotaId: string;
  savedAt: string;
  form: Record<string, any>;
}

/** Bungkus form menjadi envelope berversi untuk sessionStorage. */
export function packDraft(parts: DraftKeyParts, form: Record<string, any>): DraftEnvelope {
  return {
    v: DRAFT_SCHEMA_VERSION,
    sessionId: parts.sessionId,
    visitId: parts.visitId,
    anggotaId: parts.anggotaId,
    savedAt: new Date().toISOString(),
    form: { ...(form || {}) },
  };
}

/**
 * Urai draft: tolak bila versi/skema/sesi/visit tidak cocok (M2-021).
 * Mengembalikan null untuk draft basi/asing.
 */
export function unpackDraft(raw: string | null, expected: DraftKeyParts): Record<string, any> | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    // Envelope berversi.
    if (typeof parsed.v === "number" || parsed.sessionId || parsed.visitId) {
      if (parsed.v !== DRAFT_SCHEMA_VERSION) return null;
      if (parsed.sessionId !== expected.sessionId) return null;
      if (parsed.visitId !== expected.visitId) return null;
      if (parsed.anggotaId !== expected.anggotaId) return null;
      const form = parsed.form;
      if (!form || typeof form !== "object" || Object.keys(form).length === 0) return null;
      return canonicalizePengukuranForm(form);
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Draft vs server: bila server lebih baru DAN punya data, server menang (M2-022).
 * Kembalikan "draft" | "server".
 */
export function pickDraftOrServer(
  draftSavedAt: string | undefined | null,
  serverUpdatedAt: string | undefined | null,
  serverHasData: boolean
): "draft" | "server" {
  if (!draftSavedAt) return "server";
  if (!serverHasData) return "draft";
  if (!serverUpdatedAt) return "draft";
  const tDraft = new Date(draftSavedAt).getTime();
  const tServer = new Date(serverUpdatedAt).getTime();
  if (!Number.isFinite(tDraft)) return "server";
  if (!Number.isFinite(tServer)) return "draft";
  return tServer > tDraft ? "server" : "draft";
}
