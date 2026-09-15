/**
 * MEJA-5-AUDIT — service penyuluhan (M5-004/006/007/011/015/019).
 * DB error tidak ditelan; duplikat (sesi, tema) idempoten; guard sesi + role.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { dbService } from "@/services/dbService";

const h = vi.hoisted(() => {
  const state = {
    jadwalRow: null as any,
    currentRow: null as any,
    insertResponse: null as any,
    retryRows: [] as any[],
    updateResponse: null as any,
    deleteError: null as any,
    listRows: [] as any[],
    listError: null as any,
  };
  function makeBuilder(table: string): any {
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
    b.maybeSingle = async () => {
      if (table === "jadwal_posyandu") return { data: state.jadwalRow, error: null };
      if (table === "penyuluhan") return { data: state.currentRow, error: null };
      return { data: null, error: null };
    };
    b.single = async () => {
      if (b._op === "update" && state.updateResponse) return { data: state.updateResponse, error: null };
      if (table === "penyuluhan" && state.insertResponse) return state.insertResponse;
      return { data: state.updateResponse, error: null };
    };
    b.then = (resolve: any) => {
      if (table === "penyuluhan") {
        if (state.listError) return resolve({ data: null, error: state.listError });
        return resolve({ data: state.retryRows.length > 0 || state.listRows.length > 0 ? [...state.retryRows, ...state.listRows] : state.listRows, error: null });
      }
      return resolve({ data: null, error: state.deleteError });
    };
    return b;
  }
  return { state, from: vi.fn((table: string) => makeBuilder(table)) };
});

vi.mock("@/lib/insforge", () => ({
  insforge: { database: { from: h.from } },
  insforgeConfigured: true,
}));

const validInput = {
  tema: "Pentingnya Imunisasi Dasar Lengkap",
  narasumber: "Bidan Siti",
  jumlah_peserta: 20,
  metode: "Ceramah",
  media: "Poster",
  ringkasan: "Ringkasan materi",
};

beforeEach(() => {
  h.state.jadwalRow = { id: "sesi-A", status: "aktif" };
  h.state.currentRow = null;
  h.state.insertResponse = {
    data: {
      id: "peny-1",
      jadwal_posyandu_id: "sesi-A",
      jadwal_id: "sesi-A",
      tema: validInput.tema,
      narasumber: validInput.narasumber,
      jumlah_peserta: 20,
      metode: "Ceramah",
      media: "Poster",
      ringkasan: "Ringkasan materi",
      created_at: "2026-09-12T10:00:00Z",
      updated_at: "2026-09-12T10:00:00Z",
    },
    error: null,
  };
  h.state.retryRows = [];
  h.state.updateResponse = null;
  h.state.deleteError = null;
  h.state.listRows = [];
  h.state.listError = null;
  h.from.mockClear();
});

describe("dbService.catatPenyuluhan", () => {
  it("M5-015: role tanpa hak ditolak sebelum DB", async () => {
    await expect(
      dbService.catatPenyuluhan(validInput, { actorRole: "ketua_pkk", sessionId: "sesi-A" })
    ).rejects.toThrow(/hanya untuk Kader/);
    expect(h.from).not.toHaveBeenCalled();
  });

  it("validator menolak tema kosong sebelum DB", async () => {
    await expect(
      dbService.catatPenyuluhan({ ...validInput, tema: "  " }, { actorRole: "kader", sessionId: "sesi-A" })
    ).rejects.toThrow(/wajib diisi/);
    expect(h.from).not.toHaveBeenCalled();
  });

  it("tanpa sesi / sesi tak ada / sesi selesai ditolak", async () => {
    await expect(
      dbService.catatPenyuluhan(validInput, { actorRole: "kader" })
    ).rejects.toThrow(/wajib dipilih/);
    h.state.jadwalRow = null;
    await expect(
      dbService.catatPenyuluhan(validInput, { actorRole: "kader", sessionId: "sesi-X" })
    ).rejects.toThrow(/tidak ditemukan/);
    h.state.jadwalRow = { id: "sesi-A", status: "selesai" };
    await expect(
      dbService.catatPenyuluhan(validInput, { actorRole: "kader", sessionId: "sesi-A" })
    ).rejects.toThrow(/hanya pada sesi aktif/);
  });

  it("sukses: insert memakai jadwal_posyandu_id canonical, action created", async () => {
    const res = await dbService.catatPenyuluhan(validInput, { actorRole: "kader", sessionId: "sesi-A" });
    expect(res.action).toBe("created");
    expect(res.row.jadwal_posyandu_id).toBe("sesi-A");
    expect(res.row.tema).toBe(validInput.tema);
  });

  it("M5-007: duplikat (sesi, tema) mengembalikan baris ada (existed)", async () => {
    h.state.insertResponse = {
      data: null,
      error: { code: "23505", message: "duplicate key value violates unique constraint" },
    };
    h.state.retryRows = [{ id: "peny-lama", jadwal_posyandu_id: "sesi-A", tema: validInput.tema, jumlah_peserta: 20 }];
    const res = await dbService.catatPenyuluhan(validInput, { actorRole: "bidan", sessionId: "sesi-A" });
    expect(res.action).toBe("existed");
    expect(res.row.id).toBe("peny-lama");
  });

  it("M5-004: DB error non-duplikat dilempar (tanpa fallback lokal)", async () => {
    h.state.insertResponse = { data: null, error: { message: "connection lost" } };
    await expect(
      dbService.catatPenyuluhan(validInput, { actorRole: "kader", sessionId: "sesi-A" })
    ).rejects.toThrow(/connection lost/);
  });
});

describe("dbService.updatePenyuluhan / hapusPenyuluhan (M5-011)", () => {
  it("update sukses memetakan canonical", async () => {
    h.state.currentRow = { id: "peny-1", jadwal_posyandu_id: "sesi-A", tema: "Tema Lama ABC", narasumber: "Narasumber", jumlah_peserta: 5 };
    h.state.updateResponse = { id: "peny-1", jadwal_posyandu_id: "sesi-A", tema: "Tema Baru ABC", narasumber: "Narasumber", jumlah_peserta: 7 };
    const row = await dbService.updatePenyuluhan("peny-1", { tema: "Tema Baru ABC", jumlah_peserta: 7 }, { actorRole: "kader" });
    expect(row.tema).toBe("Tema Baru ABC");
    expect(row.jumlah).toBe(7);
  });

  it("update baris tak ada / sesi tutup ditolak", async () => {
    h.state.currentRow = null;
    await expect(dbService.updatePenyuluhan("nope", { tema: "Tema Baru ABC" }, { actorRole: "kader" })).rejects.toThrow(/tidak ditemukan/);
    h.state.currentRow = { id: "peny-1", jadwal_posyandu_id: "sesi-A", tema: "Tema Lama ABC", narasumber: "Narasumber", jumlah_peserta: 5 };
    h.state.jadwalRow = { id: "sesi-A", status: "selesai" };
    await expect(dbService.updatePenyuluhan("peny-1", { tema: "Tema Baru ABC" }, { actorRole: "kader" })).rejects.toThrow(/hanya pada sesi aktif/);
  });

  it("hapus sukses; hapus tanpa hak ditolak", async () => {
    h.state.currentRow = { id: "peny-1", jadwal_posyandu_id: "sesi-A", jadwal_id: "sesi-A" };
    await expect(dbService.hapusPenyuluhan("peny-1", { actorRole: "bidan" })).resolves.toEqual({ id: "peny-1" });
    await expect(dbService.hapusPenyuluhan("peny-1", { actorRole: "kepala_desa" })).rejects.toThrow(/hanya untuk Kader/);
  });
});

describe("dbService.getPenyuluhan (M5-019)", () => {
  it("error dilempar, bukan [] diam", async () => {
    h.state.listError = { message: "db down" };
    await expect(dbService.getPenyuluhan("sesi-A")).rejects.toThrow(/db down/);
  });

  it("sukses memetakan canonical", async () => {
    h.state.listRows = [{ id: "p1", jadwal_posyandu_id: "sesi-A", tema: "T", narasumber: "N", jumlah_peserta: 3 }];
    const rows = await dbService.getPenyuluhan("sesi-A");
    expect(rows).toHaveLength(1);
    expect(rows[0].jumlah).toBe(3);
  });
});
