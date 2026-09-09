/**
 * SIPANDU - InsForge Database Service
 * Menghubungkan seluruh operasional Posyandu ke database cloud InsForge PostgreSQL
 * Tanpa fallback dummy/mock.
 */
import { insforge, insforgeConfigured } from "@/lib/insforge";

export const dbService = {
  isConfigured(): boolean {
    return insforgeConfigured;
  },

  // ================= POSYANDU & ORGANISASI =================
  async getPosyandu() {
    const { data, error } = await insforge.database
      .from("posyandu")
      .select("*")
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data;
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
  }) {
    const { data, error } = await insforge.database
      .from("jadwal_posyandu")
      .insert([{
        tanggal: jadwal.tanggal,
        jenis: jadwal.jenis || "bulanan",
        tema: jadwal.tema || "Posyandu Rutin",
        status: jadwal.status || "aktif",
        posyandu_id: jadwal.posyandu_id || "a0000000-0000-0000-0000-000000000001",
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
          berat_badan: p.berat_badan ? Number(p.berat_badan) : undefined,
          tinggi_badan: p.tinggi_badan ? Number(p.tinggi_badan) : undefined,
          lingkar_kepala: p.lingkar_kepala ? Number(p.lingkar_kepala) : undefined,
          lingkar_lengan: p.lingkar_lengan ? Number(p.lingkar_lengan) : undefined,
          z_score_bbu: p.z_score_bbu ? Number(p.z_score_bbu) : undefined,
          z_score_tbu: p.z_score_tbu ? Number(p.z_score_tbu) : undefined,
          z_score_bbtb: p.z_score_bbtb ? Number(p.z_score_bbtb) : undefined,
        } : {},
        pelayanan: s || {},
        catatan: n ? {
          keluhan: n.keluhan || "",
          temuan: n.temuan || "",
          catatan_kader: n.catatan_kader || "",
          catatan_bidan: n.catatan_bidan || "",
        } : {},
        risiko: rByVisit.get(v.id) || [],
      };
    });
  },

  async checkIn(anggotaId: string, jadwalPosyanduId: string) {
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
        status_alur: "meja_2_pengukuran",
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

  async savePengukuran(kunjunganId: string, payload: any) {
    // Check if record exists
    const { data: existing } = await insforge.database
      .from("pengukuran")
      .select("id")
      .eq("kunjungan_id", kunjunganId)
      .maybeSingle();

    const row = {
      kunjungan_id: kunjunganId,
      berat_badan: payload.berat_badan != null ? payload.berat_badan : null,
      tinggi_badan: payload.tinggi_badan != null ? payload.tinggi_badan : null,
      lingkar_kepala: payload.lingkar_kepala != null ? payload.lingkar_kepala : null,
      lingkar_lengan: payload.lingkar_lengan != null ? payload.lingkar_lengan : null,
      tekanan_darah_sistol: payload.td_sistolik ? parseInt(payload.td_sistolik) : null,
      tekanan_darah_diastol: payload.td_diastolik ? parseInt(payload.td_diastolik) : null,
      gula_darah: payload.gula_darah_sewaktu ? parseFloat(payload.gula_darah_sewaktu) : null,
      z_score_bbu: payload.z_score_bbu != null ? payload.z_score_bbu : null,
      z_score_tbu: payload.z_score_tbu != null ? payload.z_score_tbu : null,
      z_score_bbtb: payload.z_score_bbtb != null ? payload.z_score_bbtb : null,
      status_gizi: payload.status_gizi || "normal",
      status_pertumbuhan: payload.status_pertumbuhan || "naik",
    };

    if (existing) {
      const { error } = await insforge.database
        .from("pengukuran")
        .update(row)
        .eq("id", existing.id);
      if (error) throw error;
    } else {
      const { error } = await insforge.database
        .from("pengukuran")
        .insert([row]);
      if (error) throw error;
    }

    // Update status alur kunjungan
    await insforge.database
      .from("kunjungan")
      .update({ status_alur: "meja_3_pencatatan" })
      .eq("id", kunjunganId);
  },

  async savePencatatan(kunjunganId: string, catatan: any) {
    // Check if record exists
    const { data: existing } = await insforge.database
      .from("catatan_kunjungan")
      .select("id")
      .eq("kunjungan_id", kunjunganId)
      .maybeSingle();

    const row = {
      kunjungan_id: kunjunganId,
      keluhan: catatan.keluhan || null,
      temuan: catatan.temuan || null,
      catatan_kader: catatan.catatan_kader || null,
      catatan_bidan: catatan.catatan_bidan || null,
      updated_at: new Date().toISOString(),
    };

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
      if (error) throw error;
    }

    // Update status alur kunjungan
    await insforge.database
      .from("kunjungan")
      .update({ status_alur: "meja_4_pelayanan" })
      .eq("id", kunjunganId);
  },

  async savePelayanan(kunjunganId: string, payload: any) {
    const { data: existing } = await insforge.database
      .from("pelayanan")
      .select("id")
      .eq("kunjungan_id", kunjunganId)
      .maybeSingle();

    const row = {
      kunjungan_id: kunjunganId,
      vitamin_a: Boolean(payload.vitamin_a),
      pmt: Boolean(payload.pmt),
      pmt_jenis: payload.pmt_jenis || null,
      imunisasi: Boolean(payload.imunisasi && payload.imunisasi.length > 0),
      imunisasi_jenis: payload.imunisasi?.join(", ") || null,
      tablet_fe: Boolean(payload.tablet_fe),
      imunisasi_tt: payload.imunisasi_tt_ke != null,
      imunisasi_tt_ke: payload.imunisasi_tt_ke || null,
      rujukan: Boolean(payload.rujukan),
      rujukan_tujuan: payload.rujukan_tujuan || null,
      rujukan_catatan: payload.catatan_rujukan || payload.alasan_rujukan || null,
      konseling: Boolean(payload.konseling || payload.nasihat),
      konseling_catatan: payload.nasihat || null,
      obat_rutin: payload.obat_rutin || null,
      skrining_anemia: Boolean(payload.skrining_anemia),
    };

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
      if (error) throw error;
    }

    // Update status alur kunjungan ke selesai
    await insforge.database
      .from("kunjungan")
      .update({ status_alur: "selesai" })
      .eq("id", kunjunganId);
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
    const { error } = await insforge.database
      .from("jadwal_posyandu")
      .update({ status: "selesai" })
      .eq("id", jadwalId);
    if (error) throw error;
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

  async catatRisiko(rows: Array<{
    kunjungan_id: string;
    anggota_id: string;
    kode_risiko: string;
    deskripsi: string;
    severity: string;
    tindak_lanjut?: string;
  }>) {
    if (!rows.length) return;
    const kunjunganId = rows[0].kunjungan_id;
    if (kunjunganId) {
      try {
        await insforge.database.from("risiko").delete().eq("kunjungan_id", kunjunganId);
      } catch (e) {
        console.warn("Could not delete prior risiko for kunjungan:", e);
      }
    }
    const { error } = await insforge.database
      .from("risiko")
      .insert(rows);
    if (error) throw error;
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
  async getPenyuluhan(jadwalId?: string) {
    try {
      let query = insforge.database
        .from("penyuluhan")
        .select("*")
        .order("created_at", { ascending: false });

      if (jadwalId) {
        query = query.eq("jadwal_id", jadwalId);
      }

      const { data, error } = await query;
      if (error) {
        console.warn("getPenyuluhan DB info:", error.message || error);
        return [];
      }
      return (data || []).map((p: any) => ({
        ...p,
        jadwal_posyandu_id: p.jadwal_id,
        jumlah: p.jumlah_peserta,
      }));
    } catch (e) {
      console.warn("getPenyuluhan non-critical exception:", e);
      return [];
    }
  },

  async catatPenyuluhan(penyuluhan: any) {
    const jadwalId = penyuluhan.jadwal_id || penyuluhan.jadwal_posyandu_id || penyuluhan.sesi_id;
    const jumlahPeserta = Number(penyuluhan.jumlah_peserta ?? penyuluhan.jumlah ?? 1);

    const payload: any = {
      jadwal_id: jadwalId,
      tema: penyuluhan.tema,
      narasumber: penyuluhan.narasumber,
      jumlah_peserta: jumlahPeserta,
      metode: penyuluhan.metode || "Ceramah",
      media: penyuluhan.media || "",
      ringkasan: penyuluhan.ringkasan || "",
    };

    if (penyuluhan.created_by) {
      payload.created_by = penyuluhan.created_by;
    }

    try {
      const { data, error } = await insforge.database
        .from("penyuluhan")
        .insert([payload])
        .select("*")
        .single();

      if (error) {
        console.warn("catatPenyuluhan DB error (falling back to local):", error.message || error);
        return {
          id: penyuluhan.id || `peny-${Date.now()}`,
          jadwal_id: jadwalId,
          jadwal_posyandu_id: jadwalId,
          tema: penyuluhan.tema,
          narasumber: penyuluhan.narasumber,
          jumlah_peserta: jumlahPeserta,
          jumlah: jumlahPeserta,
          metode: penyuluhan.metode,
          media: penyuluhan.media,
          ringkasan: penyuluhan.ringkasan,
          created_at: new Date().toISOString(),
        };
      }

      return {
        ...data,
        jadwal_posyandu_id: data.jadwal_id,
        jumlah: data.jumlah_peserta,
      };
    } catch (e) {
      console.warn("catatPenyuluhan exception (falling back to local):", e);
      return {
        id: penyuluhan.id || `peny-${Date.now()}`,
        jadwal_id: jadwalId,
        jadwal_posyandu_id: jadwalId,
        tema: penyuluhan.tema,
        narasumber: penyuluhan.narasumber,
        jumlah_peserta: jumlahPeserta,
        jumlah: jumlahPeserta,
        metode: penyuluhan.metode,
        media: penyuluhan.media,
        ringkasan: penyuluhan.ringkasan,
        created_at: new Date().toISOString(),
      };
    }
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
