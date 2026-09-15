/**
 * REKAP-AUDIT — Test kalkulasi murni (src/lib/rekapLogic.ts).
 */
import { describe, it, expect } from "vitest";
import {
  SASARAN_GROUPS,
  buildAnggotaMap,
  presentMemberIds,
  labelStatusAlur,
  summarizeAntropometri,
  summarizePelayanan,
  summarizeMeja3,
  buildTutupChecklist,
  countSasaranGlobal,
  countSasaranHadir,
  buildFollowUpList,
  resolveSumberLaporan,
  labelSumberLaporan,
  ringkasSesiPeriode,
} from "@/lib/rekapLogic";

const agt = [
  { id: "a1", kategori: "balita", status_aktif: true, nama: "B1", keluarga_id: "k1" },
  { id: "a2", kategori: "balita", status_aktif: true, nama: "B2", keluarga_id: "k1" },
  { id: "a3", kategori: "balita", status_aktif: true, nama: "B3", keluarga_id: "k1" },
  { id: "a4", kategori: "ibu_hamil", status_aktif: true, nama: "H1", keluarga_id: "k1" },
  { id: "a5", kategori: "lansia", status_aktif: true, nama: "L1", keluarga_id: "k1" },
  { id: "a6", kategori: "umum", status_aktif: true, nama: "U1", keluarga_id: "k1" },
  { id: "a7", kategori: "balita", status_aktif: false, nama: "B0", keluarga_id: "k1" },
];
const byId = buildAnggotaMap(agt as any) as Map<string, any>;

describe("RK-008/RK-009 — antropometri hanya balita; z null bukan normal", () => {
  const visits = [
    { id: "v1", anggota_id: "a1", pengukuran: { berat_badan: 12, z_score_bbu: 0.2, z_score_tbu: 0.1 } },
    { id: "v2", anggota_id: "a2", pengukuran: { berat_badan: 9, z_score_bbu: -2.5, z_score_tbu: -2.4 } },
    // Terukur tetapi z belum tersedia -> Belum Dihitung, BUKAN Gizi Baik.
    { id: "v3", anggota_id: "a3", pengukuran: { berat_badan: 11 } },
    // Bumil & lansia diukur -> TIDAK masuk antropometri balita.
    { id: "v4", anggota_id: "a4", pengukuran: { berat_badan: 60, z_score_bbu: 0.5 } },
    { id: "v5", anggota_id: "a5", pengukuran: { berat_badan: 65, z_score_bbu: 1.0 } },
  ] as any;

  it("menghitung tepat", () => {
    const s = summarizeAntropometri(visits, byId);
    expect(s.diukur).toBe(3);
    expect(s.normal).toBe(1);
    expect(s.giziKurang).toBe(1);
    expect(s.stunting).toBe(1);
    expect(s.belumDihitung).toBe(1);
    expect(s.belumDiukur).toBe(0);
  });
});

describe("RK-010/RK-011 — imunisasi dosis + anak; boolean aman", () => {
  it("3 jenis pada 1 anak = 3 dosis 1 anak; boolean true tidak crash", () => {
    const visits = [
      { id: "v1", anggota_id: "a1", pelayanan: { imunisasi: ["BCG", "Polio 1", "HB-0"], vitamin_a: true } },
      { id: "v2", anggota_id: "a2", pelayanan: { imunisasi: true, imunisasi_jenis: "BCG", pmt: true } },
      { id: "v3", anggota_id: "a1", pelayanan: { imunisasi: false } },
    ] as any;
    const s = summarizePelayanan(visits, byId);
    expect(s.dosisCount).toBe(4);
    expect(s.anakCount).toBe(2);
    expect(s.vitA).toBe(1);
    expect(s.pmt).toBe(1);
  });
});

describe("RK-006/RK-007 — rujukan jujur tanpa fiksi", () => {
  it("kosong -> null (UI wajib tampil 'Tidak dicatat')", () => {
    const visits = [
      { id: "v1", anggota_id: "a1", pelayanan: { rujukan: true } },
      {
        id: "v2",
        anggota_id: "a2",
        pelayanan: { rujukan: true, rujukan_tujuan: "Puskesmas", rujukan_catatan: "Observasi lama" },
      },
    ] as any;
    const s = summarizePelayanan(visits, byId);
    expect(s.rujukanList).toHaveLength(2);
    expect(s.rujukanList[0].alasan).toBeNull();
    expect(s.rujukanList[0].tujuan).toBeNull();
    expect(s.rujukanList[1].alasan).toBe("Observasi lama");
    expect(s.rujukanList[1].tujuan).toBe("Puskesmas");
  });
});

describe("RK-031 — ringkasan Meja 3", () => {
  it("menghitung per jenis field", () => {
    const visits = [
      { id: "v1", anggota_id: "a1", catatan: { keluhan: "batuk", temuan: "", catatan_kader: "ok", catatan_bidan: "" } },
      { id: "v2", anggota_id: "a2", catatan: { temuan: "lesu" } },
      { id: "v3", anggota_id: "a3", catatan: {} },
    ] as any;
    const s = summarizeMeja3(visits);
    expect(s).toEqual({ keluhan: 1, temuan: 1, catatanKader: 1, catatanBidan: 0, adaCatatan: 2 });
  });
});

