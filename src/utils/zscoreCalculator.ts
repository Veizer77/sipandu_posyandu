/**
 * SIPANDU - WHO 2006 Child Growth Standards & Clinical Calculation Engine
 * Porting 1:1 dari js/zscore-calculator.js (legacy) ke TypeScript.
 * Reference: Permenkes RI No. 2 Tahun 2020 & WHO Anthro Standards
 */

export interface LMSPoint {
  L: number;
  M: number;
  S: number;
}

type LMSTableRow = [number, number, number, number]; // [month, L, M, S]

export interface StatusInterpretasi {
  status: string;
  label: string;
  badge: string;
}

export interface UsiaInfo {
  years: number;
  months: number;
  days: number;
  totalBulan: number;
  hariLahir: string;
  usiaTeks: string;
}

export interface KlasifikasiSasaran {
  kode: string;
  label: string;
  layanan: string;
}

export interface AnalisisBalita {
  z_bbu: number | null;
  z_tbu: number | null;
  z_bbtb: number | null;
  status_bbu: StatusInterpretasi;
  status_tbu: StatusInterpretasi;
  status_bbtb: StatusInterpretasi;
  statusPertumbuhan: "naik" | "tidak_naik" | "data_baru";
  selisihBB: number;
  catatan?: string;
}

export interface RisikoKlinis {
  kode: string;
  judul: string;
  deskripsi: string;
  severity: "danger" | "warning" | "info";
  tindakLanjut: string;
}

export interface PengukuranInput {
  z_bbu?: number | null;
  z_tbu?: number | null;
  statusPertumbuhan?: string;
  td_sistolik?: string | number;
  td_diastolik?: string | number;
  lingkar_lengan?: string | number;
  gula_darah_sewaktu?: string | number;
  usiaMinggu?: number;
  // G2: tambahan untuk risiko lanjutan
  jenis_kelamin?: string;
  berat_badan?: string | number | null;
  tinggi_badan?: string | number | null;
  lingkar_perut?: string | number | null;
  prev_berat_badan?: number | null;
}

interface RiwayatInput {
  is2T?: boolean;
  prevStatus?: string;
  /** B5 (R-B09): ada imunisasi tertunggak? dihitung via jadwalImunisasi.ts */
  imunisasiTertunggak?: boolean;
}

