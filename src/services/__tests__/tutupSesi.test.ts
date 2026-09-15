import { describe, it, expect, vi, beforeEach } from "vitest";
import { dbService } from "@/services/dbService";

// Mock query builder ala postgrest: chainable + awaitable via .then,
// mengembalikan respons dari antrean dan mencatat seluruh panggilan.
const h = vi.hoisted(() => {
  const calls: Array<{ table: string; op: string; args: any[] }> = [];
  const queue: Array<{ data: any; error: any }> = [];
  function makeBuilder(table: string): any {
    const builder: any = {};
    const rec = (op: string, args: any[]) => {
      calls.push({ table, op, args });
      return builder;
    };
    builder.select = (...a: any[]) => rec("select", a);
    builder.eq = (...a: any[]) => rec("eq", a);
    builder.update = (...a: any[]) => rec("update", a);
    builder.in = (...a: any[]) => rec("in", a);
    builder.then = (resolve: any) => resolve(queue.shift() ?? { data: null, error: null });
    return builder;
  }
  return { calls, queue, from: vi.fn((t: string) => makeBuilder(t)) };
});

vi.mock("@/lib/insforge", () => ({
  insforge: { database: { from: h.from } },
  insforgeConfigured: true,
}));

beforeEach(() => {
  h.calls.length = 0;
  h.queue.length = 0;
  h.from.mockClear();
});

function updateCalls() {
  return h.calls.filter((c) => c.op === "update");
}

describe("dbService.selesaikanKunjunganSesi", () => {
  it("hanya memfinalkan visit sesi yang belum selesai, via satu update .in(ids)", async () => {
    h.queue.push({
      data: [
        { id: "v1", status_alur: "selesai" },
        { id: "v2", status_alur: "meja_5_penyuluhan" },
        { id: "v3", status_alur: "meja_2_pengukuran" },
        { id: "v4", status_alur: null },
      ],
      error: null,
    });
    h.queue.push({ data: null, error: null });
    const res = await dbService.selesaikanKunjunganSesi("sesiA");
    // v1 selesai dilewati; v4 berstatus null ikut difinalkan (jangan strand).
    expect(res).toEqual({ finalizedCount: 3 });
    const ups = updateCalls();
    expect(ups).toHaveLength(1);
    expect(ups[0].table).toBe("kunjungan");
    const inCall = h.calls.find((c) => c.op === "in");
    expect(inCall?.args).toEqual(["id", ["v2", "v3", "v4"]]);
  });

  it("tidak pernah menyentuh kolom jadwal_id yang tak ada di DB", async () => {
    h.queue.push({ data: [{ id: "v2", status_alur: "meja_5_penyuluhan" }], error: null });
    h.queue.push({ data: null, error: null });
    await dbService.selesaikanKunjunganSesi("sesiA");
    const serialized = JSON.stringify(h.calls);
    expect(serialized).not.toContain("jadwal_id");
  });

  it("tidak ada visit terbuka -> tanpa update, tetap sukses", async () => {
    h.queue.push({ data: [{ id: "v1", status_alur: "selesai" }], error: null });
    const res = await dbService.selesaikanKunjunganSesi("sesiA");
    expect(res).toEqual({ finalizedCount: 0 });
    expect(updateCalls()).toHaveLength(0);
  });

  it("select gagal -> throw tanpa update", async () => {
    h.queue.push({ data: null, error: { message: "db down" } });
    await expect(dbService.selesaikanKunjunganSesi("sesiA")).rejects.toThrow();
    expect(updateCalls()).toHaveLength(0);
  });

  it("tanpa jadwalId -> throw tanpa query", async () => {
    await expect(dbService.selesaikanKunjunganSesi("")).rejects.toThrow();
    expect(h.from).not.toHaveBeenCalled();
  });
});

describe("dbService.closeSession", () => {
  it("finalkan visit DULU baru jadwal (retry bersih bila jadwal gagal)", async () => {
    h.queue.push({ data: [{ id: "v2", status_alur: "meja_5_penyuluhan" }], error: null });
    h.queue.push({ data: null, error: null }); // update visits
    h.queue.push({ data: null, error: null }); // update jadwal
    await dbService.closeSession("sesiA");
    const ups = updateCalls();
    expect(ups).toHaveLength(2);
    expect(ups[0].table).toBe("kunjungan");
    expect(ups[1].table).toBe("jadwal_posyandu");
  });

  it("jadwal gagal -> throw (visit sudah final, retry idempoten)", async () => {
    h.queue.push({ data: [{ id: "v2", status_alur: "meja_5_penyuluhan" }], error: null });
    h.queue.push({ data: null, error: null });
    h.queue.push({ data: null, error: { message: "jadwal locked" } });
    await expect(dbService.closeSession("sesiA")).rejects.toThrow(/jadwal locked/);
  });
});