describe("RK-016 — checklist tutup sesi", () => {
  it("rinci per tahap + penyuluhan + verifikasi", () => {
    const visits = [
      { id: "v1", anggota_id: "a1", status_alur: "meja_2_pengukuran", status_verifikasi: "draft" },
      { id: "v2", anggota_id: "a2", status_alur: "meja_2_pengukuran", status_verifikasi: "valid" },
      { id: "v3", anggota_id: "a3", status_alur: "meja_5_penyuluhan", status_verifikasi: "diperiksa" },
      { id: "v4", anggota_id: "a4", status_alur: "selesai", status_verifikasi: "valid" },
    ] as any;
    const c = buildTutupChecklist(visits, 0);
    // meja_5 BUKAN incomplete: menunggu finalisasi saat tutup sesi.
    expect(c.totalBelumAlur).toBe(2);
    expect(c.menungguTutup).toBe(1);
    // selesai lama dihitung terpisah agar akuntansi modal lengkap.
    expect(c.sudahSelesai).toBe(1);
    expect(c.sudahSelesai + c.menungguTutup).toBe(2);
    expect(c.belumAlur.some((b) => b.stage === "meja_5_penyuluhan")).toBe(false);
    expect(c.tanpaPenyuluhan).toBe(true);
    expect(c.belumVerifikasi).toBe(2);
    expect(c.lengkap).toBe(false);
    expect(buildTutupChecklist([], 2).lengkap).toBe(true);
    // Hanya meja_5 + penyuluhan tercatat = siap difinalisasi.
    const siap = buildTutupChecklist(
      [{ id: "v9", anggota_id: "a9", status_alur: "meja_5_penyuluhan", status_verifikasi: "valid" }] as any,
      1
    );
    expect(siap.totalBelumAlur).toBe(0);
    expect(siap.menungguTutup).toBe(1);
    expect(siap.sudahSelesai).toBe(0);
    expect(siap.lengkap).toBe(true);
  });
});

describe("RK-014 — D/S global + hadir terpisah umum", () => {
  it("denominator seluruh non-umum aktif; umum dihitung terpisah", () => {
    expect(countSasaranGlobal(agt as any)).toBe(5);
    const r = countSasaranHadir(agt as any, new Set(["a1", "a4", "a6"]));
    expect(r).toEqual({ sasaran: 2, umum: 1 });
  });
});

describe("RK-028/RK-029/RK-030 — map & grup canonical", () => {
  it("alias legacy bumil masuk grup ibu_hamil", () => {
    const g = SASARAN_GROUPS.find((x) => x.key === "ibu_hamil")!;
    expect(g.match("bumil")).toBe(true);
    expect(g.match("wus")).toBe(false);
    const w = SASARAN_GROUPS.find((x) => x.key === "wus")!;
    expect(w.match("usia_produktif")).toBe(true);
    expect(presentMemberIds([{ anggota_id: "a1" }, { anggota_id: "a1" }] as any).size).toBe(1);
  });
});

describe("Label status alur cetak", () => {
  it("Meja 5 tampil benar; kosong/asing rapi", () => {
    expect(labelStatusAlur("selesai")).toBe("Selesai / arsip final");
    expect(labelStatusAlur("meja_5_penyuluhan")).toBe("Menunggu finalisasi sesi");
    expect(labelStatusAlur("meja_2_pengukuran")).toBe("Meja 2 (pengukuran)");
    expect(labelStatusAlur("")).toBe("Hadir");
    expect(labelStatusAlur(null)).toBe("Hadir");
  });
});

describe("Sumber data L-01 eksplisit (tanpa campur valid + draft)", () => {
  it("default terverifikasi bila ada data valid; override selalu menang", () => {
    expect(resolveSumberLaporan(5, 10, null)).toBe("terverifikasi");
    expect(resolveSumberLaporan(0, 10, null)).toBe("lapangan");
    expect(resolveSumberLaporan(0, 0, null)).toBe("lapangan");
    expect(resolveSumberLaporan(5, 10, "lapangan")).toBe("lapangan");
    expect(resolveSumberLaporan(0, 10, "terverifikasi")).toBe("terverifikasi");
  });

  it("label sumber memuat hitungan untuk badge dan header PDF", () => {
    expect(labelSumberLaporan("terverifikasi", 5, 10)).toBe("Terverifikasi (5 kunjungan)");
    expect(labelSumberLaporan("lapangan", 0, 10)).toBe("Lapangan / draft (10 kunjungan)");
  });
});

describe("Jejak sesi periode untuk header PDF", () => {
  const jadwal = [
    { tanggal: "2026-09-08" },
    { tanggal: "2026-09-20" },
    { tanggal: "2026-08-15" },
    { tanggal: null },
    null,
  ];
  it("hitung sesi + rentang dalam satu bulan; kosong bila tak ada", () => {
    expect(ringkasSesiPeriode(jadwal as any, 2026, 8)).toEqual({ jumlah: 2, rentang: "8 Sep – 20 Sep" });
    expect(ringkasSesiPeriode(jadwal as any, 2026, 7)).toEqual({ jumlah: 1, rentang: "15 Agu" });
    expect(ringkasSesiPeriode(jadwal as any, 2026, 6)).toEqual({ jumlah: 0, rentang: "—" });
    expect(ringkasSesiPeriode(null, 2026, 8)).toEqual({ jumlah: 0, rentang: "—" });
  });
});

describe("Follow-up absen", () => {
  it("hanya non-umum tak hadir; prioritas balita/bumil dulu", () => {
    const kel = new Map([["k1", { rt: "14", nama_kepala_keluarga: "KK" }]]);
    const list = buildFollowUpList(agt as any, kel as any, new Set(["a1"]));
    expect(list.map((f) => f.id).sort()).toEqual(["a2", "a3", "a4", "a5"]);
    expect(list[0].isPriority).toBe(true);
    expect(list.find((f) => f.id === "a5")?.tag).toBe("Absen Hari H");
  });
});
