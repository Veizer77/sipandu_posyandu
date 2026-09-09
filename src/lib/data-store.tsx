/**
 * SIPANDU - Reactive & Persistent Data Store
 * Terintegrasi penuh ke database InsForge PostgreSQL via dbService.
 * Seluruh mutasi Alur 5 Meja disimpan ke cloud database.
 */
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "./auth-context";
import { dbService } from "@/services/dbService";
import { hitungUsia, klasifikasiSasaran, deteksiRisikoSesi } from "@/utils/zscoreCalculator";
import seedData from "./seedData";

const STORAGE_KEY = "sipandu_db_v3_state";

export interface DataStoreState {
  posyandu: any;
  organisasi: any[];
  users: any[];
  jadwal: any[];
  keluarga: any[];
  anggota: any[];
  kunjungan: any[];
  kunjunganAktif: any[];
  sinduksadatiMaster: any[];
  sinduksadatiEvents: any[];
  notifikasi: any[];
  auditLogs: any[];
  penyuluhan: any[];
  risiko: any[];
}

interface SipanduContextValue {
  data: DataStoreState;
  isLoadingDb: boolean;
  refreshFromDb: (silent?: boolean) => Promise<void>;
  checkInPeserta: (anggotaId: string, jadwalId?: string) => Promise<{ success: boolean; visit?: any; message: string }>;
  updatePengukuran: (anggotaId: string, pengukuran: any) => Promise<void>;
  updatePencatatan: (anggotaId: string, catatan: any) => Promise<void>;
  updatePelayanan: (anggotaId: string, pelayanan: any) => Promise<void>;
  tambahKeluarga: (keluargaData: any) => Promise<any>;
  tambahAnggota: (anggotaData: any) => Promise<any>;
  tambahJadwal: (jadwalData: any) => Promise<any>;
  updateJadwalStatus: (jadwalId: string, status: "draft" | "aktif" | "selesai" | "dibatalkan") => Promise<void>;
  tambahPenyuluhan: (penyuluhanData: any) => void;
  updateKeluarga: (id: string, patch: any) => Promise<void>;
  updateAnggota: (id: string, patch: any) => Promise<void>;
  selesaikanKehamilan: (anggotaId: string) => Promise<void>;
   verifikasiKunjungan: (kunjunganId: string, status?: "valid" | "draft" | "diperiksa", catatan?: string) => Promise<void>;
   bukaKunciKunjungan: (kunjunganId: string) => Promise<void>;
  updateStatusRisiko: (risikoId: string, status: "aktif" | "ditangani" | "diabaikan") => Promise<void>;
   verifikasiBulkKunjungan: (kunjunganIds: string[], status?: "valid" | "draft" | "diperiksa") => Promise<void>;
  tutupSesiHariH: (jadwalId: string) => Promise<void>;
  linkPendudukSinduksadati: (anggotaId: string, pendudukId: string, residentCode?: string) => void;
  updateUserPhoto: (id: string, foto: string) => Promise<void>;
  tandaiSemuaNotifikasiDibaca: () => void;
  resetToDefaultSeed: () => Promise<void>;
  purgeAllTransactions: () => Promise<void>;
}

const SipanduContext = createContext<SipanduContextValue | undefined>(undefined);

/** Legacy "bumil" -> canonical "ibu_hamil" (selaras PRD + WHO_ENGINE + CategoryBadge) */
function normalizeKategoriAgt(a: any): any {
  if (!a) return a;
  let kat = a.kategori;
  if (kat === "bumil") kat = "ibu_hamil";
  // Peserta laki-laki (jenis_kelamin: "L") tidak dapat berkategori "wus" atau "ibu_hamil"
  if (a.jenis_kelamin === "L" && (kat === "wus" || kat === "ibu_hamil")) {
    kat = "umum";
  }
  return { ...a, kategori: kat };
}

function normalizeKategoriList(list: any[]): any[] {
  return (list || []).map(normalizeKategoriAgt);
}

const DEFAULT_EMPTY_STATE: DataStoreState = {
  posyandu: {
    id: "a0000000-0000-0000-0000-000000000001",
    nama_posyandu: "Posyandu ILP Flamboyan RW 06",
    kode_posyandu: "FLB-RW06",
    desa_kelurahan: "Mojorejo",
    kecamatan: "Junrejo",
    kabupaten_kota: "Kota Batu",
    provinsi: "Jawa Timur",
    rw: "06",
    alamat: "Balai RW 06, Dusun Mojorejo",
    puskesmas_pembina: "Puskesmas Junrejo",
    status_posyandu: "Aktif",
    akreditasi: "Mandiri",
    kontak: "0812-3456-7890",
  },
  organisasi: [],
  users: seedData.users || [],
  jadwal: [],
  keluarga: [],
  anggota: [],
  kunjungan: [],
  kunjunganAktif: [],
  sinduksadatiMaster: [],
  sinduksadatiEvents: [],
  notifikasi: [],
  auditLogs: [],
  penyuluhan: [],
  risiko: [],
};

function loadInitialState(): DataStoreState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.anggota && parsed.keluarga && Array.isArray(parsed.kunjunganAktif)) {
        const usersList = (parsed.users && parsed.users.length > 0 ? parsed.users : seedData.users || []).map((u: any) => {
          if (!u.foto) {
            const seedMatch = (seedData.users || []).find((su: any) => su.peran === u.peran || su.email === u.email);
            if (seedMatch?.foto) return { ...u, foto: seedMatch.foto };
          }
          return u;
        });
        return {
          ...parsed,
          users: usersList,
          anggota: normalizeKategoriList(parsed.anggota),
        };
      }
    }
  } catch (e) {
    console.warn("Failed to read from localStorage", e);
  }

  return DEFAULT_EMPTY_STATE;
}

