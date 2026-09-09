// src/lib/landingZscoreCalc.ts
/**
 * WHO 2006 Child Growth Standards Calculator (LMS Method)
 * Formula: Z = (((X/M)^L) - 1) / (L*S)
 * With SD23 adjustment when |Z| > 3
 */
import { analisisBalita } from "@/utils/zscoreCalculator";

interface LMSParams {
  L: number;
  M: number;
  S: number;
}

// WHO 2006 Weight-for-Age (BB/U) reference samples for Boys & Girls (0 - 60 mo)
const WHO_BBU_BOYS: Record<number, LMSParams> = {
  0: { L: 0.3487, M: 3.346, S: 0.14602 },
  1: { L: 0.1481, M: 4.471, S: 0.14085 },
  2: { L: -0.0152, M: 5.567, S: 0.13401 },
  3: { L: -0.1423, M: 6.388, S: 0.12879 },
  4: { L: -0.2372, M: 7.025, S: 0.1251 },
  5: { L: -0.3061, M: 7.538, S: 0.1226 },
  6: { L: -0.3547, M: 7.945, S: 0.1209 },
  9: { L: -0.4284, M: 8.875, S: 0.1179 },
  12: { L: -0.4496, M: 9.615, S: 0.1166 },
  18: { L: -0.4431, M: 10.92, S: 0.1158 },
  24: { L: -0.4227, M: 12.15, S: 0.1161 },
  36: { L: -0.3752, M: 14.34, S: 0.1183 },
  48: { L: -0.3341, M: 16.33, S: 0.1215 },
  60: { L: -0.2981, M: 18.30, S: 0.1252 },
};

const WHO_BBU_GIRLS: Record<number, LMSParams> = {
  0: { L: 0.3809, M: 3.232, S: 0.14171 },
  1: { L: 0.1983, M: 4.187, S: 0.13848 },
  2: { L: 0.0468, M: 5.128, S: 0.13264 },
  3: { L: -0.0709, M: 5.848, S: 0.12781 },
  4: { L: -0.1585, M: 6.424, S: 0.12423 },
  5: { L: -0.2223, M: 6.899, S: 0.12173 },
  6: { L: -0.2678, M: 7.297, S: 0.12005 },
  9: { L: -0.3387, M: 8.213, S: 0.11728 },
  12: { L: -0.3621, M: 8.948, S: 0.11614 },
  18: { L: -0.3644, M: 10.24, S: 0.11566 },
  24: { L: -0.3541, M: 11.48, S: 0.11624 },
  36: { L: -0.3276, M: 13.85, S: 0.11899 },
  48: { L: -0.3012, M: 16.07, S: 0.12262 },
  60: { L: -0.2764, M: 18.24, S: 0.12689 },
};

function getInterpolatedLMS(ageMonths: number, gender: 'L' | 'P', table: Record<number, LMSParams>): LMSParams {
  const keys = Object.keys(table).map(Number).sort((a, b) => a - b);
  if (ageMonths <= keys[0]) return table[keys[0]];
  if (ageMonths >= keys[keys.length - 1]) return table[keys[keys.length - 1]];

  let lower = keys[0];
  let upper = keys[keys.length - 1];

  for (let i = 0; i < keys.length - 1; i++) {
    if (ageMonths >= keys[i] && ageMonths <= keys[i + 1]) {
      lower = keys[i];
      upper = keys[i + 1];
      break;
    }
  }

  const factor = (ageMonths - lower) / (upper - lower);
  const lmsLower = table[lower];
  const lmsUpper = table[upper];

  return {
    L: lmsLower.L + factor * (lmsUpper.L - lmsLower.L),
    M: lmsLower.M + factor * (lmsUpper.M - lmsLower.M),
    S: lmsLower.S + factor * (lmsUpper.S - lmsLower.S),
  };
}

export interface ZScoreResult {
  zScoreBBU: number;
  zScoreTBU: number;
  statusBBU: {
    label: string;
    category: 'buruk' | 'kurang' | 'baik' | 'lebih';
    color: string;
    badgeBg: string;
    description: string;
    recommendation: string;
  };
  statusTBU: {
    label: string;
    category: 'sangat_pendek' | 'pendek' | 'normal' | 'tinggi';
    color: string;
    badgeBg: string;
    description: string;
  };
}