const WHO_ENGINE = {
  // Approximate WHO 2006 LMS Table samples (every 3 months, with linear interpolation)
  // [Month, L, M, S] for Boys WFA (BB/U)
  wfaBoys: [
    [0, 0.3487, 3.346, 0.14602],
    [1, 0.2297, 4.471, 0.13395],
    [2, 0.1479, 5.573, 0.12427],
    [3, 0.0865, 6.412, 0.11714],
    [6, -0.0131, 7.934, 0.10656],
    [9, -0.0634, 8.874, 0.1026],
    [12, -0.0903, 9.615, 0.10115],
    [18, -0.119, 10.87, 0.10125],
    [24, -0.1384, 12.15, 0.10294],
    [36, -0.161, 14.34, 0.10842],
    [48, -0.1746, 16.33, 0.11504],
    [60, -0.1834, 18.34, 0.12196],
  ] as LMSTableRow[],

  // [Month, L, M, S] for Girls WFA (BB/U)
  wfaGirls: [
    [0, 0.3809, 3.232, 0.14171],
    [1, 0.2598, 4.187, 0.13289],
    [2, 0.1758, 5.128, 0.12461],
    [3, 0.1149, 5.845, 0.11867],
    [6, 0.0168, 7.297, 0.11005],
    [9, -0.0328, 8.199, 0.10707],
    [12, -0.0594, 8.949, 0.1066],
    [18, -0.0881, 10.23, 0.10852],
    [24, -0.1076, 11.53, 0.11181],
    [36, -0.1331, 13.86, 0.11974],
    [48, -0.1477, 16.07, 0.12836],
    [60, -0.1566, 18.21, 0.13708],
  ] as LMSTableRow[],

  // [Month, L, M, S] for Boys LHFA (TB/U)
  lhfaBoys: [
    [0, 1.0, 49.88, 0.03795],
    [1, 1.0, 54.72, 0.03558],
    [3, 1.0, 61.43, 0.03362],
    [6, 1.0, 67.62, 0.03264],
    [12, 1.0, 75.75, 0.0331],
    [24, 1.0, 87.12, 0.03577],
    [36, 1.0, 96.11, 0.03816],
    [48, 1.0, 103.3, 0.0402],
    [60, 1.0, 110.0, 0.0421],
  ] as LMSTableRow[],

  // [Month, L, M, S] for Girls LHFA (TB/U)
  lhfaGirls: [
    [0, 1.0, 49.14, 0.0379],
    [1, 1.0, 53.69, 0.03565],
    [3, 1.0, 59.84, 0.03397],
    [6, 1.0, 65.73, 0.03328],
    [12, 1.0, 74.02, 0.03437],
    [24, 1.0, 85.71, 0.03741],
    [36, 1.0, 95.1, 0.04005],
    [48, 1.0, 102.7, 0.0423],
    [60, 1.0, 109.4, 0.0443],
  ] as LMSTableRow[],

  // [Height/Length cm, L, M, S] for Boys WFH/WFL (BB/TB) WHO 2006
  wfhBoys: [
    [45, -0.3521, 2.435, 0.09038],
    [50, -0.3521, 3.344, 0.08862],
    [55, -0.3521, 4.542, 0.08638],
    [60, -0.3521, 5.922, 0.08412],
    [65, -0.3521, 7.348, 0.08221],
    [70, -0.3521, 8.681, 0.08092],
    [75, -0.3521, 9.873, 0.08027],
    [80, -0.3521, 10.957, 0.08022],
    [85, -0.3521, 12.000, 0.08064],
    [90, -0.3521, 13.064, 0.08154],
    [95, -0.3521, 14.195, 0.08298],
    [100, -0.3521, 15.419, 0.08499],
    [105, -0.3521, 16.757, 0.08754],
    [110, -0.3521, 18.237, 0.09058],
    [115, -0.3521, 19.900, 0.09400],
    [120, -0.3521, 21.800, 0.09750],
  ] as LMSTableRow[],

  // [Height/Length cm, L, M, S] for Girls WFH/WFL (BB/TB) WHO 2006
  wfhGirls: [
    [45, -0.3833, 2.408, 0.08892],
    [50, -0.3833, 3.238, 0.08745],
    [55, -0.3833, 4.319, 0.08552],
    [60, -0.3833, 5.578, 0.08355],
    [65, -0.3833, 6.938, 0.08197],
    [70, -0.3833, 8.247, 0.08099],
    [75, -0.3833, 9.434, 0.08061],
    [80, -0.3833, 10.518, 0.08082],
    [85, -0.3833, 11.564, 0.08154],
    [90, -0.3833, 12.632, 0.08277],
    [95, -0.3833, 13.782, 0.08453],
    [100, -0.3833, 15.044, 0.08688],
    [105, -0.3833, 16.442, 0.08985],
    [110, -0.3833, 18.000, 0.09340],
    [115, -0.3833, 19.750, 0.09730],
    [120, -0.3833, 21.750, 0.10150],
  ] as LMSTableRow[],

  // Minimum monthly weight gain required by KMS (Kemenkes RI) in kg
  getMinimumWeightGain(month: number): number {
    if (month <= 3) return 0.6;
    if (month <= 6) return 0.5;
    if (month <= 9) return 0.4;
    if (month <= 12) return 0.3;
    return 0.2; // 13 - 60 months
  },

  // Interpolate LMS from sparse table
  interpolateLMS(table: LMSTableRow[], xVal: number): LMSPoint {
    if (xVal <= table[0][0]) {
      return { L: table[0][1], M: table[0][2], S: table[0][3] };
    }
    const last = table[table.length - 1];
    if (xVal >= last[0]) {
      return { L: last[1], M: last[2], S: last[3] };
    }
    for (let i = 0; i < table.length - 1; i++) {
      const x0 = table[i][0];
      const x1 = table[i + 1][0];
      if (xVal >= x0 && xVal <= x1) {
        const factor = (xVal - x0) / (x1 - x0);
        return {
          L: table[i][1] + factor * (table[i + 1][1] - table[i][1]),
          M: table[i][2] + factor * (table[i + 1][2] - table[i][2]),
          S: table[i][3] + factor * (table[i + 1][3] - table[i][3]),
        };
      }
    }
    return { L: 1, M: 10, S: 0.1 };
  },

  // Calculate Z-Score using LMS Formula
  calculateZ(X: number | null | undefined, L: number, M: number, S: number): number | null {
    if (!X || !M || !S) return null;
    let z: number;
    if (Math.abs(L) < 0.0001) {
      z = Math.log(X / M) / S;
    } else {
      z = (Math.pow(X / M, L) - 1) / (L * S);
    }
    // WHO SD3/SD4 Cutoff adjustments
    if (z > 3) {
      z = 3 + (z - 3) * 0.8;
    } else if (z < -3) {
      z = -3 + (z + 3) * 0.8;
    }
    return parseFloat(z.toFixed(2));
  },

  // Age Calculator
  hitungUsia(tanggalLahirStr: string | null | undefined, tanggalAcuan: Date = new Date()): UsiaInfo | null {
    if (!tanggalLahirStr) return null;
    const dob = new Date(tanggalLahirStr);
    const ref = new Date(tanggalAcuan);
    if (isNaN(dob.getTime())) return null;

    let years = ref.getFullYear() - dob.getFullYear();
    let months = ref.getMonth() - dob.getMonth();
    let days = ref.getDate() - dob.getDate();

    if (days < 0) {
      months -= 1;
      const prevMonth = new Date(ref.getFullYear(), ref.getMonth(), 0);
      days += prevMonth.getDate();
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }

    const totalBulan = years * 12 + months;
    const hariIndo = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"][dob.getDay()];

    let usiaTeks = "";
    if (totalBulan < 12) {
      usiaTeks = `${totalBulan} Bulan`;
    } else if (totalBulan < 60) {
      usiaTeks = `${years} Tahun ${months} Bulan`;
    } else {
      usiaTeks = `${years} Tahun`;
    }

    return {
      years,
      months,
      days,
      totalBulan,
      hariLahir: hariIndo,
      usiaTeks,
    };
  },

  // Target Classification (Section 4 & 32.1)
  klasifikasiSasaran(
    usiaInfo: UsiaInfo | null,
    jenisKelamin: string,
    statusHamilAktif = false
  ): KlasifikasiSasaran {
    if (statusHamilAktif && jenisKelamin === "P") {
      return { kode: "ibu_hamil", label: "Ibu Hamil", layanan: "ANC, Tekanan Darah, Tablet Fe, Imunisasi TT" };
    }
    if (!usiaInfo) return { kode: "umum", label: "Umum", layanan: "Layanan Umum" };

    const { totalBulan } = usiaInfo;
    if (totalBulan < 12) {
      return { kode: "bayi", label: "Bayi (0–11 bln)", layanan: "Imunisasi Dasar, Penimbangan, Pemantauan ASI Eksklusif" };
    }
    if (totalBulan < 60) {
      return { kode: "balita", label: "Balita (12–59 bln)", layanan: "Penimbangan, Pengukuran TB, Vitamin A, PMT" };
    }
    if (jenisKelamin === "P" && totalBulan >= 180 && totalBulan <= 588) {
      return { kode: "wus", label: "WUS (15–49 th)", layanan: "Skrining Anemia, Pengukuran LILA, Tablet Tambah Darah" };
    }
    if (totalBulan >= 720) {
      return { kode: "lansia", label: "Lansia (≥60 th)", layanan: "Cek Tekanan Darah, Gula Darah, Skrining IMT, Lingkar Perut" };
    }
    return { kode: "umum", label: "Masyarakat Umum", layanan: "Penyuluhan Kesehatan Dasar" };
  },

  // Naegele's Rule: Calculate HPL and gestational weeks
  hitungHPL(hphtStr: string | null | undefined, refDate: Date = new Date()) {
    if (!hphtStr) return null;
    const hpht = new Date(hphtStr);
    if (isNaN(hpht.getTime())) return null;

    const hpl = new Date(hpht.getTime() + 280 * 24 * 60 * 60 * 1000);
    const now = new Date(refDate);
    const diffDays = Math.floor((now.getTime() - hpht.getTime()) / (24 * 60 * 60 * 1000));
    const usiaMinggu = Math.max(0, Math.floor(diffDays / 7));

    const options: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" };
    return {
      hplDate: hpl,
      hplFormatted: hpl.toLocaleDateString("id-ID", options),
      usiaMinggu,
      isNearTerm: usiaMinggu >= 37,
    };
  },

  // Median berat badan menurut usia (WHO 2006 weight-for-age), dalam kg.
  // Dipakai sebagai garis acuan "Median WHO" pada grafik tren pertumbuhan.
  medianBeratUsia(usiaBulan: number, jenisKelamin: string = "L"): number {
    const tableWFA = jenisKelamin === "L" ? this.wfaBoys : this.wfaGirls;
    return this.interpolateLMS(tableWFA, usiaBulan).M;
  },

  // Calculate full anthropometry analysis
  analisisBalita(
    usiaBulan: number,
    jenisKelamin: string,
    beratBadan: number,
    tinggiBadan: number | null,
    beratBulanLalu: number | null = null
  ): AnalisisBalita {
    if (usiaBulan > 60) {
      return {
        z_bbu: null,
        z_tbu: null,
        z_bbtb: null,
        status_bbu: { status: "none", label: "—", badge: "bg-gray-100 text-gray-700" },
        status_tbu: { status: "none", label: "—", badge: "bg-gray-100 text-gray-700" },
        status_bbtb: { status: "none", label: "—", badge: "bg-gray-100 text-gray-700" },
        statusPertumbuhan: "data_baru",
        selisihBB: 0,
        catatan: "Di luar rentang kalkulasi WHO (>60 bulan)",
      };
    }

    const tableWFA = jenisKelamin === "L" ? this.wfaBoys : this.wfaGirls;
    const tableLHFA = jenisKelamin === "L" ? this.lhfaBoys : this.lhfaGirls;

    const lmsBBU = this.interpolateLMS(tableWFA, usiaBulan);
    const z_bbu = this.calculateZ(beratBadan, lmsBBU.L, lmsBBU.M, lmsBBU.S);

    let z_tbu: number | null = null;
    if (tinggiBadan) {
      const lmsTBU = this.interpolateLMS(tableLHFA, usiaBulan);
      z_tbu = this.calculateZ(tinggiBadan, lmsTBU.L, lmsTBU.M, lmsTBU.S);
    }

    // BB/TB (Weight-for-Height/Length) WHO 2006 LMS Calculation
    let z_bbtb: number | null = null;
    if (beratBadan && tinggiBadan) {
      const tableWFH = jenisKelamin === "L" ? this.wfhBoys : this.wfhGirls;
      const lmsBBTB = this.interpolateLMS(tableWFH, tinggiBadan);
      z_bbtb = this.calculateZ(beratBadan, lmsBBTB.L, lmsBBTB.M, lmsBBTB.S);
    }

    // Interpretations
    const status_bbu = this.interpretasiBBU(z_bbu);
    const status_tbu = this.interpretasiTBU(z_tbu);
    const status_bbtb = this.interpretasiBBTB(z_bbtb);

    // Growth trajectory (Naik / T)
    let statusPertumbuhan: AnalisisBalita["statusPertumbuhan"] = "data_baru";
    let selisihBB = 0;
    if (beratBulanLalu !== null && beratBulanLalu !== undefined && beratBulanLalu > 0) {
      selisihBB = parseFloat((beratBadan - beratBulanLalu).toFixed(2));
      const minGain = this.getMinimumWeightGain(usiaBulan);
      if (selisihBB >= minGain) {
        statusPertumbuhan = "naik";
      } else {
        statusPertumbuhan = "tidak_naik"; // T
      }
    }

    return {
      z_bbu,
      z_tbu,
      z_bbtb,
      status_bbu,
      status_tbu,
      status_bbtb,
      statusPertumbuhan,
      selisihBB,
    };
  },

  interpretasiBBU(z: number | null): StatusInterpretasi {
    if (z === null) return { status: "none", label: "—", badge: "bg-gray-100 text-gray-700" };
    if (z < -3) return { status: "gizi_buruk", label: "Gizi Buruk", badge: "badge-status-buruk" };
    if (z < -2) return { status: "gizi_kurang", label: "Gizi Kurang", badge: "badge-status-kurang" };
    if (z <= 1) return { status: "normal", label: "Gizi Baik (Normal)", badge: "badge-status-baik" };
    return { status: "gizi_lebih", label: "Risiko Gizi Lebih", badge: "badge-status-lebih" };
  },

  interpretasiTBU(z: number | null): StatusInterpretasi {
    if (z === null) return { status: "none", label: "—", badge: "bg-gray-100 text-gray-700" };
    if (z < -3) return { status: "stunting_berat", label: "Sangat Pendek (Stunting Berat)", badge: "badge-status-buruk" };
    if (z < -2) return { status: "stunting", label: "Pendek (Stunting)", badge: "badge-status-kurang" };
    if (z <= 3) return { status: "normal", label: "Normal", badge: "badge-status-baik" };
    return { status: "tinggi", label: "Tinggi", badge: "badge-status-lebih" };
  },

  interpretasiBBTB(z: number | null): StatusInterpretasi {
    if (z === null) return { status: "none", label: "—", badge: "bg-gray-100 text-gray-700" };
    if (z < -3) return { status: "sangat_kurus", label: "Sangat Kurus (Wasting Berat)", badge: "badge-status-buruk" };
    if (z < -2) return { status: "kurus", label: "Kurus (Wasting)", badge: "badge-status-kurang" };
    if (z <= 1) return { status: "normal", label: "Normal", badge: "badge-status-baik" };
    if (z <= 2) return { status: "berisiko_lebih", label: "Berisiko Gizi Lebih", badge: "badge-status-kurang" };
    if (z <= 3) return { status: "lebih", label: "Gizi Lebih (Overweight)", badge: "badge-status-lebih" };
    return { status: "obesitas", label: "Obesitas", badge: "badge-status-buruk" };
  },

  // Risk Detection Engine (Section 7 & 31.2)
  deteksiRisiko(kategori: string, pengukuran: PengukuranInput, riwayat: RiwayatInput = {}): RisikoKlinis[] {
    const risiko: RisikoKlinis[] = [];

    if (kategori === "bayi" || kategori === "balita") {
      if (pengukuran.z_bbu !== null && pengukuran.z_bbu !== undefined && pengukuran.z_bbu < -3) {
        risiko.push({
          kode: "R-B03",
          judul: "Gizi Buruk (BB/U < -3 SD)",
          deskripsi: "Berat badan sangat kurang. Segera lakukan konsultasi dan rujukan ke Puskesmas Junrejo.",
          severity: "danger",
          tindakLanjut: "Rujukan Puskesmas & Konseling Bidan",
        });
      } else if (pengukuran.z_bbu !== null && pengukuran.z_bbu !== undefined && pengukuran.z_bbu < -2) {
        risiko.push({
          kode: "R-B04",
          judul: "Gizi Kurang (-3 s.d -2 SD)",
          deskripsi: "Balita berada di bawah garis normal. Prioritaskan pemberian makanan tambahan (PMT).",
          severity: "warning",
          tindakLanjut: "Pemberian Makanan Tambahan (PMT) & Pantau Rutin",
        });
      }

      if (pengukuran.z_tbu !== null && pengukuran.z_tbu !== undefined && pengukuran.z_tbu < -3) {
        risiko.push({
          kode: "R-B05",
          judul: "Stunting Berat (TB/U < -3 SD)",
          deskripsi: "Panjang/Tinggi badan balita sangat pendek dibanding standar usia.",
          severity: "danger",
          tindakLanjut: "Intervensi Khusus Stunting Desa",
        });
      } else if (pengukuran.z_tbu !== null && pengukuran.z_tbu !== undefined && pengukuran.z_tbu < -2) {
        risiko.push({
          kode: "R-B06",
          judul: "Stunting / Pendek (-3 s.d -2 SD)",
          deskripsi: "Tinggi badan di bawah standar normal.",
          severity: "warning",
          tindakLanjut: "Edukasi Gizi Keluarga & PMT Pemulihan",
        });
      }

      if (riwayat.is2T || (riwayat.prevStatus === "tidak_naik" && pengukuran.statusPertumbuhan === "tidak_naik")) {
        risiko.push({
          kode: "R-B02",
          judul: "2T (Tidak Naik 2 Bulan Berturut-turut)",
          deskripsi: "Berat badan tidak mengalami kenaikan selama 2 sesi posyandu berturut-turut.",
          severity: "danger",
          tindakLanjut: "Wajib Kunjungan Rumah Kader & Bidan",
        });
      } else if (pengukuran.statusPertumbuhan === "tidak_naik") {
        risiko.push({
          kode: "R-B01",
          judul: "Status T (BB Tidak Naik)",
          deskripsi: "Kenaikan BB di bawah ambang batas kenaikan minimum bulan ini.",
          severity: "warning",
          tindakLanjut: "Konseling pola makan dan pantau bulan depan",
        });
      }

      // R-B09: Imunisasi tertunggak (PRD Bab 10)
      if (riwayat.imunisasiTertunggak) {
        risiko.push({
          kode: "R-B09",
          judul: "Imunisasi Tertunggak",
          deskripsi: "Terdeteksi imunisasi dasar yang telah melewati batas usia pemberian namun belum diberikan.",
          severity: "warning",
          tindakLanjut: "Prioritaskan imunisasi bulan ini di Meja 4",
        });
      }
    }

    if (kategori === "ibu_hamil") {
      const sistolik = parseInt(String(pengukuran.td_sistolik || "0"));
      const diastolik = parseInt(String(pengukuran.td_diastolik || "0"));
      if (sistolik >= 140 || diastolik >= 90) {
        risiko.push({
          kode: "R-H01",
          judul: "Hipertensi Dalam Kehamilan",
          deskripsi: `Tekanan darah ${sistolik}/${diastolik} mmHg di atas batas aman 140/90 mmHg. Waspada preeklampsia.`,
          severity: "danger",
          tindakLanjut: "Rujukan Bidan Segera ke Puskesmas / Faskes",
        });
      }
      if (pengukuran.lingkar_lengan && parseFloat(String(pengukuran.lingkar_lengan)) < 23.5) {
        risiko.push({
          kode: "R-H02",
          judul: "KEK (Kurang Energi Kronik)",
          deskripsi: `LILA ${pengukuran.lingkar_lengan} cm (< 23,5 cm). Berisiko melahirkan bayi BBLR.`,
          severity: "warning",
          tindakLanjut: "Pemberian PMT Pemulihan Bumil & Tablet Fe",
        });
      }
      if (pengukuran.usiaMinggu !== undefined && pengukuran.usiaMinggu >= 37) {
        risiko.push({
          kode: "R-H05",
          judul: "Mendekati Hari Perkiraan Lahir (HPL)",
          deskripsi: `Usia kehamilan ${pengukuran.usiaMinggu} minggu. Persiapan persalinan di faskes.`,
          severity: "info",
          tindakLanjut: "Edukasi Tanda Bahaya Persalinan & Transportasi",
        });
      }

      // R-H03: kenaikan BB < 1 kg/bulan pada trimester 2-3 (PRD F-07)
      const bbSekarang = parseFloat(String(pengukuran.berat_badan || ""));
      if (
        pengukuran.usiaMinggu !== undefined &&
        pengukuran.usiaMinggu >= 13 &&
        pengukuran.prev_berat_badan != null &&
        !isNaN(bbSekarang) &&
        bbSekarang - pengukuran.prev_berat_badan < 1
      ) {
        risiko.push({
          kode: "R-H03",
          judul: "Kenaikan BB Kurang (Trimester 2-3)",
          deskripsi: `Kenaikan BB hanya ${(bbSekarang - pengukuran.prev_berat_badan).toFixed(1)} kg bulan ini (standar ≥ 1 kg/bulan pada trimester 2-3).`,
          severity: "warning",
          tindakLanjut: "Konseling gizi ibu hamil & pantau asupan",
        });
      }
    }

    if (kategori === "lansia") {
      const sistolik = parseInt(String(pengukuran.td_sistolik || "0"));
      const diastolik = parseInt(String(pengukuran.td_diastolik || "0"));
      if (sistolik >= 160 || diastolik >= 100) {
        risiko.push({
          kode: "R-L01",
          judul: "Hipertensi Grade 2 Lansia",
          deskripsi: `Tekanan darah ${sistolik}/${diastolik} mmHg. Risiko tinggi kardiovaskular.`,
          severity: "danger",
          tindakLanjut: "Rujukan ke Poli Lansia Puskesmas",
        });
      } else if (sistolik >= 140 || diastolik >= 90) {
        risiko.push({
          kode: "R-L02",
          judul: "Hipertensi Grade 1 Lansia",
          deskripsi: `Tekanan darah ${sistolik}/${diastolik} mmHg.`,
          severity: "warning",
          tindakLanjut: "Konseling diet rendah garam & olahraga teratur",
        });
      }

      if (pengukuran.gula_darah_sewaktu) {
        const gds = parseInt(String(pengukuran.gula_darah_sewaktu));
        if (gds >= 200) {
          risiko.push({
            kode: "R-L03",
            judul: "Hiperglikemia Lansia (GDS ≥ 200 mg/dL)",
            deskripsi: `Kadar gula darah sewaktu ${gds} mg/dL terindikasi Diabetes Melitus.`,
            severity: "danger",
            tindakLanjut: "Rujukan Pemeriksaan Lanjutan Puskesmas",
          });
        } else if (gds >= 140) {
          risiko.push({
            kode: "R-L04",
            judul: "Prediabetes Lansia (GDS 140-199 mg/dL)",
            deskripsi: `Kadar gula darah ${gds} mg/dL.`,
            severity: "warning",
            tindakLanjut: "Edukasi diet kurangi gula dan karbohidrat sederhana",
          });
        }
      }

      // R-L05: IMT > 30 → Obesitas (PRD F-07)
      const bbLansia = parseFloat(String(pengukuran.berat_badan || ""));
      const tbLansia = parseFloat(String(pengukuran.tinggi_badan || ""));
      if (!isNaN(bbLansia) && !isNaN(tbLansia) && tbLansia > 0) {
        const imt = bbLansia / Math.pow(tbLansia / 100, 2);
        if (imt > 30) {
          risiko.push({
            kode: "R-L05",
            judul: "Obesitas Lansia (IMT > 30)",
            deskripsi: `IMT ${imt.toFixed(1)} kg/m² di atas ambang obesitas.`,
            severity: "warning",
            tindakLanjut: "Konseling gizi & aktivitas fisik ringan",
          });
        }
      }

      // R-L06: Obesitas Sentral — lingkar perut P > 80 / L > 90 (PRD F-07)
      const lpLansia = parseFloat(String(pengukuran.lingkar_perut || ""));
      if (!isNaN(lpLansia) && pengukuran.jenis_kelamin) {
        const batas = pengukuran.jenis_kelamin === "P" ? 80 : 90;
        if (lpLansia > batas) {
          risiko.push({
            kode: "R-L06",
            judul: "Obesitas Sentral",
            deskripsi: `Lingkar perut ${lpLansia} cm (> ${batas} cm untuk ${pengukuran.jenis_kelamin === "P" ? "perempuan" : "laki-laki"}).`,
            severity: "warning",
            tindakLanjut: "Konseling aktivitas fisik & pola makan",
          });
        }
      }
    }

    return risiko;
  },

  /**
   * G1: Deteksi risiko level-SESI (PRD F-07 trigger "Tutup sesi posyandu"):
   * R-B07 absen 1 bulan, R-B08 absen 2 bulan berturut-turut, R-H04 ANC tidak rutin.
   * @param sesiTerbaru tanggal sesi yang baru ditutup (ISO date)
   * @param tanggalHadirTerakhir kunjungan terakhir anggota (ISO datetime | null)
   * @param tanggalHadirSesiSebelumnya kunjungan pada sesi sebelumnya (ISO datetime | null)
   */
  deteksiRisikoSesi(
    kategori: string,
    sesiTerbaru: string,
    tanggalHadirTerakhir: string | null,
    tanggalHadirSesiSebelumnya: string | null
  ): RisikoKlinis[] {
    const risiko: RisikoKlinis[] = [];
    const tSesi = new Date(sesiTerbaru).getTime();
    const tTerakhir = tanggalHadirTerakhir ? new Date(tanggalHadirTerakhir).getTime() : null;
    const tSebelumnya = tanggalHadirSesiSebelumnya ? new Date(tanggalHadirSesiSebelumnya).getTime() : null;
    const duaBulanMs = 60 * 24 * 60 * 60 * 1000;

    const hadirDiSesiIni = tTerakhir !== null && tSesi - tTerakhir < duaBulanMs / 2;
    const hadirDiSesiSebelumnya = tSebelumnya !== null && tSesi - tSebelumnya < duaBulanMs;

    if (kategori === "bayi" || kategori === "balita") {
      if (!hadirDiSesiIni && !hadirDiSesiSebelumnya) {
        risiko.push({
          kode: "R-B08",
          judul: "Absen 2 Bulan Berturut-turut",
          deskripsi: "Sasaran tidak hadir pada 2 sesi posyandu terakhir.",
          severity: "danger",
          tindakLanjut: "Kunjungan rumah wajib",
        });
      } else if (!hadirDiSesiIni) {
        risiko.push({
          kode: "R-B07",
          judul: "Absen 1 Bulan",
          deskripsi: "Sasaran tidak hadir pada sesi posyandu terakhir.",
          severity: "warning",
          tindakLanjut: "Reminder follow-up kehadiran",
        });
      }
    }

    if (kategori === "ibu_hamil" && (!tTerakhir || tSesi - tTerakhir >= duaBulanMs)) {
      risiko.push({
        kode: "R-H04",
        judul: "ANC Tidak Rutin",
        deskripsi: "Ibu hamil tidak memeriksakan kehamilan ≥ 2 bulan.",
        severity: "danger",
        tindakLanjut: "Follow-up aktif kunjungan ANC",
      });
    }

    return risiko;
  },
};

