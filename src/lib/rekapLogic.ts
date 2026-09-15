/**
 * SIPANDU - Logika murni Rekapitulasi Sesi (audit REKAP).
 * Semua kalkulasi KPI/antropometri/pelayanan/follow-up dapat diuji langsung.
 * Tidak ada dependency React/DB di sini.
 *
 * Mencakup:
 * - RK-008/RK-009: antropometri HANYA balita; z null -> "Belum Dihitung"
 * - RK-010/RK-011: imunisasi dosis + anak unik; normalisasi boundary
 * - RK-006/RK-007: rujukan canonical tanpa fallback fiktif
 * - RK-014: denominator D/S global (standar Kemenkes) + label
 * - RK-016/RK-033: checklist kelengkapan tutup sesi
 * - RK-028/RK-029/RK-030: map memoized + grup kategori canonical
 * - RK-031: ringkasan Meja 3 (keluhan/temuan/catatan)
 */

import { normalizeImunisasiList } from "@/lib/meja2Logic";
import { catatanHasContent } from "@/lib/meja3Logic";

export interface VisitLike {
  id: string;
  anggota_id: string;
  jadwal_posyandu_id?: string | null;
  jadwal_id?: string | null;
  status_alur?: string | null;
  status_verifikasi?: string | null;
  waktu_hadir?: string | null;
  pengukuran?: Record<string, any> | null;
  pelayanan?: Record<string, any> | null;
  catatan?: Record<string, any> | null;
  [key: string]: any;
}

export interface AnggotaLike {
  id: string;
  kategori: string;
  status_aktif?: boolean;
  nama?: string;
  keluarga_id?: string;
  [key: string]: any;
}

// ---------------------------------------------------------------------------
// RK-030 — Grup kategori canonical (alias legacy dipetakan)
// ---------------------------------------------------------------------------

export interface SasaranGroup {
  key: string;
  label: string;
  match: (kategori: string) => boolean;
  badge: string;
}

const normKat = (k: unknown) => String(k ?? "").trim().toLowerCase();

export const SASARAN_GROUPS: SasaranGroup[] = [
  {
    key: "balita",
    label: "Bayi & Balita (0–59 bln)",
    match: (k) => k === "bayi" || k === "balita",
    badge: "bg-amber-100 text-amber-800",
  },
  {
    key: "ibu_hamil",
    label: "Ibu Hamil",
    match: (k) => k === "ibu_hamil" || k === "bumil",
    badge: "bg-rose-100 text-rose-800",
  },
  {
    key: "wus",
    label: "Usia Subur / Produktif (WUS/PUS)",
    match: (k) => k === "wus" || k === "usia_produktif" || k === "pus" || k === "remaja",
    badge: "bg-purple-100 text-purple-800",
  },
  {
    key: "lansia",
    label: "Lanjut Usia (Lansia)",
    match: (k) => k === "lansia",
    badge: "bg-teal-100 text-teal-800",
  },
];

export function buildAnggotaMap<T extends { id: string }>(list: T[] | undefined | null): Map<string, T> {
  const m = new Map<string, T>();
  for (const a of list || []) {
    if (a?.id) m.set(a.id, a);
  }
  return m;
}

// ---------------------------------------------------------------------------
// RK-001 — Himpunan hadir sesi (dedup anggota)
// ---------------------------------------------------------------------------

export function presentMemberIds(sessionVisits: VisitLike[] | undefined | null): Set<string> {
  const set = new Set<string>();
  for (const v of sessionVisits || []) {
    if (v?.anggota_id) set.add(v.anggota_id);
  }
  return set;
}

// ---------------------------------------------------------------------------
// RK-008/RK-009 — Antropometri balita (z null -> belumDihitung)
// ---------------------------------------------------------------------------

export interface AntropometriSummary {
  /** Balita terukur (BB atau TB terisi). */
  diukur: number;
  normal: number;
  giziKurang: number;
  giziBuruk: number;
  berisikoLebih: number;
  stunting: number;
  /** Terukur tetapi z_score belum tersedia. */
  belumDihitung: number;
  /** Balita hadir tetapi belum terukur. */
  belumDiukur: number;
}

const toNumOrNull = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
};

