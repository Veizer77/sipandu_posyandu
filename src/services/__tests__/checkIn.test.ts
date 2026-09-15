import { describe, it, expect, vi, beforeEach } from "vitest";
import { dbService } from "@/services/dbService";

// Mock InsForge database layer secara terisolasi (tanpa network).
const h = vi.hoisted(() => {
  const builder: any = {
    select: () => builder,
    eq: () => builder,
    insert: () => builder,
    maybeSingle: async () => h.response,
    single: async () => h.insertResponse,
  };
  return {
    response: { data: null as any, error: null as any },
    insertResponse: { data: { id: "new", status_alur: "meja_1_registrasi" } as any, error: null as any },
    builder,
    from: vi.fn(() => builder),
  };
});

vi.mock("@/lib/insforge", () => ({
  insforge: { database: { from: h.from } },
  insforgeConfigured: true,
}));

beforeEach(() => {
  h.response = { data: null, error: null };
  h.insertResponse = { data: { id: "new", status_alur: "meja_1_registrasi" }, error: null };
});

describe("dbService.checkIn — Meja 1 (audit P0 #3,#4,#5,#10)", () => {
  it("menolak check-in tanpa jadwalPosyanduId (tidak boleh sesi bebas)", async () => {
    await expect(dbService.checkIn("a1", "")).rejects.toThrow();
  });

  it("check-in baru menyimpan status_alur = meja_1_registrasi", async () => {
    const res = await dbService.checkIn("a1", "sesiA");
    expect(res.already).toBe(false);
    expect(res.visit?.id).toBe("new");
    expect(res.visit?.status_alur).toBe("meja_1_registrasi");
  });

  it("mengembalikan kunjungan existing bila sudah check-in di sesi yang sama", async () => {
    h.response = { data: { id: "ex", status_alur: "meja_1_registrasi" }, error: null };
    const res = await dbService.checkIn("a1", "sesiA");
    expect(res.already).toBe(true);
    expect(res.visit?.id).toBe("ex");
  });

  it("race condition: insert gagal (unique violation) dikembalikan ke existing", async () => {
    // insert pertama error (duplikat), lalu lookup existing mengembalikan row yg ada
    h.insertResponse = { data: null, error: { code: "23505", message: "duplicate" } };
    h.response = { data: { id: "dup", status_alur: "meja_1_registrasi" }, error: null };
    const res = await dbService.checkIn("a1", "sesiA");
    expect(res.already).toBe(true);
    expect(res.visit?.id).toBe("dup");
  });
});
