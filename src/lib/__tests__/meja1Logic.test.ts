import { describe, it, expect } from "vitest";
import {
  getSessionVisits,
  getAllSessionVisits,
  isAnggotaSasaran,
  getLatestVisitByAnggota,
  findExistingSessionVisit,
  filterSasaranBelumHadir,
  getStatusAntreanMeja1,
  isVisitInMejaStage,
  filterVisitsForMeja,
  isVisitPastMejaStage,
} from "@/lib/meja1Logic";

const sesiA = "sesi-A";
const sesiB = "sesi-B";

const visit = (id: string, anggotaId: string, jadwal: string, waktu = "2026-09-10T08:00:00Z") => ({
  id,
  anggota_id: anggotaId,
  jadwal_posyandu_id: jadwal,
  waktu_hadir: waktu,
});

describe("Meja 1 — logika sesi & sasaran", () => {
  it("getSessionVisits hanya mengembalikan kunjungan sesi aktif (gabung aktif + history)", () => {
    const all = [
      visit("v1", "a1", sesiA),
      visit("v2", "a2", sesiB),
      { id: "v3", anggota_id: "a3", jadwal_id: sesiA, waktu_hadir: "2026-09-10T09:00:00Z" },
    ];
    const hasil = getSessionVisits(all, sesiA);
    expect(hasil.map((v) => v.id).sort()).toEqual(["v1", "v3"]);
  });

  it("getAllSessionVisits menggabung active+history sesi aktif + dedup ID (M3-001)", () => {
    const aktif = [visit("v1", "a1", sesiA), visit("v2", "a2", sesiB)];
    const histori = [
      { id: "v3", anggota_id: "a3", jadwal_posyandu_id: sesiA, waktu_hadir: "2026-09-08T08:00:00Z" },
      { id: "v1", anggota_id: "a1", jadwal_posyandu_id: sesiA, waktu_hadir: "2026-09-08T08:00:00Z" },
    ];
    const hasil = getAllSessionVisits(aktif, histori, sesiA);
    expect(hasil.map((v) => v.id).sort()).toEqual(["v1", "v3"]);
    expect(getAllSessionVisits(aktif, histori, "")).toEqual([]);
    expect(getAllSessionVisits(aktif, histori, null)).toEqual([]);
  });

  it("getSessionVisits mengembalikan [] bila sesi kosong", () => {
    expect(getSessionVisits([visit("v1", "a1", sesiA)], "")).toEqual([]);
    expect(getSessionVisits([visit("v1", "a1", sesiA)], undefined)).toEqual([]);
  });

  it("isAnggotaSasaran menghormati set sasaran (umum & di luar target = false)", () => {
    const sasaran = new Set(["bayi", "balita", "ibu_hamil"]);
    expect(isAnggotaSasaran("bayi", sasaran)).toBe(true);
    expect(isAnggotaSasaran("ibu_hamil", sasaran)).toBe(true);
    expect(isAnggotaSasaran("umum", sasaran)).toBe(false);
    expect(isAnggotaSasaran("lansia", sasaran)).toBe(false);
  });

  it("getLatestVisitByAnggota memilih kunjungan dengan waktu hadir terbaru", () => {
    const all = [
      visit("v1", "a1", sesiA, "2026-09-01T08:00:00Z"),
      visit("v2", "a1", sesiA, "2026-09-10T08:00:00Z"),
      visit("v3", "a2", sesiA, "2026-09-10T08:00:00Z"),
    ];
    const map = getLatestVisitByAnggota(all);
    expect(map.get("a1")?.id).toBe("v2");
    expect(map.get("a2")?.id).toBe("v3");
  });

  it("findExistingSessionVisit mendeteksi duplikat per sesi, bukan lintas sesi", () => {
    const all = [visit("v1", "a1", sesiA)];
    expect(findExistingSessionVisit(all, "a1", sesiA)?.id).toBe("v1");
    // anggota sama tapi sesi beda -> belum check-in di sesi B
    expect(findExistingSessionVisit(all, "a1", sesiB)).toBeUndefined();
    // sesi kosong -> undefined
    expect(findExistingSessionVisit(all, "a1", "")).toBeUndefined();
  });

  it("filterSasaranBelumHadir: kategori di luar target disembunyikan; umum tampil bila masuk target", () => {
    const anggota = [
      { id: "a1", kategori: "bayi", status_aktif: true, nama: "Budi", nik: "123", keluarga_id: "k1" },
      { id: "a2", kategori: "lansia", status_aktif: true, nama: "Siti", nik: "456", keluarga_id: "k1" },
      { id: "a3", kategori: "umum", status_aktif: true, nama: "Tamu", nik: "789", keluarga_id: "k1" },
      { id: "a4", kategori: "balita", status_aktif: false, nama: "Nona", nik: "000", keluarga_id: "k1" },
    ];
    const kkById = new Map<string, string>([["k1", "3501"]]);
    const hadir = new Set(["a1"]); // Budi sudah hadir

    // Target tanpa umum: a3 umum tetap disembunyikan
    const tanpaUmum = new Set(["bayi", "balita", "ibu_hamil"]);
    expect(filterSasaranBelumHadir(anggota, tanpaUmum, hadir, "", kkById).map((a) => a.id)).toEqual([]);
    // Target mencakup umum (default sesi ILP): a3 bisa check-in
    const denganUmum = new Set(["bayi", "balita", "ibu_hamil", "umum"]);
    expect(filterSasaranBelumHadir(anggota, denganUmum, hadir, "", kkById).map((a) => a.id)).toEqual(["a3"]);
    // Pencarian nama tetap menemukan pasien umum
    expect(filterSasaranBelumHadir(anggota, denganUmum, hadir, "tamu", kkById).map((a) => a.id)).toEqual(["a3"]);
  });

  it("getStatusAntreanMeja1: selesai tanpa pengukuran tetap badge selesai (kasus Nadia Safitri)", () => {
    const selesaiTanpaUkur = {
      id: "v1",
      anggota_id: "a1",
      jadwal_posyandu_id: sesiA,
      status_alur: "selesai",
      pengukuran: {},
    };
    expect(getStatusAntreanMeja1(selesaiTanpaUkur)).toBe("selesai");

    const selesaiDenganUkur = {
      ...selesaiTanpaUkur,
      pengukuran: { berat_badan: 60 },
    };
    expect(getStatusAntreanMeja1(selesaiDenganUkur)).toBe("selesai");

    const ukurBelumSelesai = {
      id: "v2",
      anggota_id: "a2",
      jadwal_posyandu_id: sesiA,
      status_alur: "meja_3_pencatatan",
      pengukuran: { berat_badan: 12 },
    };
    expect(getStatusAntreanMeja1(ukurBelumSelesai)).toBe("meja2_selesai");

    const menunggu = {
      id: "v3",
      anggota_id: "a3",
      jadwal_posyandu_id: sesiA,
      status_alur: "meja_2_pengukuran",
      pengukuran: {},
    };
    expect(getStatusAntreanMeja1(menunggu)).toBe("menunggu_meja2");
    expect(getStatusAntreanMeja1(undefined)).toBe("menunggu_meja2");
  });

  it("isVisitInMejaStage: tiap meja hanya menerima tahapnya (F-05)", () => {
    const at = (status: string | null) => ({ id: "v", anggota_id: "a", jadwal_posyandu_id: sesiA, status_alur: status });
    expect(isVisitInMejaStage(at("meja_1_registrasi"), 2)).toBe(true);
    expect(isVisitInMejaStage(at("meja_2_pengukuran"), 2)).toBe(true);
    expect(isVisitInMejaStage(at("meja_3_pencatatan"), 2)).toBe(false);
    expect(isVisitInMejaStage(at("meja_4_pelayanan"), 2)).toBe(false);
    expect(isVisitInMejaStage(at("meja_5_penyuluhan"), 2)).toBe(false);
    expect(isVisitInMejaStage(at("meja_2_pengukuran"), 3)).toBe(true);
    expect(isVisitInMejaStage(at("meja_3_pencatatan"), 3)).toBe(true);
    expect(isVisitInMejaStage(at("meja_4_pelayanan"), 3)).toBe(false);
    expect(isVisitInMejaStage(at("meja_5_penyuluhan"), 3)).toBe(false);
    expect(isVisitInMejaStage(at("meja_3_pencatatan"), 4)).toBe(true);
    expect(isVisitInMejaStage(at("meja_4_pelayanan"), 4)).toBe(true);
    expect(isVisitInMejaStage(at("meja_5_penyuluhan"), 4)).toBe(false);
    // Status kosong/legacy tidak di-strand: tetap tampil agar diproses.
    expect(isVisitInMejaStage(at(null), 2)).toBe(true);
    expect(isVisitInMejaStage(at(null), 4)).toBe(true);
    expect(isVisitInMejaStage(undefined, 2)).toBe(false);
  });

  it("filterVisitsForMeja: meja_5 tidak muncul di antrean Meja 2-4; selesai hanya di Rekap/arsip", () => {
    const all = [
      { id: "v1", anggota_id: "a1", jadwal_posyandu_id: sesiA, status_alur: "meja_1_registrasi" },
      { id: "v2", anggota_id: "a2", jadwal_posyandu_id: sesiA, status_alur: "meja_3_pencatatan" },
      { id: "v3", anggota_id: "a3", jadwal_posyandu_id: sesiA, status_alur: "meja_5_penyuluhan" },
      { id: "v4", anggota_id: "a4", jadwal_posyandu_id: sesiA, status_alur: "selesai" },
      // Stage filter session-agnostic by design (filter sesi dilakukan upstream
      // via getAllSessionVisits); v5 sesi lain tetap lolos filter stage.
      { id: "v5", anggota_id: "a5", jadwal_posyandu_id: sesiB, status_alur: "meja_2_pengukuran" },
    ];
    expect(filterVisitsForMeja(all, 2).map((v) => v.id)).toEqual(["v1", "v5"]);
    expect(filterVisitsForMeja(all, 3).map((v) => v.id)).toEqual(["v2", "v5"]);
    expect(filterVisitsForMeja(all, 4).map((v) => v.id)).toEqual(["v2"]);
    expect(filterVisitsForMeja(all, 5).map((v) => v.id)).toEqual(["v3"]);
    expect(filterVisitsForMeja(undefined, 2)).toEqual([]);
  });

  it("isVisitPastMejaStage: hanya tahap lebih lanjut yang diblokir (guard detail)", () => {
    const at = (status: string | null) => ({ id: "v", anggota_id: "a", jadwal_posyandu_id: sesiA, status_alur: status });
    // Meja 2: meja_3+ diblokir; meja_1/meja_2 lolos ke guard prasyarat normal.
    expect(isVisitPastMejaStage(at("meja_1_registrasi"), 2)).toBe(false);
    expect(isVisitPastMejaStage(at("meja_2_pengukuran"), 2)).toBe(false);
    expect(isVisitPastMejaStage(at("meja_3_pencatatan"), 2)).toBe(true);
    expect(isVisitPastMejaStage(at("meja_5_penyuluhan"), 2)).toBe(true);
    // Meja 3: meja_4+ diblokir; tahap awal lolos.
    expect(isVisitPastMejaStage(at("meja_1_registrasi"), 3)).toBe(false);
    expect(isVisitPastMejaStage(at("meja_3_pencatatan"), 3)).toBe(false);
    expect(isVisitPastMejaStage(at("meja_4_pelayanan"), 3)).toBe(true);
    expect(isVisitPastMejaStage(at("meja_5_penyuluhan"), 3)).toBe(true);
    // Meja 4: hanya meja_5 diblokir.
    expect(isVisitPastMejaStage(at("meja_4_pelayanan"), 4)).toBe(false);
    expect(isVisitPastMejaStage(at("meja_5_penyuluhan"), 4)).toBe(true);
    // 'selesai' ditangani cabang finished tersendiri; status aneh tidak diblokir.
    expect(isVisitPastMejaStage(at("selesai"), 2)).toBe(false);
    expect(isVisitPastMejaStage(at(null), 3)).toBe(false);
    expect(isVisitPastMejaStage(at("status_tak_dikenal"), 4)).toBe(false);
    expect(isVisitPastMejaStage(undefined, 2)).toBe(false);
  });

  it("filterSasaranBelumHadir: pencarian via nama, NIK, dan Nomor KK", () => {
    const anggota = [
      { id: "a1", kategori: "bayi", status_aktif: true, nama: "Budi", nik: "123456", keluarga_id: "k1" },
      { id: "a2", kategori: "balita", status_aktif: true, nama: "Sari", nik: "654321", keluarga_id: "k2" },
    ];
    const kkById = new Map<string, string>([["k1", "350111"], ["k2", "350222"]]);
    const sasaran = new Set(["bayi", "balita", "ibu_hamil"]);

    expect(filterSasaranBelumHadir(anggota, sasaran, new Set(), "budi", kkById).map((a) => a.id)).toEqual(["a1"]);
    expect(filterSasaranBelumHadir(anggota, sasaran, new Set(), "654", kkById).map((a) => a.id)).toEqual(["a2"]);
    expect(filterSasaranBelumHadir(anggota, sasaran, new Set(), "350111", kkById).map((a) => a.id)).toEqual(["a1"]);
  });
});