export function summarizeAntropometri(
  sessionVisits: VisitLike[] | undefined | null,
  anggotaById: Map<string, AnggotaLike>
): AntropometriSummary {
  const out: AntropometriSummary = {
    diukur: 0,
    normal: 0,
    giziKurang: 0,
    giziBuruk: 0,
    berisikoLebih: 0,
    stunting: 0,
    belumDihitung: 0,
    belumDiukur: 0,
  };

  for (const k of sessionVisits || []) {
    const a = k?.anggota_id ? anggotaById.get(k.anggota_id) : undefined;
    const kat = normKat(a?.kategori);
    // RK-008: Z-Score BB/U & TB/U hanya relevan untuk bayi/balita.
    if (kat !== "bayi" && kat !== "balita") continue;
    const p = k?.pengukuran;
    if (!p || (toNumOrNull(p.berat_badan) === null && toNumOrNull(p.tinggi_badan) === null)) {
      out.belumDiukur++;
      continue;
    }
    out.diukur++;
    const zBBU = toNumOrNull(p.z_score_bbu);
    const zTBU = toNumOrNull(p.z_score_tbu);
    // RK-009: tanpa z_score = "Belum Dihitung", BUKAN "Gizi Baik".
    if (zBBU === null) {
      out.belumDihitung++;
    } else if (zBBU < -3) {
      out.giziBuruk++;
    } else if (zBBU < -2) {
      out.giziKurang++;
    } else if (zBBU > 2) {
      out.berisikoLebih++;
    } else {
      out.normal++;
    }
    if (zTBU !== null && zTBU < -2) out.stunting++;
  }
  return out;
}

// ---------------------------------------------------------------------------
// RK-010/RK-011 + RK-006/RK-007 — Pelayanan & rujukan
// ---------------------------------------------------------------------------

export interface RujukanItem {
  nama: string;
  kategori: string;
  /** null bila tidak dicatat (UI wajib tampil "Tidak dicatat", bukan fiksi). */
  alasan: string | null;
  tujuan: string | null;
}

export interface PelayananSummary {
  vitA: number;
  pmt: number;
  /** Total dosis/jenis imunisasi. */
  dosisCount: number;
  /** Anak unik yang menerima imunisasi. */
  anakCount: number;
  fe: number;
  rujukanList: RujukanItem[];
}

export function summarizePelayanan(
  sessionVisits: VisitLike[] | undefined | null,
  anggotaById: Map<string, AnggotaLike>
): PelayananSummary {
  let vitA = 0;
  let pmt = 0;
  let dosisCount = 0;
  const anakSet = new Set<string>();
  let fe = 0;
  const rujukanList: RujukanItem[] = [];

  for (const k of sessionVisits || []) {
    const p = k?.pelayanan;
    if (!p || typeof p !== "object") continue;
    if (p.vitamin_a) vitA++;
    if (p.pmt) pmt++;
    // RK-011: normalisasi dulu (boolean DB -> []).
    const jenis = normalizeImunisasiList(p);
    if (jenis.length > 0) {
      dosisCount += jenis.length;
      if (k?.anggota_id) anakSet.add(k.anggota_id);
    }
    if (p.tablet_fe) fe++;
    if (p.rujukan) {
      const a = k?.anggota_id ? anggotaById.get(k.anggota_id) : undefined;
      // RK-006/RK-007: canonical + null jujur (tanpa fallback fiktif).
      const alasanRaw = (p as any).alasan_rujukan ?? (p as any).rujukan_alasan ?? (p as any).rujukan_catatan;
      const tujuanRaw = (p as any).tujuan_rujukan ?? (p as any).rujukan_tujuan;
      rujukanList.push({
        nama: a?.nama || k?.anggota_id || "—",
        kategori: a?.kategori || "—",
        alasan: typeof alasanRaw === "string" && alasanRaw.trim() ? alasanRaw.trim() : null,
        tujuan: typeof tujuanRaw === "string" && tujuanRaw.trim() ? tujuanRaw.trim() : null,
      });
    }
  }
  return { vitA, pmt, dosisCount, anakCount: anakSet.size, fe, rujukanList };
}

// ---------------------------------------------------------------------------
// RK-031 — Ringkasan Meja 3
// ---------------------------------------------------------------------------

export interface Meja3Summary {
  keluhan: number;
  temuan: number;
  catatanKader: number;
  catatanBidan: number;
  adaCatatan: number;
}

const nonBlank = (v: unknown) => typeof v === "string" && v.trim().length > 0;

