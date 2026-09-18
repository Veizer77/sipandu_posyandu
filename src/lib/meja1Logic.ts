/**
 * SIPANDU - Logika murni Meja 1 (Registrasi & Presensi Digital)
 * Dipisah dari komponen UI agar dapat diuji langsung (audit P0 #10, P1 #7).
 * Tidak ada dependency React/DB di sini.
 */

export interface VisitLike {
  id: string;
  anggota_id: string;
  jadwal_posyandu_id?: string | null;
  jadwal_id?: string | null;
  waktu_hadir?: string | null;
  [key: string]: any;
}

export interface AnggotaLike {
  id: string;
  kategori: string;
  status_aktif?: boolean;
  [key: string]: any;
}

/** Semua kunjungan milik satu sesi (gabung aktif + history). */
export function getSessionVisits(
  allVisits: VisitLike[],
  sessionId: string | undefined | null
): VisitLike[] {
  if (!sessionId || !Array.isArray(allVisits)) return [];
  return allVisits.filter(
    (v) => (v.jadwal_posyandu_id || v.jadwal_id) === sessionId
  );
}

/**
 * M3-001/M3-014 — Selector kanonis semua visit sesi aktif.
 * Gabungkan active + history (visit selesai tetap milik sesi), filter sessionId,
 * deduplicate berdasarkan visit.id. Satu-satunya source of truth untuk
 * "kunjungan sesi ini" di seluruh meja.
 */
export function getAllSessionVisits(
  activeVisits: VisitLike[] | undefined | null,
  historyVisits: VisitLike[] | undefined | null,
  sessionId: string | undefined | null
): VisitLike[] {
  if (!sessionId) return [];
  const seen = new Set<string>();
  const out: VisitLike[] = [];
  for (const v of [...(activeVisits || []), ...(historyVisits || [])]) {
    if (!v || (v.jadwal_posyandu_id || v.jadwal_id) !== sessionId) continue;
    if (seen.has(v.id)) continue;
    seen.add(v.id);
    out.push(v);
  }
  return out;
}

/** Anggota termasuk sasaran sesi? */
export function isAnggotaSasaran(kategori: string, sasaranSet: Set<string>): boolean {
  return sasaranSet.has(kategori);
}

/** Kunjungan terakhir per anggota, diurutkan berdasarkan waktu hadir terbaru. */
export function getLatestVisitByAnggota(allVisits: VisitLike[]): Map<string, VisitLike> {
  const map = new Map<string, VisitLike>();
  for (const v of allVisits || []) {
    const prev = map.get(v.anggota_id);
    const tPrev = prev?.waktu_hadir ? new Date(prev.waktu_hadir).getTime() : 0;
    const tCur = v.waktu_hadir ? new Date(v.waktu_hadir).getTime() : 0;
    if (!prev || tCur > tPrev) map.set(v.anggota_id, v);
  }
  return map;
}

/** Cari kunjungan existing untuk anggota pada sesi tertentu (cegah duplikat lintas sesi). */
export function findExistingSessionVisit(
  allVisits: VisitLike[],
  anggotaId: string,
  sessionId: string | undefined | null
): VisitLike | undefined {
  if (!sessionId) return undefined;
  return allVisits.find(
    (k) =>
      k.anggota_id === anggotaId &&
      (k.jadwal_posyandu_id || k.jadwal_id) === sessionId
  );
}

/**
 * F-05 — Peta status_alur per meja kerja.
 * Visit hanya tampil di antrean meja yang sesuai tahapnya; visit yang sudah
 * melewati meja (mis. meja_5 di antrean Meja 2) disembunyikan agar tidak
 * terlihat "tertahan". Rekap/arsip memakai selector penuh (tanpa filter stage).
 */
export const MEJA_STAGE_STATUS: Record<2 | 3 | 4 | 5, string[]> = {
  2: ["meja_1_registrasi", "meja_2_pengukuran"],
  3: ["meja_2_pengukuran", "meja_3_pencatatan"],
  4: ["meja_3_pencatatan", "meja_4_pelayanan"],
  5: ["meja_4_pelayanan", "meja_5_penyuluhan"],
};

