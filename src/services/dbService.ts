/**
 * SIPANDU - InsForge Database Service
 * Menghubungkan seluruh operasional Posyandu ke database cloud InsForge PostgreSQL
 * Tanpa fallback dummy/mock.
 */
import { insforge, insforgeConfigured } from "@/lib/insforge";
import { canonicalizePengukuranForm } from "@/lib/meja2Logic";
import { validatePencatatan, isVersionConflict, toCatatanFormFields } from "@/lib/meja3Logic";
import { normalizePelayanan, validatePelayanan, toDbPelayananRow, toPelayananFormFields } from "@/lib/meja4Logic";
import {
  validatePenyuluhan as validatePenyuluhanInput,
  toDbPenyuluhanRow,
  fromDbPenyuluhan,
  canManagePenyuluhan,
} from "@/lib/meja5Logic";

// ===== Normalisasi nilai enum (kolom DB bertipe enum; label UI menimbulkan 22P02) =====
// status_gizi_enum: buruk | kurang | normal | lebih | obesitas
export function normalisasiStatusGizi(v: any): "buruk" | "kurang" | "normal" | "lebih" | "obesitas" {
  const s = String(v ?? "").toLowerCase();
  if (s.includes("buruk") || s.includes("severely") || s.includes("sangat pendek") || s.includes("sangat kurang")) return "buruk";
  if (s.includes("kurang") || s.includes("wasted") || s.includes("underweight") || s.includes("pendek")) return "kurang";
  if (s.includes("obes")) return "obesitas";
  if (s.includes("lebih") || s.includes("overweight") || s.includes("berisiko")) return "lebih";
  return "normal"; // "Gizi Baik (Normal)", "Normal", "—", kosong/tak dikenal
}

// status_pertumbuhan: naik | tidak_naik | turun | data_baru (M2-010)
// "data_baru"/null dipertahankan eksplisit — jangan klaim "naik" tanpa baseline.
// Kolom DB menerima data_baru setelah migrasi 20260912000001 (sebelumnya fallback null).
export function normalisasiStatusPertumbuhan(v: any): "naik" | "tidak_naik" | "turun" | "data_baru" | null {
  if (v === null || v === undefined || v === "") return null;
  const s = String(v).toLowerCase();
  if (s === "data_baru" || s.includes("data baru") || s.includes("kunjungan pertama")) return "data_baru";
  if (s === "t" || s === "o" || s === "b" || s.includes("tidak") || s.includes("tetap") || s.includes("stagnan")) return "tidak_naik";
  if (s === "turun" || (s.includes("turun") && !s.includes("tidak"))) return "turun";
  if (s === "naik" || s === "n" || s.includes("naik")) return "naik";
  return null;
}

