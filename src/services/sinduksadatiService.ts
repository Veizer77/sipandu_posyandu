/**
 * SIPANDU - SINDUKSADATI Integration Service (PRD Bagian 42)
 * Terhubung melalui proxy backend SIPANDU.
 */

import { insforge } from "@/lib/insforge";

export interface SinduksadatiLookupResult {
  nama_lengkap: string;
  jenis_kelamin: "L" | "P";
  telepon_masked?: string | null;
  alamat?: string | null;
  nomor_rumah?: string | null;
  blok?: string | null;
  nomor_rt: string;
  nomor_rw: string;
  hunian_id?: string | null;
  status_domisili?: string | null;
  status_penduduk: string;
  existing_id_pelanggan_hippam?: string | null;
}

export interface Citizen360Payload {
  penduduk_id: string;
  nik_masked: string;
  nama_lengkap: string;
  sumber: string;
  last_updated: string;
  indikator_kesehatan: {
    kategori_sasaran: string;
    /**
     * Klasifikasi status gizi SESUAI KATEGORI (standar WHO):
     * - bayi/balita : status gizi berbasis Z-score BB/U (WHO 2006).
     * - wus/lansia/umum : status IMT/BMI dewasa (underweight/normal/overweight/obesitas).
     * - ibu_hamil : null (indikator kehamilan: LILA/TD, bukan gizi IMT/z-score).
     */
    status_gizi?: string | null;
    /** Klasifikasi status gizi formal (kode mesin): gizi_buruk|gizi_kurang|normal|gizi_lebih|underweight|overweight|obesitas */
    status_gizi_kode?: string | null;
    /** Hanya bermakna untuk bayi/balita (kunjungan bulanan). */
    status_pertumbuhan?: string | null;
    /** Hanya untuk bayi/balita (TB/U < -2 SD). */
    status_stunting?: string | null;
    /** Z-score WHO 2006 — HANYA berlaku untuk bayi/balita (0–60 bulan). */
    z_score_bbu?: number | null;
    z_score_tbu?: number | null;
    z_score_bbtb?: number | null;
    /** Penanda apakah z-score relevan (true hanya bila kategori bayi/balita). */
    z_score_berlaku?: boolean;
    /** Indeks Massa Tubuh (kg/m²) — relevan untuk dewasa (wus/lansia/umum). */
    imt?: number | null;
    status_imt?: string | null;
    /** Lingkar Lengan Atas (cm) — skrining KEK ibu hamil & WUS. */
    lila_cm?: number | null;
    /** Status KEK (Kurang Energi Kronik) ibu hamil (LILA < 23,5 cm). */
    status_kek?: boolean | null;
    /** Lingkar perut (cm) — obesitas sentral dewasa. */
    lingkar_perut_cm?: number | null;
    vitamin_a_terakhir?: boolean;
    imunisasi_lengkap?: boolean;
    status_risiko?: string[];
    /** Tekanan darah terakhir, format "sistolik/diastolik" mmHg. */
    tekanan_darah_terakhir?: string | null;
    /** Catatan interpretasi (mis. z-score hanya untuk balita). */
    catatan?: string | null;
  };
}

/** Diagnosa proxy: petakan InsForgeError (statusCode/error code) -> pesan + langkah perbaikan */
function petakanErrorProxy(err: any): { kode: string; message: string; hint: string } {
  const status = err?.statusCode ?? err?.status;
  const raw = String(err?.message || err?.error || err || "");
  const code = String(err?.error || "");

  if (status === 401 || /unauthorized/i.test(raw) || /unauthorized/i.test(code)) {
    return {
      kode: "AUTH_REQUIRED",
      message: "Proxy aktif, tetapi membutuhkan otentikasi login InsForge.",
      hint: "Silakan login menggunakan akun resmi (kader/bidan/admin) untuk verifikasi akses.",
    };
  }
  if (status === 404 || /not found/i.test(raw)) {
    return {
      kode: "FUNCTION_MISSING",
      message: "Edge function sinduksadati-proxy tidak ditemukan di server.",
      hint: "Deploy ulang via CLI: npx insforge functions deploy sinduksadati-proxy",
    };
  }
  if (status === 503 || /not configured/i.test(raw)) {
    return {
      kode: "PROVIDER_NOT_CONFIGURED",
      message: "Kredensial SINDUKSADATI belum diatur di sisi server (secrets).",
      hint: "Set secret SINDUKSADATI_API_URL dan SINDUKSADATI_SERVICE_KEY di dashboard InsForge / insforge CLI, lalu periksa ulang.",
    };
  }
  if (status === 502 || status === 504 || /provider/i.test(raw)) {
    return {
      kode: "PROVIDER_DOWN",
      message: "SINDUKSADATI upstream tidak merespons (server proxy hidup).",
      hint: "Cek status layanan SINDUKSADATI, lalu coba lagi nanti.",
    };
  }
  if (/failed to fetch|network|abort/i.test(raw)) {
    return {
      kode: "NETWORK",
      message: "Tidak dapat menghubungi backend InsForge.",
      hint: "Periksa koneksi internet atau VITE_INSFORGE_URL di .env.local.",
    };
  }
  return {
    kode: "UNKNOWN",
    message: raw || "Permintaan ke proxy gagal.",
    hint: "Periksa tab Network di DevTools untuk detail respons /functions/sinduksadati-proxy.",
  };
}