/**
 * Apakah visit boleh diproses di meja tertentu.
 * Status kosong/legacy (falsy) diizinkan agar data lama tidak strand
 * (tetap tampil untuk diproses); status dikenal di luar tahap meja ditolak.
 */
export function isVisitInMejaStage(visit: VisitLike | undefined | null, meja: 2 | 3 | 4 | 5): boolean {
  if (!visit) return false;
  const st = visit.status_alur;
  if (!st) return true;
  return (MEJA_STAGE_STATUS[meja] || []).includes(st);
}

/** Filter daftar visit ke tahap satu meja kerja. */
export function filterVisitsForMeja(
  visits: VisitLike[] | undefined | null,
  meja: 2 | 3 | 4 | 5
): VisitLike[] {
  if (!Array.isArray(visits)) return [];
  return visits.filter((v) => isVisitInMejaStage(v, meja));
}

const STAGE_ORDER = [
  "meja_1_registrasi",
  "meja_2_pengukuran",
  "meja_3_pencatatan",
  "meja_4_pelayanan",
  "meja_5_penyuluhan",
  "selesai",
];

/** Tahap terakhir yang masih menjadi wewenang tiap meja (inklusif). */
const MEJA_OWN_STAGE: Record<2 | 3 | 4, string> = {
  2: "meja_2_pengukuran",
  3: "meja_3_pencatatan",
  4: "meja_4_pelayanan",
};

/**
 * Apakah visit sudah melewati wewenang satu meja (untuk guard route detail).
 * - Tahap lebih AWAL (mis. Meja 3 dibuka untuk visit meja_1) -> false, agar
 *   jatuh ke guard prasyarat yang sudah ada ("Belum Ada Pengukuran").
 * - Status kosong/legacy/tak dikenal -> false (jangan strand data lama).
 * - 'selesai' ditangani cabang finished tersendiri -> false di sini.
 */
export function isVisitPastMejaStage(visit: VisitLike | undefined | null, meja: 2 | 3 | 4): boolean {
  const st = visit?.status_alur;
  if (!st || st === "selesai") return false;
  const cur = STAGE_ORDER.indexOf(st);
  const own = STAGE_ORDER.indexOf(MEJA_OWN_STAGE[meja]);
  if (cur === -1 || own === -1) return false;
  return cur > own;
}

/**
 * Status antrean satu kunjungan untuk panel "Peserta Sudah Hadir" Meja 1.
 * - "selesai": status_alur selesai (lulus seluruh meja) — WAJIB badge, bukan tombol Meja 2.
 *   Kunjungan bisa selesai TANPA baris pengukuran bila Meja 2 terlewati (Meja 3/4 langsung),
 *   sehingga cek pengukuran saja tidak cukup.
 * - "meja2_selesai": ada data pengukuran, alur belum selesai.
 * - "menunggu_meja2": belum ada pengukuran.
 */
export type StatusAntreanMeja1 = "selesai" | "meja2_selesai" | "menunggu_meja2";

export function getStatusAntreanMeja1(visit: VisitLike | undefined | null): StatusAntreanMeja1 {
  if (!visit) return "menunggu_meja2";
  if (visit.status_alur === "selesai") return "selesai";
  const p = visit.pengukuran;
  if (p && typeof p === "object" && Object.keys(p).length > 0) return "meja2_selesai";
  return "menunggu_meja2";
}

/** Filter anggota yang layak tampil di daftar belum-hadir Meja 1. */
export function filterSasaranBelumHadir(
  anggotaList: AnggotaLike[],
  sasaranSet: Set<string>,
  presentMemberIds: Set<string>,
  query: string,
  kkById: Map<string, string>
): AnggotaLike[] {
  const q = (query || "").trim().toLowerCase();
  return (anggotaList || []).filter((a) => {
    if (!a.status_aktif) return false;
    // Tampilkan bila kategorinya masuk target sesi — termasuk "umum"
    // (pasien umum check-in lewat jalur yang sama). Di luar target: sembunyikan.
    if (!sasaranSet.has(a.kategori)) return false;
    if (presentMemberIds.has(a.id)) return false;
    if (!q) return true;
    const kk = kkById.get(a.keluarga_id) || "";
    return (
      (a.nama || "").toLowerCase().includes(q) ||
      (a.nik && a.nik.includes(q)) ||
      kk.includes(q)
    );
  });
}