export function parseNumberOrNull(v: any): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export const dbService = {
  isConfigured(): boolean {
    return insforgeConfigured;
  },

  // ================= POSYANDU & ORGANISASI =================
  /**
   * Profil posyandu aktif. Deterministik:
   * - Prioritas baris dengan id kanonis POSYANDU_ID (a0000000-...-0001),
   *   lalu fallback ke RW "06" (Flamboyan RW 06), baru baris apa pun.
   * - TIDAK memakai maybeSingle() karena tabel dapat berisi >1 baris
   *   (mis. data RW lain) → maybeSingle() akan error PGRST116.
   */
  async getPosyandu() {
    const { data, error } = await insforge.database
      .from("posyandu")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw error;
    const rows = Array.isArray(data) ? data : data ? [data] : [];
    if (rows.length === 0) return null;
    return (
      rows.find((r: any) => r.id === "a0000000-0000-0000-0000-000000000001") ||
      rows.find((r: any) => String(r.rw) === "06") ||
      rows[0]
    );
  },

  async getOrganisasi() {
    const { data, error } = await insforge.database
      .from("organisasi_posyandu")
      .select("*");
    if (error) throw error;
    return data || [];
  },

  // ================= USERS / PETUGAS =================
  async getUsers() {
    const { data, error } = await insforge.database
      .from("users")
      .select("*");
    if (error) throw error;
    return data || [];
  },

  // ================= MASTER KELUARGA & ANGGOTA =================
  async getKeluarga() {
    const { data, error } = await insforge.database
      .from("keluarga")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async createKeluarga(keluarga: {
    nomor_kk: string;
    nama_kepala_keluarga: string;
    alamat?: string;
    rt?: string;
    rw?: string;
    posyandu_id?: string;
  }) {
    const { data, error } = await insforge.database
      .from("keluarga")
      .insert([{
        nomor_kk: keluarga.nomor_kk,
        nama_kepala_keluarga: keluarga.nama_kepala_keluarga,
        alamat: keluarga.alamat || "Jl. Mojorejo RW 06",
        rt: keluarga.rt || "14",
        rw: keluarga.rw || "06",
        posyandu_id: keluarga.posyandu_id || "a0000000-0000-0000-0000-000000000001",
      }])
      .select("*")
      .single();
    if (error) throw error;
    return data;
  },

  async getAnggota() {
    const { data, error } = await insforge.database
      .from("anggota")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async createAnggota(agt: {
    keluarga_id: string;
    nik: string;
    nama: string;
    jenis_kelamin: "L" | "P";
    tanggal_lahir: string;
    hubungan_keluarga?: string;
    kategori: string;
    status_aktif?: boolean;
    nomor_telepon?: string;
    nomor_bpjs?: string;
    status_hamil?: boolean;
    hpht?: string | null;
  }) {
    // PRD 37 KEHAMILAN_GENDER_ERROR: anggota laki-laki tidak dapat ditandai hamil
    if (agt.status_hamil && agt.jenis_kelamin !== "P") {
      throw new Error("Anggota berjenis kelamin laki-laki tidak dapat ditandai hamil.");
    }
    const { data, error } = await insforge.database
      .from("anggota")
      .insert([{
        keluarga_id: agt.keluarga_id,
        nik: agt.nik,
        nama: agt.nama,
        jenis_kelamin: agt.jenis_kelamin,
        tanggal_lahir: agt.tanggal_lahir,
        hubungan_keluarga: agt.hubungan_keluarga || "Anak",
        kategori: agt.kategori,
        status_aktif: agt.status_aktif ?? true,
        nomor_telepon: agt.nomor_telepon,
        nomor_bpjs: agt.nomor_bpjs,
        status_hamil: Boolean(agt.status_hamil),
        hpht: agt.hpht || null,
      }])
      .select("*")
      .single();
    if (error) throw error;
    return data;
  },

  // ================= JADWAL POSYANDU =================
  async getJadwal() {
    const { data, error } = await insforge.database
      .from("jadwal_posyandu")
      .select("*")
      .order("tanggal", { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async createJadwal(jadwal: {
    tanggal: string;
    jenis?: string;
    tema?: string;
    status?: string;
    posyandu_id?: string;
    sasaran?: string[];
  }) {
    const { data, error } = await insforge.database
      .from("jadwal_posyandu")
      .insert([{
        tanggal: jadwal.tanggal,
        jenis: jadwal.jenis || "bulanan",
        tema: jadwal.tema || "Posyandu Rutin",
        status: jadwal.status || "aktif",
        posyandu_id: jadwal.posyandu_id || "a0000000-0000-0000-0000-000000000001",
        sasaran: jadwal.sasaran || [],
      }])
      .select("*")
      .single();
    if (error) throw error;
    return data;
  },

  // ================= KUNJUNGAN & ALUR 5 MEJA =================
  async getKunjunganWithDetails() {
    const { data: visits, error: vErr } = await insforge.database
      .from("kunjungan")
      .select("*")
      .order("waktu_hadir", { ascending: false });
    if (vErr) throw vErr;

    if (!visits || visits.length === 0) return [];

    const visitIds = visits.map((v: any) => v.id);

    // Pengukuran
    const { data: measurements } = await insforge.database
      .from("pengukuran")
      .select("*")
      .in("kunjungan_id", visitIds);

    // Pelayanan
    const { data: services } = await insforge.database
      .from("pelayanan")
      .select("*")
      .in("kunjungan_id", visitIds);

    // Catatan (Meja 3)
    const { data: notes } = await insforge.database
      .from("catatan_kunjungan")
      .select("*")
      .in("kunjungan_id", visitIds);

    // Risiko (PRD F-07)
    const { data: dbRisiko } = await insforge.database
      .from("risiko")
      .select("*")
      .in("kunjungan_id", visitIds);

    // (BUG #11) Kunjungan memiliki relasi 1:N ke pengukuran/pelayanan/catatan.
    // Simpan sebagai array lalu ambil record TERBARU (by created_at) agar tidak ke-silangkan
    // data bila ada duplikat (race savePengukuran).
    const mByVisit = new Map<string, any[]>();
    const sByVisit = new Map<string, any[]>();
    const nByVisit = new Map<string, any[]>();
    const pushLatest = (map: Map<string, any[]>, row: any) => {
      const arr = map.get(row.kunjungan_id) || [];
      arr.push(row);
      map.set(row.kunjungan_id, arr);
    };
    (measurements || []).forEach((m: any) => pushLatest(mByVisit, m));
    (services || []).forEach((s: any) => pushLatest(sByVisit, s));
    (notes || []).forEach((n: any) => pushLatest(nByVisit, n));
    const latestOf = (arr?: any[]) => {
      if (!arr || arr.length === 0) return undefined;
      return [...arr].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())[0];
    };
    const rByVisit = new Map<string, any[]>();

    (dbRisiko || []).forEach((r: any) => {
      const arr = rByVisit.get(r.kunjungan_id) || [];
      arr.push({
        id: r.id,
        kunjungan_id: r.kunjungan_id,
        anggota_id: r.anggota_id,
        kode: r.kode_risiko,
        kode_risiko: r.kode_risiko,
        judul: r.deskripsi,
        deskripsi: r.deskripsi,
        severity: r.severity,
        tindakLanjut: r.tindak_lanjut,
        tindak_lanjut: r.tindak_lanjut,
        status: r.status || "aktif",
      });
      rByVisit.set(r.kunjungan_id, arr);
    });

    return visits.map((v: any) => {
      const p = latestOf(mByVisit.get(v.id));
      const s = latestOf(sByVisit.get(v.id));
      const n = latestOf(nByVisit.get(v.id));
      return {
        ...v,
        pengukuran: p ? {
          ...p,
          // M2-027: round-trip penuh form <-> DB dengan key kanonis form.
          berat_badan: p.berat_badan != null ? Number(p.berat_badan) : undefined,
          tinggi_badan: p.tinggi_badan != null ? Number(p.tinggi_badan) : undefined,
          panjang_badan: p.panjang_badan != null ? Number(p.panjang_badan) : undefined,
          lingkar_kepala: p.lingkar_kepala != null ? Number(p.lingkar_kepala) : undefined,
          lingkar_lengan: p.lingkar_lengan != null ? Number(p.lingkar_lengan) : undefined,
          lingkar_lengan_atas: p.lingkar_lengan != null ? Number(p.lingkar_lengan) : undefined,
          lingkar_perut: p.lingkar_perut != null ? Number(p.lingkar_perut) : undefined,
          td_sistolik: p.tekanan_darah_sistol != null ? Number(p.tekanan_darah_sistol) : undefined,
          td_diastolik: p.tekanan_darah_diastol != null ? Number(p.tekanan_darah_diastol) : undefined,
          gula_darah_sewaktu: p.gula_darah != null ? Number(p.gula_darah) : undefined,
          tinggi_fundus: p.tinggi_fundus != null ? Number(p.tinggi_fundus) : undefined,
          djj: p.djj != null ? Number(p.djj) : undefined,
          imt: p.imt != null ? Number(p.imt) : undefined,
          usia_saat_ukur: p.usia_saat_ukur != null ? Number(p.usia_saat_ukur) : undefined,
          catatan: p.catatan ?? undefined,
          z_score_bbu: p.z_score_bbu != null ? Number(p.z_score_bbu) : undefined,
          z_score_tbu: p.z_score_tbu != null ? Number(p.z_score_tbu) : undefined,
          z_score_bbtb: p.z_score_bbtb != null ? Number(p.z_score_bbtb) : undefined,
        } : {},
        // M4-003/M4-026: canonical DTO (tujuan/alasan rujukan, imunisasi[], TT) + versi.
        pelayanan: toPelayananFormFields(s),
        // M3-018: round-trip penuh termasuk created_at/updated_at (versi M3-015).
        catatan: n ? toCatatanFormFields(n) : {},
        risiko: rByVisit.get(v.id) || [],
      };
    });
  },

  async checkIn(anggotaId: string, jadwalPosyanduId: string) {
    if (!jadwalPosyanduId) {
      throw new Error("jadwalPosyanduId wajib diisi (check-in hanya pada sesi aktif)");
    }
    // Check if already checked in for this session
    const { data: existing } = await insforge.database
      .from("kunjungan")
      .select("*")
      .eq("anggota_id", anggotaId)
      .eq("jadwal_posyandu_id", jadwalPosyanduId)
      .maybeSingle();

    if (existing) {
      return { visit: existing, already: true };
    }

    const { data, error } = await insforge.database
      .from("kunjungan")
      .insert([{
        jadwal_posyandu_id: jadwalPosyanduId,
        anggota_id: anggotaId,
        waktu_hadir: new Date().toISOString(),
        status_verifikasi: "draft",
        status_alur: "meja_1_registrasi",
      }])
      .select("*")
      .single();

    if (error) {
      // Race condition safety: if duplicate insert, retrieve existing visit
      const { data: dup } = await insforge.database
        .from("kunjungan")
        .select("*")
        .eq("anggota_id", anggotaId)
        .eq("jadwal_posyandu_id", jadwalPosyanduId)
        .maybeSingle();
      if (dup) return { visit: dup, already: true };
      throw error;
    }
    return { visit: data, already: false };
  },

  /**
   * M2-004 — Guard server-side sebelum mutasi pengukuran.
   * Visit harus: ada, belum selesai, belum terkunci (valid), dan sesinya aktif.
   * Ini validasi terhadap DB live (bukan state lokal) agar cross-session /
   * cross-tenant mutation ditolak walaupun pemanggil memalsukan ID.
   */
  async assertVisitWritable(kunjunganId: string) {
    if (!kunjunganId) throw new Error("kunjunganId wajib diisi.");
    const { data: visit, error } = await insforge.database
      .from("kunjungan")
      .select("id, anggota_id, jadwal_posyandu_id, status_alur, status_verifikasi")
      .eq("id", kunjunganId)
      .maybeSingle();
    if (error) throw error;
    if (!visit) throw new Error("Kunjungan tidak ditemukan di database.");
    if (visit.status_alur === "selesai") {
      throw new Error("Kunjungan sudah selesai; pengukuran ditolak.");
    }
    if (visit.status_verifikasi === "valid") {
      throw new Error("Kunjungan sudah tervalidasi Bidan dan terkunci.");
    }
    if (visit.jadwal_posyandu_id) {
      const { data: jadwal, error: jErr } = await insforge.database
        .from("jadwal_posyandu")
        .select("id, status")
        .eq("id", visit.jadwal_posyandu_id)
        .maybeSingle();
      if (jErr) throw jErr;
      // M3-003: sesi rujukan tidak ada = data korup/lintas sumber → tolak.
      if (!jadwal) {
        throw new Error("Sesi posyandu kunjungan ini tidak valid; mutasi ditolak.");
      }
      if (jadwal.status && jadwal.status !== "aktif") {
        throw new Error(`Sesi posyandu berstatus "${jadwal.status}"; mutasi hanya pada sesi aktif.`);
      }
    }
    return visit;
  },

  async savePengukuran(kunjunganId: string, payload: any) {
    // M2-004: tolak mutasi cross-session / sesi selesai / visit terkunci.
    const visit = await this.assertVisitWritable(kunjunganId);
    if (payload?.anggota_id && visit.anggota_id && payload.anggota_id !== visit.anggota_id) {
      throw new Error("Kunjungan bukan milik peserta ini; mutasi ditolak.");
    }

    // M2-026: kanonikalisasi alias field di boundary sebelum persist.
    const p = canonicalizePengukuranForm(payload || {});

    // Cek record existing dengan limit(1) — maybeSingle() error PGRST116 bila ada duplikat
    // dan membuat setiap save berikutnya selalu INSERT baris baru (loop duplikasi).
    const { data: existingRows } = await insforge.database
      .from("pengukuran")
      .select("id")
      .eq("kunjungan_id", kunjunganId)
      .order("created_at", { ascending: false })
      .limit(1);
    const existing = existingRows && existingRows.length > 0 ? existingRows[0] : null;

    const bb = parseNumberOrNull(p.berat_badan);
    const tb = parseNumberOrNull(p.tinggi_badan);
    const usiaUkur = parseNumberOrNull(p.usia_saat_ukur);
    // IMT dihitung server-side agar round-trip (M2-027).
    const imt =
      parseNumberOrNull(p.imt) ??
      (bb !== null && tb !== null && tb > 0 ? Number((bb / Math.pow(tb / 100, 2)).toFixed(2)) : null);

    const row: Record<string, any> = {
      kunjungan_id: kunjunganId,
      berat_badan: bb,
      tinggi_badan: tb,
      // <24 bulan diukur PB (infantometer); simpan juga ke panjang_badan bila tersedia.
      panjang_badan: parseNumberOrNull(p.panjang_badan) ?? (usiaUkur !== null && usiaUkur < 24 ? tb : null),
      lingkar_kepala: parseNumberOrNull(p.lingkar_kepala),
      lingkar_lengan: parseNumberOrNull(p.lingkar_lengan),
      lingkar_perut: parseNumberOrNull(p.lingkar_perut),
      tekanan_darah_sistol: parseNumberOrNull(p.td_sistolik),
      tekanan_darah_diastol: parseNumberOrNull(p.td_diastolik),
      gula_darah: parseNumberOrNull(p.gula_darah_sewaktu),
      kolesterol: parseNumberOrNull(p.kolesterol),
      asam_urat: parseNumberOrNull(p.asam_urat),
      tinggi_fundus: parseNumberOrNull(p.tinggi_fundus),
      djj: parseNumberOrNull(p.djj),
      usia_saat_ukur: usiaUkur,
      imt,
      z_score_bbu: parseNumberOrNull(p.z_score_bbu),
      z_score_tbu: parseNumberOrNull(p.z_score_tbu),
      z_score_bbtb: parseNumberOrNull(p.z_score_bbtb),
      status_gizi: normalisasiStatusGizi(p.status_gizi),
      // M2-010: data_baru/null dipertahankan; tidak dipaksa "naik".
      status_pertumbuhan: normalisasiStatusPertumbuhan(p.status_pertumbuhan),
      catatan: typeof p.catatan === "string" && p.catatan.trim() ? p.catatan.trim() : null,
    };

    const writeRow = async (r: Record<string, any>) => {
      if (existing) {
        const { error } = await insforge.database
          .from("pengukuran")
          .update(r)
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        // M2-006: idempoten — unique pengukuran(kunjungan_id) di DB membuat
        // double-submit aman; bila race menghasilkan duplikat, ambil existing.
        const { error } = await insforge.database
          .from("pengukuran")
          .insert([r]);
        if (error) {
          const msg = String((error as any)?.message || error);
          if (/duplicate|unique|23505/i.test(msg)) {
            const { data: retry } = await insforge.database
              .from("pengukuran")
              .select("id")
              .eq("kunjungan_id", kunjunganId)
              .order("created_at", { ascending: false })
              .limit(1);
            if (retry && retry.length > 0) {
              const { error: uErr } = await insforge.database
                .from("pengukuran")
                .update(r)
                .eq("id", retry[0].id);
              if (uErr) throw uErr;
              return;
            }
          }
          throw error;
        }
      }
    };

    try {
      await writeRow(row);
    } catch (e: any) {
      // Fallback bila migrasi 20260912000001 belum dijalankan di live DB:
      // kolom `catatan` / nilai `data_baru` mungkin ditolak. Ulangi tanpa keduanya
      // agar submit tidak gagal total; admin wajib menjalankan migrasi.
      const msg = String(e?.message || e);
      if (/catatan|data_baru|status_pertumbuhan|22P02|23514/i.test(msg)) {
        console.warn("savePengukuran fallback tanpa kolom baru (jalankan migrasi 20260912000001):", msg);
        const { catatan: _c, ...rest } = row;
        if (rest.status_pertumbuhan === "data_baru") rest.status_pertumbuhan = null;
        await writeRow(rest);
      } else {
        throw e;
      }
    }

    // M2-011: status transition error WAJIB diperiksa — jangan sukses palsu.
    const { error: trErr } = await insforge.database
      .from("kunjungan")
      .update({ status_alur: "meja_3_pencatatan" })
      .eq("id", kunjunganId);
    if (trErr) throw new Error(`Pengukuran tersimpan tetapi status alur gagal diperbarui: ${trErr.message || trErr}`);
  },

  /**
   * Guard alur: Meja 3/4 wajib didahului pengukuran Meja 2 pada kunjungan yang sama.
   * Mencegah kasus "selesai tanpa ukur" (Meja 2 terlewati via URL langsung).
   */
  async assertPengukuranExists(kunjunganId: string) {
    if (!kunjunganId) throw new Error("kunjunganId wajib diisi.");
    const { data: rows, error } = await insforge.database
      .from("pengukuran")
      .select("id")
      .eq("kunjungan_id", kunjunganId)
      .order("created_at", { ascending: false })
      .limit(1);
    if (error) throw error;
    if (!rows || rows.length === 0) {
      throw new Error("Pengukuran Meja 2 belum tercatat untuk kunjungan ini. Selesaikan Meja 2 dulu.");
    }
    return rows[0];
  },

  /**
   * M3-010 — service menolak catatan_bidan dari role Kader.
   * UI menyembunyikan/mengunci field; penolakan server menutup bypass via API langsung.
   */
  assertBidanFieldAllowed(payload: any, actorRole?: string) {
    const v = typeof payload?.catatan_bidan === "string" ? payload.catatan_bidan.trim() : "";
    if (actorRole === "kader" && v) {
      throw new Error("Field catatan Bidan hanya dapat diisi oleh Bidan/Admin.");
    }
  },

  /** M3-006: fungsi RPC tidak tersedia di endpoint (fungsi belum terdaftar di gateway). */
  isRpcMissing(e: any): boolean {
    const code = String((e as any)?.code || "");
    const msg = String((e as any)?.message || e || "");
    const status = (e as any)?.status;
    return (
      code === "PGRST202" ||
      status === 404 ||
      /could not find the function/i.test(msg) ||
      /failed to fetch|fetch failed|networkerror|load failed/i.test(msg)
    );
  },

  async savePencatatan(
    kunjunganId: string,
    payload: any,
    opts?: { actorRole?: string; expectedUpdatedAt?: string | null }
  ): Promise<{ action: "created" | "updated"; id?: string; updatedAt?: string | null }> {
    // M3-010: gate role sebelum validasi.
    this.assertBidanFieldAllowed(payload, opts?.actorRole);
    // M3-011: validator domain yang sama dengan UI.
    const validation = validatePencatatan(payload || {});
    if (!validation.valid) {
      throw new Error(validation.firstError || "Catatan tidak valid.");
    }
    const clean = validation.value;

    // Guards cepat sisi klien (gagal cepat sebelum RPC).
    const visit = await this.assertVisitWritable(kunjunganId);
    if (payload?.anggota_id && (visit as any).anggota_id && payload.anggota_id !== (visit as any).anggota_id) {
      throw new Error("Kunjungan bukan milik peserta ini; mutasi ditolak.");
    }
    await this.assertPengukuranExists(kunjunganId);

    // M3-006: jalur utama = transaksi atomik (upsert + transisi status) via RPC.
    // Bila RPC tak terjangkau/fungsi tak terdaftar → fallback sekuensial idempoten.
    let rpcOut: any = null;
    let rpcDead = false;
    try {
      const res: any = await (insforge.database as any).rpc("simpan_pencatatan", {
        p_kunjungan_id: kunjunganId,
        p_keluhan: clean.keluhan,
        p_temuan: clean.temuan,
        p_catatan_kader: clean.catatan_kader,
        p_catatan_bidan: clean.catatan_bidan,
        p_expected_updated_at: opts?.expectedUpdatedAt ?? null,
      });
      if (res?.error) {
        if (this.isRpcMissing(res.error)) {
          rpcDead = true;
        } else {
          throw new Error(res.error.message || "Gagal menyimpan catatan via RPC.");
        }
      } else {
        rpcOut = res?.data;
      }
    } catch (e: any) {
      if (!this.isRpcMissing(e)) throw e;
      rpcDead = true;
    }
    if (rpcDead) {
      // Error fallback merambat langsung (tanpa catch ulang → tanpa rekursi).
      return this.savePencatatanSequential(kunjunganId, clean, visit, opts);
    }
    if (!rpcOut || rpcOut.ok !== true) {
      const err: any = new Error(rpcOut?.message || "Gagal menyimpan catatan.");
      err.code = rpcOut?.code;
      err.conflict = rpcOut?.conflict === true;
      err.serverUpdatedAt = rpcOut?.server_updated_at ?? null;
      throw err;
    }
    return {
      action: rpcOut.action === "created" ? "created" : "updated",
      id: rpcOut.id,
      updatedAt: rpcOut.updated_at ?? null,
    };
  },

  /**
   * M3-005/M3-007/M3-015/M3-020 — Fallback sekuensial bila RPC tak tersedia.
   * Idempoten (aman retry): upsert tahan race via unique + penanganan 23505,
   * version check eksplisit, transisi maju-saja, error parsial eksplisit.
   */
  async savePencatatanSequential(
    kunjunganId: string,
    clean: { keluhan: string; temuan: string; catatan_kader: string; catatan_bidan: string },
    visit: any,
    opts?: { actorRole?: string; expectedUpdatedAt?: string | null }
  ): Promise<{ action: "created" | "updated"; id?: string; updatedAt?: string | null }> {
    void opts?.actorRole;
    const { data: rows } = await insforge.database
      .from("catatan_kunjungan")
      .select("id, updated_at")
      .eq("kunjungan_id", kunjunganId)
      .order("created_at", { ascending: false })
      .limit(1);
    const existing = rows && rows.length > 0 ? rows[0] : null;

    // M3-015: tolak overwrite bila server berubah sejak dibaca.
    if (opts?.expectedUpdatedAt != null && existing) {
      if (isVersionConflict(opts.expectedUpdatedAt, existing.updated_at, true)) {
        const err: any = new Error("Catatan berubah oleh petugas lain. Muat ulang sebelum menyimpan.");
        err.conflict = true;
        err.serverUpdatedAt = existing.updated_at ?? null;
        throw err;
      }
    }

    const row = {
      kunjungan_id: kunjunganId,
      keluhan: clean.keluhan,
      temuan: clean.temuan,
      catatan_kader: clean.catatan_kader,
      catatan_bidan: clean.catatan_bidan,
    };

    let rowId: string | undefined = existing?.id;
    if (existing) {
      const { error } = await insforge.database
        .from("catatan_kunjungan")
        .update(row)
        .eq("id", existing.id);
      if (error) throw error;
    } else {
      const { error } = await insforge.database
        .from("catatan_kunjungan")
        .insert([row]);
      if (error) {
        // M3-005: kalah race (kembaran insert duluan) → update baris pemenang.
        const msg = String((error as any)?.message || error);
        if (/duplicate|unique|23505/i.test(msg)) {
          const { data: retry } = await insforge.database
            .from("catatan_kunjungan")
            .select("id")
            .eq("kunjungan_id", kunjunganId)
            .order("created_at", { ascending: false })
            .limit(1);
          if (retry && retry.length > 0) {
            rowId = retry[0].id;
            const { error: uErr } = await insforge.database
              .from("catatan_kunjungan")
              .update(row)
              .eq("id", retry[0].id);
            if (uErr) throw uErr;
          } else {
            throw error;
          }
        } else {
          throw error;
        }
      }
    }

    // M3-020: transisi maju-saja; tidak pernah regresi. Error eksplisit (M3-007).
    const statusNow = (visit as any)?.status_alur;
    let advanced = false;
    if (["meja_1_registrasi", "meja_2_pengukuran", "meja_3_pencatatan"].includes(statusNow)) {
      const { error: trErr } = await insforge.database
        .from("kunjungan")
        .update({ status_alur: "meja_4_pelayanan" })
        .eq("id", kunjunganId);
      if (trErr) {
        throw new Error(`Catatan tersimpan tetapi status alur gagal diperbarui: ${trErr.message || trErr}`);
      }
      advanced = true;
    }
    void advanced;
    return { action: existing ? "updated" : "created", id: rowId, updatedAt: null };
  },

  /**
   * M4-016 — service menolak tindakan imunisasi dari role Kader.
   * Kader BOLEH menulis rujukan, tetapi TIDAK BOLEH memberikan imunisasi (dasar/TT).
   */
  assertImunisasiAllowed(payload: any, actorRole?: string) {
    if (actorRole !== "kader") return;
    const v = normalizePelayanan(payload);
    if (v.imunisasi.length > 0 || v.imunisasi_tt_ke !== null || (payload as any)?.imunisasi_tt === true) {
      throw new Error("Imunisasi hanya dapat diberikan oleh Bidan/Admin. Kader tidak boleh menyuntikkan/memberikan imunisasi.");
    }
  },

  async savePelayanan(
    kunjunganId: string,
    payload: any,
    opts?: { actorRole?: string; expectedUpdatedAt?: string | null }
  ): Promise<{ action: "created" | "updated"; id?: string; updatedAt?: string | null; imunisasiDisimpan?: number }> {
    // M4-016: gate tindakan medis sebelum validasi.
    this.assertImunisasiAllowed(payload, opts?.actorRole);
    // M4-004/M4-005/M4-011/M4-012: validator domain yang sama dengan UI.
    const validation = validatePelayanan(payload || {});
    if (!validation.valid) {
      throw new Error(validation.firstError || "Pelayanan tidak valid.");
    }
    const clean = validation.value;

    // Guards cepat sisi klien (gagal cepat sebelum RPC).
    const visit = await this.assertVisitWritable(kunjunganId);
    const anggotaId = payload?.anggota_id || (visit as any).anggota_id;
    if (payload?.anggota_id && (visit as any).anggota_id && payload.anggota_id !== (visit as any).anggota_id) {
      throw new Error("Kunjungan bukan milik peserta ini; mutasi ditolak.");
    }
    await this.assertPengukuranExists(kunjunganId);

    // M4-006: jalur utama = transaksi atomik via RPC
    // (upsert pelayanan + imunisasi idempoten + transisi maju-saja).
    const dbRow = toDbPelayananRow(kunjunganId, clean);
    let rpcOut: any = null;
    let rpcDead = false;
    try {
      const res: any = await (insforge.database as any).rpc("simpan_pelayanan", {
        p_kunjungan_id: kunjunganId,
        p_anggota_id: anggotaId,
        p_payload: {
          vitamin_a: dbRow.vitamin_a,
          pmt: dbRow.pmt,
          pmt_jenis: dbRow.pmt_jenis,
          imunisasi: dbRow.imunisasi,
          imunisasi_jenis: dbRow.imunisasi_jenis,
          tablet_fe: dbRow.tablet_fe,
          imunisasi_tt: dbRow.imunisasi_tt,
          imunisasi_tt_ke: dbRow.imunisasi_tt_ke,
          rujukan: dbRow.rujukan,
          tujuan_rujukan: dbRow.rujukan_tujuan,
          alasan_rujukan: dbRow.rujukan_alasan,
          konseling: dbRow.konseling,
          konseling_catatan: dbRow.konseling_catatan,
          obat_rutin: dbRow.obat_rutin,
          skrining_anemia: dbRow.skrining_anemia,
        },
        p_imunisasi_jenis: clean.imunisasi,
        p_tanggal: new Date().toISOString().split("T")[0],
        p_expected_updated_at: opts?.expectedUpdatedAt ?? null,
      });
      if (res?.error) {
        if (this.isRpcMissing(res.error)) {
          rpcDead = true;
        } else {
          throw new Error(res.error.message || "Gagal menyimpan pelayanan via RPC.");
        }
      } else {
        rpcOut = res?.data;
      }
    } catch (e: any) {
      if (!this.isRpcMissing(e)) throw e;
      rpcDead = true;
    }
    if (rpcDead) {
      return this.savePelayananSequential(kunjunganId, anggotaId, clean, visit, opts);
    }
    if (!rpcOut || rpcOut.ok !== true) {
      const err: any = new Error(rpcOut?.message || "Gagal menyimpan pelayanan.");
      err.code = rpcOut?.code;
      err.conflict = rpcOut?.conflict === true;
      err.serverUpdatedAt = rpcOut?.server_updated_at ?? null;
      throw err;
    }
    return {
      action: rpcOut.action === "created" ? "created" : "updated",
      id: rpcOut.id,
      updatedAt: rpcOut.updated_at ?? null,
      imunisasiDisimpan: rpcOut.imunisasi_disimpan ?? 0,
    };
  },

  /**
   * M4-006/M4-007/M4-023 — Fallback sekuensial bila RPC tak tersedia.
   * Idempoten: upsert tahan race (unique + 23505), imunisasi insert-abaikan-duplikat,
   * transisi maju-saja, error parsial eksplisit (M4-018).
   */
  async savePelayananSequential(
    kunjunganId: string,
    anggotaId: string,
    clean: {
      vitamin_a: boolean; pmt: boolean; pmt_jenis: string | null;
      imunisasi: string[]; tablet_fe: boolean;
      imunisasi_tt_ke: number | null; rujukan: boolean;
      tujuan_rujukan: string; alasan_rujukan: string;
      konseling: boolean; obat_rutin: string; skrining_anemia: boolean;
    },
    visit: any,
    opts?: { actorRole?: string; expectedUpdatedAt?: string | null }
  ): Promise<{ action: "created" | "updated"; id?: string; updatedAt?: string | null; imunisasiDisimpan?: number }> {
    void opts?.actorRole;
    const { data: rows } = await insforge.database
      .from("pelayanan")
      .select("id, updated_at")
      .eq("kunjungan_id", kunjunganId)
      .order("created_at", { ascending: false })
      .limit(1);
    const existing = rows && rows.length > 0 ? rows[0] : null;

    // M4-019: tolak overwrite bila server berubah sejak dibaca.
    if (opts?.expectedUpdatedAt != null && existing) {
      if (isVersionConflict(opts.expectedUpdatedAt, existing.updated_at, true)) {
        const err: any = new Error("Pelayanan berubah oleh petugas lain. Muat ulang sebelum menyimpan.");
        err.conflict = true;
        err.serverUpdatedAt = existing.updated_at ?? null;
        throw err;
      }
    }

    const row = toDbPelayananRow(kunjunganId, clean);
    let rowId: string | undefined = existing?.id;
    if (existing) {
      const { error } = await insforge.database
        .from("pelayanan")
        .update(row)
        .eq("id", existing.id);
      if (error) throw error;
    } else {
      const { error } = await insforge.database
        .from("pelayanan")
        .insert([row]);
      if (error) {
        // M4-008: kalah race → update baris pemenang.
        const msg = String((error as any)?.message || error);
        if (/duplicate|unique|23505/i.test(msg)) {
          const { data: retry } = await insforge.database
            .from("pelayanan")
            .select("id")
            .eq("kunjungan_id", kunjunganId)
            .order("created_at", { ascending: false })
            .limit(1);
          if (retry && retry.length > 0) {
            rowId = retry[0].id;
            const { error: uErr } = await insforge.database
              .from("pelayanan")
              .update(row)
              .eq("id", retry[0].id);
            if (uErr) throw uErr;
          } else {
            throw error;
          }
        } else {
          throw error;
        }
      }
    }

    // M4-007 (fallback): imunisasi per jenis, abaikan duplikat (constraint).
    let imunisasiDisimpan = 0;
    const tanggal = new Date().toISOString().split("T")[0];
    for (const jenis of clean.imunisasi) {
      const { error } = await insforge.database
        .from("imunisasi")
        .insert([{ anggota_id: anggotaId, jenis, tanggal, kunjungan_id: kunjunganId }]);
      if (!error) {
        imunisasiDisimpan++;
      } else if (!/duplicate|unique|23505/i.test(String((error as any)?.message || error))) {
        // M4-018: kegagalan imunisasi BUKAN warning diam — lempar eksplisit.
        throw new Error(`Pelayanan tersimpan tetapi imunisasi ${jenis} gagal dicatat: ${(error as any)?.message || error}`);
      }
    }

    // M5-018: terminal Meja 4 = 'meja_5_penyuluhan' (menunggu penyuluhan/
    // penutupan sesi). 'selesai' hanya oleh penutupan sesi. Tak pernah regresi.
    const statusNow = (visit as any)?.status_alur;
    if (["meja_1_registrasi", "meja_2_pengukuran", "meja_3_pencatatan", "meja_4_pelayanan"].includes(statusNow)) {
      const { error: trErr } = await insforge.database
        .from("kunjungan")
        .update({ status_alur: "meja_5_penyuluhan" })
        .eq("id", kunjunganId);
      if (trErr) {
        throw new Error(`Pelayanan tersimpan tetapi status alur gagal diperbarui: ${trErr.message || trErr}`);
      }
    } else if (statusNow !== "meja_5_penyuluhan") {
      throw new Error(`Transisi status dari "${statusNow || "?"}" ke meja_5_penyuluhan tidak valid.`);
    }
    return { action: existing ? "updated" : "created", id: rowId, updatedAt: null, imunisasiDisimpan };
  },

  /**
   * M4-022 — Reopen resmi: kembalikan visit SELESAI atau MEJA_5 (menunggu
   * finalisasi) ke tahap koreksi. Hanya Bidan/Super Admin. Audit REOPEN wajib
   * (di store). F-05: tanpa ini, visit meja_5 yang diblokir dari semua detail
   * meja tidak punya jalan koreksi pra-tutup sesi.
   */
  async reopenAlur(
    kunjunganId: string,
    target: "meja_2_pengukuran" | "meja_3_pencatatan" | "meja_4_pelayanan",
    actorRole?: string
  ) {
    if (actorRole !== "bidan" && actorRole !== "super_admin") {
      throw new Error("Membuka kembali kunjungan selesai hanya untuk Bidan/Admin.");
    }
    if (!kunjunganId) throw new Error("kunjunganId wajib diisi.");
    const { data: visit, error: vErr } = await insforge.database
      .from("kunjungan")
      .select("id, status_alur, jadwal_posyandu_id")
      .eq("id", kunjunganId)
      .maybeSingle();
    if (vErr) throw vErr;
    if (!visit) throw new Error("Kunjungan tidak ditemukan di database.");
    if (!["selesai", "meja_5_penyuluhan"].includes(visit.status_alur)) {
      throw new Error("Hanya kunjungan berstatus selesai atau menunggu finalisasi yang dapat dibuka kembali.");
    }
    if (visit.jadwal_posyandu_id) {
      const { data: jadwal } = await insforge.database
        .from("jadwal_posyandu")
        .select("id, status")
        .eq("id", visit.jadwal_posyandu_id)
        .maybeSingle();
      if (!jadwal) throw new Error("Sesi posyandu kunjungan ini tidak valid.");
      if (jadwal.status !== "aktif") {
        throw new Error(`Sesi berstatus "${jadwal.status}"; reopen hanya pada sesi aktif.`);
      }
    }
    // Koreksi wajib diverifikasi ulang: alur mundur + verifikasi ke diperiksa.
    const { error } = await insforge.database
      .from("kunjungan")
      .update({ status_alur: target, status_verifikasi: "diperiksa" })
      .eq("id", kunjunganId);
    if (error) throw error;
    return { kunjunganId, target };
  },

  async verifyKunjungan(kunjunganId: string, status: "valid" | "draft" | "diperiksa" = "valid") {
    const { error } = await insforge.database
      .from("kunjungan")
      .update({
        status_verifikasi: status,
        verifikasi_at: new Date().toISOString(),
      })
      .eq("id", kunjunganId);
    if (error) throw error;
  },

  async closeSession(jadwalId: string) {
    if (!jadwalId) throw new Error("jadwalId wajib diisi untuk menutup sesi.");
    // Urutan penting: finalkan visit DULU, baru jadwal. Jika flip jadwal gagal,
    // retry bersih (idempoten); sebaliknya sesi tampak tutup padahal visit masih terbuka.
    await this.selesaikanKunjunganSesi(jadwalId);
    const { error } = await insforge.database
      .from("jadwal_posyandu")
      .update({ status: "selesai" })
      .eq("id", jadwalId);
    if (error) throw error;
  },

  /**
   * Finalkan semua kunjungan satu sesi menjadi 'selesai' (idempoten).
   * Hanya memakai kolom jadwal_posyandu_id — kolom jadwal_id TIDAK ADA di DB
   * live (filter ke kolom tak ada melempar 400 dan menggagalkan tutup sesi).
   */
  async selesaikanKunjunganSesi(jadwalId: string): Promise<{ finalizedCount: number }> {
    if (!jadwalId) throw new Error("jadwalId wajib diisi.");
    const { data: rows, error: selError } = await insforge.database
      .from("kunjungan")
      .select("id, status_alur")
      .eq("jadwal_posyandu_id", jadwalId);
    if (selError) throw selError;
    const ids = (rows || [])
      .filter((r: any) => r?.id && r?.status_alur !== "selesai")
      .map((r: any) => r.id);
    if (ids.length === 0) return { finalizedCount: 0 };
    const { error: updError } = await insforge.database
      .from("kunjungan")
      .update({ status_alur: "selesai" })
      .in("id", ids);
    if (updError) throw updError;
    return { finalizedCount: ids.length };
  },

  // ================= AUDIT LOGS (PostgreSQL audit_log) =================
  async getAuditLogs(limit = 100) {
    const { data, error } = await insforge.database
      .from("audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) {
      console.warn("Gagal membaca audit_log dari InsForge DB:", error);
      return [];
    }
    return data || [];
  },

  async logAudit(entry: {
    user_id?: string;
    aksi: string;
    tabel?: string;
    record_id?: string;
    deskripsi?: string;
    data_lama?: any;
    data_baru?: any;
  }) {
    try {
      const { data, error } = await insforge.database
        .from("audit_log")
        .insert([{
          user_id: entry.user_id || null,
          aksi: entry.aksi,
          tabel: entry.tabel || "posyandu",
          record_id: entry.record_id || null,
          data_lama: entry.data_lama ? entry.data_lama : null,
          data_baru: entry.data_baru ? entry.data_baru : (entry.deskripsi ? { deskripsi: entry.deskripsi } : null),
        }]);
      if (error) console.warn("Gagal insert audit_log:", error);
      return data;
    } catch (e) {
      console.warn("Gagal insert audit_log:", e);
    }
  },

  // ================= RISIKO (PRD F-07, DDL tabel risiko, state 35.4) =================
  async getRisiko() {
    const { data, error } = await insforge.database
      .from("risiko")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  },

  /**
   * M2-008/M2-009 — Replace risiko atomik-per-kunjungan.
   * SELALU delete by kunjungan_id dulu, lalu insert bila ada rows.
   * Input normal (risiko kosong) menghapus risiko stale lama.
   * Idempoten sehingga aman di-retry setelah partial failure (M2-007).
   */
  async replaceRisiko(kunjunganId: string, rows: Array<{
    kunjungan_id: string;
    anggota_id: string;
    kode_risiko: string;
    deskripsi: string;
    severity: string;
    tindak_lanjut?: string;
  }>) {
    if (!kunjunganId) throw new Error("kunjunganId wajib diisi untuk replace risiko.");
    const { error: delErr } = await insforge.database.from("risiko").delete().eq("kunjungan_id", kunjunganId);
    if (delErr) throw delErr;
    if (!rows.length) return;
    const { error } = await insforge.database
      .from("risiko")
      .insert(rows);
    if (error) throw error;
  },

  async catatRisiko(rows: Array<{
    kunjungan_id: string;
    anggota_id: string;
    kode_risiko: string;
    deskripsi: string;
    severity: string;
    tindak_lanjut?: string;
  }>, kunjunganId?: string) {
    const targetId = kunjunganId || (rows.length > 0 ? rows[0].kunjungan_id : undefined);
    // M2-008: tanpa target kunjungan tidak ada yang bisa di-replace — no-op eksplisit.
    if (!targetId) return;
    return this.replaceRisiko(targetId, rows);
  },

  async updateStatusRisiko(
    id: string,
    status: "aktif" | "ditangani" | "diabaikan",
    opts?: { kunjungan_id?: string; kode_risiko?: string }
  ) {
    // Bila id adalah id sintetik lokal (risiko per-kunjungan yang belum punya uuid DB),
    // cocokkan lewat kunjungan_id + kode_risiko agar persist ke baris yang benar (BUG #4).
    let query = insforge.database.from("risiko").update({ status });
    if (opts?.kunjungan_id && opts?.kode_risiko) {
      query = query.eq("kunjungan_id", opts.kunjungan_id).eq("kode_risiko", opts.kode_risiko);
    } else {
      query = query.eq("id", id);
    }
    const { error } = await query;
    if (error) throw error;
  },

  // ================= IMUNISASI (PRD Bab 10, DDL tabel imunisasi) =================
  async getImunisasi() {
    const { data, error } = await insforge.database
      .from("imunisasi")
      .select("*")
      .order("tanggal", { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async catatImunisasi(entries: Array<{
    anggota_id: string;
    jenis: string;
    tanggal: string;
    kunjungan_id?: string | null;
  }>) {
    if (!entries.length) return;
    const rows = entries.map((e) => ({
      anggota_id: e.anggota_id,
      jenis: e.jenis,
      tanggal: e.tanggal,
      kunjungan_id: e.kunjungan_id || null,
    }));
    const { error } = await insforge.database
      .from("imunisasi")
      .insert(rows);
    if (error) throw error;
  },

  // ================= KEHAMILAN (PRD F-03.3, DDL tabel kehamilan) =================
  async createKehamilan(anggotaId: string, hpht: string) {
    const taksiran = new Date(new Date(hpht).getTime() + 280 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    const { data: existing } = await insforge.database
      .from("kehamilan")
      .select("id")
      .eq("anggota_id", anggotaId)
      .eq("status", "aktif")
      .maybeSingle();

    if (existing) {
      const { error } = await insforge.database
        .from("kehamilan")
        .update({ tanggal_hpht: hpht, taksiran_persalinan: taksiran })
        .eq("id", existing.id);
      if (error) throw error;
      return;
    }

    const { error } = await insforge.database
      .from("kehamilan")
      .insert([{
        anggota_id: anggotaId,
        tanggal_hpht: hpht,
        taksiran_persalinan: taksiran,
        status: "aktif",
      }]);
    if (error) throw error;
  },

  async selesaikanKehamilan(anggotaId: string) {
    const { error: errK } = await insforge.database
      .from("kehamilan")
      .update({ status: "selesai", tanggal_selesai: new Date().toISOString().split("T")[0] })
      .eq("anggota_id", anggotaId)
      .eq("status", "aktif");
    if (errK) throw errK;

    const { error: errA } = await insforge.database
      .from("anggota")
      .update({ status_hamil: false, hpht: null })
      .eq("id", anggotaId);
    if (errA) throw errA;
  },

  // ================= MASTER DATA EDITS (PRD Bab 6: edit keluarga/anggota) =================
  async updateKeluarga(id: string, patch: any) {
    const { error } = await insforge.database
      .from("keluarga")
      .update(patch)
      .eq("id", id);
    if (error) throw error;
  },

  async updateAnggota(id: string, patch: any) {
    const { error } = await insforge.database
      .from("anggota")
      .update(patch)
      .eq("id", id);
    if (error) throw error;
  },

  // ================= ADMIN: PROFIL POSYANDU, ORGANISASI, PENGGUNA (PRD F-01/F-11) =================
  async updatePosyandu(id: string, patch: any) {
    const { error } = await insforge.database
      .from("posyandu")
      .update(patch)
      .eq("id", id);
    if (error) throw error;
  },

  async updateOrganisasi(id: string, patch: any) {
    const { error } = await insforge.database
      .from("organisasi_posyandu")
      .update(patch)
      .eq("id", id);
    if (error) throw error;
  },

  async createUser(user: { nama_lengkap: string; email: string; peran: string }) {
    // (BUG #8) Buat akun login-able: signUp ke auth.users (bukan sekadar insert profil),
    // lalu set peran/nama pada baris users. Password sementara di-generate & dikembalikan
    // agar admin dapat menyampaikannya ke pengguna (ganti via reset password nanti).
    const tempPassword = `Sipandu${Math.random().toString(36).slice(2, 10)}!`;
    try {
      const { data: authData, error: authErr } = await insforge.auth.signUp({
        email: user.email,
        password: tempPassword,
        name: user.nama_lengkap,
        autoConfirm: true,
      });
      if (authErr) throw authErr;

      const authUserId = (authData as any)?.user?.id || (authData as any)?.id;
      if (authUserId) {
        // Upsert profil dengan peran & nama (id profil = id auth user)
        await insforge.database
          .from("users")
          .upsert({
            id: authUserId,
            nama_lengkap: user.nama_lengkap,
            email: user.email,
            peran: user.peran,
            status_aktif: true,
          })
          .eq("id", authUserId);
      }
      return { ...(authData as any), tempPassword };
    } catch (e) {
      console.warn("Gagal membuat akun auth, fallback insert profil saja:", e);
      // Fallback: insert profil (tetap tidak bisa login tanpa auth.users)
      const { data, error } = await insforge.database
        .from("users")
        .insert([{
          nama_lengkap: user.nama_lengkap,
          email: user.email,
          peran: user.peran,
          status_aktif: true,
        }])
        .select("*")
        .single();
      if (error) throw error;
      return data;
    }
  },

  async updateUserStatus(id: string, statusAktif: boolean) {
    const { error } = await insforge.database
      .from("users")
      .update({ status_aktif: statusAktif })
      .eq("id", id);
    if (error) throw error;
  },

  async updateUserPhoto(id: string, foto: string) {
    const { error } = await insforge.database
      .from("users")
      .update({ foto, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
  },

  // ================= PENYULUHAN (MEJA 5) =================
  /**
   * M5-019: error DB dilempar (bukan [] diam) agar UI dapat membedakan
   * "belum ada penyuluhan" dari "gagal membaca".
   */
  async getPenyuluhan(jadwalId?: string) {
    let query = insforge.database
      .from("penyuluhan")
      .select("*")
      .order("created_at", { ascending: false });

    if (jadwalId) {
      query = query.eq("jadwal_posyandu_id", jadwalId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map((p: any) => fromDbPenyuluhan(p));
  },

  /** Guard sesi untuk tulis penyuluhan: jadwal ada + berstatus aktif. */
  async assertPenyuluhanSession(jadwalId?: string) {
    if (!jadwalId) {
      throw new Error("Sesi posyandu wajib dipilih. Buka sesi hari H dulu.");
    }
    const { data: jadwal, error } = await insforge.database
      .from("jadwal_posyandu")
      .select("id, status")
      .eq("id", jadwalId)
      .maybeSingle();
    if (error) throw error;
    if (!jadwal) throw new Error("Sesi posyandu tidak ditemukan di database.");
    if (jadwal.status !== "aktif") {
      throw new Error(`Sesi posyandu berstatus "${jadwal.status}"; pencatatan hanya pada sesi aktif.`);
    }
    return jadwal;
  },

  /**
   * M5-004/M5-006/M5-007: catat penyuluhan HANYA via DB (tanpa fallback lokal).
   * Validasi + guard sesi + insert; duplikat (sesi, tema) mengembalikan baris
   * yang sudah ada (idempoten double-submit) dengan flag existed.
   */
  async catatPenyuluhan(
    penyuluhan: any,
    opts?: { actorRole?: string; sessionId?: string }
  ): Promise<{ row: any; action: "created" | "existed" }> {
    if (!canManagePenyuluhan(opts?.actorRole)) {
      throw new Error("Dokumentasi penyuluhan hanya untuk Kader/Bidan/Admin.");
    }
    const validation = validatePenyuluhanInput(penyuluhan || {});
    if (!validation.valid) {
      throw new Error(validation.firstError || "Penyuluhan tidak valid.");
    }
    const jadwalId =
      opts?.sessionId || penyuluhan.jadwal_posyandu_id || penyuluhan.jadwal_id || penyuluhan.sesi_id;
    await this.assertPenyuluhanSession(jadwalId);
    const row = toDbPenyuluhanRow(jadwalId, validation.value);

    const { data, error } = await insforge.database
      .from("penyuluhan")
      .insert([row])
      .select("*")
      .single();

    if (!error) {
      return { row: fromDbPenyuluhan(data), action: "created" };
    }
    // M5-007: kalah race / double submit dengan tema sama -> kembalikan yang ada.
    const msg = String((error as any)?.message || error);
    if (/duplicate|unique|23505/i.test(msg)) {
      const { data: retry, error: rErr } = await insforge.database
        .from("penyuluhan")
        .select("*")
        .eq("jadwal_posyandu_id", jadwalId)
        .eq("tema", row.tema)
        .order("created_at", { ascending: false })
        .limit(1);
      if (!rErr && retry && retry.length > 0) {
        return { row: fromDbPenyuluhan(retry[0]), action: "existed" };
      }
    }
    throw error;
  },

  /** M5-011: ubah penyuluhan (sesi aktif + permission). */
  async updatePenyuluhan(
    id: string,
    patch: any,
    opts?: { actorRole?: string }
  ) {
    if (!canManagePenyuluhan(opts?.actorRole)) {
      throw new Error("Mengubah penyuluhan hanya untuk Kader/Bidan/Admin.");
    }
    if (!id) throw new Error("ID penyuluhan wajib diisi.");
    const { data: current, error: cErr } = await insforge.database
      .from("penyuluhan")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (cErr) throw cErr;
    if (!current) throw new Error("Data penyuluhan tidak ditemukan.");
    await this.assertPenyuluhanSession(current.jadwal_posyandu_id || current.jadwal_id);

    const merged = { ...fromDbPenyuluhan(current), ...(patch || {}) };
    const validation = validatePenyuluhanInput(merged);
    if (!validation.valid) {
      throw new Error(validation.firstError || "Penyuluhan tidak valid.");
    }
    const row = toDbPenyuluhanRow(
      current.jadwal_posyandu_id || current.jadwal_id,
      validation.value
    );
    const { data, error } = await insforge.database
      .from("penyuluhan")
      .update({
        tema: row.tema,
        narasumber: row.narasumber,
        jumlah_peserta: row.jumlah_peserta,
        metode: row.metode,
        media: row.media,
        ringkasan: row.ringkasan,
      })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return fromDbPenyuluhan(data);
  },

  // ================= RENCANA KUNJUNGAN RUMAH (REKAP RK-015) =================
  async getRencanaKunjungan(status?: "terjadwal" | "selesai" | "dibatalkan") {
    let query = insforge.database
      .from("rencana_kunjungan_rumah")
      .select("*")
      .order("created_at", { ascending: false });
    if (status) query = query.eq("status", status);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  /**
   * RK-015: jadwalkan kunjungan rumah (persist, bukan toast palsu).
   * Idempoten: bila sudah ada rencana aktif untuk anggota -> kembalikan itu.
   */
  async jadwalkanKunjunganRumah(
    anggotaId: string,
    jadwalId?: string | null,
    alasan?: string | null
  ) {
    if (!anggotaId) throw new Error("anggotaId wajib diisi.");
    const { data, error } = await insforge.database
      .from("rencana_kunjungan_rumah")
      .insert([{
        anggota_id: anggotaId,
        jadwal_posyandu_id: jadwalId || null,
        alasan: (alasan || "").trim() || null,
        status: "terjadwal",
      }])
      .select("*")
      .single();
    if (!error) return { row: data, action: "created" as const };
    // Sudah ada rencana aktif (unique partial) -> kembalikan barisnya.
    const msg = String((error as any)?.message || error);
    if (/duplicate|unique|23505/i.test(msg)) {
      const { data: retry, error: rErr } = await insforge.database
        .from("rencana_kunjungan_rumah")
        .select("*")
        .eq("anggota_id", anggotaId)
        .eq("status", "terjadwal")
        .order("created_at", { ascending: false })
        .limit(1);
      if (!rErr && retry && retry.length > 0) {
        return { row: retry[0], action: "existed" as const };
      }
    }
    throw error;
  },

  async updateStatusRencana(id: string, status: "terjadwal" | "selesai" | "dibatalkan") {
    if (!id) throw new Error("ID rencana wajib diisi.");
    if (!["terjadwal", "selesai", "dibatalkan"].includes(status)) {
      throw new Error(`Status rencana tidak valid: ${status}.`);
    }
    const { data, error } = await insforge.database
      .from("rencana_kunjungan_rumah")
      .update({ status })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return data;
  },

  /** M5-011: hapus penyuluhan (sesi aktif + permission). */
  async hapusPenyuluhan(id: string, opts?: { actorRole?: string }) {
    if (!canManagePenyuluhan(opts?.actorRole)) {
      throw new Error("Menghapus penyuluhan hanya untuk Kader/Bidan/Admin.");
    }
    if (!id) throw new Error("ID penyuluhan wajib diisi.");
    const { data: current, error: cErr } = await insforge.database
      .from("penyuluhan")
      .select("id, jadwal_posyandu_id, jadwal_id")
      .eq("id", id)
      .maybeSingle();
    if (cErr) throw cErr;
    if (!current) throw new Error("Data penyuluhan tidak ditemukan.");
    await this.assertPenyuluhanSession(current.jadwal_posyandu_id || current.jadwal_id);
    const { error } = await insforge.database.from("penyuluhan").delete().eq("id", id);
    if (error) throw error;
    return { id };
  },

  // ================= SUPER ADMIN CLEANUP =================
  async purgeTransactionalData() {
    // Urutan PENTING: hapus child dulu (FK NOT NULL ke kunjungan) sebelum parent,
    // agar tidak melanggar constraint (BUG #3).
    const tables = [
      "penyuluhan", // FK -> jadwal_posyandu
      "risiko", // FK -> kunjungan, anggota
      "catatan_kunjungan", // FK -> kunjungan
      "pelayanan", // FK -> kunjungan
      "pengukuran", // FK -> kunjungan
      "kunjungan",
      "audit_log",
    ];
    for (const tbl of tables) {
      try {
        await insforge.database.from(tbl).delete().neq("id", "00000000-0000-0000-0000-000000000000");
      } catch (e) {
        console.warn(`Purge table ${tbl}:`, e);
      }
    }
  },
};
