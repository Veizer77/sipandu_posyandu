/**
 * REKAP-AUDIT RK-015 — rencana kunjungan rumah persist DB (idempoten).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { dbService } from "@/services/dbService";

const h = vi.hoisted(() => {
  const state = {
    insertResponse: null as any,
    retryRows: [] as any[],
    updateResponse: null as any,
  };
  function makeBuilder(_table: string): any {
    const b: any = { _op: "" };
    b.select = () => b;
    b.eq = () => b;
    b.order = () => b;
    b.limit = () => b;
    b.update = (_row: any) => {
      b._op = "update";
      return b;
    };
    b.delete = () => b;
    b.insert = (_rows: any) => {
      b._op = "insert";
      return b;
    };
    b.single = async () => {
      if (b._op === "update" && state.updateResponse) {
        return { data: state.updateResponse, error: null };
      }
      return state.insertResponse || { data: state.updateResponse, error: null };
    };
    b.then = (resolve: any) => resolve({ data: state.retryRows, error: null });
    return b;
  }
  return { state, from: vi.fn((_table: string) => makeBuilder(_table)) };
});

vi.mock("@/lib/insforge", () => ({
  insforge: { database: { from: h.from } },
  insforgeConfigured: true,
}));

beforeEach(() => {
  h.state.insertResponse = {
    data: { id: "rk-1", anggota_id: "a1", status: "terjadwal" },
    error: null,
  };
  h.state.retryRows = [];
  h.state.updateResponse = null;
  h.from.mockClear();
});

describe("dbService.jadwalkanKunjunganRumah", () => {
  it("membuat rencana baru", async () => {
    const res = await dbService.jadwalkanKunjunganRumah("a1", "sesi-A", "Absen sesi");
    expect(res.action).toBe("created");
    expect(res.row.id).toBe("rk-1");
  });

  it("duplikat aktif -> kembalikan yang ada (tanpa dobel)", async () => {
    h.state.insertResponse = {
      data: null,
      error: { code: "23505", message: "duplicate key value violates unique constraint" },
    };
    h.state.retryRows = [{ id: "rk-lama", anggota_id: "a1", status: "terjadwal" }];
    const res = await dbService.jadwalkanKunjunganRumah("a1", "sesi-A", null);
    expect(res.action).toBe("existed");
    expect(res.row.id).toBe("rk-lama");
  });

  it("error non-duplikat dilempar", async () => {
    h.state.insertResponse = { data: null, error: { message: "db down" } };
    await expect(dbService.jadwalkanKunjunganRumah("a1", null, null)).rejects.toThrow(/db down/);
  });

  it("tanpa anggotaId ditolak sebelum DB", async () => {
    await expect(dbService.jadwalkanKunjunganRumah("", null, null)).rejects.toThrow(/anggotaId/);
    expect(h.from).not.toHaveBeenCalled();
  });
});

describe("dbService.updateStatusRencana", () => {
  it("status valid lolos; invalid ditolak", async () => {
    h.state.updateResponse = { id: "rk-1", status: "selesai" };
    const row = await dbService.updateStatusRencana("rk-1", "selesai");
    expect(row.status).toBe("selesai");
    await expect(dbService.updateStatusRencana("rk-1", "aneh" as any)).rejects.toThrow(/tidak valid/);
  });
});
