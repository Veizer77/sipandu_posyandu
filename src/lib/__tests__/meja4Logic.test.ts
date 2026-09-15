/**
 * MEJA-4-AUDIT — Test matrix logika murni (src/lib/meja4Logic.ts).
 */
import { describe, it, expect } from "vitest";
import {
  normalizePelayanan,
  hasAnyPelayanan,
  validatePelayanan,
  toDbPelayananRow,
  toPelayananFormFields,
  isBulanVitaminA,
  resolveMeja4Visit,
  canGiveImunisasi,
  payloadHasImunisasiTindakan,
  buildDraftKeyM4,
  packDraftM4,
  unpackDraftM4,
} from "@/lib/meja4Logic";

describe("M4-004 — form kosong ditolak", () => {
  it("semua false/kosong -> invalid dengan pesan panduan", () => {
    const r = validatePelayanan({});
    expect(r.valid).toBe(false);
    expect(r.firstError).toMatch(/Minimal satu layanan/);
  });

  it("satu konseling saja lolos (kejujuran data tanpa tindakan medis)", () => {
    expect(validatePelayanan({ konseling: true }).valid).toBe(true);
  });
});

describe("M4-005 — rujukan wajib tujuan + alasan", () => {
  it("rujukan tanpa keduanya ditolak; lengkap lolos", () => {
    const kosong = validatePelayanan({ rujukan: true, tujuan_rujukan: "", alasan_rujukan: "  " });
    expect(kosong.valid).toBe(false);
    expect(kosong.errors.tujuan_rujukan).toBeDefined();
    expect(kosong.errors.alasan_rujukan).toBeDefined();

    const ok = validatePelayanan({
      rujukan: true,
      tujuan_rujukan: " Puskesmas Junrejo ",
      alasan_rujukan: "Observasi",
    });
    expect(ok.valid).toBe(true);
    expect(ok.value.tujuan_rujukan).toBe("Puskesmas Junrejo");
  });
});

describe("M4-009 — hasAnyPelayanan semua jenis", () => {
  it("TT/konseling/obat/skrining dihitung sebagai pelayanan", () => {
    expect(hasAnyPelayanan({ imunisasi_tt_ke: 2 })).toBe(true);
    expect(hasAnyPelayanan({ konseling: true })).toBe(true);
    expect(hasAnyPelayanan({ obat_rutin: "Amlodipine" })).toBe(true);
    expect(hasAnyPelayanan({ skrining_anemia: true })).toBe(true);
    expect(hasAnyPelayanan({ vitamin_a: true })).toBe(true);
    expect(hasAnyPelayanan({ imunisasi: ["BCG"] })).toBe(true);
    expect(hasAnyPelayanan({})).toBe(false);
    expect(hasAnyPelayanan(null)).toBe(false);
  });
});

describe("M4-011/M4-012 — TT & panjang field", () => {
  it("TT di luar 1-5 ditolak; obat_rutin > 200 ditolak", () => {
    expect(validatePelayanan({ imunisasi_tt_ke: 9 }).errors.imunisasi_tt_ke).toMatch(/TT1/);
    expect(validatePelayanan({ imunisasi_tt_ke: 0 }).errors.imunisasi_tt_ke).toBeDefined();
    expect(validatePelayanan({ imunisasi_tt_ke: 3 }).valid).toBe(true);
    expect(validatePelayanan({ konseling: true, obat_rutin: "x".repeat(201) }).errors.obat_rutin).toMatch(/maksimal/);
  });
});

