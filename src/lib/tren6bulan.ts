/**
 * SIPANDU - Agregasi tren pertumbuhan 6 bulan (riil, tanpa hardcode).
 * Mengambil rata-rata BB/U balita per bulan dari kunjungan yang tersimpan.
 * Bulan tanpa histori ditandai `isIlustrasi` agar UI menampilkan badge "Ilustrasi".
 */
import { hitungUsia, medianBeratUsia } from "@/utils/zscoreCalculator";

export interface TrenBulan {
  /** Label singkat, mis. "Jan" */
  bulan: string;
  /** Rata-rata berat badan balita (kg) pada bulan tersebut; null = tidak ada data */
  riil: number | null;
  /** Median berat badan WHO untuk usia rata-rata kohort (kg) */
  who: number;
  /** true bila riil kosong -> titik ini murni ilustrasi acuan, bukan data riil */
  isIlustrasi: boolean;
  /** Jumlah balita yang diukur pada bulan tersebut */
  jumlahSampel: number;
}

const BULAN_SINGKAT = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

export function buildTren6Bulan(
  visits: any[],
  anggota: any[],
  refDate: Date = new Date()
): TrenBulan[] {
  const balitaIds = new Set(
    anggota
      .filter((a: any) => a.status_aktif && (a.kategori === "balita" || a.kategori === "bayi"))
      .map((a: any) => a.id)
  );

  const result: TrenBulan[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(refDate.getFullYear(), refDate.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth();
    const label = BULAN_SINGKAT[m];

    let sum = 0;
    let count = 0;
    let usiaSum = 0;
    let usiaCount = 0;

    for (const v of visits) {
      if (!balitaIds.has(v.anggota_id)) continue;
      const t = v.waktu_hadir ? new Date(v.waktu_hadir) : null;
      if (!t || isNaN(t.getTime())) continue;
      if (t.getFullYear() !== y || t.getMonth() !== m) continue;
      const bb = v?.pengukuran?.berat_badan;
      if (typeof bb !== "number" || isNaN(bb)) continue;

      sum += bb;
      count++;

      const anggotaRow = anggota.find((a: any) => a.id === v.anggota_id);
      if (anggotaRow?.tanggal_lahir) {
        const usia = hitungUsia(anggotaRow.tanggal_lahir, t);
        if (usia) {
          usiaSum += usia.totalBulan;
          usiaCount++;
        }
      }
    }

    const riil = count > 0 ? parseFloat((sum / count).toFixed(2)) : null;
    const avgUsia = usiaCount > 0 ? usiaSum / usiaCount : 12;
    const who = parseFloat(medianBeratUsia(Math.max(0, Math.min(60, Math.round(avgUsia))), "L").toFixed(2));

    result.push({
      bulan: label,
      riil,
      who,
      isIlustrasi: riil === null,
      jumlahSampel: count,
    });
  }

  return result;
}

/** True bila seluruh titik tren adalah ilustrasi (tidak ada data kunjungan). */
export function semuaIlustrasi(tren: TrenBulan[]): boolean {
  return tren.every((t) => t.isIlustrasi);
}

export interface TrenPersenBulan {
  bulan: string;
  /** Persentase riil (bulan berjalan); null = tidak ada histori */
  pct: number | null;
  isIlustrasi: boolean;
}

/**
 * Tren persentase 6 bulan (mis. D/S kehadiran, serapan APBDes).
 * Hanya bulan berjalan diisi data riil; 5 bulan sebelumnya ditandai ilustrasi
 * karena histori bulanan belum terekam di sistem.
 */
export function buildTrenPersen6Bulan(
  currentPct: number,
  refDate: Date = new Date()
): TrenPersenBulan[] {
  const result: TrenPersenBulan[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(refDate.getFullYear(), refDate.getMonth() - i, 1);
    const isCurrent = i === 0;
    result.push({
      bulan: BULAN_SINGKAT[d.getMonth()],
      pct: isCurrent ? currentPct : null,
      isIlustrasi: !isCurrent,
    });
  }
  return result;
}
