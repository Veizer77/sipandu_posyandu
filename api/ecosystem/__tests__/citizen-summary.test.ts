/**
 * SIPANDU - Test API citizen-summary (kontrak Citizen 360 SINDUKSADATI)
 * Regression guard audit 2026-09-15:
 * - BB/TB selalu dikirim (non-balita pun).
 * - Z-score hanya untuk bayi/balita (z_score_berlaku).
 * - Dewasa: imt + status_imt + status_gizi dari IMT.
 * - Bumil: lila_cm + status_kek; status_gizi tidak berlaku.
 */
import { describe, it, expect, vi } from "vitest";

// Mock admin client: rantai query minimal yang mengembalikan data terkontrol.
const state: { anggota: any; kunjungan: any[]; pengukuran: any[]; catatan: any[]; imunisasi: any[]; risiko: any[]; kehamilan: any[] } = {
  anggota: null,
  kunjungan: [],
  pengukuran: [],
  catatan: [],
  imunisasi: [],
  risiko: [],
  kehamilan: [],
};

function makeQuery(rows: any[]) {
  const q: any = {
    select: () => q,
    eq: () => q,
    in: () => q,
    order: () => q,
    limit: () => q,
    maybeSingle: async () => ({ data: rows[0] ?? null, error: null }),
    then: (resolve: any) => resolve({ data: rows, error: null }),
  };
  // await q -> { data: rows }
  (q as any)[Symbol.toStringTag] = "Promise";
  return q;
}

vi.mock("@insforge/sdk", () => ({
  createAdminClient: () => ({
    database: {
      from: (table: string) => {
        const map: Record<string, any[]> = {
          anggota: state.anggota ? [state.anggota] : [],
          kunjungan: state.kunjungan,
          pengukuran: state.pengukuran,
          catatan_kunjungan: state.catatan,
          imunisasi: state.imunisasi,
          risiko: state.risiko,
          kehamilan: state.kehamilan,
        };
        return makeQuery(map[table] ?? []);
      },
    },
  }),
}));

process.env.ECOSYSTEM_SERVICE_KEY = "test-key";
process.env.INSFORGE_API_KEY = "test-admin";

import handler from "../citizen-summary";

function mockRes() {
  const res: any = {
    statusCode: 0,
    body: null,
    headers: {},
    setHeader: (k: string, v: string) => { res.headers[k] = v; },
    status: (c: number) => { res.statusCode = c; return res; },
    json: (b: any) => { res.body = b; return res; },
    end: () => res,
  };
  return res;
}

async function call(nik = "3579012811980008") {
  const req: any = { method: "GET", query: { nik }, headers: { "x-ecosystem-key": "test-key" } };
  const res = mockRes();
  await handler(req, res);
  return res;
}

function reset(anggota: any, pengukuran: any[]) {
  state.anggota = anggota;
  state.kunjungan = [{ id: "k1", waktu_hadir: "2026-09-08T04:42:46Z", status_verifikasi: "valid" }];
  state.pengukuran = pengukuran.map((p) => ({ kunjungan_id: "k1", ...p }));
  state.catatan = [];
  state.imunisasi = [];
  state.risiko = [];
  state.kehamilan = [];
}

describe("GET /api/ecosystem/citizen-summary", () => {
  it("WUS (Dimas): kirim BB/TB + imt + status_imt, z_score_berlaku=false, status_gizi dari IMT", async () => {
    reset({ id: "a1", nama: "Dimas", kategori: "wus", nik: "3579012811980008", tanggal_lahir: "1998-11-28" }, [
      { berat_badan: 55, tinggi_badan: 168, tekanan_darah_sistol: 110, tekanan_darah_diastol: 66, gula_darah: 98, z_score_bbu: null, status_pertumbuhan: null },
    ]);
    const res = await call();
    expect(res.statusCode).toBe(200);
    const d = res.body.data;
    expect(d.berat_badan_kg).toBe(55);
    expect(d.tinggi_badan_cm).toBe(168);
    expect(d.z_score_berlaku).toBe(false);
    expect(d.z_score_bb_u).toBeUndefined();
    expect(d.imt).toBeCloseTo(19.49, 1);
    expect(d.status_imt).toBe("Normal");
    expect(d.status_gizi).toBe("Normal");
    expect(d.tensi_darah).toBe("110/66");
  });

  it("Balita: z-score dikirim, z_score_berlaku=true, status dari Z-score", async () => {
    reset({ id: "a2", nama: "Anak", kategori: "balita", nik: "3579011205800001", tanggal_lahir: "2024-01-01" }, [
      { berat_badan: 12, tinggi_badan: 88, z_score_bbu: -2.5, z_score_tbu: -2.7, status_gizi: "kurang" },
    ]);
    const d = (await call()).body.data;
    expect(d.z_score_berlaku).toBe(true);
    expect(d.z_score_bb_u).toBe(-2.5);
    expect(d.z_score_tb_u).toBe(-2.7);
    expect(d.status_gizi).toBe("Gizi Kurang");
    expect(d.status_stunting).toBe("Stunting");
    expect(d.imt).toBeUndefined();
  });

  it("Ibu hamil: lila_cm + status_kek, status_gizi tidak berlaku", async () => {
    reset({ id: "a3", nama: "Bumil", kategori: "ibu_hamil", nik: "3579011205800005", tanggal_lahir: "1995-01-01" }, [
      { berat_badan: 60, tinggi_badan: 155, lingkar_lengan: 22, tekanan_darah_sistol: 120, tekanan_darah_diastol: 80 },
    ]);
    const d = (await call()).body.data;
    expect(d.lila_cm).toBe(22);
    expect(d.status_kek).toBe(true);
    expect(d.status_gizi).toBeUndefined();
    expect(d.z_score_berlaku).toBe(false);
  });

  it("autentikasi: key salah -> 401", async () => {
    reset({ id: "a1", nama: "X", kategori: "wus", nik: "3579012811980008" }, []);
    const req: any = { method: "GET", query: { nik: "3579012811980008" }, headers: { "x-ecosystem-key": "wrong" } };
    const res = mockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(401);
  });
});
