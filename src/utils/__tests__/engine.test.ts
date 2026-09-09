/**
 * M1 — Unit test engine klinis (PRD Bab 11, 10, F-07)
 * Import relatif agar tanpa konfigurasi alias vitest.
 */
import { describe, it, expect } from "vitest";
import WHO_ENGINE from "../zscoreCalculator";
import { statusImunisasi, adaImunisasiTertunggak, jatuhTempoBulanIni } from "../jadwalImunisasi";

describe("WHO_ENGINE.calculateZ (LMS)", () => {
  it("z-score median = 0", () => {
    const z = WHO_ENGINE.calculateZ(9.615, -0.0903, 9.615, 0.10115);
    expect(Math.abs(z as number)).toBeLessThan(0.01);
  });

  it("z-score negatif untuk BB di bawah median", () => {
    const z = WHO_ENGINE.calculateZ(7.5, -0.0903, 9.615, 0.10115);
    expect(z).toBeLessThan(0);
  });

  it("X=0 atau kosong -> null", () => {
    expect(WHO_ENGINE.calculateZ(0, 1, 10, 0.1)).toBeNull();
    expect(WHO_ENGINE.calculateZ(null, 1, 10, 0.1)).toBeNull();
  });

  it("cutoff ekstrem ditekan (z > 3 dikompresi)", () => {
    const z = WHO_ENGINE.calculateZ(30, -0.0903, 9.615, 0.10115);
    expect(z as number).toBeLessThan(10);
  });
});

describe("WHO_ENGINE.hitungUsia", () => {
  it("usia 0 bulan untuk bayi baru lahir", () => {
    const now = new Date();
    const info = WHO_ENGINE.hitungUsia(now.toISOString().split("T")[0], now);
    expect(info?.totalBulan).toBe(0);
  });

  it("usia 12 bulan", () => {
    const ref = new Date(2026, 8, 6);
    const info = WHO_ENGINE.hitungUsia("2025-09-06", ref);
    expect(info?.totalBulan).toBe(12);
    expect(info?.usiaTeks).toContain("1 Tahun");
  });

  it("tanggal invalid -> null", () => {
    expect(WHO_ENGINE.hitungUsia("bukan-tanggal")).toBeNull();
    expect(WHO_ENGINE.hitungUsia(null)).toBeNull();
  });
});

