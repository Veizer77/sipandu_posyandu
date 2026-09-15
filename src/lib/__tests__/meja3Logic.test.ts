/**
 * MEJA-3-AUDIT — Test matrix logika murni (src/lib/meja3Logic.ts).
 */
import { describe, it, expect } from "vitest";
import {
  CATATAN_MAX_LEN,
  validatePencatatan,
  normalizePencatatan,
  catatanHasContent,
  toCatatanFormFields,
  resolveMeja3Visit,
  buildDraftKeyM3,
  packDraftM3,
  unpackDraftM3,
  isVersionConflict,
} from "@/lib/meja3Logic";

describe("M3-011 — validator domain pencatatan", () => {
  it("trim field dan lolos bila satu field terisi", () => {
    const r = validatePencatatan({ keluhan: "  batuk  ", temuan: "", catatan_kader: "", catatan_bidan: "" });
    expect(r.valid).toBe(true);
    expect(r.value.keluhan).toBe("batuk");
  });

  it("payload kosong total ditolak", () => {
    const r = validatePencatatan({ keluhan: "   ", temuan: "", catatan_kader: null, catatan_bidan: undefined });
    expect(r.valid).toBe(false);
    expect(r.firstError).toMatch(/Minimal satu field/);
    expect(r.errors._form).toBeDefined();
  });

  it(`field lebih dari ${CATATAN_MAX_LEN} karakter ditolak per-field`, () => {
    const r = validatePencatatan({ keluhan: "x".repeat(CATATAN_MAX_LEN + 1) });
    expect(r.valid).toBe(false);
    expect(r.errors.keluhan).toMatch(/maksimal/);
  });

  it("tepat di batas lolos", () => {
    expect(validatePencatatan({ temuan: "y".repeat(CATATAN_MAX_LEN) }).valid).toBe(true);
  });
});

describe("M3-008 — sudah dicatat bila SATU field terisi", () => {
  it("Catatan hanya `temuan` dihitung sudah dicatat", () => {
    expect(catatanHasContent({ temuan: "lesu" })).toBe(true);
    expect(catatanHasContent({ catatan_bidan: "kontrol" })).toBe(true);
    expect(catatanHasContent({ keluhan: "", temuan: "", catatan_kader: "", catatan_bidan: "  " })).toBe(false);
    expect(catatanHasContent({})).toBe(false);
    expect(catatanHasContent(null)).toBe(false);
  });
});

describe("M3-018 — mapper round-trip baris DB", () => {
  it("field + versi terbawa; null menjadi string kosong", () => {
    const f = toCatatanFormFields({
      keluhan: " batuk ",
      temuan: null,
      catatan_kader: "",
      catatan_bidan: null,
      created_at: "2026-09-12T13:00:00Z",
      updated_at: "2026-09-12T14:00:00Z",
    });
    expect(f.keluhan).toBe("batuk");
    expect(f.temuan).toBe("");
    expect(f.created_at).toBe("2026-09-12T13:00:00Z");
    expect(f.updated_at).toBe("2026-09-12T14:00:00Z");
  });
});

describe("M3-014 — resolusi visit sesi", () => {
  const sesi = "sesi-A";
  const v = (id: string, anggota: string, status: string) => ({
    id,
    anggota_id: anggota,
    jadwal_posyandu_id: sesi,
    status_alur: status,
  });

  it("aktif didahulukan; selesai saja -> finished; tanpa visit -> none", () => {
    expect(resolveMeja3Visit([v("v1", "a1", "meja_3_pencatatan")], "a1").kind).toBe("active");
    const both = [v("v0", "a1", "selesai"), v("v1", "a1", "meja_2_pengukuran")];
    const r = resolveMeja3Visit(both, "a1");
    expect(r.kind).toBe("active");
    expect((r as any).visit.id).toBe("v1");
    expect(resolveMeja3Visit([v("v0", "a1", "selesai")], "a1").kind).toBe("finished");
    expect(resolveMeja3Visit([v("v9", "a2", "meja_2_pengukuran")], "a1").kind).toBe("none");
  });
});

describe("M3-012 — draft session-aware", () => {
  const parts = { anggotaId: "a1", sessionId: "sesi-A", visitId: "v1" };

  it("key memuat sesi + visit + versi; beda sesi/visit ditolak", () => {
    const key = buildDraftKeyM3(parts);
    expect(key).toContain("sesi-A");
    expect(key).toContain("v1");
    const raw = JSON.stringify(packDraftM3(parts, { keluhan: "batuk" }));
    expect(unpackDraftM3(raw, parts)?.keluhan).toBe("batuk");
    expect(unpackDraftM3(raw, { ...parts, sessionId: "sesi-B" })).toBeNull();
    expect(unpackDraftM3(raw, { ...parts, visitId: "v2" })).toBeNull();
  });

  it("draft kosong isi ditolak (tidak ada draft phantom)", () => {
    const raw = JSON.stringify(packDraftM3(parts, { keluhan: "   " }));
    expect(unpackDraftM3(raw, parts)).toBeNull();
  });
});

describe("M3-015 — deteksi konflik versi", () => {
  it("sama -> tidak konflik; beda -> konflik; tanpa ekspektasi -> tidak konflik", () => {
    expect(isVersionConflict("2026-09-12T14:00:00Z", "2026-09-12T14:00:00Z", true)).toBe(false);
    expect(isVersionConflict("2026-09-12T14:00:00Z", "2026-09-12T15:00:00Z", true)).toBe(true);
    expect(isVersionConflict(null, "2026-09-12T15:00:00Z", true)).toBe(false);
    expect(isVersionConflict("2026-09-12T14:00:00Z", "2026-09-12T15:00:00Z", false)).toBe(false);
  });
});

describe("normalizePencatatan — non-string dikoersi aman", () => {
  it("angka/null/undefined menjadi string/kosong tanpa crash", () => {
    const n = normalizePencatatan({ keluhan: 123, temuan: null } as any);
    expect(n.keluhan).toBe("123");
    expect(n.temuan).toBe("");
  });
});