export function summarizeMeja3(sessionVisits: VisitLike[] | undefined | null): Meja3Summary {
  const out: Meja3Summary = { keluhan: 0, temuan: 0, catatanKader: 0, catatanBidan: 0, adaCatatan: 0 };
  for (const k of sessionVisits || []) {
    const c = k?.catatan;
    if (!c || typeof c !== "object") continue;
    if (!catatanHasContent(c)) continue;
    out.adaCatatan++;
    if (nonBlank((c as any).keluhan)) out.keluhan++;
    if (nonBlank((c as any).temuan)) out.temuan++;
    if (nonBlank((c as any).catatan_kader)) out.catatanKader++;
    if (nonBlank((c as any).catatan_bidan)) out.catatanBidan++;
  }
  return out;
}

// ---------------------------------------------------------------------------
// RK-016/RK-033 — Checklist kelengkapan tutup sesi
// ---------------------------------------------------------------------------

export interface TutupChecklist {
  /** Rincian visit belum selesai per tahap (Meja 1–4 saja). */
  belumAlur: Array<{ stage: string; label: string; count: number }>;
  totalBelumAlur: number;
  /**
   * Visit di tahap meja_5_penyuluhan: klinis selesai, tinggal difinalisasi
   * menjadi 'selesai' saat sesi ditutup. BUKAN incomplete — jangan ditampilkan
   * sebagai kekurangan data.
   */
  menungguTutup: number;
  /**
   * Visit yang SUDAH berstatus selesai sebelum sesi ditutup (umumnya data lama
   * dari alur sebelum tahap meja_5 diaktifkan). Ditampilkan agar akuntansi
   * modal lengkap: sudahSelesai + menungguTutup = total tercatat selesai.
   */
  sudahSelesai: number;
  tanpaPenyuluhan: boolean;
  belumVerifikasi: number;
  lengkap: boolean;
}

const STAGE_LABEL: Record<string, string> = {
  meja_1_registrasi: "Meja 1 (registrasi, belum diukur)",
  meja_2_pengukuran: "Meja 2 (pengukuran, belum dicatat)",
  meja_3_pencatatan: "Meja 3 (pencatatan, belum dilayani)",
  meja_4_pelayanan: "Meja 4 (pelayanan, belum selesai)",
  meja_5_penyuluhan: "Meja 5 (menunggu penutupan sesi)",
};

export function buildTutupChecklist(
  sessionVisits: VisitLike[] | undefined | null,
  penyuluhanCount: number
): TutupChecklist {
  const byStage = new Map<string, number>();
  let belumVerifikasi = 0;
  let menungguTutup = 0;
  let sudahSelesai = 0;
  for (const k of sessionVisits || []) {
    const st = String(k?.status_alur || "");
    if (st === "meja_5_penyuluhan") {
      menungguTutup++;
    } else if (st === "selesai") {
      sudahSelesai++;
    } else if (st) {
      byStage.set(st, (byStage.get(st) || 0) + 1);
    }
    if ((k?.status_verifikasi || "draft") !== "valid") belumVerifikasi++;
  }
  const belumAlur = Array.from(byStage.entries()).map(([stage, count]) => ({
    stage,
    label: STAGE_LABEL[stage] || stage,
    count,
  }));
  const totalBelumAlur = belumAlur.reduce((a, b) => a + b.count, 0);
  const tanpaPenyuluhan = penyuluhanCount === 0;
  return {
    belumAlur,
    totalBelumAlur,
    menungguTutup,
    sudahSelesai,
    tanpaPenyuluhan,
    belumVerifikasi,
    lengkap: totalBelumAlur === 0 && !tanpaPenyuluhan,
  };
}

// ---------------------------------------------------------------------------
// RK-014 — D/S (denominator global standar Kemenkes; label diperjelas di UI)
// ---------------------------------------------------------------------------

export function countSasaranGlobal(anggota: AnggotaLike[] | undefined | null): number {
  return (anggota || []).filter((a) => a?.status_aktif && normKat(a?.kategori) !== "umum").length;
}

export function countSasaranHadir(
  anggota: AnggotaLike[] | undefined | null,
  presentIds: Set<string>
): { sasaran: number; umum: number } {
  let sasaran = 0;
  let umum = 0;
  for (const a of anggota || []) {
    if (!a?.status_aktif || !presentIds.has(a.id)) continue;
    if (normKat(a.kategori) === "umum") umum++;
    else sasaran++;
  }
  return { sasaran, umum };
}

// ---------------------------------------------------------------------------
// Label status alur untuk cetak (Meja 5 tampil benar, bukan kode mentah)
// ---------------------------------------------------------------------------

const STATUS_ALUR_LABEL: Record<string, string> = {
  selesai: "Selesai / arsip final",
  meja_5_penyuluhan: "Menunggu finalisasi sesi",
  meja_4_pelayanan: "Meja 4 (pelayanan)",
  meja_3_pencatatan: "Meja 3 (pencatatan)",
  meja_2_pengukuran: "Meja 2 (pengukuran)",
  meja_1_registrasi: "Meja 1 (registrasi)",
};

