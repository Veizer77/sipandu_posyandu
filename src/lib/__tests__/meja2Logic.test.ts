/**
 * MEJA-2-AUDIT — Test matrix (logika murni, src/lib/meja2Logic.ts).
 * Setiap kasus memetakan ke baris "Test matrix" dokumen audit.
 */
import { describe, it, expect } from "vitest";
import {
  getActiveSessionId,
  getVisitsForActiveSession,
  findVisitForActiveSession,
  resolveKategoriMeja2,
  normalizeKategori,
  validatePengukuran,
  getLatestWeightBefore,
  getHistoryForAnggota,
  normalizeImunisasiList,
  canonicalizePengukuranForm,
  visitHasPengukuran,
  normalizePelayananRow,
  buildRisikoKey,
  buildDraftKey,
  packDraft,
  unpackDraft,
  pickDraftOrServer,
  DRAFT_SCHEMA_VERSION,
} from "@/lib/meja2Logic";

const sesiA = "sesi-A";
const sesiB = "sesi-B";

const visit = (id: string, anggotaId: string, jadwal: string, waktu = "2026-09-10T08:00:00Z", pengukuran: any = {}) => ({
  id,
  anggota_id: anggotaId,
  jadwal_posyandu_id: jadwal,
  waktu_hadir: waktu,
  pengukuran,
});

describe("M2-001 — antrean hanya sesi aktif", () => {
  it("Visit anggota di sesi A dan B: hanya visit sesi aktif tampil", () => {
    const all = [visit("vA", "a1", sesiA), visit("vB", "a1", sesiB)];
    expect(getVisitsForActiveSession(all, sesiA).map((v) => v.id)).toEqual(["vA"]);
    expect(getVisitsForActiveSession(all, sesiB).map((v) => v.id)).toEqual(["vB"]);
  });

  it("getActiveSessionId: tepat satu sesi aktif, null bila kosong/ambigu", () => {
    expect(getActiveSessionId([{ id: "s1", status: "aktif" }, { id: "s2", status: "selesai" }])).toBe("s1");
    expect(getActiveSessionId([])).toBeNull();
    expect(
      getActiveSessionId([
        { id: "s1", status: "aktif" },
        { id: "s2", status: "aktif" },
      ])
    ).toBeNull();
  });
});

describe("M2-002/M2-024 — detail visit terikat sesi; route tanpa visit blocked", () => {
  it("anggota dengan visit di dua sesi: temuan tepat per sesi", () => {
    const all = [visit("vA", "a1", sesiA), visit("vB", "a1", sesiB)];
    expect(findVisitForActiveSession(all, "a1", sesiA)?.id).toBe("vA");
    expect(findVisitForActiveSession(all, "a1", sesiB)?.id).toBe("vB");
  });

  it("Route tanpa visit aktif -> undefined (UI wajib blocked, tanpa auto-create)", () => {
    const all = [visit("vA", "a1", sesiA)];
    expect(findVisitForActiveSession(all, "a1", sesiB)).toBeUndefined();
    expect(findVisitForActiveSession(all, "a9", sesiA)).toBeUndefined();
  });
});

describe("M2-012/M2-013 — kategori kanonis", () => {
  it("Kategori `bumil` dinormalisasi ke `ibu_hamil`", () => {
    expect(normalizeKategori("bumil")).toBe("ibu_hamil");
    const r = resolveKategoriMeja2("bumil", "P");
    expect(r.valid).toBe(true);
    expect(r.canonical).toBe("ibu_hamil");
  });

  it("Kategori unknown -> invalid (blocked, bukan form Umum)", () => {
    const r = resolveKategoriMeja2("alien", "P");
    expect(r.valid).toBe(false);
    expect(r.canonical).toBeNull();
  });

  it("Laki-laki berkategori wus/ibu_hamil -> invalid", () => {
    expect(resolveKategoriMeja2("wus", "L").valid).toBe(false);
    expect(resolveKategoriMeja2("ibu_hamil", "L").valid).toBe(false);
    expect(resolveKategoriMeja2("lansia", "L").valid).toBe(true);
  });
});

