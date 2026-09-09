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
    status_gizi?: string | null;
    status_pertumbuhan?: string | null;
    status_stunting?: string | null;
    z_score_bbu?: number | null;
    z_score_tbu?: number | null;
    z_score_bbtb?: number | null;
    vitamin_a_terakhir?: boolean;
    imunisasi_lengkap?: boolean;
    status_risiko?: string[];
    tekanan_darah_terakhir?: string | null;
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
   * Buat payload Citizen 360 agregat kesehatan untuk dikirimkan ke SINDUKSADATI
   */
  formatCitizen360Payload(anggota: any, lastVisit?: any): Citizen360Payload {
    const p = lastVisit?.pengukuran || {};
    const pel = lastVisit?.pelayanan || {};
    const maskedNik = anggota.nik ? `${anggota.nik.slice(0, 6)}******${anggota.nik.slice(12)}` : "3579************";

    return {
      penduduk_id: anggota.sinduksadati_penduduk_id || `sdti-pdk-${anggota.id}`,
      nik_masked: maskedNik,
      nama_lengkap: anggota.nama,
      sumber: "SIPANDU-ILP-Flamboyan",
      last_updated: new Date().toISOString(),
      indikator_kesehatan: {
        kategori_sasaran: anggota.kategori,
        status_gizi: p.status_gizi || null,
        status_pertumbuhan: p.status_pertumbuhan || null,
        status_stunting: p.z_score_tbu ? (p.z_score_tbu < -2 ? "Stunting" : "Normal") : null,
        z_score_bbu: p.z_score_bbu ?? null,
        z_score_tbu: p.z_score_tbu ?? null,
        z_score_bbtb: p.z_score_bbtb ?? null,
        vitamin_a_terakhir: Boolean(pel.vitamin_a),
        imunisasi_lengkap: Boolean(pel.imunisasi && pel.imunisasi.length > 0),
        status_risiko: lastVisit?.risiko || [],
        tekanan_darah_terakhir: p.tekanan_darah || null,
      },
    };
  },
};