export function SipanduDataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<DataStoreState>(loadInitialState);
  const [isLoadingDb, setIsLoadingDb] = useState<boolean>(false);
  const { currentUser, showToast } = useAuth();
  const checkInLocks = useRef<Set<string>>(new Set());

  // PRD F-08: data tervalidasi (Valid) tidak bisa diubah Kader; hanya Bidan/Super Admin dapat membuka kunci
  const isLockedFromKader = useCallback((visit: any) => {
    const locked = visit?.status_verifikasi === "valid";
    const canUnlock = currentUser?.peran === "bidan" || currentUser?.peran === "super_admin";
    return locked && !canUnlock;
  }, [currentUser]);

  // Save to localStorage on any state mutation
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error("Gagal menyimpan data ke localStorage", e);
    }
  }, [data]);

  // Load live data from InsForge DB on mount
  const refreshFromDb = useCallback(async (silent = false) => {
    if (!dbService.isConfigured()) return;
    if (!silent) setIsLoadingDb(true);
    try {
      const [pos, org, users, kel, agt, jadwal, visits, logs, risikos, penyuluhans] = await Promise.all([
        dbService.getPosyandu().catch(() => null),
        dbService.getOrganisasi().catch(() => []),
        dbService.getUsers().catch(() => []),
        dbService.getKeluarga().catch(() => []),
        dbService.getAnggota().catch(() => []),
        dbService.getJadwal().catch(() => []),
        dbService.getKunjunganWithDetails().catch(() => []),
        dbService.getAuditLogs().catch(() => []),
        dbService.getRisiko().catch(() => []),
        dbService.getPenyuluhan().catch(() => []),
      ]);

      setData((prev) => {
        const nextKeluarga = kel && kel.length > 0 ? kel : prev.keluarga;
        const nextAnggota = agt && agt.length > 0 ? normalizeKategoriList(agt) : prev.anggota;
        const nextJadwal = jadwal && jadwal.length > 0 ? jadwal : prev.jadwal;
        const nextVisits = visits || [];
        const nextRisiko = risikos && risikos.length > 0 ? risikos : (prev.risiko || []);
        const nextPenyuluhan = (penyuluhans && penyuluhans.length > 0) ? penyuluhans : (prev.penyuluhan || []);

        // Active visits: those with status not 'selesai' or part of current active schedule
        const activeVisits = nextVisits.filter((v: any) => v.status_alur !== "selesai");
        const historyVisits = nextVisits.filter((v: any) => v.status_alur === "selesai");

        // Non-destructive merge for kunjunganAktif to protect local input / offline updates:
        const mergedAktif = activeVisits.map((dbV: any) => {
          const localV = prev.kunjunganAktif.find((lv: any) => lv.id === dbV.id || lv.anggota_id === dbV.anggota_id);
          if (!localV) return dbV;
          return {
            ...dbV,
            ...localV,
            status_alur: dbV.status_alur === "selesai" ? "selesai" : (localV.status_alur || dbV.status_alur),
            pengukuran: { ...(dbV.pengukuran || {}), ...(localV.pengukuran || {}) },
            catatan: { ...(dbV.catatan || {}), ...(localV.catatan || {}) },
            pelayanan: { ...(dbV.pelayanan || {}), ...(localV.pelayanan || {}) },
            risiko: (localV.risiko && localV.risiko.length > 0) ? localV.risiko : (dbV.risiko || []),
          };
        });
        const dbIds = new Set(activeVisits.map((v: any) => v.id));
        const dbAnggotaIds = new Set(activeVisits.map((v: any) => v.anggota_id));
        const purelyLocal = prev.kunjunganAktif.filter((lv: any) => !dbIds.has(lv.id) && !dbAnggotaIds.has(lv.anggota_id));
        const finalKunjunganAktif = [...mergedAktif, ...purelyLocal];

        return {
          ...prev,
          posyandu: pos || prev.posyandu,
          organisasi: org && org.length > 0 ? org : prev.organisasi,
          users: users && users.length > 0 ? users.map((u: any) => ({
            id: u.id,
            nama_lengkap: u.nama_lengkap,
            peran: u.peran,
            email: u.email || `${u.peran}@flamboyan.id`,
            status_aktif: u.status_aktif ?? true,
            foto: u.foto || (seedData.users || []).find((su: any) => su.peran === u.peran)?.foto || null,
          })) : prev.users,
          keluarga: nextKeluarga,
          anggota: nextAnggota,
          jadwal: nextJadwal,
          kunjungan: historyVisits,
          kunjunganAktif: finalKunjunganAktif,
          risiko: nextRisiko,
          penyuluhan: nextPenyuluhan,
          auditLogs: logs && logs.length > 0 ? logs.map((l: any) => ({
            id: l.id,
            user: l.data_baru?.user || "Sistem",
            aksi: l.aksi,
            tabel: l.tabel,
            deskripsi: l.data_baru?.deskripsi || l.aksi,
            waktu: new Date(l.created_at).toLocaleString("id-ID"),
          })) : prev.auditLogs,
        };
      });
    } catch (err) {
      console.warn("Could not sync with InsForge DB, using local state:", err);
    } finally {
      if (!silent) setIsLoadingDb(false);
    }
  }, []);

  useEffect(() => {
    refreshFromDb();
  }, [refreshFromDb]);

  const addAuditLog = useCallback(async (aksi: string, tabel: string, recordCode: string, deskripsi: string) => {
    const newLog = {
      id: `log-${Date.now()}`,
      user: currentUser?.nama_lengkap || "Sistem",
      peran: currentUser?.peran || "kader",
      aksi,
      tabel,
      record_code: recordCode,
      deskripsi,
      waktu: new Date().toLocaleString("id-ID"),
    };

    setData((prev) => ({
      ...prev,
      auditLogs: [newLog, ...(prev.auditLogs || [])],
    }));

    // Async persist to InsForge DB
    if (dbService.isConfigured()) {
      await dbService.logAudit({
        user_id: currentUser?.id || undefined,
        aksi,
        tabel,
        record_id: recordCode,
        deskripsi,
        data_baru: {
          user: currentUser?.nama_lengkap || "Sistem",
          peran: currentUser?.peran || "kader",
          deskripsi,
        },
      });
    }
  }, [currentUser]);

  const checkInPeserta = useCallback(async (anggotaId: string, jadwalId?: string) => {
    const anggota = data.anggota.find((a) => a.id === anggotaId);
    if (!anggota) return { success: false, message: "Peserta tidak ditemukan" };

    // S4: kunjungan selalu tercatat pada SESI AKTIF (bukan ID hardcode)
    const sesi = data.jadwal.find((j) => j.status === "aktif");
    const targetJadwalId = jadwalId || sesi?.id;
    if (!targetJadwalId) {
      showToast("Tidak ada sesi aktif. Buka sesi hari H di halaman Jadwal Posyandu dulu.", "warning");
      return { success: false, message: "Tidak ada sesi aktif" };
    }

    if (checkInLocks.current.has(anggotaId)) {
      const already = data.kunjunganAktif.find((k) => k.anggota_id === anggotaId);
      return { success: true, visit: already, message: "Check-in sedang diproses" };
    }
    checkInLocks.current.add(anggotaId);

    try {
      const already = data.kunjunganAktif.find((k) => k.anggota_id === anggotaId);
      if (already) {
        return { success: true, visit: already, message: "Peserta sudah check-in" };
      }

      let serverVisit: any = null;
      if (dbService.isConfigured()) {
        try {
          const res = await dbService.checkIn(anggotaId, targetJadwalId);
          serverVisit = res.visit;
        } catch (err) {
          console.warn("CheckIn DB error, falling back to local:", err);
        }
      }

      const newVisit = {
        id: serverVisit?.id || `kunj-live-${Date.now()}`,
        jadwal_id: targetJadwalId,
        jadwal_posyandu_id: targetJadwalId,
        anggota_id: anggotaId,
        waktu_hadir: new Date().toISOString(),
        status_verifikasi: "draft",
        status_alur: "meja_2_pengukuran",
        pengukuran: {},
        pelayanan: {},
        catatan: {},
        risiko: [],
      };

      setData((prev) => {
        if (prev.kunjunganAktif.some((k) => k.anggota_id === anggotaId)) {
          return prev;
        }
        return {
          ...prev,
          kunjunganAktif: [newVisit, ...prev.kunjunganAktif],
        };
      });

      addAuditLog("CREATE", "kunjungan", newVisit.id, `Presensi kehadiran: ${anggota.nama}`);
      return { success: true, visit: newVisit, message: "Check-in berhasil" };
    } finally {
      checkInLocks.current.delete(anggotaId);
    }
  }, [data.anggota, data.kunjunganAktif, data.jadwal, addAuditLog, showToast]);

  const updatePengukuran = useCallback(async (anggotaId: string, pengukuran: any) => {
    const activeVisit = data.kunjunganAktif.find((k) => k.anggota_id === anggotaId);

    if (isLockedFromKader(activeVisit)) {
      showToast("Data kunjungan ini sudah tervalidasi Bidan dan tidak dapat diubah. Minta Bidan/Admin untuk membuka kunci.", "warning");
      return;
    }

    setData((prev) => {
      const updated = prev.kunjunganAktif.map((k) => {
        if (k.anggota_id === anggotaId) {
          return {
            ...k,
            status_alur: "meja_3_pencatatan",
            pengukuran: { ...(k.pengukuran || {}), ...pengukuran },
            risiko: pengukuran.risiko || k.risiko || [],
          };
        }
        return k;
      });

      const newRisikoItems = Array.isArray(pengukuran.risiko) ? pengukuran.risiko : [];
      const existingIds = new Set((prev.risiko || []).map((r: any) => r.id));
      const newlyAdded = newRisikoItems.filter((r: any) => r.id && !existingIds.has(r.id));
      const mergedRisiko = [...(prev.risiko || []), ...newlyAdded];

      return { ...prev, kunjunganAktif: updated, risiko: mergedRisiko };
    });

    if (activeVisit && dbService.isConfigured()) {
      try {
        await dbService.savePengukuran(activeVisit.id, pengukuran);
      } catch (e) {
        console.warn("Failed to persist pengukuran to InsForge DB:", e);
      }

      if (Array.isArray(pengukuran.risiko) && pengukuran.risiko.length > 0) {
        try {
          const risikoRows = pengukuran.risiko.map((r: any) => {
            const isObj = typeof r === "object" && r !== null;
            return {
              kunjungan_id: activeVisit.id,
              anggota_id: anggotaId,
              kode_risiko: (isObj && (r.kode_risiko || r.kode)) || "R-GEN",
              deskripsi: (isObj && (r.deskripsi || r.judul)) || String(r),
              severity: (isObj && r.severity) || "warning",
              tindak_lanjut: (isObj && (r.tindak_lanjut || r.tindakLanjut)) || "Konseling & Pantau Rutin",
            };
          });
          await dbService.catatRisiko(risikoRows);
        } catch (e) {
          console.warn("Failed to persist risiko to InsForge DB:", e);
        }
      }
    }

    addAuditLog("UPDATE", "pengukuran", anggotaId, "Memperbarui pengukuran antropometri Meja 2");
  }, [data.kunjunganAktif, addAuditLog, isLockedFromKader, showToast]);

  const updatePencatatan = useCallback(async (anggotaId: string, catatan: any) => {
    const activeVisit = data.kunjunganAktif.find((k) => k.anggota_id === anggotaId);

    if (isLockedFromKader(activeVisit)) {
      showToast("Data kunjungan ini sudah tervalidasi Bidan dan tidak dapat diubah. Minta Bidan/Admin untuk membuka kunci.", "warning");
      return;
    }

    setData((prev) => {
      const updated = prev.kunjunganAktif.map((k) => {
        if (k.anggota_id === anggotaId) {
          return {
            ...k,
            status_alur: "meja_4_pelayanan",
            catatan: { ...(k.catatan || {}), ...catatan },
          };
        }
        return k;
      });
      return { ...prev, kunjunganAktif: updated };
    });

    if (activeVisit && dbService.isConfigured()) {
      try {
        await dbService.savePencatatan(activeVisit.id, catatan);
      } catch (e) {
        console.warn("Failed to persist pencatatan to InsForge DB:", e);
      }
    }

    addAuditLog("UPDATE", "pencatatan", anggotaId, "Memperbarui pencatatan dan keluhan Meja 3");
  }, [data.kunjunganAktif, addAuditLog, isLockedFromKader, showToast]);

  const updatePelayanan = useCallback(async (anggotaId: string, pelayanan: any) => {
    const activeVisit = data.kunjunganAktif.find((k) => k.anggota_id === anggotaId);

    if (isLockedFromKader(activeVisit)) {
      showToast("Data kunjungan ini sudah tervalidasi Bidan dan tidak dapat diubah. Minta Bidan/Admin untuk membuka kunci.", "warning");
      return;
    }

    setData((prev) => {
      const updated = prev.kunjunganAktif.map((k) => {
        if (k.anggota_id === anggotaId) {
          return {
            ...k,
            status_alur: "selesai",
            pelayanan: { ...(k.pelayanan || {}), ...pelayanan },
          };
        }
        return k;
      });
      return { ...prev, kunjunganAktif: updated };
    });

    if (activeVisit && dbService.isConfigured()) {
      try {
        await dbService.savePelayanan(activeVisit.id, pelayanan);
      } catch (e) {
        console.warn("Failed to persist pelayanan to InsForge DB:", e);
      }
    }

    addAuditLog("UPDATE", "pelayanan", anggotaId, "Menyelesaikan pelayanan kesehatan Meja 4");
  }, [data.kunjunganAktif, addAuditLog, isLockedFromKader, showToast]);

  const tambahKeluarga = useCallback(async (keluargaData: any) => {
    let serverKeluarga: any = null;
    if (dbService.isConfigured()) {
      try {
        serverKeluarga = await dbService.createKeluarga(keluargaData);
      } catch (e) {
        console.warn("Failed to create keluarga in InsForge DB:", e);
      }
    }

    const newKeluarga = serverKeluarga || {
      id: `kk-live-${Date.now()}`,
      nomor_kk: keluargaData.nomor_kk,
      nama_kepala_keluarga: keluargaData.nama_kepala_keluarga,
      alamat: keluargaData.alamat || "Jl. Mojorejo RW 06",
      rt: keluargaData.rt || "14",
      rw: "06",
      kelurahan: "Mojorejo",
      kecamatan: "Junrejo",
      status_ekonomi: keluargaData.status_ekonomi || "sejahtera_2",
    };

    setData((prev) => ({
      ...prev,
      keluarga: [newKeluarga, ...prev.keluarga],
    }));

    addAuditLog("CREATE", "keluarga", newKeluarga.nomor_kk, `Mendaftarkan KK baru: ${newKeluarga.nama_kepala_keluarga}`);
    return newKeluarga;
  }, [addAuditLog]);

  const tambahAnggota = useCallback(async (anggotaData: any) => {
    let serverAnggota: any = null;
    if (dbService.isConfigured()) {
      try {
        serverAnggota = await dbService.createAnggota(anggotaData);
      } catch (e) {
        console.warn("Failed to create anggota in InsForge DB:", e);
      }
    }

    const newAnggota = serverAnggota || {
      id: `agt-live-${Date.now()}`,
      keluarga_id: anggotaData.keluarga_id,
      nik: anggotaData.nik,
      nama: anggotaData.nama,
      jenis_kelamin: anggotaData.jenis_kelamin,
      tanggal_lahir: anggotaData.tanggal_lahir,
      hubungan_keluarga: anggotaData.hubungan_keluarga || "Anak",
      kategori: anggotaData.kategori,
      status_aktif: true,
      status_hamil: Boolean(anggotaData.status_hamil),
      hpht: anggotaData.hpht || null,
      foto: anggotaData.foto || "",
    };

    setData((prev) => ({
      ...prev,
      anggota: [newAnggota, ...prev.anggota],
    }));

    addAuditLog("CREATE", "anggota", newAnggota.nik, `Mendaftarkan anggota baru: ${newAnggota.nama}`);

    // F1: catat kehamilan aktif bila anggota ditandai hamil (DDL tabel kehamilan)
    if (anggotaData.status_hamil && anggotaData.hpht && dbService.isConfigured()) {
      try {
        await dbService.createKehamilan(newAnggota.id, anggotaData.hpht);
      } catch (e) {
        console.warn("Failed to create kehamilan record:", e);
      }
    }

    return newAnggota;
  }, [addAuditLog]);

  const updateKeluarga = useCallback(async (id: string, patch: any) => {
    setData((prev) => ({
      ...prev,
      keluarga: prev.keluarga.map((k) => (k.id === id ? { ...k, ...patch } : k)),
    }));

    if (dbService.isConfigured()) {
      try {
        await dbService.updateKeluarga(id, patch);
      } catch (e) {
        console.warn("Failed to update keluarga in InsForge DB:", e);
      }
    }

    addAuditLog("UPDATE", "keluarga", id, "Memperbarui data keluarga");
  }, [addAuditLog]);

  const updateAnggota = useCallback(async (id: string, patch: any) => {
    // Guard gender (PRD 37): laki-laki tidak dapat ditandai hamil
    const target = data.anggota.find((a) => a.id === id);
    if (target && patch.status_hamil && target.jenis_kelamin !== "P") {
      showToast("Anggota berjenis kelamin laki-laki tidak dapat ditandai hamil.", "danger");
      return;
    }

    setData((prev) => ({
      ...prev,
      anggota: prev.anggota.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    }));

    if (dbService.isConfigured()) {
      try {
        await dbService.updateAnggota(id, patch);
      } catch (e) {
        console.warn("Failed to update anggota in InsForge DB:", e);
      }
      if (patch.status_hamil && patch.hpht) {
        try {
          await dbService.createKehamilan(id, patch.hpht);
        } catch (e) {
          console.warn("Failed to create kehamilan record:", e);
        }
      }
      // (BUG #7) Bila kehamilan dibatalkan (status_hamil=false), finalisasi record kehamilan
      // aktif di DB agar tidak menjadi orphan dengan status 'aktif'.
      if (patch.status_hamil === false) {
        try {
          await dbService.selesaikanKehamilan(id);
        } catch (e) {
          console.warn("Failed to finalize kehamilan on cancel:", e);
        }
      }
    }

    addAuditLog("UPDATE", "anggota", id, "Memperbarui data anggota");
  }, [data.anggota, addAuditLog, showToast]);

  const selesaikanKehamilan = useCallback(async (anggotaId: string) => {
    // Recalc kategori kembali berbasis usia (PRD F-04: pasca persalinan)
    const target = data.anggota.find((a) => a.id === anggotaId);
    if (!target) return;

    const usiaInfo = hitungUsia(target.tanggal_lahir);
    const kategoriBaru = klasifikasiSasaran(usiaInfo, target.jenis_kelamin, false).kode;

    setData((prev) => ({
      ...prev,
      anggota: prev.anggota.map((a) =>
        a.id === anggotaId ? { ...a, status_hamil: false, hpht: null, kategori: kategoriBaru } : a
      ),
    }));

    if (dbService.isConfigured()) {
      try {
        await dbService.selesaikanKehamilan(anggotaId);
      } catch (e) {
        console.warn("Failed to finalize kehamilan in InsForge DB:", e);
      }
    }

    addAuditLog("UPDATE", "kehamilan", anggotaId, `Menyelesaikan kehamilan; kategori dikembalikan ke ${kategoriBaru}`);
  }, [data.anggota, addAuditLog]);

  const tambahJadwal = useCallback(async (jadwalData: any) => {
    let serverJadwal: any = null;
    if (dbService.isConfigured()) {
      try {
        serverJadwal = await dbService.createJadwal(jadwalData);
      } catch (e) {
        console.warn("Failed to create jadwal in InsForge DB:", e);
      }
    }

    const newJadwal = serverJadwal || {
      id: `jadwal-${Date.now()}`,
      tanggal: jadwalData.tanggal,
      jenis: jadwalData.jenis || "bulanan",
      tema: jadwalData.tema || "Posyandu Rutin",
      tempat: jadwalData.tempat || "Balai RW 06 Flamboyan",
      catatan: jadwalData.catatan || "",
      // "Mulai Alur 5 Meja" mengirim status "aktif" langsung (pola legacy); form perencanaan default draft
      status: jadwalData.status || "draft",
    };

    setData((prev) => ({
      ...prev,
      jadwal: [newJadwal, ...prev.jadwal],
    }));

    addAuditLog("CREATE", "jadwal", newJadwal.id, `Membuat jadwal posyandu: ${newJadwal.tema || newJadwal.tanggal}`);
    return newJadwal;
  }, [addAuditLog]);

  const updateJadwalStatus = useCallback(async (jadwalId: string, status: "draft" | "aktif" | "selesai" | "dibatalkan") => {
    // (BUG #6) Saat mengaktifkan 1 jadwal, jadwal aktif LAIN harus ikut di-set "selesai"
    // di DB agar tidak ada >1 sesi aktif (check-in akan memilih sesi salah).
    const otherActiveIds =
      status === "aktif"
        ? (data.jadwal || []).filter((j) => j.status === "aktif" && j.id !== jadwalId).map((j) => j.id)
        : [];

    setData((prev) => {
      const updatedJadwal = prev.jadwal.map((j) => {
        if (j.id === jadwalId) return { ...j, status };
        if (status === "aktif" && j.status === "aktif") return { ...j, status: "selesai" as const };
        return j;
      });

      let newKunjunganAktif = prev.kunjunganAktif;
      let newHistory = prev.kunjungan;
      if (status === "aktif") {
        const matchingVisits = prev.kunjungan.filter(
          (k: any) => k.jadwal_id === jadwalId || k.jadwal_posyandu_id === jadwalId
        );
        if (matchingVisits.length > 0) {
          newKunjunganAktif = matchingVisits;
          newHistory = prev.kunjungan.filter(
            (k: any) => k.jadwal_id !== jadwalId && k.jadwal_posyandu_id !== jadwalId
          );
        }
      } else if (status === "selesai") {
        const completedVisits = prev.kunjunganAktif.map((k: any) => ({
          ...k,
          jadwal_id: k.jadwal_id || jadwalId,
          status_alur: "selesai",
        }));
        newKunjunganAktif = [];
        newHistory = [...completedVisits, ...prev.kunjungan];
      }

      return {
        ...prev,
        jadwal: updatedJadwal,
        kunjunganAktif: newKunjunganAktif,
        kunjungan: newHistory,
      };
    });

    if (dbService.isConfigured()) {
      try {
        await insforgeUpdateJadwalStatus(jadwalId, status);
        // Propagasi jadwal aktif lain -> selesai ke DB
        for (const otherId of otherActiveIds) {
          try {
            await insforgeUpdateJadwalStatus(otherId, "selesai");
          } catch (e) {
            console.warn(`Failed to close other active jadwal ${otherId}:`, e);
          }
        }
      } catch (e) {
        console.warn("Failed to update jadwal status:", e);
      }
    }

    addAuditLog("UPDATE", "jadwal", jadwalId, `Status jadwal diubah menjadi: ${status}`);
  }, [addAuditLog, data.jadwal]);

  async function insforgeUpdateJadwalStatus(jadwalId: string, status: string) {
    const { insforge } = await import("@/lib/insforge");
    try {
      await insforge.database.from("jadwal_posyandu").update({ status }).eq("id", jadwalId);
    } catch (e) {
      console.warn("Database jadwal_posyandu update non-critical error:", e);
    }
  }

  const tambahPenyuluhan = useCallback(async (penyuluhanData: any) => {
    let jadwalId = penyuluhanData.jadwal_id || penyuluhanData.jadwal_posyandu_id || penyuluhanData.sesi_id;
    if (!jadwalId) {
      const activeJadwal = data.jadwal.find((j: any) => j.status === "aktif") || data.jadwal[0];
      jadwalId = activeJadwal?.id || "3b8467a2-62de-4307-aa62-fc3e7e685e10";
    }

    const jumlahPeserta = Number(penyuluhanData.jumlah_peserta ?? penyuluhanData.jumlah ?? 1);

    const newPeny = {
      id: penyuluhanData.id || `peny-${Date.now()}`,
      jadwal_id: jadwalId,
      jadwal_posyandu_id: jadwalId,
      tema: penyuluhanData.tema,
      narasumber: penyuluhanData.narasumber || "Kader Posyandu Flamboyan",
      jumlah_peserta: jumlahPeserta,
      jumlah: jumlahPeserta,
      metode: penyuluhanData.metode || "Ceramah & Demonstrasi",
      media: penyuluhanData.media || "",
      ringkasan: penyuluhanData.ringkasan || "",
      waktu: penyuluhanData.waktu || new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    // Update local state immediately for fast UI feedback
    setData((prev) => ({
      ...prev,
      penyuluhan: [newPeny, ...(prev.penyuluhan || []).filter((p: any) => p.id !== newPeny.id)],
    }));

    addAuditLog("CREATE", "penyuluhan", newPeny.id, `Mendokumentasikan penyuluhan: ${newPeny.tema}`);

    // Persist to Cloud Database via dbService
    try {
      await dbService.catatPenyuluhan(newPeny);
    } catch (e) {
      console.warn("Non-critical: Gagal menyimpan penyuluhan ke dbService:", e);
    }
  }, [data.jadwal, addAuditLog]);

  const verifikasiKunjungan = useCallback(
    async (kunjunganId: string, status: "valid" | "draft" | "diperiksa" = "valid", catatan?: string) => {
      setData((prev) => {
        const updated = prev.kunjunganAktif.map((k) => {
          if (k.id === kunjunganId) {
            const next: any = {
              ...k,
              status_verifikasi: status,
              waktu_verifikasi: new Date().toISOString(),
            };
            if (status === "draft" && catatan) next.catatan_kembalikan = catatan;
            return next;
          }
          return k;
        });
        return { ...prev, kunjunganAktif: updated };
      });

      if (dbService.isConfigured()) {
        try {
          await dbService.verifyKunjungan(kunjunganId, status);
        } catch (e) {
          console.warn("Failed to persist verification to InsForge DB:", e);
        }
      }

      addAuditLog(
        "UPDATE",
        "verifikasi_bidan",
        kunjunganId,
        catatan ? `Validasi status kunjungan: ${status} — Catatan: ${catatan}` : `Validasi status kunjungan: ${status}`
      );
    },
    [addAuditLog]
  );

  // (BUG #16) Bidan/Super Admin dapat membuka kunci kunjungan yang sudah tervalidasi
  // dengan mengembalikan status_verifikasi ke "draft" agar bisa diedit kembali.
  const bukaKunciKunjungan = useCallback(async (kunjunganId: string) => {
    setData((prev) => {
      const updated = prev.kunjunganAktif.map((k) => {
        if (k.id === kunjunganId) return { ...k, status_verifikasi: "draft", waktu_verifikasi: undefined };
        return k;
      });
      return { ...prev, kunjunganAktif: updated };
    });

    if (dbService.isConfigured()) {
      try {
        await dbService.verifyKunjungan(kunjunganId, "draft");
      } catch (e) {
        console.warn("Failed to unlock kunjungan in DB:", e);
      }
    }

    addAuditLog("UPDATE", "verifikasi_bidan", kunjunganId, "Kunjungan dibuka kunci (status valid -> draft).");
  }, [addAuditLog]);

  // G3: state risiko aktif -> ditangani | diabaikan (PRD 35.4)
  const updateStatusRisiko = useCallback(async (risikoId: string, status: "aktif" | "ditangani" | "diabaikan") => {
    // Id lokal berformat "risiko::<kunjunganId>::<kode>" (sintetik, BUG #4).
    // Parse untuk memanggil DB via kunjungan_id + kode_risiko bila perlu.
    let dbKunjunganId: string | undefined;
    let dbKode: string | undefined;
    if (risikoId.startsWith("risiko::")) {
      const parts = risikoId.split("::");
      dbKunjunganId = parts[1];
      dbKode = parts[2];
    }

    setData((prev) => {
      const updatedRisiko = (prev.risiko || []).map((r) => (r.id === risikoId ? { ...r, status } : r));

      const matches = (r: any, kId: string) => {
        if (typeof r === "string") return `risiko::${kId}::${r}` === risikoId || `${kId}-${r}` === risikoId;
        return r.id === risikoId;
      };

      const updatedAktif = prev.kunjunganAktif.map((k) => {
        if (!(k.risiko || []).some((r: any) => matches(r, k.id))) return k;
        return {
          ...k,
          risiko: k.risiko.map((r: any) => (matches(r, k.id) ? (typeof r === "object" ? { ...r, status } : { id: risikoId, judul: r, status }) : r)),
        };
      });

      const updatedKunjungan = prev.kunjungan.map((k) => {
        if (!(k.risiko || []).some((r: any) => matches(r, k.id))) return k;
        return {
          ...k,
          risiko: k.risiko.map((r: any) => (matches(r, k.id) ? (typeof r === "object" ? { ...r, status } : { id: risikoId, judul: r, status }) : r)),
        };
      });

      return { ...prev, risiko: updatedRisiko, kunjunganAktif: updatedAktif, kunjungan: updatedKunjungan };
    });

    if (dbService.isConfigured()) {
      try {
        await dbService.updateStatusRisiko(risikoId, status, {
          kunjungan_id: dbKunjunganId,
          kode_risiko: dbKode,
        });
      } catch (e) {
        console.warn("Failed to update risiko status in DB:", e);
      }
    }

    addAuditLog("UPDATE", "risiko", risikoId, `Status risiko diubah menjadi: ${status}`);
  }, [addAuditLog]);

  const verifikasiBulkKunjungan = useCallback(async (kunjunganIds: string[], status: "valid" | "draft" | "diperiksa" = "valid") => {
    const idSet = new Set(kunjunganIds);

    setData((prev) => {
      const updated = prev.kunjunganAktif.map((k) => {
        if (idSet.has(k.id)) {
          return {
            ...k,
            status_verifikasi: status,
            waktu_verifikasi: new Date().toISOString(),
          };
        }
        return k;
      });
      return { ...prev, kunjunganAktif: updated };
    });

    if (dbService.isConfigured()) {
      for (const id of kunjunganIds) {
        try {
          await dbService.verifyKunjungan(id, status);
        } catch (e) {
          console.warn(`Failed to persist verification for ${id}:`, e);
        }
      }
    }

    addAuditLog("UPDATE", "verifikasi_bidan", kunjunganIds.join(","), `Verifikasi massal ${kunjunganIds.length} kunjungan menjadi: ${status}`);
  }, [addAuditLog]);

  const tutupSesiHariH = useCallback(async (jadwalId: string) => {
    // G1: hitung risiko level-sesi (R-B07/B08, R-H04) untuk sasaran yang absen
    const sesiTerbaru = new Date().toISOString();
    const hadirByAnggota = new Map<string, string[]>();
    [...data.kunjungan].forEach((k: any) => {
      const list = hadirByAnggota.get(k.anggota_id) || [];
      list.push(k.waktu_hadir);
      hadirByAnggota.set(k.anggota_id, list);
    });
    data.kunjunganAktif.forEach((k: any) => {
      const list = hadirByAnggota.get(k.anggota_id) || [];
      list.push(k.waktu_hadir);
      hadirByAnggota.set(k.anggota_id, list);
    });

    const risikoSesi = data.anggota
      .filter((a: any) => a.status_aktif && a.kategori !== "umum" && !data.kunjunganAktif.some((k: any) => k.anggota_id === a.id))
      .map((a: any) => {
        const riwayat = (hadirByAnggota.get(a.id) || []).sort();
        const terakhir = riwayat[riwayat.length - 1] || null;
        const sebelumnya = riwayat[riwayat.length - 2] || null;
        const flags = deteksiRisikoSesi(a.kategori, sesiTerbaru, terakhir, sebelumnya);
        return { anggota: a, flags };
      })
      .filter((r) => r.flags.length > 0);

    const notifSesi = risikoSesi.flatMap((r) =>
      r.flags.map((f) => ({
        id: `notif-sesi-${Date.now()}-${r.anggota.id}-${f.kode}`,
        judul: `${f.kode}: ${r.anggota.nama}`,
        pesan: `${f.judul} — ${f.tindakLanjut}`,
        tipe: f.severity === "danger" ? "danger" : "warning",
        tanggal: new Date().toLocaleString("id-ID"),
        dibaca: false,
      }))
    );

    setData((prev) => {
      const updatedJadwal = prev.jadwal.map((j) => (j.id === jadwalId ? { ...j, status: "selesai" } : j));
      const newHistory = [...prev.kunjunganAktif, ...prev.kunjungan];
      return {
        ...prev,
        jadwal: updatedJadwal,
        kunjungan: newHistory,
        kunjunganAktif: [],
        notifikasi: [...(notifSesi as any[]), ...(prev.notifikasi || [])],
      };
    });

    if (dbService.isConfigured()) {
      try {
        await dbService.closeSession(jadwalId);
      } catch (e) {
        console.warn("Failed to close session in InsForge DB:", e);
      }
    }

    addAuditLog(
      "CLOSE",
      "sesi_posyandu",
      jadwalId,
      notifSesi.length > 0
        ? `Sesi ditutup. ${notifSesi.length} sasaran terdeteksi absen/risiko (R-B07/B08, R-H04).`
        : "Sesi Posyandu Hari H resmi ditutup tanpa kasus absen prioritas."
    );
  }, [data.anggota, data.kunjungan, data.kunjunganAktif, addAuditLog]);

  const tandaiSemuaNotifikasiDibaca = useCallback(() => {
    setData((prev) => ({
      ...prev,
      notifikasi: (prev.notifikasi || []).map((n: any) => ({ ...n, dibaca: true })),
    }));
  }, []);

  const linkPendudukSinduksadati = useCallback((anggotaId: string, pendudukId: string, residentCode?: string) => {
    setData((prev) => {
      const updatedAnggota = prev.anggota.map((a) => {
        if (a.id === anggotaId) {
          return { ...a, sinduksadati_penduduk_id: pendudukId, sinduksadati_sync_at: new Date().toISOString() };
        }
        return a;
      });

      const updatedMaster = (prev.sinduksadatiMaster || []).map((m) => {
        if (m.penduduk_id === pendudukId) {
          return { ...m, linked_sipandu_anggota_id: anggotaId };
        }
        return m;
      });

      return {
        ...prev,
        anggota: updatedAnggota,
        sinduksadatiMaster: updatedMaster,
      };
    });

    // L1: persist link ke DB (kolom PRD 42.5)
    if (dbService.isConfigured()) {
      (async () => {
        try {
          const { insforge } = await import("@/lib/insforge");
          await insforge.database
            .from("anggota")
            .update({ sinduksadati_penduduk_id: pendudukId, sinduksadati_sync_at: new Date().toISOString() })
            .eq("id", anggotaId);
        } catch (e) {
          console.warn("Failed to persist sinduksadati link:", e);
        }
      })();
    }

    addAuditLog("LINK", "sinduksadati", anggotaId, `Link anggota ke SINDUKSADATI: ${residentCode || pendudukId}`);
  }, [addAuditLog]);

  const resetToDefaultSeed = useCallback(async () => {
    localStorage.removeItem(STORAGE_KEY);
    await refreshFromDb();
    addAuditLog("RESET", "database", "all", "Super Admin menyinkronkan ulang seluruh data master dari InsForge Cloud.");
  }, [addAuditLog, refreshFromDb]);

  // Purge all transactions in InsForge DB + clean local visits
  const purgeAllTransactions = useCallback(async () => {
    if (dbService.isConfigured()) {
      await dbService.purgeTransactionalData();
    }
    localStorage.removeItem(STORAGE_KEY);
    setData((prev) => ({
      ...prev,
      kunjungan: [],
      kunjunganAktif: [],
      auditLogs: [],
    }));
    addAuditLog("PURGE", "database", "all", "Super Admin membersihkan seluruh data kunjungan dan transaksi.");
  }, [addAuditLog]);

  // Update foto profil pengguna terpusat oleh Admin
  const updateUserPhoto = useCallback(async (id: string, foto: string) => {
    setData((prev) => ({
      ...prev,
      users: (prev.users || []).map((u: any) => (u.id === id ? { ...u, foto } : u)),
    }));

    if (dbService.isConfigured()) {
      try {
        await dbService.updateUserPhoto(id, foto);
      } catch (err) {
        console.error("Gagal update foto pengguna di database:", err);
        throw err;
      }
    }

    addAuditLog("UPDATE", "users", id, `Foto profil pengguna diperbarui oleh Admin.`);
  }, [addAuditLog]);

  return (
    <SipanduContext.Provider
      value={{
        data,
        isLoadingDb,
        refreshFromDb,
        checkInPeserta,
        updatePengukuran,
        updatePencatatan,
        updatePelayanan,
        tambahKeluarga,
        tambahAnggota,
        tambahJadwal,
        updateJadwalStatus,
        tambahPenyuluhan,
        updateKeluarga,
        updateAnggota,
        selesaikanKehamilan,
        verifikasiKunjungan,
        bukaKunciKunjungan,
        verifikasiBulkKunjungan,
        updateStatusRisiko,
        tutupSesiHariH,
        linkPendudukSinduksadati,
        updateUserPhoto,
        tandaiSemuaNotifikasiDibaca,
        resetToDefaultSeed,
        purgeAllTransactions,
      }}
    >
      {children}
    </SipanduContext.Provider>
  );
}

export function useSipandu(): SipanduContextValue {
  const ctx = useContext(SipanduContext);
  if (!ctx) throw new Error("useSipandu must be used within SipanduDataProvider");
  return ctx;
}
