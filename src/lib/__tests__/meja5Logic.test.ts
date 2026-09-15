/**
 * MEJA-5-AUDIT — Test matrix logika murni (src/lib/meja5Logic.ts).
 */
import { describe, it, expect } from "vitest";
import {
  TEMPLATES_KEMENKES,
  rankTemplatesByHadir,
  countHadirUnik,
  getPenyuluhanSesi,
  validatePenyuluhan,
  normalizePenyuluhan,
  canManagePenyuluhan,
  toDbPenyuluhanRow,
  fromDbPenyuluhan,
} from "@/lib/meja5Logic";

describe("M5-007 — validator domain penyuluhan", () => {
  it("tema wajib, min 5, maks 200", () => {
    expect(validatePenyuluhan({ tema: "", narasumber: "Kader", jumlah_peserta: 10 }).errors.tema).toMatch(/wajib/);
    expect(validatePenyuluhan({ tema: "Gizi", narasumber: "Kader", jumlah_peserta: 10 }).errors.tema).toMatch(/minimal 5/);
    expect(validatePenyuluhan({ tema: "x".repeat(201), narasumber: "Kader", jumlah_peserta: 10 }).errors.tema).toMatch(/maksimal 200/);
  });

  it("narasumber wajib, maks 100; jumlah min 1", () => {
    const r = validatePenyuluhan({ tema: "Tema valid ABC", narasumber: "", jumlah_peserta: 0 });
    expect(r.errors.narasumber).toMatch(/wajib/);
    expect(r.errors.jumlah_peserta).toMatch(/minimal 1/);
    expect(validatePenyuluhan({ tema: "Tema valid ABC", narasumber: "y".repeat(101), jumlah_peserta: 5 }).errors.narasumber).toMatch(/maksimal 100/);
  });

  it("media 500 / ringkasan 2000 ditegakkan", () => {
    const base = { tema: "Tema valid ABC", narasumber: "Kader", jumlah_peserta: 5 };
    expect(validatePenyuluhan({ ...base, media: "m".repeat(501) }).errors.media).toMatch(/maksimal 500/);
    expect(validatePenyuluhan({ ...base, ringkasan: "r".repeat(2001) }).errors.ringkasan).toMatch(/maksimal 2000/);
    expect(validatePenyuluhan({ ...base, media: "Leaflet", ringkasan: "OK" }).valid).toBe(true);
  });

  it("trim otomatis", () => {
    const r = validatePenyuluhan({ tema: "  Tema valid ABC  ", narasumber: " Kader ", jumlah_peserta: "10" });
    expect(r.valid).toBe(true);
    expect(r.value.tema).toBe("Tema valid ABC");
    expect(r.value.jumlah_peserta).toBe(10);
  });
});

describe("M5-008/M5-020 — filter sesi tanpa fallthrough", () => {
  const rows = [
    { id: "p1", jadwal_posyandu_id: "sesi-A" },
    { id: "p2", jadwal_id: "sesi-A" },
    { id: "p3", jadwal_posyandu_id: "sesi-B" },
  ];
  it("hanya sesi aktif tampil; tanpa sesi -> [] (bukan semua)", () => {
    expect(getPenyuluhanSesi(rows, "sesi-A").map((p) => p.id).sort()).toEqual(["p1", "p2"]);
    expect(getPenyuluhanSesi(rows, "")).toEqual([]);
    expect(getPenyuluhanSesi(rows, null)).toEqual([]);
    expect(getPenyuluhanSesi(rows, undefined)).toEqual([]);
  });
});

describe("M5-005 — hadir unik per anggota", () => {
  it("duplikat anggota dihitung sekali", () => {
    expect(countHadirUnik([{ anggota_id: "a1" }, { anggota_id: "a1" }, { anggota_id: "a2" }, {}])).toBe(2);
  });
});

describe("M5-015 — permission", () => {
  it("kader/bidan/super_admin boleh; pkk/kades tidak", () => {
    expect(canManagePenyuluhan("kader")).toBe(true);
    expect(canManagePenyuluhan("bidan")).toBe(true);
    expect(canManagePenyuluhan("super_admin")).toBe(true);
    expect(canManagePenyuluhan("ketua_pkk")).toBe(false);
    expect(canManagePenyuluhan("kepala_desa")).toBe(false);
    expect(canManagePenyuluhan(undefined)).toBe(false);
  });
});

describe("M5-021 — relevansi template demografi", () => {
  it("template sesuai hadir di depan; stabil bila tak ada yang cocok", () => {
    const ranked = rankTemplatesByHadir(TEMPLATES_KEMENKES, ["ibu_hamil"]);
    expect(ranked[0].kategori).toBe("Ibu Hamil");
    expect(ranked[0].relevan).toBe(true);
    const netral = rankTemplatesByHadir(TEMPLATES_KEMENKES, []);
    expect(netral.map((t) => t.kategori)).toEqual(TEMPLATES_KEMENKES.map((t) => t.kategori));
  });
});

describe("M5-029 — DTO canonical & mapper", () => {
  it("tulis memakai jadwal_posyandu_id + mirror jadwal_id", () => {
    const row = toDbPenyuluhanRow("sesi-A", normalizePenyuluhan({ tema: "T", narasumber: "N", jumlah_peserta: 5 }));
    expect(row.jadwal_posyandu_id).toBe("sesi-A");
    expect(row.jadwal_id).toBe("sesi-A");
  });

  it("baca memetakan alias + jumlah + versi", () => {
    const r = fromDbPenyuluhan({
      id: "p1",
      jadwal_posyandu_id: "sesi-A",
      tema: " T ",
      narasumber: "N",
      jumlah_peserta: 20,
      metode: null,
      created_at: "2026-09-12T10:00:00Z",
      updated_at: null,
    });
    expect(r.tema).toBe("T");
    expect(r.jumlah).toBe(20);
    expect(r.jadwal_id).toBe("sesi-A");
    expect(r.metode).toBe("Ceramah");
  });
});