describe("M2-014/M2-015 — validator domain", () => {
  it("TD 80/120 ditolak (sistolik harus > diastolik)", () => {
    const r = validatePengukuran("ibu_hamil", {
      berat_badan: "60",
      lingkar_lengan: "24",
      td_sistolik: "80",
      td_diastolik: "120",
    });
    expect(r.valid).toBe(false);
    expect(r.errors.td_sistolik).toMatch(/lebih besar/);
  });

  it("TD 120/80 valid", () => {
    const r = validatePengukuran("ibu_hamil", {
      berat_badan: "60",
      lingkar_lengan: "24",
      td_sistolik: "120",
      td_diastolik: "80",
    });
    expect(r.valid).toBe(true);
  });

  it("Balita tanpa BB/TB -> invalid; non-angka ditolak", () => {
    expect(validatePengukuran("balita", {}).valid).toBe(false);
    const r = validatePengukuran("balita", { berat_badan: "abc", tinggi_badan: "88" });
    expect(r.valid).toBe(false);
    expect(r.errors.berat_badan).toMatch(/angka/);
  });

  it("Range dilanggar -> invalid (BB balita 0.1 kg)", () => {
    const r = validatePengukuran("balita", { berat_badan: "0.1", tinggi_badan: "88" });
    expect(r.valid).toBe(false);
  });
});

describe("M2-016/M2-017 — baseline & riwayat", () => {
  it("Baseline = pengukuran terbaru terurut waktu (bukan .find tanpa sort)", () => {
    const all = [
      visit("v1", "a1", sesiA, "2026-07-10T08:00:00Z", { berat_badan: 10 }),
      visit("v2", "a1", sesiA, "2026-09-10T08:00:00Z", { berat_badan: 12 }),
      visit("v3", "a1", sesiA, "2026-08-10T08:00:00Z", { berat_badan: 11 }),
    ];
    // array sengaja tidak terurut; exclude visit aktif v2
    expect(getLatestWeightBefore([all[1], all[0], all[2]], "a1", "v2")).toBe(11);
    expect(getLatestWeightBefore(all, "a1", "vX")).toBe(12);
  });

  it("Riwayat: exclude visit aktif, dedup ID, sort terbaru, limit", () => {
    const all = [
      visit("v1", "a1", sesiA, "2026-07-10T08:00:00Z", { berat_badan: 10 }),
      visit("v1", "a1", sesiA, "2026-07-10T08:00:00Z", { berat_badan: 10 }),
      visit("v2", "a1", sesiB, "2026-09-10T08:00:00Z", { berat_badan: 12 }),
      visit("v3", "a1", sesiB, "2026-09-11T08:00:00Z", {}),
      visit("v4", "a2", sesiB, "2026-09-11T08:00:00Z", { berat_badan: 60 }),
    ];
    const h = getHistoryForAnggota(all, "a1", "v2", 3);
    expect(h.map((v) => v.id)).toEqual(["v1"]);
  });
});

describe("M2-019 — imunisasi boundary selalu string[]", () => {
  it("array tetap array", () => {
    expect(normalizeImunisasiList({ imunisasi: ["BCG", "Polio 1"] })).toEqual(["BCG", "Polio 1"]);
  });
  it("string koma dipisah; boolean+jenis dipetakan; null/boolean polos aman", () => {
    expect(normalizeImunisasiList({ imunisasi: "BCG, Polio 1" })).toEqual(["BCG", "Polio 1"]);
    expect(normalizeImunisasiList({ imunisasi: true, imunisasi_jenis: "BCG" })).toEqual(["BCG"]);
    expect(normalizeImunisasiList({ imunisasi: true })).toEqual([]);
    expect(normalizeImunisasiList(null)).toEqual([]);
    expect(normalizeImunisasiList(undefined, [{ jenis: "HB-0" }, "BCG"])).toEqual(["HB-0", "BCG"]);
  });
});

describe("Guard alur — visitHasPengukuran (Meja 3/4 wajib didahului Meja 2)", () => {
  const base = { id: "v1", anggota_id: "a1", jadwal_posyandu_id: sesiA };
  it("pengukuran terisi -> true; kosong/null/undefined -> false", () => {
    expect(visitHasPengukuran({ ...base, pengukuran: { berat_badan: 12 } } as any)).toBe(true);
    expect(visitHasPengukuran({ ...base, pengukuran: {} } as any)).toBe(false);
    expect(visitHasPengukuran({ ...base, pengukuran: null } as any)).toBe(false);
    expect(visitHasPengukuran({ ...base } as any)).toBe(false);
    expect(visitHasPengukuran(undefined)).toBe(false);
  });
});