describe("WHO_ENGINE.klasifikasiSasaran (PRD F-04)", () => {
  const usia = (totalBulan: number) =>
    WHO_ENGINE.hitungUsia(
      new Date(new Date(2026, 8, 6).getTime() - totalBulan * 30.4375 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      new Date(2026, 8, 6)
    );

  it("ibu hamil prioritas tertinggi", () => {
    const k = WHO_ENGINE.klasifikasiSasaran(usia(300), "P", true);
    expect(k.kode).toBe("ibu_hamil");
  });

  it("0-11 bulan = bayi", () => {
    expect(WHO_ENGINE.klasifikasiSasaran(usia(6), "L", false).kode).toBe("bayi");
  });

  it("12-59 bulan = balita", () => {
    expect(WHO_ENGINE.klasifikasiSasaran(usia(24), "L", false).kode).toBe("balita");
  });

  it("WUS perempuan 15-49 th tidak hamil", () => {
    expect(WHO_ENGINE.klasifikasiSasaran(usia(300), "P", false).kode).toBe("wus");
  });

  it(">=60 th = lansia", () => {
    expect(WHO_ENGINE.klasifikasiSasaran(usia(780), "L", false).kode).toBe("lansia");
  });

  it("laki-laki dewasa = umum", () => {
    expect(WHO_ENGINE.klasifikasiSasaran(usia(300), "L", false).kode).toBe("umum");
  });
});

describe("WHO_ENGINE.hitungHPL (Naegele, PRD F-03.3)", () => {
  it("HPL = HPHT + 280 hari, usia minggu konsisten", () => {
    const ref = new Date(2026, 8, 6);
    const hpl = WHO_ENGINE.hitungHPL("2026-06-08", ref);
    expect(hpl).not.toBeNull();
    expect(hpl?.usiaMinggu).toBe(12);
    expect(hpl?.isNearTerm).toBe(false);
  });

  it("usia >= 37 minggu -> isNearTerm", () => {
    const hpl = WHO_ENGINE.hitungHPL("2025-12-15", new Date(2026, 8, 6));
    expect(hpl?.isNearTerm).toBe(true);
  });
});

describe("WHO_ENGINE.analisisBalita (PRD Bab 11)", () => {
  it("balita 24 bln laki-laki 12 kg / 87 cm -> status normal", () => {
    const a = WHO_ENGINE.analisisBalita(24, "L", 12.15, 87.1);
    expect(a.status_bbu.status).toBe("normal");
    expect(a.status_tbu.status).toBe("normal");
  });

  it("BB sangat rendah -> gizi buruk", () => {
    const a = WHO_ENGINE.analisisBalita(24, "L", 6.0, 87.1);
    expect(a.status_bbu.status).toBe("gizi_buruk");
  });

  it("TB sangat rendah -> stunting berat", () => {
    const a = WHO_ENGINE.analisisBalita(24, "L", 12.0, 70.0);
    expect(a.status_tbu.status).toBe("stunting_berat");
  });

  it("naik BB memenuhi minimum -> naik; tidak -> tidak_naik", () => {
    const naik = WHO_ENGINE.analisisBalita(5, "L", 7.5, 65.0, 7.0);
    expect(naik.statusPertumbuhan).toBe("naik");
    const tidak = WHO_ENGINE.analisisBalita(5, "L", 7.1, 65.0, 7.0);
    expect(tidak.statusPertumbuhan).toBe("tidak_naik");
  });

  it("> 60 bulan di luar rentang WHO", () => {
    const a = WHO_ENGINE.analisisBalita(72, "L", 20, 110);
    expect(a.z_bbu).toBeNull();
  });
});

describe("WHO_ENGINE.deteksiRisiko (PRD F-07)", () => {
  it("bumil TD 150/95 -> R-H01", () => {
    const r = WHO_ENGINE.deteksiRisiko("ibu_hamil", { td_sistolik: "150", td_diastolik: "95" });
    expect(r.some((x) => x.kode === "R-H01")).toBe(true);
  });

  it("bumil LILA 22 -> R-H02 KEK", () => {
    const r = WHO_ENGINE.deteksiRisiko("ibu_hamil", { lingkar_lengan: "22" });
    expect(r.some((x) => x.kode === "R-H02")).toBe(true);
  });

  it("lansia GDS 220 -> R-L03", () => {
    const r = WHO_ENGINE.deteksiRisiko("lansia", { gula_darah_sewaktu: "220" });
    expect(r.some((x) => x.kode === "R-L03")).toBe(true);
  });

  it("lansia IMT > 30 -> R-L05 (G2)", () => {
    const r = WHO_ENGINE.deteksiRisiko("lansia", { berat_badan: "95", tinggi_badan: "160" });
    expect(r.some((x) => x.kode === "R-L05")).toBe(true);
  });

  it("lansia lingkar perut 92 cm laki-laki -> R-L06 (G2)", () => {
    const r = WHO_ENGINE.deteksiRisiko("lansia", { lingkar_perut: "92", jenis_kelamin: "L" });
    expect(r.some((x) => x.kode === "R-L06")).toBe(true);
  });

  it("bumil trimester 2 BB naik 0.4 kg -> R-H03 (G2)", () => {
    const r = WHO_ENGINE.deteksiRisiko("ibu_hamil", {
      usiaMinggu: 20,
      berat_badan: "60.4",
      prev_berat_badan: 60,
    });
    expect(r.some((x) => x.kode === "R-H03")).toBe(true);
  });
});

describe("WHO_ENGINE.deteksiRisikoSesi (G1: R-B07/B08, R-H04)", () => {
  const sesi = new Date(2026, 8, 6).toISOString();

  it("absen 1 sesi -> R-B07", () => {
    // hadir sesi sebelumnya (36 hari lalu), absen sesi ini
    const t = new Date(2026, 7, 1).toISOString();
    const r = WHO_ENGINE.deteksiRisikoSesi("balita", sesi, t, t);
    expect(r.some((x) => x.kode === "R-B07")).toBe(true);
    expect(r.some((x) => x.kode === "R-B08")).toBe(false);
  });

  it("absen 2 sesi -> R-B08", () => {
    const r = WHO_ENGINE.deteksiRisikoSesi("balita", sesi, null, null);
    expect(r.some((x) => x.kode === "R-B08")).toBe(true);
  });

  it("bumil ANC > 2 bulan -> R-H04", () => {
    const r = WHO_ENGINE.deteksiRisikoSesi("ibu_hamil", sesi, new Date(2026, 4, 6).toISOString(), null);
    expect(r.some((x) => x.kode === "R-H04")).toBe(true);
  });
});

describe("jadwalImunisasi (PRD Bab 10)", () => {
  it("bayi 2 bln belum imunisasi: HB-0 terlambat, BCG jatuh tempo, MR belum", () => {
    const s = statusImunisasi(2, []);
    expect(s.find((x) => x.jenis.id === "HB-0")?.status).toBe("terlambat");
    expect(s.find((x) => x.jenis.id === "BCG")?.status).toBe("jatuh_tempo");
    expect(s.find((x) => x.jenis.id === "DPT-HB-Hib 1")?.status).toBe("jatuh_tempo");
    expect(s.find((x) => x.jenis.id === "MR 1")?.status).toBe("belum");
  });

  it("sudah diberikan = sudah", () => {
    const s = statusImunisasi(2, ["HB-0", "BCG"]);
    expect(s.find((x) => x.jenis.id === "HB-0")?.status).toBe("sudah");
  });

  it("adaImunisasiTertunggak & jatuhTempoBulanIni", () => {
    expect(adaImunisasiTertunggak(2, [])).toBe(true);
    expect(adaImunisasiTertunggak(2, ["HB-0", "BCG", "Polio 1"])).toBe(false);
    expect(jatuhTempoBulanIni(2, []).length).toBeGreaterThan(0);
  });
});
