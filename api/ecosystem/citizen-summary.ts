import { createClient } from "@insforge/sdk";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, X-Ecosystem-Key",
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

export default async function handler(req: any, res: any) {
  // Set CORS headers
  for (const [key, value] of Object.entries(corsHeaders)) {
    res.setHeader(key, value);
  }

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  // Auth: Check X-Ecosystem-Key
  const ecosystemKey = req.headers["x-ecosystem-key"];
  const expectedKey = process.env.ECOSYSTEM_SERVICE_KEY;

  if (!expectedKey) {
    console.error("Missing ECOSYSTEM_SERVICE_KEY in environment variables");
    return res.status(500).json({ success: false, message: "Server configuration error" });
  }

  if (ecosystemKey !== expectedKey) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const nik = req.query.nik;

  if (!nik || typeof nik !== 'string' || !/^\d{16}$/.test(nik)) {
    return res.status(400).json({ success: false, message: "Invalid NIK parameter" });
  }

  // Initialize Supabase Client (Using Service Role Key if available, else Anon Key)
  const supabaseUrl = process.env.VITE_INSFORGE_URL || process.env.VITE_SUPABASE_URL || "https://6i9ja6g9.us-east.insforge.app";
  const supabaseKey = process.env.INSFORGE_SERVICE_ROLE_KEY || process.env.VITE_INSFORGE_ANON_KEY || "anon_c96fb04fdf42783ed160148118711f6b909f25fffeb3440ccc650a2996907cc6";

  const supabase = createClient({
    baseUrl: supabaseUrl,
    anonKey: supabaseKey, // Or service role key
  });

  try {
    // We might need to login if using anon key and RLS is enabled, but for Edge function with Service Key it bypasses RLS.
    // If we only have anon key in prod, we do the login here just like before.
    if (supabaseKey.startsWith("anon_")) {
      const email = process.env.POSYANDU_EMAIL || "admin@sipandu-flamboyan.id";
      const password = process.env.POSYANDU_PASSWORD || "password123";
      await supabase.auth.signInWithPassword({ email, password });
    }

    const { data: anggotaList, error: anggotaErr } = await supabase.database
      .from("anggota")
      .select("*")
      .eq("nik", nik);

    if (anggotaErr || !anggotaList || anggotaList.length === 0) {
      return res.status(200).json({ success: true, data: null });
    }

    const a = anggotaList[0];
    const record: any = {
      nama_sasaran: a.nama,
      kategori_sasaran: mapKategori(a.kategori),
      tgl_pemeriksaan_terakhir: "",
      status_kemandirian: a.status_kemandirian ?? undefined,
    };

    // Pengukuran terbaru via kunjungan
    const { data: kunjunganList } = await supabase.database
      .from("kunjungan")
      .select("id, waktu_hadir, status_verifikasi")
      .eq("anggota_id", a.id)
      .order("waktu_hadir", { ascending: false })
      .limit(5);

    if (kunjunganList && kunjunganList.length > 0) {
      const latestVisitId = kunjunganList[0].id;
      record.tgl_pemeriksaan_terakhir = kunjunganList[0].waktu_hadir || "";

      const { data: pengukuranList } = await supabase.database
        .from("pengukuran")
        .select("*")
        .eq("kunjungan_id", latestVisitId)
        .limit(1);

      if (pengukuranList && pengukuranList.length > 0) {
        const p = pengukuranList[0];
        record.berat_badan_kg = p.berat_badan ?? undefined;
        record.tinggi_badan_cm = p.tinggi_badan ?? undefined;
        record.lingkar_kepala_cm = p.lingkar_kepala ?? undefined;
        record.z_score_bb_u = p.z_score_bbu ?? undefined;
        record.z_score_tb_u = p.z_score_tbu ?? undefined;
        record.tensi_darah = p.tekanan_darah ?? undefined;
        record.gula_darah_puasa = p.gula_darah_sewaktu != null ? String(p.gula_darah_sewaktu) : undefined;
        record.catatan_kader = p.catatan_kader ?? undefined;

        if (p.z_score_bbu != null) {
          const z = p.z_score_bbu;
          record.status_gizi = z < -3 ? "Gizi Buruk" : z < -2 ? "Gizi Kurang" : z > 2 ? "Gizi Lebih" : "Normal";
        }

        if (p.z_score_tbu != null) {
          const z = p.z_score_tbu;
          record.status_stunting = z < -3 ? "Stunting Berat" : z < -2 ? "Stunting" : "Normal";
        }
      }
      record.total_kunjungan = kunjunganList.length;
    }

    // Imunisasi
    const { data: imunisasiList } = await supabase.database
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
      const { data: hamilList } = await supabase.database
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

    // Risiko
    const { data: risikoList } = await supabase.database
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