export interface LiveStatusResult {
  online: boolean;
  latencyMs: number;
  message: string;
  hint?: string;
  kode?: string;
}

export const SinduksadatiService = {
  /**
   * Cari data kependudukan live berdasarkan NIK 16 digit
   */
  async lookupWargaByNik(nik: string): Promise<{ success: boolean; data?: SinduksadatiLookupResult; message?: string }> {
    const cleanNik = nik.trim();
    if (!/^\d{16}$/.test(cleanNik)) {
      return { success: false, message: "NIK harus 16 digit angka." };
    }

    try {
      const { data, error } = await insforge.functions.invoke<{ success?: boolean; data?: SinduksadatiLookupResult; message?: string }>("sinduksadati-proxy", {
        method: "POST",
        body: { nik: cleanNik },
      });
      if (error || !data?.success || !data.data) {
        if (error) {
          const diag = petakanErrorProxy(error);
          return { success: false, message: `${diag.message} ${diag.hint}` };
        }
        return { success: false, message: data?.message || "Gagal menemukan data warga." };
      }

      return {
        success: true,
        data: data.data,
      };
    } catch (err: any) {
      const diag = petakanErrorProxy(err);
      return { success: false, message: `${diag.message} ${diag.hint}` };
    }
  },

  /**
   * Ping live gateway status langsung ke Edge Function sinduksadati-proxy.
   */
  async pingLiveStatus(): Promise<LiveStatusResult> {
    const start = Date.now();

    try {
      const { data, error } = await insforge.functions.invoke<{ online?: boolean; message?: string }>("sinduksadati-proxy", {
        method: "GET",
      });
      const latencyMs = Date.now() - start;
      if (!error && data?.online) {
        return { online: true, latencyMs, message: data.message || "SINDUKSADATI Live Gateway connected", kode: "ONLINE" };
      }
      const diag = error ? petakanErrorProxy(error) : { kode: "PROVIDER_DOWN", message: "Proxy merespons tanpa status online.", hint: "Cek upstream SINDUKSADATI di server." };
      if (diag.kode === "AUTH_REQUIRED") {
        return {
          online: true,
          latencyMs,
          message: "Proxy terhubung (HTTP 401) — butuh login akun resmi.",
          hint: diag.hint,
          kode: diag.kode,
        };
      }
      return { online: false, latencyMs, message: diag.message, hint: diag.hint, kode: diag.kode };
    } catch (err: any) {
      const diag = petakanErrorProxy(err);
      if (diag.kode === "AUTH_REQUIRED") {
        return { online: true, latencyMs: Date.now() - start, message: diag.message, hint: diag.hint, kode: diag.kode };
      }
      return { online: false, latencyMs: Date.now() - start, message: diag.message, hint: diag.hint, kode: diag.kode };
    }
  },

  /**
   * Buat payload Citizen 360 agregat kesehatan untuk dikirimkan ke SINDUKSADATI.
   *
   * Prinsip (standar WHO, direvisi 2026-09-15):
   * - Z-score (BB/U, TB/U, BB/TB) HANYA berlaku untuk bayi/balita (0–60 bulan).
   *   Untuk kategori lain, z-score = null dan `z_score_berlaku = false`.
   * - Dewasa (wus/lansia/umum) diklasifikasi memakai IMT/BMI
   *   (underweight <18,5 · normal 18,5–24,9 · overweight ≥25 · obesitas ≥30).
   * - Ibu hamil memakai indikator LILA (KEK <23,5 cm) & tekanan darah, bukan IMT/z-score.
   */
  formatCitizen360Payload(anggota: any, lastVisit?: any): Citizen360Payload {
    const p = lastVisit?.pengukuran || {};
    const pel = lastVisit?.pelayanan || {};
    const maskNik = (nik?: string) => {
      if (!nik || nik.length < 16) return "3579************";
      return `${nik.slice(0, 6)}******${nik.slice(12)}`;
    };

    const kategori = String(anggota?.kategori || "umum");
    const isAnak = kategori === "bayi" || kategori === "balita";
    const isBumil = kategori === "ibu_hamil";

    const num = (v: any): number | null => {
      if (v === null || v === undefined || v === "") return null;
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };

    const zBbu = num(p.z_score_bbu);
    const zTbu = num(p.z_score_tbu);
    const zBbtb = num(p.z_score_bbtb);
    const bb = num(p.berat_badan);
    const tb = num(p.tinggi_badan) ?? num(p.panjang_badan);
    const lila = num(p.lingkar_lengan) ?? num(p.lingkar_lengan_atas);
    const lingkarPerut = num(p.lingkar_perut);
    const tdS = num(p.tekanan_darah_sistol) ?? num(p.td_sistolik);
    const tdD = num(p.tekanan_darah_diastol) ?? num(p.td_diastolik);

    // IMT/BMI: pakai yang tersimpan bila ada, else hitung dari BB & TB.
    const imt =
      num(p.imt) ?? (bb !== null && tb !== null && tb > 0 ? Number((bb / Math.pow(tb / 100, 2)).toFixed(2)) : null);

    // --- Klasifikasi gizi sesuai kategori ---
    let statusGizi: string | null = null;
    let statusGiziKode: string | null = null;
    let statusPertumbuhan: string | null = null;
    let statusStunting: string | null = null;
    let statusImt: string | null = null;
    let statusKek: boolean | null = null;
    let catatan: string | null = null;

    if (isAnak) {
      // Bayi/Balita — klasifikasi Z-score WHO 2006.
      if (zBbu !== null) {
        if (zBbu < -3) { statusGizi = "Gizi Buruk"; statusGiziKode = "gizi_buruk"; }
        else if (zBbu < -2) { statusGizi = "Gizi Kurang"; statusGiziKode = "gizi_kurang"; }
        else if (zBbu > 2) { statusGizi = "Gizi Lebih"; statusGiziKode = "gizi_lebih"; }
        else { statusGizi = "Gizi Baik (Normal)"; statusGiziKode = "normal"; }
      }
      if (zTbu !== null) statusStunting = zTbu < -2 ? "Stunting" : "Normal";
      statusPertumbuhan = p.status_pertumbuhan || null;
    } else if (isBumil) {
      // Ibu Hamil — fokus KEK (LILA) & TD; bukan IMT/z-score.
      if (lila !== null) statusKek = lila < 23.5;
      catatan = "Ibu hamil: indikator gizi memakai LILA (KEK) & tekanan darah, bukan Z-score/IMT.";
    } else {
      // Dewasa (wus/lansia/umum) — klasifikasi IMT/BMI (WHO).
      if (imt !== null) {
        if (imt < 18.5) { statusImt = "Underweight (Kurus)"; statusGizi = statusImt; statusGiziKode = "underweight"; }
        else if (imt < 25) { statusImt = "Normal"; statusGizi = statusImt; statusGiziKode = "normal"; }
        else if (imt < 30) { statusImt = "Overweight (Berlebih)"; statusGizi = statusImt; statusGiziKode = "overweight"; }
        else { statusImt = "Obesitas"; statusGizi = statusImt; statusGiziKode = "obesitas"; }
      }
      catatan = "Dewasa: klasifikasi gizi memakai IMT/BMI (Z-score WHO hanya untuk balita 0–60 bulan).";
    }

    const tdFormatted = tdS !== null || tdD !== null ? `${tdS ?? "-"}/${tdD ?? "-"}` : null;

    return {
      penduduk_id: anggota.sinduksadati_penduduk_id || `sdti-pdk-${anggota.id}`,
      nik_masked: maskNik(anggota.nik),
      nama_lengkap: anggota.nama,
      sumber: "SIPANDU-ILP-Flamboyan",
      last_updated: new Date().toISOString(),
      indikator_kesehatan: {
        kategori_sasaran: kategori,
        status_gizi: statusGizi,
        status_gizi_kode: statusGiziKode,
        status_pertumbuhan: statusPertumbuhan,
        status_stunting: statusStunting,
        z_score_bbu: isAnak ? zBbu : null,
        z_score_tbu: isAnak ? zTbu : null,
        z_score_bbtb: isAnak ? zBbtb : null,
        z_score_berlaku: isAnak,
        imt: !isAnak && !isBumil ? imt : null,
        status_imt: statusImt,
        lila_cm: lila,
        status_kek: statusKek,
        lingkar_perut_cm: lingkarPerut,
        vitamin_a_terakhir: Boolean(pel.vitamin_a),
        imunisasi_lengkap: Boolean(pel.imunisasi && pel.imunisasi.length > 0),
        status_risiko: Array.isArray(lastVisit?.risiko)
          ? lastVisit.risiko.map((r: any) => (typeof r === "string" ? r : r?.kode || r?.kode_risiko || r?.judul)).filter(Boolean)
          : [],
        tekanan_darah_terakhir: tdFormatted,
        catatan,
      },
    };
  },
};
