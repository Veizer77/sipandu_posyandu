/**
 * Guard alur Meja 2->3->4 di dbService (kasus "selesai tanpa ukur"):
 * - savePencatatan/savePelayanan menolak visit selesai/terkunci/sesi non-aktif.
 * - savePencatatan/savePelayanan menolak kunjungan tanpa baris pengukuran.
 * - Transisi status yang gagal melempar (tanpa sukses palsu).
 * - savePengukuran menolak kunjungan milik peserta lain.
 *
 * Mock InsForge dengan builder thenable: terminal await (update/delete/insert
 * dan select().order().limit()) resolve { data, error }; maybeSingle/single
 * eksplisit per tabel.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { dbService } from "@/services/dbService";

const h = vi.hoisted(() => {
  const state = {
    kunjunganRow: null as any,
    jadwalRow: null as any,
    pengukuranRows: [] as any[],
    existingCatatan: null as any,
    existingPelayanan: null as any,
    writeError: null as any,
    updateError: null as any,
    transitionError: null as any,
    rpcResponse: null as any,
    catatanListRows: null as any,
    catatanListQueue: null as any,
    pelayananListRows: null as any,
    pelayananListQueue: null as any,
    imunisasiInsertError: null as any,
  };
  function terminal(op: string, table: string) {
    if (op === "select-list") {
      if (table === "catatan_kunjungan") {
        // Antrean hasil select berurutan (simulasi race: kosong dulu, lalu ada pemenang).
        if (Array.isArray(state.catatanListQueue) && state.catatanListQueue.length > 0) {
          return { data: state.catatanListQueue.shift(), error: null };
        }
        if (state.catatanListRows !== null) return { data: state.catatanListRows, error: null };
        return {
          data: state.existingCatatan
            ? [{ id: state.existingCatatan.id, updated_at: state.existingCatatan.updated_at }]
            : [],
          error: null,
        };
      }
      if (table === "pelayanan") {
        if (Array.isArray(state.pelayananListQueue) && state.pelayananListQueue.length > 0) {
          return { data: state.pelayananListQueue.shift(), error: null };
        }
        if (state.pelayananListRows !== null) return { data: state.pelayananListRows, error: null };
        return {
          data: state.existingPelayanan
            ? [{ id: state.existingPelayanan.id, updated_at: state.existingPelayanan.updated_at }]
            : [],
          error: null,
        };
      }
      return { data: state.pengukuranRows, error: null };
    }
    // Transisi status alur (update tabel kunjungan) dapat gagal independen.
    if (table === "kunjungan" && op === "update") return { data: null, error: state.transitionError };
    if (op === "update") return { data: null, error: state.updateError };
    if (table === "imunisasi" && op === "insert") return { data: null, error: state.imunisasiInsertError };
    return { data: null, error: state.writeError };
  }
  function makeBuilder(table: string): any {
    const b: any = { _op: "" };
    b.select = () => b;
    b.eq = () => b;
    b.order = () => b;
    b.limit = () => {
      b._op = "select-list";
      return b;
    };
    b.update = () => {
      b._op = "update";
      return b;
    };
    b.delete = () => {
      b._op = "delete";
      return b;
    };
    b.insert = () => {
      b._op = "insert";
      return b;
    };
    b.maybeSingle = async () => {
      if (table === "kunjungan") return { data: state.kunjunganRow, error: null };
      if (table === "jadwal_posyandu") return { data: state.jadwalRow, error: null };
      if (table === "catatan_kunjungan") return { data: state.existingCatatan, error: null };
      if (table === "pelayanan") return { data: state.existingPelayanan, error: null };
      return { data: null, error: null };
    };
    b.single = async () => ({ data: { id: "row-id" }, error: state.writeError });
    b.then = (resolve: any) => resolve(terminal(b._op, table));
    return b;
  }
  const rpc = vi.fn(async (_fn: string, _args: any) => state.rpcResponse);
  return { state, from: vi.fn((table: string) => makeBuilder(table)), rpc };
});

vi.mock("@/lib/insforge", () => ({
  insforge: { database: { from: h.from, rpc: h.rpc } },
  insforgeConfigured: true,
}));

const visitOk = {
  id: "visit-1",
  anggota_id: "a1",
  jadwal_posyandu_id: "sesiA",
  status_alur: "meja_3_pencatatan",
  status_verifikasi: "draft",
};
const jadwalAktif = { id: "sesiA", status: "aktif" };

beforeEach(() => {
  h.state.kunjunganRow = { ...visitOk };
  h.state.jadwalRow = { ...jadwalAktif };
  h.state.pengukuranRows = [{ id: "ukur-1" }];
  h.state.existingCatatan = null;
  h.state.existingPelayanan = null;
  h.state.writeError = null;
  h.state.updateError = null;
  h.state.transitionError = null;
  h.state.catatanListRows = null;
  h.state.catatanListQueue = null;
  h.state.pelayananListRows = null;
  h.state.pelayananListQueue = null;
  h.state.imunisasiInsertError = null;
  h.state.rpcResponse = {
    data: { ok: true, action: "updated", id: "cat-1", updated_at: "2026-09-12T14:00:00.000Z" },
    error: null,
  };
  h.from.mockClear();
  h.rpc.mockClear();
});

describe("dbService.savePencatatan — guard alur", () => {
  it("menolak kunjungan tanpa pengukuran (Meja 2 dilewati)", async () => {
    h.state.pengukuranRows = [];
    await expect(dbService.savePencatatan("visit-1", { keluhan: "batuk" })).rejects.toThrow(
      /Pengukuran Meja 2 belum tercatat/
    );
  });

  it("menolak kunjungan berstatus selesai", async () => {
    h.state.kunjunganRow = { ...visitOk, status_alur: "selesai" };
    await expect(dbService.savePencatatan("visit-1", { keluhan: "x" })).rejects.toThrow(/sudah selesai/);
  });

  it("menolak kunjungan terkunci (tervalidasi Bidan)", async () => {
    h.state.kunjunganRow = { ...visitOk, status_verifikasi: "valid" };
    await expect(dbService.savePencatatan("visit-1", { keluhan: "x" })).rejects.toThrow(/terkunci/);
  });

  it("menolak sesi tidak aktif", async () => {
    h.state.jadwalRow = { id: "sesiA", status: "selesai" };
    await expect(dbService.savePencatatan("visit-1", { keluhan: "x" })).rejects.toThrow(
      /hanya pada sesi aktif/
    );
  });

  it("transisi status gagal (jalur fallback) -> lempar tanpa sukses palsu", async () => {
    h.state.rpcResponse = {
      data: null,
      error: { code: "PGRST202", message: "Could not find the function public.simpan_pencatatan" },
    };
    h.state.transitionError = { message: "boom" };
    await expect(dbService.savePencatatan("visit-1", { keluhan: "x" })).rejects.toThrow(
      /status alur gagal/
    );
  });

  it("menolak kunjungan milik peserta lain", async () => {
    await expect(
      dbService.savePencatatan("visit-1", { anggota_id: "orang-lain", keluhan: "x" })
    ).rejects.toThrow(/bukan milik peserta/);
  });

  it("menolak sesi rujukan yang tidak ada (data korup)", async () => {
    h.state.jadwalRow = null;
    await expect(dbService.savePencatatan("visit-1", { keluhan: "x" })).rejects.toThrow(/tidak valid/);
  });

  it("lolos via RPC atomik bila visit writable + pengukuran ada", async () => {
    const res = await dbService.savePencatatan("visit-1", { anggota_id: "a1", keluhan: "batuk" });
    expect(res.action).toBe("updated");
    expect(res.id).toBe("cat-1");
    expect(res.updatedAt).toBe("2026-09-12T14:00:00.000Z");
    expect(h.rpc).toHaveBeenCalledOnce();
  });
});

describe("dbService.savePencatatan — RPC, validator, role, versi (M3-006/010/011/015)", () => {
  const rpcMissing = {
    data: null,
    error: { code: "PGRST202", message: "Could not find the function public.simpan_pencatatan" },
  };

  it("RPC menolak (409 konflik) -> lempar dengan flag conflict + versi server", async () => {
    h.state.rpcResponse = {
      data: {
        ok: false,
        code: 409,
        conflict: true,
        message: "Catatan berubah oleh petugas lain. Muat ulang sebelum menyimpan.",
        server_updated_at: "2026-09-12T15:00:00.000Z",
      },
      error: null,
    };
    try {
      await dbService.savePencatatan("visit-1", { keluhan: "x" }, { expectedUpdatedAt: "2026-09-12T14:00:00Z" });
      expect.unreachable("seharusnya melempar konflik");
    } catch (e: any) {
      expect(e.conflict).toBe(true);
      expect(e.serverUpdatedAt).toBe("2026-09-12T15:00:00.000Z");
    }
  });

  it("RPC menolak guard (422 tanpa ukur) -> lempar pesan fungsi", async () => {
    h.state.rpcResponse = {
      data: { ok: false, code: 422, message: "Pengukuran Meja 2 belum tercatat untuk kunjungan ini." },
      error: null,
    };
    await expect(dbService.savePencatatan("visit-1", { keluhan: "x" })).rejects.toThrow(
      /Pengukuran Meja 2 belum tercatat/
    );
  });

  it("RPC tak terdaftar -> fallback sekuensial tetap simpan (update)", async () => {
    h.state.rpcResponse = rpcMissing;
    h.state.existingCatatan = { id: "c1", updated_at: "2026-09-12T14:00:00.000Z" };
    const res = await dbService.savePencatatan(
      "visit-1",
      { keluhan: "batuk" },
      { expectedUpdatedAt: "2026-09-12T14:00:00.000Z" }
    );
    expect(res.action).toBe("updated");
    expect(res.id).toBe("c1");
  });

  it("Fallback: race insert 23505 -> update baris pemenang, satu baris", async () => {
    h.state.rpcResponse = rpcMissing;
    h.state.existingCatatan = null;
    h.state.writeError = { code: "23505", message: "duplicate key value violates unique constraint" };
    // Select pertama: belum ada baris -> insert -> 23505 -> select ulang: pemenang ada.
    h.state.catatanListQueue = [[], [{ id: "c-winner" }]];
    const res = await dbService.savePencatatan("visit-1", { keluhan: "batuk" });
    expect(res.action).toBe("created");
    expect(res.id).toBe("c-winner");
    expect(h.state.catatanListQueue.length).toBe(0);
  });

  it("Fallback: versi server berubah -> konflik, tanpa tulis", async () => {
    h.state.rpcResponse = rpcMissing;
    h.state.existingCatatan = { id: "c1", updated_at: "2026-09-12T15:00:00.000Z" };
    try {
      await dbService.savePencatatan("visit-1", { keluhan: "x" }, { expectedUpdatedAt: "2026-09-12T14:00:00Z" });
      expect.unreachable("seharusnya melempar konflik");
    } catch (e: any) {
      expect(e.conflict).toBe(true);
      expect(e.serverUpdatedAt).toBe("2026-09-12T15:00:00.000Z");
    }
  });

  it("Validator: payload kosong total ditolak sebelum menyentuh DB", async () => {
    await expect(dbService.savePencatatan("visit-1", {})).rejects.toThrow(/Minimal satu field/);
    expect(h.from).not.toHaveBeenCalled();
    expect(h.rpc).not.toHaveBeenCalled();
  });

  it("Validator: field > 500 karakter ditolak", async () => {
    await expect(dbService.savePencatatan("visit-1", { keluhan: "x".repeat(501) })).rejects.toThrow(
      /maksimal 500/
    );
    expect(h.rpc).not.toHaveBeenCalled();
  });

  it("Role gate: catatan_bidan dari Kader ditolak server", async () => {
    await expect(
      dbService.savePencatatan(
        "visit-1",
        { keluhan: "x", catatan_bidan: "kontrol ulang" },
        { actorRole: "kader" }
      )
    ).rejects.toThrow(/hanya dapat diisi oleh Bidan/);
    expect(h.rpc).not.toHaveBeenCalled();
  });

  it("Role gate: catatan_bidan dari Bidan lolos", async () => {
    const res = await dbService.savePencatatan(
      "visit-1",
      { keluhan: "x", catatan_bidan: "kontrol ulang" },
      { actorRole: "bidan" }
    );
    expect(res.action).toBe("updated");
  });
});

describe("dbService.savePelayanan — guard alur", () => {
  it("menolak kunjungan tanpa pengukuran (Meja 2 dilewati)", async () => {
    h.state.pengukuranRows = [];
    await expect(dbService.savePelayanan("visit-1", { vitamin_a: true })).rejects.toThrow(
      /Pengukuran Meja 2 belum tercatat/
    );
  });

  it("menolak kunjungan berstatus selesai", async () => {
    h.state.kunjunganRow = { ...visitOk, status_alur: "selesai" };
    await expect(dbService.savePelayanan("visit-1", { vitamin_a: true })).rejects.toThrow(/sudah selesai/);
  });

  it("transisi ke selesai gagal (jalur fallback) -> lempar", async () => {
    h.state.rpcResponse = {
      data: null,
      error: { code: "PGRST202", message: "Could not find the function public.simpan_pelayanan" },
    };
    h.state.transitionError = { message: "boom" };
    await expect(dbService.savePelayanan("visit-1", { vitamin_a: true })).rejects.toThrow(/status alur gagal/);
  });

  it("lolos via RPC bila visit writable + pengukuran ada", async () => {
    const res = await dbService.savePelayanan("visit-1", { anggota_id: "a1", vitamin_a: true });
    expect(res.action).toBe("updated");
    expect(h.rpc).toHaveBeenCalled();
  });
});

describe("dbService.savePelayanan — RPC, validator, permission, versi (M4-004/005/011/016/019)", () => {
  const rpcMissing = {
    data: null,
    error: { code: "PGRST202", message: "Could not find the function public.simpan_pelayanan" },
  };

  it("M4-004: form kosong ditolak sebelum menyentuh DB", async () => {
    await expect(dbService.savePelayanan("visit-1", {})).rejects.toThrow(/Minimal satu layanan/);
    expect(h.from).not.toHaveBeenCalled();
    expect(h.rpc).not.toHaveBeenCalled();
  });

  it("M4-005: rujukan tanpa tujuan/alasan ditolak", async () => {
    await expect(
      dbService.savePelayanan("visit-1", { rujukan: true, tujuan_rujukan: "", alasan_rujukan: "" })
    ).rejects.toThrow(/wajib/);
    expect(h.rpc).not.toHaveBeenCalled();
  });

  it("M4-011: TT di luar 1-5 ditolak", async () => {
    await expect(dbService.savePelayanan("visit-1", { imunisasi_tt_ke: 9 })).rejects.toThrow(/TT1/);
    expect(h.rpc).not.toHaveBeenCalled();
  });

  it("M4-016: imunisasi dari Kader ditolak server", async () => {
    await expect(
      dbService.savePelayanan("visit-1", { imunisasi: ["BCG"] }, { actorRole: "kader" })
    ).rejects.toThrow(/hanya dapat diberikan oleh Bidan/);
    expect(h.rpc).not.toHaveBeenCalled();
  });

  it("M4-016: TT dari Kader ditolak server", async () => {
    await expect(
      dbService.savePelayanan("visit-1", { imunisasi_tt_ke: 2 }, { actorRole: "kader" })
    ).rejects.toThrow(/hanya dapat diberikan oleh Bidan/);
  });

  it("M4-016: rujukan dari Kader lolos gate permission", async () => {
    const res = await dbService.savePelayanan(
      "visit-1",
      { rujukan: true, tujuan_rujukan: "Puskesmas", alasan_rujukan: "Observasi" },
      { actorRole: "kader" }
    );
    expect(res.action).toBe("updated");
  });

  it("RPC konflik versi -> flag conflict + versi server", async () => {
    h.state.rpcResponse = {
      data: {
        ok: false, code: 409, conflict: true,
        message: "Pelayanan berubah oleh petugas lain. Muat ulang sebelum menyimpan.",
        server_updated_at: "2026-09-12T16:00:00.000Z",
      },
      error: null,
    };
    try {
      await dbService.savePelayanan("visit-1", { vitamin_a: true }, { expectedUpdatedAt: "2026-09-12T15:00:00Z" });
      expect.unreachable("seharusnya melempar konflik");
    } catch (e: any) {
      expect(e.conflict).toBe(true);
      expect(e.serverUpdatedAt).toBe("2026-09-12T16:00:00.000Z");
    }
  });

  it("RPC sukses created + hitung imunisasi", async () => {
    h.state.rpcResponse = {
      data: { ok: true, action: "created", id: "lay-1", updated_at: "2026-09-12T16:00:00Z", imunisasi_disimpan: 2 },
      error: null,
    };
    const res = await dbService.savePelayanan("visit-1", { imunisasi: ["BCG", "Polio 1"] }, { actorRole: "bidan" });
    expect(res.action).toBe("created");
    expect(res.imunisasiDisimpan).toBe(2);
    const rpcArgs = h.rpc.mock.calls[0][1];
    expect(rpcArgs.p_imunisasi_jenis).toEqual(["BCG", "Polio 1"]);
  });

  it("Fallback: race 23505 -> update pemenang; imunisasi duplikat diabaikan", async () => {
    h.state.rpcResponse = rpcMissing;
    h.state.pelayananListQueue = [[], [{ id: "lay-winner" }]];
    h.state.writeError = { code: "23505", message: "duplicate key value violates unique constraint" };
    h.state.imunisasiInsertError = { code: "23505", message: "duplicate key value violates unique constraint" };
    const res = await dbService.savePelayanan("visit-1", { vitamin_a: true, imunisasi: ["BCG"] });
    expect(res.action).toBe("created");
    expect(res.id).toBe("lay-winner");
    expect(res.imunisasiDisimpan).toBe(0);
  });

  it("Fallback: imunisasi gagal non-duplikat -> lempar eksplisit (tanpa sukses palsu)", async () => {
    h.state.rpcResponse = rpcMissing;
    h.state.imunisasiInsertError = { message: "connection lost" };
    await expect(
      dbService.savePelayanan("visit-1", { vitamin_a: true, imunisasi: ["BCG"] })
    ).rejects.toThrow(/imunisasi BCG gagal dicatat/);
  });

  it("Fallback: simpan ulang di meja_5 dipertahankan (tanpa regresi)", async () => {
    h.state.rpcResponse = rpcMissing;
    h.state.kunjunganRow = { ...visitOk, status_alur: "meja_5_penyuluhan" };
    h.state.existingPelayanan = { id: "lay-1", updated_at: null };
    const res = await dbService.savePelayanan("visit-1", { vitamin_a: true });
    expect(res.action).toBe("updated");
    expect(res.id).toBe("lay-1");
  });

  it("Fallback: simpan dari tahap meja_4 lolos (maju ke meja_5)", async () => {
    h.state.rpcResponse = rpcMissing;
    h.state.kunjunganRow = { ...visitOk, status_alur: "meja_4_pelayanan" };
    const res = await dbService.savePelayanan("visit-1", { vitamin_a: true });
    expect(res.action).toBe("created");
  });
});

describe("dbService.reopenAlur (M4-022)", () => {
  it("menolak role non-Bidan/Admin", async () => {
    await expect(dbService.reopenAlur("visit-1", "meja_4_pelayanan", "kader")).rejects.toThrow(
      /hanya untuk Bidan/
    );
  });

  it("menolak visit yang belum selesai", async () => {
    await expect(dbService.reopenAlur("visit-1", "meja_4_pelayanan", "bidan")).rejects.toThrow(
      /berstatus selesai/
    );
  });

  it("membuka visit selesai ke Meja 4 + verifikasi diperiksa", async () => {
    h.state.kunjunganRow = { ...visitOk, status_alur: "selesai", status_verifikasi: "valid" };
    const res = await dbService.reopenAlur("visit-1", "meja_4_pelayanan", "bidan");
    expect(res.target).toBe("meja_4_pelayanan");
  });
});

describe("dbService.savePengukuran — kepemilikan kunjungan", () => {
  it("menolak payload anggota yang berbeda dari kunjungan", async () => {
    await expect(
      dbService.savePengukuran("visit-1", { anggota_id: "orang-lain", berat_badan: 12 })
    ).rejects.toThrow(/bukan milik peserta/);
  });
});
