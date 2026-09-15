import { createAdminClient } from "@insforge/sdk";
import crypto from "crypto";

const ALLOWED_ORIGIN =
  (process.env.SINDUKSADATI_ALLOWED_ORIGIN && process.env.SINDUKSADATI_ALLOWED_ORIGIN !== "[SENSITIVE]")
    ? process.env.SINDUKSADATI_ALLOWED_ORIGIN
    : "https://sinduksadati.vercel.app";

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers": "Authorization, Content-Type, X-Ecosystem-Key, X-Ecosystem-Caller",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

function mapKategori(kategori?: string): string {
  switch (kategori) {
    case "bayi": return "Bayi (0–11 Bulan)";
    case "balita": return "Balita (12–59 Bulan)";
    case "ibu_hamil": return "Ibu Hamil (ILP)";
    case "wus": return "WUS (15–49 Tahun)";
    case "lansia": return "Lansia (≥60 Tahun)";
    case "umum": return "Dewasa (Usia Produktif)";
    default: return "Tidak Terkategorikan";
  }
}

function timingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

export default async function handler(req: any, res: any) {
  for (const [key, value] of Object.entries(corsHeaders)) {
    res.setHeader(key, value);
  }

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  // Auth server-to-server: shared secret X-Ecosystem-Key (timing-safe).
  const ecosystemKey = req.headers["x-ecosystem-key"];
  const expectedKey = process.env.ECOSYSTEM_SERVICE_KEY;

  if (!expectedKey || expectedKey === "[SENSITIVE]") {
    console.error("Missing ECOSYSTEM_SERVICE_KEY in environment variables");
    return res.status(500).json({ success: false, message: "Server configuration error" });
  }

  if (!ecosystemKey || typeof ecosystemKey !== "string" || !timingSafeEqual(ecosystemKey, expectedKey)) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  // Ping/health check tanpa NIK: gateway hidup = 400 (auth lolos, param kurang).
  const nik = req.query.nik;

  if (!nik || typeof nik !== "string" || !/^\d{16}$/.test(nik)) {
    return res.status(400).json({ success: false, message: "Invalid NIK parameter" });
  }

  const baseUrl = process.env.VITE_INSFORGE_URL || "https://6i9ja6g9.us-east.insforge.app";
  const apiKey = process.env.INSFORGE_API_KEY;

  if (!apiKey || apiKey === "[SENSITIVE]") {
    console.error("Missing INSFORGE_API_KEY (admin key) in environment variables");
    return res.status(500).json({ success: false, message: "Server configuration error" });
  }

  const db = createAdminClient({ baseUrl, apiKey });

  try {
    const { data: anggotaList, error: anggotaErr } = await db.database
      .from("anggota")
      .select("*")
      .eq("nik", nik);

    if (anggotaErr) {
      console.error("DB error:", anggotaErr);
      return res.status(500).json({ success: false, message: "Database query failed" });
    }

    if (!anggotaList || anggotaList.length === 0) {
      return res.status(200).json({ success: true, data: null });
    }

    const a = anggotaList[0];
    const record: any = {
      nama_sasaran: a.nama,
      kategori_sasaran: mapKategori(a.kategori),
      tgl_pemeriksaan_terakhir: "",
      status_kemandirian: a.status_kemandirian ?? undefined,
    };

    // Pengukuran terbaru via kunjungan: anggota -> kunjungan -> pengukuran
    const { data: kunjunganList } = await db.database
      .from("kunjungan")
      .select("id, waktu_hadir, status_verifikasi")
      .eq("anggota_id", a.id)
      .order("waktu_hadir", { ascending: false })
      .limit(12);

    if (kunjunganList && kunjunganList.length > 0) {
      const latestVisitId = kunjunganList[0].id;
      record.tgl_pemeriksaan_terakhir = kunjunganList[0].waktu_hadir || "";
      record.total_kunjungan = kunjunganList.length;

      const kunjunganIds = kunjunganList.map((k: any) => k.id);
      const { data: pengukuranList } = await db.database
        .from("pengukuran")
        .select("*")
        .in("kunjungan_id", kunjunganIds);

      record.riwayat_pengukuran = [];

      if (pengukuranList && pengukuranList.length > 0) {
        // Build history
        for (const k of kunjunganList) {
          const p = pengukuranList.find((meas: any) => meas.kunjungan_id === k.id);
          if (p) {
            record.riwayat_pengukuran.push({
              tanggal: k.waktu_hadir,
              berat_badan: p.berat_badan ?? undefined,
              tinggi_badan: p.tinggi_badan ?? p.panjang_badan ?? undefined,
              z_score_bbu: p.z_score_bbu ?? undefined,
              z_score_tbu: p.z_score_tbu ?? undefined,
            });
          }
        }

        // Set latest metrics based on the latest visit (which is index 0)
        const pLatest = pengukuranList.find((meas: any) => meas.kunjungan_id === latestVisitId);
        if (pLatest) {
          const isAnak = a.kategori === "bayi" || a.kategori === "balita";
          const isBumil = a.kategori === "ibu_hamil";

          record.berat_badan_kg = pLatest.berat_badan ?? undefined;
          record.tinggi_badan_cm = pLatest.tinggi_badan ?? pLatest.panjang_badan ?? undefined;
          record.lingkar_kepala_cm = pLatest.lingkar_kepala ?? undefined;
          record.lingkar_lengan_cm = pLatest.lingkar_lengan ?? undefined;
          record.lingkar_perut_cm = pLatest.lingkar_perut ?? undefined;

          // Z-score WHO HANYA berlaku untuk bayi/balita (0–60 bulan).
          record.z_score_berlaku = isAnak;
          if (isAnak) {
            record.z_score_bb_u = pLatest.z_score_bbu ?? undefined;
            record.z_score_tb_u = pLatest.z_score_tbu ?? undefined;
            record.z_score_bb_tb = pLatest.z_score_bbtb ?? undefined;
          }

          // IMT/BMI: tersimpan, atau hitung dari BB/TB (untuk dewasa).
          const bb = Number(pLatest.berat_badan);
          const tb = Number(pLatest.tinggi_badan ?? pLatest.panjang_badan);
          const imt: number | null =
            pLatest.imt != null ? Number(pLatest.imt)
            : (Number.isFinite(bb) && Number.isFinite(tb) && tb > 0 ? Number((bb / Math.pow(tb / 100, 2)).toFixed(2)) : null);
          if (!isAnak && imt != null) {            record.imt = imt;
            record.status_imt =
              imt < 18.5 ? "Underweight (Kurus)" : imt < 25 ? "Normal" : imt < 30 ? "Overweight (Berlebih)" : "Obesitas";
          }

          // Bumil: status KEK dari LILA (< 23,5 cm).
          if (isBumil && pLatest.lingkar_lengan != null) {
            record.lila_cm = Number(pLatest.lingkar_lengan);
            record.status_kek = Number(pLatest.lingkar_lengan) < 23.5;
          }

          record.tensi_darah = (pLatest.tekanan_darah_sistol != null || pLatest.tekanan_darah_diastol != null)
            ? `${pLatest.tekanan_darah_sistol ?? "-"}/${pLatest.tekanan_darah_diastol ?? "-"}`
            : undefined;
          record.gula_darah_puasa = pLatest.gula_darah != null ? String(pLatest.gula_darah) : undefined;

          // Status gizi: balita -> dari Z-score; dewasa -> dari IMT; bumil -> tidak berlaku.
          if (isAnak) {
            if (pLatest.z_score_bbu != null) {
              const z = Number(pLatest.z_score_bbu);
              record.status_gizi = z < -3 ? "Gizi Buruk" : z < -2 ? "Gizi Kurang" : z > 2 ? "Gizi Lebih" : "Normal";
            } else if (pLatest.status_gizi) {
              record.status_gizi = pLatest.status_gizi;
            }
            if (pLatest.z_score_tbu != null) {
              const z = Number(pLatest.z_score_tbu);
              record.status_stunting = z < -3 ? "Stunting Berat" : z < -2 ? "Stunting" : "Normal";
            }
          } else if (isBumil) {
            // Ibu hamil: tidak ada status gizi IMT/z-score; fokus LILA & TD.
            record.status_gizi = undefined;
          } else {
            record.status_gizi = record.status_imt ?? (pLatest.status_gizi ?? undefined);
          }

          // Catatan interpretasi untuk konsumen (SINDUKSADATI).
          record.catatan_indikator = isAnak
            ? "Balita: status gizi memakai Z-score WHO 2006 (0–60 bulan)."
            : isBumil
            ? "Ibu hamil: indikator memakai LILA (KEK) & tekanan darah."
            : "Dewasa: status gizi memakai IMT/BMI (Z-score WHO hanya untuk balita).";
        }
      }

      const { data: catatanList } = await db.database
        .from("catatan_kunjungan")
        .select("catatan_kader, catatan_bidan")
        .eq("kunjungan_id", latestVisitId)
        .limit(1);

      if (catatanList && catatanList.length > 0) {
        record.catatan_kader = catatanList[0].catatan_bidan || catatanList[0].catatan_kader || undefined;
      }
    }

    // Imunisasi
    const { data: imunisasiList } = await db.database
      .from("imunisasi")
      .select("jenis, tanggal")
      .eq("anggota_id", a.id)
      .order("tanggal", { ascending: false })
      .limit(5);

    if (imunisasiList && imunisasiList.length > 0) {
      const jenisList = imunisasiList.map((i: any) => i.jenis).filter(Boolean);
      if (jenisList.length > 0) record.status_imunisasi = jenisList.join(", ");
    }

    // Kehamilan
    if (a.kategori === "ibu_hamil" || a.status_hamil) {
      const { data: hamilList } = await db.database
        .from("kehamilan")
        .select("*")
        .eq("anggota_id", a.id)
        .eq("status", "aktif")
        .order("created_at", { ascending: false })
        .limit(1);

      if (hamilList && hamilList.length > 0) {
        const h = hamilList[0];
        record.hpl = h.taksiran_persalinan ?? undefined;
        if (h.tanggal_hpht) {
          const hpht = new Date(h.tanggal_hpht);
          const now = new Date();
          const diffDays = Math.floor((now.getTime() - hpht.getTime()) / (1000 * 60 * 60 * 24));
          record.usia_kehamilan_minggu = Math.floor(diffDays / 7);
        }
      }
    }

    // Risiko aktif
    const { data: risikoList } = await db.database
      .from("risiko")
      .select("kode_risiko, deskripsi, severity, status")
      .eq("anggota_id", a.id)
      .eq("status", "aktif")
      .limit(5);

    if (risikoList && risikoList.length > 0) {
      const dangerRisks = risikoList.filter((r: any) => r.severity === "danger");
      const warningRisks = risikoList.filter((r: any) => r.severity === "warning");

      if (dangerRisks.length > 0) {
        record.status_risiko = `⚠️ ${dangerRisks.length} risiko tinggi: ${dangerRisks.map((r: any) => r.kode_risiko).join(", ")}`;
      } else if (warningRisks.length > 0) {
        record.status_risiko = `${warningRisks.length} peringatan: ${warningRisks.map((r: any) => r.kode_risiko).join(", ")}`;
      }
    }

    // Usia
    if (a.tanggal_lahir) {
      const birthDate = new Date(a.tanggal_lahir);
      const now = new Date();
      const totalMonths = (now.getFullYear() - birthDate.getFullYear()) * 12 + (now.getMonth() - birthDate.getMonth());
      record.usia_bulan = totalMonths;
      record.usia_tahun = Math.floor(totalMonths / 12);
    }

    return res.status(200).json({ success: true, data: record });
  } catch (e) {
    console.error("API error:", e);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}
