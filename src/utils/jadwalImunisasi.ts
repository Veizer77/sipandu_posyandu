/**
 * SIPANDU - Modul Jadwal Imunisasi Dasar (PRD Bab 10)
 * Status per jenis: Belum / Sudah / Terlambat.
 * "Terlambat" = usia saat ini > batas atas usia imunisasi dan belum diberikan.
 */

export interface ImunisasiJenis {
  id: string;
  label: string;
  /** usia minimum pemberian dalam bulan */
  usiaMin: number;
  /** batas atas usia pemberian dalam bulan (di luar ini = Terlambat bila belum diberikan) */
  usiaMax: number;
  keterangan?: string;
}

/** Jadwal Imunisasi Dasar — Permenkes RI No. 12 Tahun 2017 */
export const JADWAL_IMUNISASI: ImunisasiJenis[] = [
  { id: "HB-0", label: "HB-0 (Hepatitis B-0)", usiaMin: 0, usiaMax: 1, keterangan: "0–24 jam / sebelum 1 bulan" },
  { id: "BCG", label: "BCG", usiaMin: 1, usiaMax: 3, keterangan: "1 bulan" },
  { id: "Polio 1", label: "Polio 1", usiaMin: 1, usiaMax: 3, keterangan: "1 bulan" },
  { id: "DPT-HB-Hib 1", label: "DPT-HB-Hib 1", usiaMin: 2, usiaMax: 4, keterangan: "2 bulan" },
  { id: "Polio 2", label: "Polio 2", usiaMin: 2, usiaMax: 4, keterangan: "2 bulan" },
  { id: "DPT-HB-Hib 2", label: "DPT-HB-Hib 2", usiaMin: 3, usiaMax: 5, keterangan: "3 bulan" },
  { id: "Polio 3", label: "Polio 3", usiaMin: 3, usiaMax: 5, keterangan: "3 bulan" },
  { id: "DPT-HB-Hib 3", label: "DPT-HB-Hib 3", usiaMin: 4, usiaMax: 6, keterangan: "4 bulan" },
  { id: "Polio 4", label: "Polio 4", usiaMin: 4, usiaMax: 6, keterangan: "4 bulan" },
  { id: "IPV", label: "IPV", usiaMin: 4, usiaMax: 6, keterangan: "4 bulan" },
  { id: "MR 1", label: "MR 1 (Campak-Rubella)", usiaMin: 9, usiaMax: 12, keterangan: "9 bulan" },
  { id: "DPT-HB-Hib 4", label: "DPT-HB-Hib 4 (Booster)", usiaMin: 18, usiaMax: 24, keterangan: "18 bulan" },
  { id: "MR 2", label: "MR 2", usiaMin: 18, usiaMax: 24, keterangan: "18 bulan" },
];

export type StatusImunisasi = "sudah" | "terlambat" | "jatuh_tempo" | "belum";

export interface ImunisasiStatusItem {
  jenis: ImunisasiJenis;
  status: StatusImunisasi;
  tanggalDiberikan?: string | null;
}

/**
 * Hitung status imunisasi satu anggota.
 * @param totalBulan usia anggota sekarang (bulan)
 * @param diberikan list jenis id yang sudah diberikan (dari tabel imunisasi / pelayanan)
 */
export function statusImunisasi(
  totalBulan: number,
  diberikan: string[] = []
): ImunisasiStatusItem[] {
  const sudahSet = new Set(diberikan);
  return JADWAL_IMUNISASI.map((jenis) => {
    if (sudahSet.has(jenis.id)) {
      return { jenis, status: "sudah" as StatusImunisasi, tanggalDiberikan: null };
    }
    if (totalBulan > jenis.usiaMax) {
      return { jenis, status: "terlambat" as StatusImunisasi };
    }
    if (totalBulan >= jenis.usiaMin) {
      return { jenis, status: "jatuh_tempo" as StatusImunisasi };
    }
    return { jenis, status: "belum" as StatusImunisasi };
  });
}

/** Jenis imunisasi yang "seharusnya diberikan bulan ini" berdasarkan usia */
export function jatuhTempoBulanIni(totalBulan: number, diberikan: string[] = []): ImunisasiJenis[] {
  return statusImunisasi(totalBulan, diberikan)
    .filter((s) => s.status === "jatuh_tempo" || s.status === "terlambat")
    .map((s) => s.jenis);
}

/** Apakah ada imunisasi tertunggak (R-B09) */
export function adaImunisasiTertunggak(totalBulan: number, diberikan: string[] = []): boolean {
  return statusImunisasi(totalBulan, diberikan).some((s) => s.status === "terlambat");
}
