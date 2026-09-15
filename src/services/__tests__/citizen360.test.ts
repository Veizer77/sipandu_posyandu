/**
 * SIPANDU - Test integrasi payload Citizen 360 (SINDUKSADATI)
 * Regression guard audit 2026-09-15:
 * - Z-score hanya berlaku bayi/balita; non-balita -> null + z_score_berlaku=false.
 * - Dewasa (wus/lansia/umum) -> status_gizi dari IMT/BMI.
 * - Bumil -> status_gizi null (indikator LILA/TD).
 * - tekanan_darah_terakhir dibaca dari td_sistolik/td_diastolik (bukan field fiktif).
 */
import { describe, it, expect } from "vitest";
import { SinduksadatiService } from "@/services/sinduksadatiService";

const build = (anggota: any, pengukuran: any = {}, pelayanan: any = {}, risiko: any[] = []) =>
  SinduksadatiService.formatCitizen360Payload(anggota, { pengukuran, pelayanan, risiko });

describe("formatCitizen360Payload — klasifikasi gizi per kategori", () => {
  it("balita: z-score & status gizi WHO dipertahankan", () => {
    const out = build(
      { id: "a1", nik: "3579011205800001", nama: "Anak Balita", kategori: "balita", sinduksadati_penduduk_id: null },
      { z_score_bbu: -2.5, z_score_tbu: -1.2, z_score_bbtb: -0.3, berat_badan: 12, tinggi_badan: 88, status_pertumbuhan: "naik" }
    );
    const k = out.indikator_kesehatan;
    expect(k.z_score_berlaku).toBe(true);
    expect(k.z_score_bbu).toBe(-2.5);
    expect(k.z_score_tbu).toBe(-1.2);
    expect(k.status_gizi).toBe("Gizi Kurang");
    expect(k.status_gizi_kode).toBe("gizi_kurang");
    expect(k.status_pertumbuhan).toBe("naik");
    expect(k.status_stunting).toBe("Normal");
  });

  it("balita stunting: TB/U < -2 -> Stunting", () => {
    const out = build(
      { id: "a1b", nik: "3579011205800002", nama: "Anak Stunting", kategori: "balita" },
      { z_score_bbu: -0.5, z_score_tbu: -2.8, berat_badan: 10, tinggi_badan: 80 }
    );
    expect(out.indikator_kesehatan.status_stunting).toBe("Stunting");
  });

  it("dewasa (wus): z-score null, status gizi dari IMT (underweight)", () => {
    const out = build(
      { id: "a2", nik: "3579012811980008", nama: "Dimas", kategori: "wus" },
      { berat_badan: 42, tinggi_badan: 163, tekanan_darah_sistol: 110, tekanan_darah_diastol: 66 }
    );
    const k = out.indikator_kesehatan;
    expect(k.z_score_berlaku).toBe(false);
    expect(k.z_score_bbu).toBeNull();
    expect(k.z_score_tbu).toBeNull();
    expect(k.z_score_bbtb).toBeNull();
    expect(k.status_pertumbuhan).toBeNull();
    expect(k.status_stunting).toBeNull();
    // IMT = 42 / 1.63^2 = 15.81 -> underweight
    expect(k.imt).toBeCloseTo(15.81, 1);
    expect(k.status_gizi).toBe("Underweight (Kurus)");
    expect(k.status_gizi_kode).toBe("underweight");
  });

  it("dewasa (lansia): status gizi overweight dari IMT", () => {
    const out = build(
      { id: "a3", nik: "3579011205800003", nama: "Mbah", kategori: "lansia" },
      { berat_badan: 68, tinggi_badan: 155 }
    );
    // IMT = 68 / 1.55^2 = 28.3 -> overweight (25–29.9)
    expect(out.indikator_kesehatan.status_gizi).toBe("Overweight (Berlebih)");
    expect(out.indikator_kesehatan.status_gizi_kode).toBe("overweight");
  });

  it("dewasa: IMT tersimpan dipakai bila ada (tanpa hitung ulang)", () => {
    const out = build(
      { id: "a4", nik: "3579011205800004", nama: "Dewasa", kategori: "wus" },
      { imt: 31.2, berat_badan: 80, tinggi_badan: 160 }
    );
    expect(out.indikator_kesehatan.imt).toBe(31.2);
    expect(out.indikator_kesehatan.status_gizi).toBe("Obesitas");
  });

  it("ibu hamil: status_gizi & z-score null; LILA + KEK dihitung", () => {
    const out = build(
      { id: "a5", nik: "3579011205800005", nama: "Bumil", kategori: "ibu_hamil" },
      { berat_badan: 55, tinggi_badan: 155, lingkar_lengan: 22, tekanan_darah_sistol: 120, tekanan_darah_diastol: 80 }
    );
    const k = out.indikator_kesehatan;
    expect(k.status_gizi).toBeNull();
    expect(k.z_score_bbu).toBeNull();
    expect(k.z_score_berlaku).toBe(false);
    expect(k.lila_cm).toBe(22);
    expect(k.status_kek).toBe(true); // LILA < 23.5
    expect(k.imt).toBeNull(); // IMT tidak diset untuk bumil
  });

  it("tekanan darah dibaca dari td_sistolik/td_diastolik -> format 'S/D'", () => {
    const out = build(
      { id: "a6", nik: "3579011205800006", nama: "Warga", kategori: "wus" },
      { td_sistolik: 130, td_diastolik: 85 }
    );
    expect(out.indikator_kesehatan.tekanan_darah_terakhir).toBe("130/85");
  });

  it("tekanan darah: kosong -> null (bukan string palsu)", () => {
    const out = build({ id: "a7", nik: "3579011205800007", nama: "Warga", kategori: "wus" }, {});
    expect(out.indikator_kesehatan.tekanan_darah_terakhir).toBeNull();
  });

  it("status_risiko dinormalisasi dari objek ke kode", () => {
    const out = build(
      { id: "a8", nik: "3579011205800008", nama: "Warga", kategori: "wus" },
      {},
      {},
      [{ kode_risiko: "R-B03", deskripsi: "Gizi buruk" }, "legacy-string"]
    );
    expect(out.indikator_kesehatan.status_risiko).toEqual(["R-B03", "legacy-string"]);
  });

  it("penduduk_id fallback sintetik bila linking kosong", () => {
    const out = build({ id: "abc-123", nik: "3579011205800009", nama: "Warga", kategori: "wus" });
    expect(out.indikator_kesehatan.kategori_sasaran).toBe("wus");
    expect(out.penduduk_id).toBe("sdti-pdk-abc-123");
  });

  it("NIK dimasking dengan benar", () => {
    const out = build({ id: "a9", nik: "3579012811980008", nama: "Warga", kategori: "wus" });
    expect(out.nik_masked).toBe("357901******0008");
  });
});