export default WHO_ENGINE;
export const calculateZScore = WHO_ENGINE.calculateZ;
export const analisisBalita = WHO_ENGINE.analisisBalita.bind(WHO_ENGINE);
export const deteksiRisiko = WHO_ENGINE.deteksiRisiko.bind(WHO_ENGINE);
export const deteksiRisikoSesi = WHO_ENGINE.deteksiRisikoSesi.bind(WHO_ENGINE);
export const hitungUsia = WHO_ENGINE.hitungUsia.bind(WHO_ENGINE);
export const klasifikasiSasaran = WHO_ENGINE.klasifikasiSasaran.bind(WHO_ENGINE);
export const hitungHPL = WHO_ENGINE.hitungHPL.bind(WHO_ENGINE);
export const medianBeratUsia = WHO_ENGINE.medianBeratUsia.bind(WHO_ENGINE);
export const interpretasiBBU = WHO_ENGINE.interpretasiBBU.bind(WHO_ENGINE);
export const interpretasiTBU = WHO_ENGINE.interpretasiTBU.bind(WHO_ENGINE);
export const interpretasiBBTB = WHO_ENGINE.interpretasiBBTB.bind(WHO_ENGINE);
export const getMinimumWeightGain = WHO_ENGINE.getMinimumWeightGain.bind(WHO_ENGINE);