/** Label cetak yang stabil untuk status alur (fallback rapi bila tak dikenal). */
export function labelStatusAlur(status: unknown): string {
  const s = String(status ?? "").trim();
  if (!s) return "Hadir";
  return STATUS_ALUR_LABEL[s] || s.replace(/_/g, " ");
}

// ---------------------------------------------------------------------------
// Sumber data L-01 eksplisit: "terverifikasi" (resmi) vs "lapangan" (draft).
// Satu mode berlaku untuk SEMUA metrik — tanpa campur valid + draft.
// ---------------------------------------------------------------------------

export type SumberLaporan = "terverifikasi" | "lapangan";

/** Mode efektif: override pengguna, else terverifikasi bila ada data valid. */
export function resolveSumberLaporan(
  validCount: number,
  totalCount: number,
  override: SumberLaporan | null
): SumberLaporan {
  if (override === "terverifikasi" || override === "lapangan") return override;
  void totalCount;
  return validCount > 0 ? "terverifikasi" : "lapangan";
}

/** Labelmode untuk badge UI dan header PDF. */
export function labelSumberLaporan(mode: SumberLaporan, validCount: number, totalCount: number): string {
  return mode === "terverifikasi"
    ? `Terverifikasi (${validCount} kunjungan)`
    : `Lapangan / draft (${totalCount} kunjungan)`;
}

// ---------------------------------------------------------------------------
// Jejak sesi periode untuk header PDF L-01 (sesi mana saja yang diagregat).
// ---------------------------------------------------------------------------

export interface RingkasanSesiPeriode {
  jumlah: number;
  rentang: string;
}

const fmtTglPendek = (t: string): string => {
  const d = new Date(`${t}T00:00:00`);
  if (isNaN(d.getTime())) return t;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
};

/** Daftar sesi (jadwal) dalam satu bulan kalender + rentang tanggalnya. */
export function ringkasSesiPeriode(
  jadwal: Array<{ tanggal?: string } | null | undefined> | undefined | null,
  tahun: number,
  bulanIdx: number
): RingkasanSesiPeriode {
  const prefix = `${tahun}-${String(bulanIdx + 1).padStart(2, "0")}`;
  const rows = (jadwal || [])
    .filter((j): j is { tanggal: string } => typeof j?.tanggal === "string" && j.tanggal.slice(0, 7) === prefix)
    .sort((a, b) => (a.tanggal < b.tanggal ? -1 : 1));
  if (rows.length === 0) return { jumlah: 0, rentang: "—" };
  if (rows.length === 1) return { jumlah: 1, rentang: fmtTglPendek(rows[0].tanggal) };
  return { jumlah: rows.length, rentang: `${fmtTglPendek(rows[0].tanggal)} – ${fmtTglPendek(rows[rows.length - 1].tanggal)}` };
}

// ---------------------------------------------------------------------------
// Follow-up absen (daftar; status rencana dari DB di UI)
// ---------------------------------------------------------------------------

export interface FollowUpItem {
  id: string;
  nama: string;
  kategori: string;
  rt: string;
  kepalaKeluarga: string;
  isPriority: boolean;
  tag: string;
}

export function buildFollowUpList(
  anggota: AnggotaLike[] | undefined | null,
  keluargaById: Map<string, { rt?: string; nama_kepala_keluarga?: string }>,
  presentIds: Set<string>
): FollowUpItem[] {
  return (anggota || [])
    .filter((a) => a?.status_aktif && normKat(a?.kategori) !== "umum" && !presentIds.has(a.id))
    .map((a) => {
      const kel = a.keluarga_id ? keluargaById.get(a.keluarga_id) : undefined;
      const kat = normKat(a.kategori);
      const isAnak = kat === "bayi" || kat === "balita";
      const isBumil = kat === "ibu_hamil";
      return {
        id: a.id,
        nama: a.nama || "—",
        kategori: a.kategori,
        rt: (kel as any)?.rt || "01",
        kepalaKeluarga: (kel as any)?.nama_kepala_keluarga || "—",
        isPriority: isAnak || isBumil,
        tag: isAnak ? "PRIORITAS BALITA" : isBumil ? "PRIORITAS BUMIL" : "Absen Hari H",
      };
    })
    .sort((a, b) => Number(b.isPriority) - Number(a.isPriority));
}