describe("Boundary pelayanan — imunisasi boolean DB tidak boleh crash konsumen", () => {
  it("boolean true + jenis string -> array jenis (kasus crash dashboard Bidan)", () => {
    // Regresi: (true || []).forEach melempar TypeError.
    const row = normalizePelayananRow({ imunisasi: true, imunisasi_jenis: "BCG, Polio 1" } as any);
    expect(row.imunisasi).toEqual(["BCG", "Polio 1"]);
    expect(() => row.imunisasi.forEach(() => {})).not.toThrow();
  });

  it("boolean false/null/array/string dinormalisasi aman", () => {
    expect(normalizePelayananRow({ imunisasi: false, imunisasi_jenis: null } as any).imunisasi).toEqual([]);
    expect(normalizePelayananRow({ imunisasi: true, imunisasi_jenis: null } as any).imunisasi).toEqual([]);
    expect(normalizePelayananRow({ imunisasi: ["BCG"], imunisasi_jenis: "BCG" } as any).imunisasi).toEqual(["BCG"]);
    expect(normalizePelayananRow(null).imunisasi).toBeUndefined();
    expect(normalizePelayananRow(undefined)).toEqual({});
  });
});

describe("M2-020 — key risiko stabil & unik", () => {
  it("kode sama pada visit berbeda / index berbeda menghasilkan key berbeda", () => {
    const k1 = buildRisikoKey("visit-1", "R-B01", 0);
    const k2 = buildRisikoKey("visit-1", "R-B01", 1);
    const k3 = buildRisikoKey("visit-2", "R-B01", 0);
    expect(new Set([k1, k2, k3]).size).toBe(3);
  });
});

describe("M2-021/M2-022 — draft berversi per sesi+visit", () => {
  const partsA = { anggotaId: "a1", sessionId: sesiA, visitId: "vA" };

  it("Draft sesi A tidak muncul di sesi B; versi lama ditolak", () => {
    const keyA = buildDraftKey(partsA);
    expect(keyA).toContain(sesiA);
    expect(keyA).toContain("vA");
    expect(keyA).toContain(`v${DRAFT_SCHEMA_VERSION}`);
    const raw = JSON.stringify(packDraft(partsA, { berat_badan: "12" }));
    expect(unpackDraft(raw, partsA)).toEqual({ berat_badan: "12" });
    expect(unpackDraft(raw, { ...partsA, sessionId: sesiB })).toBeNull();
    expect(unpackDraft(raw, { ...partsA, visitId: "vB" })).toBeNull();
    const tampered = JSON.stringify({ ...JSON.parse(raw), v: 999 });
    expect(unpackDraft(tampered, partsA)).toBeNull();
  });

  it("Server lebih baru + punya data -> server menang; draft lebih baru -> draft menang", () => {
    expect(pickDraftOrServer("2026-09-10T08:00:00Z", "2026-09-11T08:00:00Z", true)).toBe("server");
    expect(pickDraftOrServer("2026-09-12T08:00:00Z", "2026-09-11T08:00:00Z", true)).toBe("draft");
    expect(pickDraftOrServer("2026-09-10T08:00:00Z", "2026-09-11T08:00:00Z", false)).toBe("draft");
  });
});

describe("M2-026 — field kanonis tunggal", () => {
  it("Alias DB/legacy dipetakan ke kanonis; kanonis menang atas alias", () => {
    const c = canonicalizePengukuranForm({
      lingkar_lengan_atas: 14,
      tekanan_darah_sistol: 120,
      tekanan_darah_diastol: 80,
      gula_darah: 110,
    });
    expect(c.lingkar_lengan).toBe(14);
    expect(c.td_sistolik).toBe(120);
    expect(c.td_diastolik).toBe(80);
    expect(c.gula_darah_sewaktu).toBe(110);
    const both = canonicalizePengukuranForm({ lingkar_lengan: 15, lingkar_lengan_atas: 14 });
    expect(both.lingkar_lengan).toBe(15);
  });
});