export function computeZScore(
  weightKg: number,
  heightCm: number,
  ageMonths: number,
  gender: 'L' | 'P'
): ZScoreResult {
  const tableBBU = gender === 'L' ? WHO_BBU_BOYS : WHO_BBU_GIRLS;
  const lmsBBU = getInterpolatedLMS(ageMonths, gender, tableBBU);

  // Calculate Z-score for BB/U
  let zBBU = (Math.pow(weightKg / lmsBBU.M, lmsBBU.L) - 1) / (lmsBBU.L * lmsBBU.S);

  // SD23 correction if extreme
  if (zBBU > 3) {
    const z3 = lmsBBU.M * Math.pow(1 + lmsBBU.L * lmsBBU.S * 3, 1 / lmsBBU.L);
    const z2 = lmsBBU.M * Math.pow(1 + lmsBBU.L * lmsBBU.S * 2, 1 / lmsBBU.L);
    const sdVal = z3 - z2;
    zBBU = 3 + (weightKg - z3) / sdVal;
  } else if (zBBU < -3) {
    const zNeg3 = lmsBBU.M * Math.pow(1 + lmsBBU.L * lmsBBU.S * -3, 1 / lmsBBU.L);
    const zNeg2 = lmsBBU.M * Math.pow(1 + lmsBBU.L * lmsBBU.S * -2, 1 / lmsBBU.L);
    const sdVal = zNeg2 - zNeg3;
    zBBU = -3 + (weightKg - zNeg3) / sdVal;
  }

  // TB/U (stunting) — gunakan engine WHO 2006 LHFA yang benar (BUG #9).
  // Rumus aproksimasi lama (medianHeight/sdHeight) diganti dengan interpolasi LMS resmi.
  let zTBU: number;
  try {
    const a = analisisBalita(ageMonths, gender, weightKg, heightCm);
    zTBU = a.z_tbu != null ? a.z_tbu : 0;
  } catch {
    zTBU = 0;
  }

  // Format
  const roundedZBBU = Math.round(zBBU * 100) / 100;
  const roundedZTBU = Math.round(zTBU * 100) / 100;

  // BBU status evaluation
  let statusBBU;
  if (roundedZBBU < -3) {
    statusBBU = {
      label: 'Gizi Buruk (Severely Underweight)',
      category: 'buruk' as const,
      color: 'text-rose-600',
      badgeBg: 'bg-rose-50 border-rose-200 text-rose-700',
      description: 'Z-Score < -3.0 SD. Diperlukan penanganan medis segera dan intervensi PMT khusus.',
      recommendation: 'Segera rujuk ke Puskesmas / Rumah Sakit untuk tata laksana gizi buruk terintegrasi.',
    };
  } else if (roundedZBBU < -2) {
    statusBBU = {
      label: 'Gizi Kurang (Underweight)',
      category: 'kurang' as const,
      color: 'text-amber-600',
      badgeBg: 'bg-amber-50 border-amber-200 text-amber-700',
      description: 'Z-Score antara -3.0 SD s/d -2.0 SD. Perlu peningkatan asupan kalori dan pemantauan berkala.',
      recommendation: 'Jadwalkan kunjungan rumah (sweeping), berikan PMT Pemulihan, dan evaluasi pola asuh.',
    };
  } else if (roundedZBBU <= 1) {
    statusBBU = {
      label: 'Gizi Baik (Normal Weight)',
      category: 'baik' as const,
      color: 'text-emerald-600',
      badgeBg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
      description: 'Z-Score antara -2.0 SD s/d +1.0 SD. Pertumbuhan optimal sesuai standar WHO.',
      recommendation: 'Pertahankan pola makan bergizi seimbang dan lanjutkan imunisasi serta vitamin berkala.',
    };
  } else {
    statusBBU = {
      label: 'Risiko Berat Badan Lebih (Overweight)',
      category: 'lebih' as const,
      color: 'text-blue-600',
      badgeBg: 'bg-blue-50 border-blue-200 text-blue-700',
      description: 'Z-Score > +1.0 SD. Perlu konsultasi pola makan seimbang dan aktivitas fisik.',
      recommendation: 'Lakukan edukasi gizi seimbang pada orang tua dan hindari makanan manis berlebih.',
    };
  }

  // TBU status evaluation
  let statusTBU;
  if (roundedZTBU < -3) {
    statusTBU = {
      label: 'Sangat Pendek (Severely Stunted)',
      category: 'sangat_pendek' as const,
      color: 'text-rose-600',
      badgeBg: 'bg-rose-50 border-rose-200 text-rose-700',
      description: 'Panjang/Tinggi badan jauh di bawah standar umur.',
    };
  } else if (roundedZTBU < -2) {
    statusTBU = {
      label: 'Pendek (Indikasi Stunting)',
      category: 'pendek' as const,
      color: 'text-amber-600',
      badgeBg: 'bg-amber-50 border-amber-200 text-amber-700',
      description: 'Panjang/Tinggi badan di bawah standar pertumbuhan umur.',
    };
  } else if (roundedZTBU <= 3) {
    statusTBU = {
      label: 'Tinggi Badan Normal',
      category: 'normal' as const,
      color: 'text-emerald-600',
      badgeBg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
      description: 'Tinggi badan optimal sesuai kurva pertumbuhan.',
    };
  } else {
    statusTBU = {
      label: 'Tinggi (Above Average)',
      category: 'tinggi' as const,
      color: 'text-blue-600',
      badgeBg: 'bg-blue-50 border-blue-200 text-blue-700',
      description: 'Tinggi badan di atas rerata pertumbuhan umur.',
    };
  }

  return {
    zScoreBBU: roundedZBBU,
    zScoreTBU: roundedZTBU,
    statusBBU,
    statusTBU,
  };
}