describe("M4-003/M4-024 — DTO canonical & mapper DB", () => {
  it("alias legacy dipetakan; boolean legacy diurai", () => {
    const v = normalizePelayanan({
      rujukan_tujuan: "Puskesmas",
      rujukan_catatan: "Observasi",
      imunisasi: true,
      imunisasi_jenis: "BCG, Polio 1",
    } as any);
    expect(v.tujuan_rujukan).toBe("Puskesmas");
    expect(v.alasan_rujukan).toBe("Observasi");
    expect(v.imunisasi).toEqual(["BCG", "Polio 1"]);
  });

  it("toDbPelayananRow menulis kolom canonical + legacy", () => {
    const v = normalizePelayanan({
      rujukan: true,
      tujuan_rujukan: "Puskesmas",
      alasan_rujukan: "Observasi",
      imunisasi: ["BCG"],
      imunisasi_tt_ke: 2,
    });
    const row = toDbPelayananRow("visit-1", v);
    expect(row.rujukan_tujuan).toBe("Puskesmas");
    expect(row.rujukan_alasan).toBe("Observasi");
    expect(row.rujukan_catatan).toBe("Observasi");
    expect(row.imunisasi).toBe(true);
    expect(row.imunisasi_jenis).toBe("BCG");
    expect(row.imunisasi_tt).toBe(true);
    expect(row.imunisasi_tt_ke).toBe(2);
  });

  it("toPelayananFormFields round-trip: DB -> form canonical + versi", () => {
    const f = toPelayananFormFields({
      vitamin_a: true,
      imunisasi: true,
      imunisasi_jenis: "BCG",
      rujukan_tujuan: "Puskesmas",
      rujukan_alasan: null,
      rujukan_catatan: "Observasi lama",
      imunisasi_tt: true,
      imunisasi_tt_ke: 1,
      created_at: "2026-09-12T13:00:00Z",
      updated_at: "2026-09-12T14:00:00Z",
    });
    expect(f.imunisasi).toEqual(["BCG"]);
    expect(f.tujuan_rujukan).toBe("Puskesmas");
    expect(f.alasan_rujukan).toBe("Observasi lama");
    expect(f.imunisasi_tt_ke).toBe(1);
    expect(f.updated_at).toBe("2026-09-12T14:00:00Z");
  });
});

describe("M4-014 — bulan Vitamin A", () => {
  it("Februari & Agustus true; lainnya false", () => {
    expect(isBulanVitaminA(1)).toBe(true);
    expect(isBulanVitaminA(7)).toBe(true);
    expect(isBulanVitaminA(0)).toBe(false);
    expect(isBulanVitaminA(8)).toBe(false);
  });
});

describe("M4-015 — resolusi visit sesi", () => {
  const v = (id: string, anggota: string, status: string) => ({
    id,
    anggota_id: anggota,
    jadwal_posyandu_id: "sesi-A",
    status_alur: status,
  });

  it("aktif didahulukan; selesai saja -> finished; tanpa visit -> none", () => {
    expect(resolveMeja4Visit([v("v1", "a1", "meja_4_pelayanan")], "a1").kind).toBe("active");
    expect(resolveMeja4Visit([v("v0", "a1", "selesai")], "a1").kind).toBe("finished");
    expect(resolveMeja4Visit([], "a1").kind).toBe("none");
  });
});

describe("M4-016 — permission imunisasi", () => {
  it("kader tidak boleh; bidan/super_admin boleh", () => {
    expect(canGiveImunisasi("kader")).toBe(false);
    expect(canGiveImunisasi("bidan")).toBe(true);
    expect(canGiveImunisasi("super_admin")).toBe(true);
    expect(payloadHasImunisasiTindakan({ imunisasi: ["BCG"] })).toBe(true);
    expect(payloadHasImunisasiTindakan({ imunisasi_tt_ke: 2 })).toBe(true);
    expect(payloadHasImunisasiTindakan({ vitamin_a: true })).toBe(false);
  });
});

describe("M4-020 — draft session-aware", () => {
  const parts = { anggotaId: "a1", sessionId: "sesi-A", visitId: "v1" };

  it("key berversi; beda sesi/visit ditolak; kosong ditolak", () => {
    expect(buildDraftKeyM4(parts)).toContain("sesi-A");
    const raw = JSON.stringify(packDraftM4(parts, { vitamin_a: true }));
    expect(unpackDraftM4(raw, parts)?.vitamin_a).toBe(true);
    expect(unpackDraftM4(raw, { ...parts, sessionId: "sesi-B" })).toBeNull();
    expect(unpackDraftM4(raw, { ...parts, visitId: "v2" })).toBeNull();
    expect(unpackDraftM4(JSON.stringify(packDraftM4(parts, {})), parts)).toBeNull();
  });
});
