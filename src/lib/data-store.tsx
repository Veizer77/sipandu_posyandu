/**
 * SIPANDU - Reactive & Persistent Data Store
 * Terintegrasi penuh ke database InsForge PostgreSQL via dbService.
 * Seluruh mutasi Alur 5 Meja disimpan ke cloud database.
 */
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "./auth-context";
import { dbService } from "@/services/dbService";
import { hitungUsia, klasifikasiSasaran, deteksiRisikoSesi } from "@/utils/zscoreCalculator";
import { findExistingSessionVisit } from "@/lib/meja1Logic";
import seedData from "./seedData";

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
  /** M5-019: error baca terakhir (null = OK); bedakan "kosong" dari "gagal baca". */
  penyuluhanError: string | null;
  /** RK-015: rencana kunjungan rumah (persist DB, lintas sesi). */
  rencanaKunjungan: any[];
  /** RK-022: sesi terakhir ditutup (untuk tampilan arsip read-only). */
  sesiArsipId: string | null;
  risiko: any[];
}

interface SipanduContextValue {
  data: DataStoreState;
  isLoadingDb: boolean;
  /** ID sesi aktif; null bila tidak ada / ambigu (>1 aktif). (MEJA-2 M2-001) */
  activeSessionId: string | null;
  refreshFromDb: (silent?: boolean) => Promise<void>;
  checkInPeserta: (anggotaId: string) => Promise<{ success: boolean; visit?: any; message: string }>;
  updatePengukuran: (anggotaId: string, pengukuran: any, opts?: { kunjunganId?: string }) => Promise<void>;
  updatePencatatan: (
    anggotaId: string,
    catatan: any,
    opts?: { kunjunganId?: string; expectedUpdatedAt?: string | null }
  ) => Promise<{ action: "created" | "updated"; id?: string; updatedAt?: string | null }>;
  updatePelayanan: (
    anggotaId: string,
    pelayanan: any,
    opts?: { kunjunganId?: string; expectedUpdatedAt?: string | null }
  ) => Promise<{ action: "created" | "updated"; id?: string; updatedAt?: string | null; imunisasiDisimpan?: number }>;
  reopenKunjungan: (
    kunjunganId: string,
    target?: "meja_2_pengukuran" | "meja_3_pencatatan" | "meja_4_pelayanan"
  ) => Promise<{ kunjunganId: string; target: string }>;
  tambahKeluarga: (keluargaData: any) => Promise<any>;
  tambahAnggota: (anggotaData: any) => Promise<any>;
  tambahJadwal: (jadwalData: any) => Promise<any>;
  updateJadwalStatus: (jadwalId: string, status: "draft" | "aktif" | "dibatalkan") => Promise<void>;
  tambahPenyuluhan: (penyuluhanData: any) => Promise<{ row: any; action: "created" | "existed" }>;
  ubahPenyuluhan: (id: string, patch: any) => Promise<any>;
  hapusPenyuluhan: (id: string) => Promise<void>;
  updateKeluarga: (id: string, patch: any) => Promise<void>;
  updateAnggota: (id: string, patch: any) => Promise<void>;
  selesaikanKehamilan: (anggotaId: string) => Promise<void>;
   verifikasiKunjungan: (kunjunganId: string, status?: "valid" | "draft" | "diperiksa", catatan?: string) => Promise<void>;
   bukaKunciKunjungan: (kunjunganId: string) => Promise<void>;
  updateStatusRisiko: (risikoId: string, status: "aktif" | "ditangani" | "diabaikan") => Promise<void>;
   verifikasiBulkKunjungan: (kunjunganIds: string[], status?: "valid" | "draft" | "diperiksa") => Promise<void>;
  tutupSesiHariH: (jadwalId: string) => Promise<{ closedCount: number; notifCount: number }>;
  jadwalkanKunjunganRumah: (anggotaId: string, alasan?: string | null) => Promise<{ row: any; action: "created" | "existed" }>;
  updateStatusRencana: (id: string, status: "terjadwal" | "selesai" | "dibatalkan") => Promise<any>;
  linkPendudukSinduksadati: (anggotaId: string, pendudukId: string, residentCode?: string) => void;
  updateUserPhoto: (id: string, foto: string) => Promise<void>;
  tandaiSemuaNotifikasiDibaca: () => void;
  resetToDefaultSeed: () => Promise<void>;
  purgeAllTransactions: () => Promise<void>;
  sinkronkanDataKeCloud: () => Promise<{ success: boolean; syncedCount: number; message: string }>;
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
  penyuluhanError: null,
  rencanaKunjungan: [],
  // RK-022: arsip terakhir bertahan melewati refresh (localStorage) agar
  // tampilan arsip + cetak rekap tidak hilang setelah reload halaman.
  sesiArsipId: loadSesiArsipId(),
  risiko: [],
};

const SESI_ARSIP_KEY = "sipandu_sesi_arsip_terakhir";

function loadSesiArsipId(): string | null {
  try {
    if (typeof localStorage === "undefined") return null;
    return localStorage.getItem(SESI_ARSIP_KEY);
  } catch {
    return null;
  }
}

function saveSesiArsipId(jadwalId: string | null): void {
  try {
    if (typeof localStorage === "undefined") return;
    if (jadwalId) localStorage.setItem(SESI_ARSIP_KEY, jadwalId);
    else localStorage.removeItem(SESI_ARSIP_KEY);
  } catch {
    // Penyimpanan lokal tidak tersedia — arsip hanya sesi berjalan.
  }
}

export function SipanduDataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<DataStoreState>(DEFAULT_EMPTY_STATE);
  const [isLoadingDb, setIsLoadingDb] = useState<boolean>(false);
  const { currentUser, showToast } = useAuth();
  const checkInLocks = useRef<Set<string>>(new Set());

  // PRD F-08: data tervalidasi (Valid) tidak bisa diubah Kader; hanya Bidan/Super Admin dapat membuka kunci
  const isLockedFromKader = useCallback((visit: any) => {
    const locked = visit?.status_verifikasi === "valid";
    const canUnlock = currentUser?.peran === "bidan" || currentUser?.peran === "super_admin";
    return locked && !canUnlock;
  }, [currentUser]);

  // Load live data DIRECTLY from InsForge DB (100% cloud database, no localStorage)
  const refreshFromDb = useCallback(async (silent = false) => {
    if (!dbService.isConfigured()) return;
    if (!silent) setIsLoadingDb(true);
    try {
      // M5-019: kegagalan baca penyuluhan dicatat terpisah (null = OK).
      let penyuluhanReadError: string | null = null;
      // Gagal fetch kunjungan ≠ kunjungan kosong: bedakan agar polling yang
      // gagal sesaat tidak menghapus seluruh antrean/arsip lokal (desync).
      let visitsReadError = false;
      const [pos, org, users, kel, agt, jadwal, visits, logs, risikos, penyuluhans, rencana] = await Promise.all([
        dbService.getPosyandu().catch(() => null),
        dbService.getOrganisasi().catch(() => []),
        dbService.getUsers().catch(() => []),
        dbService.getKeluarga().catch(() => []),
        dbService.getAnggota().catch(() => []),
        dbService.getJadwal().catch(() => []),
        dbService.getKunjunganWithDetails().catch(() => {
          visitsReadError = true;
          return null;
        }),
        dbService.getAuditLogs().catch(() => []),
        dbService.getRisiko().catch(() => []),
        dbService.getPenyuluhan().catch((e) => {
          penyuluhanReadError = e?.message || "Gagal membaca data penyuluhan dari database.";
          return null;
        }),
        dbService.getRencanaKunjungan().catch(() => []),
      ]);

      setData((prev) => {
        const nextKeluarga = kel && kel.length > 0 ? kel : prev.keluarga;
        const nextAnggota = agt && agt.length > 0 ? normalizeKategoriList(agt) : prev.anggota;
        const nextJadwal = jadwal && jadwal.length > 0 ? jadwal : prev.jadwal;
        const nextVisits = visitsReadError
          ? [...prev.kunjunganAktif, ...prev.kunjungan]
          : (visits || []);
        const nextRisiko = risikos && risikos.length > 0 ? risikos : (prev.risiko || []);
        // Error baca: pertahankan data lama + tandai (jangan tampilkan "kosong").
        const nextPenyuluhan = penyuluhanReadError ? (prev.penyuluhan || []) : (penyuluhans || []);

        // Active visits: those with status not 'selesai' directly from InsForge database
        const activeVisits = nextVisits.filter((v: any) => v.status_alur !== "selesai");
        const historyVisits = nextVisits.filter((v: any) => v.status_alur === "selesai");

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
          kunjunganAktif: activeVisits,
          risiko: nextRisiko,
          penyuluhan: nextPenyuluhan,
          penyuluhanError: penyuluhanReadError,
          rencanaKunjungan: rencana || [],
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
      console.error("Gagal sinkronisasi dengan database InsForge:", err);
    } finally {
      if (!silent) setIsLoadingDb(false);
    }
  }, []);

  // Migrasi satu kali & pembersihan total: Angkat data tersisa dari localStorage ke InsForge DB lalu hapus localStorage permanen
  useEffect(() => {
    async function purgeAndMigrateLegacyStorage() {
      try {
        const keys = ["sipandu_db_v3_state", "sipandu_state_v3"];
        for (const k of keys) {
          const raw = localStorage.getItem(k);
          if (raw) {
            try {
              const parsed = JSON.parse(raw);
              const allVisits = [...(parsed?.kunjunganAktif || []), ...(parsed?.kunjungan || [])];
              const visitsWithInput = allVisits.filter((v: any) =>
                (v.pengukuran && Object.keys(v.pengukuran).length > 0) ||
                (v.catatan && Object.keys(v.catatan).length > 0) ||
                (v.pelayanan && Object.keys(v.pelayanan).length > 0)
              );

              if (visitsWithInput.length > 0 && dbService.isConfigured()) {
                const dbAnggota = await dbService.getAnggota().catch(() => []);
                const agtByNik = new Map<string, any>();
                (dbAnggota || []).forEach((a: any) => agtByNik.set(a.nik, a));
                const dbJadwal = await dbService.getJadwal().catch(() => []);
                // Hanya migrasikan ke sesi aktif; jangan fallback ke jadwal[0] (risiko salah sesi)
                const targetJadwalId = dbJadwal.find((j: any) => j.status === "aktif")?.id;

                for (const v of visitsWithInput) {
                  let realAgt = (dbAnggota || []).find((a: any) => a.id === v.anggota_id);
                  if (!realAgt) {
                    const localAgt = (parsed.anggota || []).find((a: any) => a.id === v.anggota_id);
                    if (localAgt?.nik) realAgt = agtByNik.get(localAgt.nik);
                  }
                  if (!realAgt || !targetJadwalId) continue;

                  const res = await dbService.checkIn(realAgt.id, targetJadwalId).catch(() => null);
                  const dbVisitId = res?.visit?.id;
                  if (!dbVisitId) continue;

                  if (v.pengukuran && Object.keys(v.pengukuran).length > 0) {
                    await dbService.savePengukuran(dbVisitId, v.pengukuran).catch(() => undefined);
                  }
                  if (v.catatan && Object.keys(v.catatan).length > 0) {
                    await dbService.savePencatatan(dbVisitId, v.catatan).catch(() => undefined);
                  }
                  if (v.pelayanan && Object.keys(v.pelayanan).length > 0) {
                    await dbService.savePelayanan(dbVisitId, v.pelayanan).catch(() => undefined);
                  }
                }
              }
            } catch (innerErr) {
              console.warn("Legacy storage parse error:", innerErr);
            } finally {
              // Hapus total dari localStorage agar tidak ada lagi jejak penyimpanan lokal
              localStorage.removeItem(k);
            }
          }
        }
      } catch (e) {
        console.warn("Storage cleanup error:", e);
      } finally {
        refreshFromDb(true);
      }
    }

    purgeAndMigrateLegacyStorage();
  }, [refreshFromDb]);

  useEffect(() => {
    refreshFromDb();
  }, [refreshFromDb, currentUser?.id]);

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

  const checkInPeserta = useCallback(async (anggotaId: string) => {
    const anggota = data.anggota.find((a) => a.id === anggotaId);
    if (!anggota) return { success: false, message: "Peserta tidak ditemukan" };

    // S4: kunjungan selalu tercatat pada SESI AKTIF (bukan ID bebas/hardcode)
    const sesi = data.jadwal.find((j) => j.status === "aktif");
    const targetJadwalId = sesi?.id;
    if (!targetJadwalId) {
      showToast("Tidak ada sesi aktif. Buka sesi hari H di halaman Jadwal Posyandu dulu.", "warning");
      return { success: false, message: "Tidak ada sesi aktif" };
    }

    // Cegah race: lock per anggota+sesi (bukan anggota global)
    const lockKey = `${targetJadwalId}:${anggotaId}`;
    if (checkInLocks.current.has(lockKey)) {
      const already = findExistingSessionVisit(data.kunjunganAktif, anggotaId, targetJadwalId);
      return { success: true, visit: already, message: "Check-in sedang diproses" };
    }
    checkInLocks.current.add(lockKey);

    try {
      // Existing check HARUS dibatasi pada sesi aktif (bukan anggota lintas sesi)
      const already = findExistingSessionVisit(data.kunjunganAktif, anggotaId, targetJadwalId);
      if (already) {
        return { success: true, visit: already, message: "Peserta sudah check-in" };
      }

      if (!dbService.isConfigured()) {
        showToast("Database InsForge belum terhubung.", "danger");
        return { success: false, message: "Database InsForge belum terhubung" };
      }

      const res = await dbService.checkIn(anggotaId, targetJadwalId);
      const serverVisit = res.visit;
      if (!serverVisit || !serverVisit.id) {
        showToast("Gagal mendaftarkan kunjungan ke database InsForge.", "danger");
        return { success: false, message: "Gagal mendaftarkan kunjungan ke database" };
      }

      await refreshFromDb(true);
      await addAuditLog("CREATE", "kunjungan", serverVisit.id, `Presensi kehadiran: ${anggota.nama}`);
      return { success: true, visit: serverVisit, message: "Check-in berhasil disimpan ke database" };
    } catch (err: any) {
      console.error("CheckIn error:", err);
      showToast(`Gagal check-in: ${err.message || "Kesalahan database"}`, "danger");
      return { success: false, message: err.message || "Gagal check-in" };
    } finally {
      checkInLocks.current.delete(lockKey);
    }
  }, [data.anggota, data.kunjunganAktif, data.jadwal, addAuditLog, showToast, refreshFromDb]);

  // M2-001: sesi aktif tunggal; null bila tidak ada/ambigu.
  const activeSessionId: string | null = (() => {
    const aktif = (data.jadwal || []).filter((j: any) => j?.status === "aktif");
    return aktif.length === 1 ? aktif[0].id : null;
  })();

  const updatePengukuran = useCallback(async (anggotaId: string, pengukuran: any, opts?: { kunjunganId?: string }) => {
    // M2-002/M2-003: visit HARUS milik sesi aktif. Tanpa fallback jadwal[0],
    // tanpa auto-create visit — route tanpa visit aktif diblokir di UI (M2-024).
    const sessionId = (() => {
      const aktif = (data.jadwal || []).filter((j: any) => j?.status === "aktif");
      return aktif.length === 1 ? aktif[0].id : null;
    })();
    if (!sessionId) {
      const msg = "Tidak ada sesi aktif. Buka sesi hari H di halaman Jadwal Posyandu dulu.";
      showToast(msg, "warning");
      throw new Error(msg);
    }

    const sessionVisit = data.kunjunganAktif.find(
      (k) => k.anggota_id === anggotaId && (k.jadwal_posyandu_id || k.jadwal_id) === sessionId
    );

    let visitId = opts?.kunjunganId || sessionVisit?.id;
    // kunjunganId eksplisit harus cocok dengan anggota + sesi (M2-003).
    if (opts?.kunjunganId) {
      const claimed = data.kunjunganAktif.find((k) => k.id === opts.kunjunganId);
      if (!claimed || claimed.anggota_id !== anggotaId ||
        (claimed.jadwal_posyandu_id || claimed.jadwal_id) !== sessionId) {
        throw new Error("ID kunjungan tidak valid untuk peserta/sesi ini; mutasi ditolak.");
      }
    }

    const isUuid = typeof visitId === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(visitId);
    if (!isUuid) {
      const msg = "Peserta belum terdaftar di Meja 1 pada sesi ini. Lakukan check-in dulu.";
      showToast(msg, "warning");
      throw new Error(msg);
    }

    const activeVisit = sessionVisit || data.kunjunganAktif.find((k) => k.id === visitId);
    if (isLockedFromKader(activeVisit)) {
      const msg = "Data kunjungan ini sudah tervalidasi Bidan dan tidak dapat diubah. Minta Bidan/Admin untuk membuka kunci.";
      showToast(msg, "warning");
      throw new Error(msg);
    }

    if (!dbService.isConfigured()) {
      const msg = "Database InsForge tidak terhubung.";
      showToast(msg, "danger");
      throw new Error(msg);
    }

    try {
      setIsLoadingDb(true);

      // M2-007: urutan idempoten (upsert pengukuran -> replace risiko -> status).
      // Aman di-retry karena setiap langkah idempoten (M2-006/M2-008).
      await dbService.savePengukuran(visitId, { ...pengukuran, anggota_id: anggotaId });

      // M2-008/M2-009: replace SELALU — termasuk risiko kosong (clear stale).
      const risikoRows = Array.isArray(pengukuran.risiko)
        ? pengukuran.risiko.map((r: any) => {
          const isObj = typeof r === "object" && r !== null;
          return {
            kunjungan_id: visitId,
            anggota_id: anggotaId,
            kode_risiko: (isObj && (r.kode_risiko || r.kode)) || "R-GEN",
            deskripsi: (isObj && (r.deskripsi || r.judul)) || String(r),
            severity: (isObj && r.severity) || "warning",
            tindak_lanjut: (isObj && (r.tindak_lanjut || r.tindakLanjut)) || "Konseling & Pantau Rutin",
          };
        })
        : [];
      await dbService.replaceRisiko(visitId, risikoRows);

      await refreshFromDb(true);
      // M2-025: audit ditunggu setelah mutation sukses.
      await addAuditLog("UPDATE", "pengukuran", anggotaId, "Menyimpan pengukuran antropometri Meja 2 ke database InsForge");
    } catch (e: any) {
      console.error("Gagal menyimpan pengukuran ke database:", e);
      showToast(`Gagal menyimpan pengukuran: ${e.message || "Error"}`, "danger");
      throw e;
    } finally {
      setIsLoadingDb(false);
    }
  }, [data.kunjunganAktif, data.jadwal, addAuditLog, isLockedFromKader, showToast, refreshFromDb]);

  // Guard alur: Meja 3/4 wajib visit sesi aktif (tanpa auto-create) + sudah diukur di Meja 2.
  // Mencegah kasus "selesai tanpa ukur" (pengukuran dilewati via URL langsung).
  const resolveSessionVisitOrThrow = useCallback((anggotaId: string, kunjunganId?: string) => {
    const aktif = (data.jadwal || []).filter((j: any) => j?.status === "aktif");
    const sessionId = aktif.length === 1 ? aktif[0].id : null;
    if (!sessionId) {
      const msg = "Tidak ada sesi aktif. Buka sesi hari H di halaman Jadwal Posyandu dulu.";
      showToast(msg, "warning");
      throw new Error(msg);
    }
    const sessionVisit = data.kunjunganAktif.find(
      (k) => k.anggota_id === anggotaId && (k.jadwal_posyandu_id || k.jadwal_id) === sessionId
    );
    let visitId = kunjunganId || sessionVisit?.id;
    if (kunjunganId) {
      const claimed = data.kunjunganAktif.find((k) => k.id === kunjunganId);
      if (!claimed || claimed.anggota_id !== anggotaId ||
        (claimed.jadwal_posyandu_id || claimed.jadwal_id) !== sessionId) {
        throw new Error("ID kunjungan tidak valid untuk peserta/sesi ini; mutasi ditolak.");
      }
    }
    const isUuid = typeof visitId === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(visitId);
    if (!isUuid) {
      const msg = "Peserta belum terdaftar di Meja 1 pada sesi ini. Lakukan check-in dulu.";
      showToast(msg, "warning");
      throw new Error(msg);
    }
    const visit = sessionVisit || data.kunjunganAktif.find((k) => k.id === visitId);
    if (isLockedFromKader(visit)) {
      const msg = "Data kunjungan ini sudah tervalidasi Bidan dan tidak dapat diubah. Minta Bidan/Admin untuk membuka kunci.";
      showToast(msg, "warning");
      throw new Error(msg);
    }
    return visitId as string;
  }, [data.jadwal, data.kunjunganAktif, isLockedFromKader, showToast]);

  const updatePencatatan = useCallback(async (
    anggotaId: string,
    catatan: any,
    opts?: { kunjunganId?: string; expectedUpdatedAt?: string | null }
  ): Promise<{ action: "created" | "updated"; id?: string; updatedAt?: string | null }> => {
    if (!dbService.isConfigured()) {
      const msg = "Database InsForge tidak terhubung.";
      showToast(msg, "danger");
      throw new Error(msg);
    }

    try {
      setIsLoadingDb(true);
      const visitId = resolveSessionVisitOrThrow(anggotaId, opts?.kunjunganId);
      const sessionId = (() => {
        const aktif = (data.jadwal || []).filter((j: any) => j?.status === "aktif");
        return aktif.length === 1 ? aktif[0].id : "?";
      })();
      const nama = data.anggota.find((a) => a.id === anggotaId)?.nama || anggotaId;
      // M3-010: peran aktor diteruskan agar service dapat menolak catatan_bidan dari Kader.
      const result = await dbService.savePencatatan(
        visitId,
        { ...catatan, anggota_id: anggotaId },
        { actorRole: currentUser?.peran, expectedUpdatedAt: opts?.expectedUpdatedAt ?? null }
      );
      await refreshFromDb(true);
      // M3-016: audit memakai kunjunganId + sesi + peran aktor + aksi CREATE/UPDATE.
      await addAuditLog(
        result.action === "created" ? "CREATE" : "UPDATE",
        "catatan_kunjungan",
        visitId,
        `Meja 3 ${result.action === "created" ? "mencatat baru" : "memperbarui catatan"}: ${nama} [sesi ${sessionId}]`
      );
      return result;
    } catch (e: any) {
      console.error("Gagal menyimpan catatan ke database:", e);
      if (!(e as any)?.conflict) {
        showToast(`Gagal menyimpan catatan: ${e.message || "Error"}`, "danger");
      }
      throw e;
    } finally {
      setIsLoadingDb(false);
    }
  }, [resolveSessionVisitOrThrow, addAuditLog, showToast, refreshFromDb, data.jadwal, data.anggota, currentUser]);

  const updatePelayanan = useCallback(async (
    anggotaId: string,
    pelayanan: any,
    opts?: { kunjunganId?: string; expectedUpdatedAt?: string | null }
  ): Promise<{ action: "created" | "updated"; id?: string; updatedAt?: string | null; imunisasiDisimpan?: number }> => {
    if (!dbService.isConfigured()) {
      const msg = "Database InsForge tidak terhubung.";
      showToast(msg, "danger");
      throw new Error(msg);
    }

    try {
      setIsLoadingDb(true);
      const visitId = resolveSessionVisitOrThrow(anggotaId, opts?.kunjunganId);
      const sessionId = (() => {
        const aktif = (data.jadwal || []).filter((j: any) => j?.status === "aktif");
        return aktif.length === 1 ? aktif[0].id : "?";
      })();
      const nama = data.anggota.find((a) => a.id === anggotaId)?.nama || anggotaId;
      // M4-016: peran aktor diteruskan agar service dapat menolak imunisasi dari Kader.
      const result = await dbService.savePelayanan(
        visitId,
        { ...pelayanan, anggota_id: anggotaId },
        { actorRole: currentUser?.peran, expectedUpdatedAt: opts?.expectedUpdatedAt ?? null }
      );
      await refreshFromDb(true);
      // M4-017: audit memakai kunjunganId + sesi + peran aktor + aksi CREATE/UPDATE.
      await addAuditLog(
        result.action === "created" ? "CREATE" : "UPDATE",
        "pelayanan",
        visitId,
        `Meja 4 ${result.action === "created" ? "mencatat pelayanan baru" : "memperbarui pelayanan"}: ${nama} [sesi ${sessionId}]`
      );
      return result;
    } catch (e: any) {
      console.error("Gagal menyimpan pelayanan ke database:", e);
      if (!(e as any)?.conflict) {
        showToast(`Gagal menyimpan pelayanan: ${e.message || "Error"}`, "danger");
      }
      throw e;
    } finally {
      setIsLoadingDb(false);
    }
  }, [resolveSessionVisitOrThrow, addAuditLog, showToast, refreshFromDb, data.jadwal, data.anggota, currentUser]);

  // M4-022 — Reopen resmi visit selesai ke tahap koreksi (Bidan/Admin + audit REOPEN).
  const reopenKunjungan = useCallback(async (
    kunjunganId: string,
    target: "meja_2_pengukuran" | "meja_3_pencatatan" | "meja_4_pelayanan" = "meja_4_pelayanan"
  ) => {
    const role = currentUser?.peran;
    if (role !== "bidan" && role !== "super_admin") {
      const msg = "Membuka kembali kunjungan selesai hanya untuk Bidan/Admin.";
      showToast(msg, "warning");
      throw new Error(msg);
    }
    if (!dbService.isConfigured()) {
      const msg = "Database InsForge tidak terhubung.";
      showToast(msg, "danger");
      throw new Error(msg);
    }
    try {
      setIsLoadingDb(true);
      const res = await dbService.reopenAlur(kunjunganId, target, role);
      await refreshFromDb(true);
      await addAuditLog("REOPEN", "kunjungan", kunjunganId, `Kunjungan selesai dibuka kembali ke ${target} oleh ${role}.`);
      return res;
    } catch (e: any) {
      console.error("Gagal membuka kembali kunjungan:", e);
      showToast(`Gagal membuka kembali: ${e.message || "Error"}`, "danger");
      throw e;
    } finally {
      setIsLoadingDb(false);
    }
  }, [addAuditLog, showToast, refreshFromDb, currentUser]);

  const tambahKeluarga = useCallback(async (keluargaData: any) => {
    if (!dbService.isConfigured()) {
      showToast("Database InsForge tidak terhubung.", "danger");
      throw new Error("Database InsForge tidak terhubung");
    }
    const serverKeluarga = await dbService.createKeluarga(keluargaData);
    await refreshFromDb(true);
    addAuditLog("CREATE", "keluarga", serverKeluarga.nomor_kk, `Mendaftarkan KK baru ke database: ${serverKeluarga.nama_kepala_keluarga}`);
    return serverKeluarga;
  }, [addAuditLog, refreshFromDb, showToast]);

  const tambahAnggota = useCallback(async (anggotaData: any) => {
    if (!dbService.isConfigured()) {
      showToast("Database InsForge tidak terhubung.", "danger");
      throw new Error("Database InsForge tidak terhubung");
    }
    const serverAnggota = await dbService.createAnggota(anggotaData);
    if (anggotaData.status_hamil && anggotaData.hpht) {
      await dbService.createKehamilan(serverAnggota.id, anggotaData.hpht).catch((e) => console.warn(e));
    }
    await refreshFromDb(true);
    addAuditLog("CREATE", "anggota", serverAnggota.nik, `Mendaftarkan anggota baru ke database: ${serverAnggota.nama}`);
    return serverAnggota;
  }, [addAuditLog, refreshFromDb, showToast]);

  const updateKeluarga = useCallback(async (id: string, patch: any) => {
    if (dbService.isConfigured()) {
      await dbService.updateKeluarga(id, patch);
      await refreshFromDb(true);
    }
    addAuditLog("UPDATE", "keluarga", id, "Memperbarui data keluarga di database");
  }, [addAuditLog, refreshFromDb]);

  const updateAnggota = useCallback(async (id: string, patch: any) => {
    const target = data.anggota.find((a) => a.id === id);
    if (target && patch.status_hamil && target.jenis_kelamin !== "P") {
      showToast("Anggota berjenis kelamin laki-laki tidak dapat ditandai hamil.", "danger");
      return;
    }

    if (dbService.isConfigured()) {
      await dbService.updateAnggota(id, patch);
      if (patch.status_hamil && patch.hpht) {
        await dbService.createKehamilan(id, patch.hpht).catch((e) => console.warn(e));
      }
      if (patch.status_hamil === false) {
        await dbService.selesaikanKehamilan(id).catch((e) => console.warn(e));
      }
      await refreshFromDb(true);
    }

    addAuditLog("UPDATE", "anggota", id, "Memperbarui data anggota di database");
  }, [data.anggota, addAuditLog, showToast, refreshFromDb]);

  const selesaikanKehamilan = useCallback(async (anggotaId: string) => {
    const target = data.anggota.find((a) => a.id === anggotaId);
    if (!target) return;

    const usiaInfo = hitungUsia(target.tanggal_lahir);
    const kategoriBaru = klasifikasiSasaran(usiaInfo, target.jenis_kelamin, false).kode;

    if (dbService.isConfigured()) {
      await dbService.selesaikanKehamilan(anggotaId);
      await dbService.updateAnggota(anggotaId, { status_hamil: false, hpht: null, kategori: kategoriBaru });
      await refreshFromDb(true);
    }

    addAuditLog("UPDATE", "kehamilan", anggotaId, `Menyelesaikan kehamilan di database; kategori dikembalikan ke ${kategoriBaru}`);
  }, [data.anggota, addAuditLog, refreshFromDb]);

  const tambahJadwal = useCallback(async (jadwalData: any) => {
    if (!dbService.isConfigured()) {
      showToast("Database InsForge tidak terhubung.", "danger");
      throw new Error("Database InsForge tidak terhubung");
    }
    const serverJadwal = await dbService.createJadwal(jadwalData);
    await refreshFromDb(true);
    addAuditLog("CREATE", "jadwal", serverJadwal.id, `Membuat jadwal posyandu di database: ${serverJadwal.tema || serverJadwal.tanggal}`);
    return serverJadwal;
  }, [addAuditLog, refreshFromDb, showToast]);

  const updateJadwalStatus = useCallback(async (jadwalId: string, status: "draft" | "aktif" | "dibatalkan") => {
    // CATATAN: status "selesai" TIDAK ditangani di sini — satu-satunya jalur
    // penutupan resmi adalah tutupSesiHariH (risiko absen, arsip sesi,
    // sesiArsipId, audit CLOSE, error dilempar). Call site penutupan wajib
    // memanggil tutupSesiHariH agar perilaku identik di semua halaman.
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
          // C-06: dedup ID + jangan timpa kunjunganAktif milik sesi lain yang masih berjalan.
          const milikLain = prev.kunjunganAktif.filter(
            (k: any) =>
              (k.jadwal_id || k.jadwal_posyandu_id) &&
              (k.jadwal_id || k.jadwal_posyandu_id) !== jadwalId
          );
          const seen = new Set<string>(milikLain.map((k: any) => k.id));
          const merged = [...milikLain];
          for (const k of matchingVisits) {
            if (k?.id && !seen.has(k.id)) {
              seen.add(k.id);
              merged.push(k);
            }
          }
          newKunjunganAktif = merged;
          newHistory = prev.kunjungan.filter(
            (k: any) => k.jadwal_id !== jadwalId && k.jadwal_posyandu_id !== jadwalId
          );
        }
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

  // M5-001/M5-002/M5-004/M5-006/M5-016: tulis HANYA via DB pada tepat satu sesi
  // aktif (tanpa fallback jadwal[0]/UUID). Klaim sukses hanya pasca-persist;
  // audit menunggu persist. Error dilempar (tanpa telan) agar UI bertahan.
  const tambahPenyuluhan = useCallback(async (penyuluhanData: any) => {
    const aktif = (data.jadwal || []).filter((j: any) => j?.status === "aktif");
    const sessionId = aktif.length === 1 ? aktif[0].id : null;
    if (!sessionId) {
      const msg = aktif.length > 1
        ? "Terdeteksi lebih dari satu sesi aktif. Rapikan sesi dulu."
        : "Tidak ada sesi aktif. Buka sesi hari H dulu.";
      showToast(msg, "warning");
      throw new Error(msg);
    }
    if (!dbService.isConfigured()) {
      const msg = "Database InsForge tidak terhubung.";
      showToast(msg, "danger");
      throw new Error(msg);
    }

    try {
      setIsLoadingDb(true);
      const { row, action } = await dbService.catatPenyuluhan(penyuluhanData, {
        actorRole: currentUser?.peran,
        sessionId,
      });
      setData((prev) => ({
        ...prev,
        penyuluhan: [row, ...(prev.penyuluhan || []).filter((p: any) => p.id !== row.id)],
      }));
      await addAuditLog(
        "CREATE",
        "penyuluhan",
        row.id,
        `Mendokumentasikan penyuluhan: ${row.tema} [sesi ${sessionId}]`
      );
      return { row, action };
    } catch (e: any) {
      console.error("Gagal menyimpan penyuluhan ke database:", e);
      showToast(`Gagal menyimpan penyuluhan: ${e.message || "Error"}`, "danger");
      throw e;
    } finally {
      setIsLoadingDb(false);
    }
  }, [data.jadwal, addAuditLog, showToast, currentUser]);

  // M5-011: ubah penyuluhan tersimpan (persist dulu, lalu state + audit).
  const ubahPenyuluhan = useCallback(async (id: string, patch: any) => {
    if (!dbService.isConfigured()) {
      const msg = "Database InsForge tidak terhubung.";
      showToast(msg, "danger");
      throw new Error(msg);
    }
    try {
      setIsLoadingDb(true);
      const row = await dbService.updatePenyuluhan(id, patch, { actorRole: currentUser?.peran });
      setData((prev) => ({
        ...prev,
        penyuluhan: (prev.penyuluhan || []).map((p: any) => (p.id === id ? row : p)),
      }));
      await addAuditLog("UPDATE", "penyuluhan", id, `Memperbarui penyuluhan: ${row.tema}`);
      return row;
    } catch (e: any) {
      console.error("Gagal memperbarui penyuluhan:", e);
      showToast(`Gagal memperbarui: ${e.message || "Error"}`, "danger");
      throw e;
    } finally {
      setIsLoadingDb(false);
    }
  }, [addAuditLog, showToast, currentUser]);

  // M5-011: hapus penyuluhan tersimpan (persist dulu, lalu state + audit).
  const hapusPenyuluhan = useCallback(async (id: string) => {
    if (!dbService.isConfigured()) {
      const msg = "Database InsForge tidak terhubung.";
      showToast(msg, "danger");
      throw new Error(msg);
    }
    try {
      setIsLoadingDb(true);
      await dbService.hapusPenyuluhan(id, { actorRole: currentUser?.peran });
      setData((prev) => ({
        ...prev,
        penyuluhan: (prev.penyuluhan || []).filter((p: any) => p.id !== id),
      }));
      await addAuditLog("DELETE", "penyuluhan", id, "Menghapus dokumentasi penyuluhan.");
    } catch (e: any) {
      console.error("Gagal menghapus penyuluhan:", e);
      showToast(`Gagal menghapus: ${e.message || "Error"}`, "danger");
      throw e;
    } finally {
      setIsLoadingDb(false);
    }
  }, [addAuditLog, showToast, currentUser]);

  // RK-017: optimistis + rollback saat persist gagal + error dilempar (tanpa telan).
  // RK-015: rencana kunjungan rumah persist DB (jadwal ulang idempoten).
  const jadwalkanKunjunganRumah = useCallback(async (anggotaId: string, alasan?: string | null) => {
    if (!dbService.isConfigured()) {
      const msg = "Database InsForge tidak terhubung.";
      showToast(msg, "danger");
      throw new Error(msg);
    }
    const aktif = (data.jadwal || []).filter((j: any) => j?.status === "aktif");
    const sessionId = aktif.length === 1 ? aktif[0].id : null;
    try {
      setIsLoadingDb(true);
      const { row, action } = await dbService.jadwalkanKunjunganRumah(anggotaId, sessionId, alasan ?? null);
      setData((prev) => ({
        ...prev,
        rencanaKunjungan: [row, ...(prev.rencanaKunjungan || []).filter((r: any) => r.id !== row.id)],
      }));
      await addAuditLog(
        "CREATE",
        "rencana_kunjungan_rumah",
        row.id,
        action === "existed"
          ? `Rencana kunjungan rumah sudah ada untuk anggota ${anggotaId}; tidak diduplikasi.`
          : `Menjadwalkan kunjungan rumah untuk anggota ${anggotaId}.`
      );
      return { row, action };
    } catch (e: any) {
      console.error("Gagal menjadwalkan kunjungan rumah:", e);
      showToast(`Gagal menjadwalkan: ${e.message || "Error"}`, "danger");
      throw e;
    } finally {
      setIsLoadingDb(false);
    }
  }, [addAuditLog, showToast, data.jadwal]);

  const updateStatusRencana = useCallback(async (id: string, status: "terjadwal" | "selesai" | "dibatalkan") => {
    if (!dbService.isConfigured()) {
      const msg = "Database InsForge tidak terhubung.";
      showToast(msg, "danger");
      throw new Error(msg);
    }
    try {
      setIsLoadingDb(true);
      const row = await dbService.updateStatusRencana(id, status);
      setData((prev) => ({
        ...prev,
        rencanaKunjungan: (prev.rencanaKunjungan || []).map((r: any) => (r.id === id ? row : r)),
      }));
      await addAuditLog("UPDATE", "rencana_kunjungan_rumah", id, `Status rencana kunjungan rumah: ${status}.`);
      return row;
    } catch (e: any) {
      console.error("Gagal memperbarui rencana kunjungan rumah:", e);
      showToast(`Gagal memperbarui: ${e.message || "Error"}`, "danger");
      throw e;
    } finally {
      setIsLoadingDb(false);
    }
  }, [addAuditLog, showToast]);

  const verifikasiKunjungan = useCallback(
    async (kunjunganId: string, status: "valid" | "draft" | "diperiksa" = "valid", catatan?: string) => {
      const allVisits = [...(data.kunjunganAktif || []), ...(data.kunjungan || [])];
      const prev = allVisits.find((k) => k.id === kunjunganId);
      const snapshot = prev
        ? {
            status_verifikasi: prev.status_verifikasi,
            waktu_verifikasi: prev.waktu_verifikasi,
            catatan_kembalikan: prev.catatan_kembalikan,
          }
        : null;

      const applyStatus = (k: any) => {
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
      };

      setData((prevState) => ({
        ...prevState,
        kunjunganAktif: prevState.kunjunganAktif.map(applyStatus),
        kunjungan: prevState.kunjungan.map(applyStatus),
      }));

      if (dbService.isConfigured()) {
        try {
          await dbService.verifyKunjungan(kunjunganId, status);
        } catch (e: any) {
          // Rollback state lokal agar tidak berbeda dari DB.
          const rollbackItem = (k: any) => (k.id === kunjunganId && snapshot ? { ...k, ...snapshot } : k);
          setData((prevState) => ({
            ...prevState,
            kunjunganAktif: prevState.kunjunganAktif.map(rollbackItem),
            kunjungan: prevState.kunjungan.map(rollbackItem),
          }));
          const msg = `Gagal menyimpan verifikasi: ${e?.message || "Error database"}`;
          showToast(msg, "danger");
          throw new Error(msg);
        }
      }

      await addAuditLog(
        "UPDATE",
        "verifikasi_bidan",
        kunjunganId,
        catatan ? `Validasi status kunjungan: ${status} — Catatan: ${catatan}` : `Validasi status kunjungan: ${status}`
      );
    },
    [addAuditLog, data.kunjunganAktif, data.kunjungan, showToast]
  );

  // (BUG #16) Bidan/Super Admin dapat membuka kunci kunjungan yang sudah tervalidasi
  // dengan mengembalikan status_verifikasi ke "draft" agar bisa diedit kembali.
  const bukaKunciKunjungan = useCallback(async (kunjunganId: string) => {
    const unlock = (k: any) => (k.id === kunjunganId ? { ...k, status_verifikasi: "draft" as const, waktu_verifikasi: undefined } : k);
    setData((prev) => ({
      ...prev,
      kunjunganAktif: prev.kunjunganAktif.map(unlock),
      kunjungan: prev.kunjungan.map(unlock),
    }));

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
    const allVisits = [...(data.kunjunganAktif || []), ...(data.kunjungan || [])];
    const snapshots = new Map<string, any>();
    for (const k of allVisits) {
      if (idSet.has(k.id) && !snapshots.has(k.id)) {
        snapshots.set(k.id, {
          status_verifikasi: k.status_verifikasi,
          waktu_verifikasi: k.waktu_verifikasi,
        });
      }
    }

    const applyBulk = (k: any) => {
      if (idSet.has(k.id)) {
        return {
          ...k,
          status_verifikasi: status,
          waktu_verifikasi: new Date().toISOString(),
        };
      }
      return k;
    };

    setData((prev) => ({
      ...prev,
      kunjunganAktif: prev.kunjunganAktif.map(applyBulk),
      kunjungan: prev.kunjungan.map(applyBulk),
    }));

    if (dbService.isConfigured()) {
      const gagal: string[] = [];
      for (const id of kunjunganIds) {
        try {
          await dbService.verifyKunjungan(id, status);
        } catch (e) {
          gagal.push(id);
        }
      }
      if (gagal.length > 0) {
        // RK-017: rollback yang gagal agar lokal selaras DB.
        const gagalSet = new Set(gagal);
        const rollbackBulk = (k: any) => {
          const snap = snapshots.get(k.id);
          return gagalSet.has(k.id) && snap ? { ...k, ...snap } : k;
        };
        setData((prev) => ({
          ...prev,
          kunjunganAktif: prev.kunjunganAktif.map(rollbackBulk),
          kunjungan: prev.kunjungan.map(rollbackBulk),
        }));
        const msg = `Verifikasi massal gagal untuk ${gagal.length} kunjungan; perubahannya dibatalkan.`;
        showToast(msg, "danger");
        throw new Error(msg);
      }
    }

    await addAuditLog("UPDATE", "verifikasi_bidan", kunjunganIds.join(","), `Verifikasi massal ${kunjunganIds.length} kunjungan menjadi: ${status}`);
  }, [addAuditLog, data.kunjunganAktif, data.kunjungan, showToast]);

  // RK-002/RK-004/RK-018/RK-019/RK-035: tutup sesi HANYA untuk jadwalId terkait,
  // DB dulu (gagal = tidak ada perubahan lokal + error dilempar), audit jujur.
  const tutupSesiHariH = useCallback(async (jadwalId: string) => {
    if (!jadwalId) throw new Error("jadwalId wajib diisi untuk menutup sesi.");
    const milikSesi = (k: any) => (k.jadwal_posyandu_id || k.jadwal_id) === jadwalId;

    // G1: risiko level-sesi (R-B07/B08, R-H04) untuk sasaran yang absen.
    const sesiTerbaru = new Date().toISOString();
    // RK-019: "hadir sesi ini" HANYA dari visit milik jadwalId.
    const presentSessionIds = new Set<string>();
    [...data.kunjunganAktif, ...data.kunjungan].forEach((k: any) => {
      if (milikSesi(k) && k?.anggota_id) presentSessionIds.add(k.anggota_id);
    });
    // RK-020 (koreksi audit): timestamp riwayat hadir TETAP lintas sesi —
    // tanpa histori, absen 1 vs 2 bulan (R-B07/B08) tidak dapat dibedakan.
    const hadirByAnggota = new Map<string, string[]>();
    [...data.kunjungan, ...data.kunjunganAktif].forEach((k: any) => {
      if (!k?.anggota_id || !k?.waktu_hadir) return;
      const list = hadirByAnggota.get(k.anggota_id) || [];
      list.push(k.waktu_hadir);
      hadirByAnggota.set(k.anggota_id, list);
    });

    const risikoSesi = data.anggota
      .filter((a: any) => a.status_aktif && a.kategori !== "umum" && !presentSessionIds.has(a.id))
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

    // RK-004/RK-018: DB dulu. Gagal = state lokal utuh + audit CLOSE_FAILED + throw.
    if (dbService.isConfigured()) {
      try {
        await dbService.closeSession(jadwalId);
      } catch (e: any) {
        const msg = `Gagal menutup sesi di database: ${e?.message || "Error"}. Tidak ada data yang diubah.`;
        showToast(msg, "danger");
        await addAuditLog("CLOSE_FAILED", "sesi_posyandu", jadwalId, msg);
        throw new Error(msg);
      }
    }

    // RK-002/RK-035: arsipkan HANYA visit sesi ini; dedup ID; sesi lain utuh.
    // Arsip dihitung dari prev (BUKAN closure) agar kebal race dengan polling
    // refresh 45 detik: visit yang masuk di antara klik dan setData tetap ikut.
    let closedCount = 0;
    setData((prev) => {
      const updatedJadwal = prev.jadwal.map((j) => (j.id === jadwalId ? { ...j, status: "selesai" } : j));
      const toArchive = prev.kunjunganAktif
        .filter(milikSesi)
        .map((k: any) => ({ ...k, status_alur: "selesai" as const }));
      closedCount = toArchive.length;
      const remainingAktif = prev.kunjunganAktif.filter((k: any) => !milikSesi(k));
      const seen = new Set<string>();
      const newHistory = [...toArchive, ...prev.kunjungan].filter((k: any) => {
        if (!k?.id || seen.has(k.id)) return false;
        seen.add(k.id);
        return true;
      });
      return {
        ...prev,
        jadwal: updatedJadwal,
        kunjungan: newHistory,
        kunjunganAktif: remainingAktif,
        sesiArsipId: jadwalId,
        notifikasi: [...(notifSesi as any[]), ...(prev.notifikasi || [])],
      };
    });
    saveSesiArsipId(jadwalId);

    // Settle dari kebenaran DB pasca-tutup: menutup sisa race polling/tab lain
    // sehingga arsip lokal, DB, dan cetakan berikutnya identik.
    await refreshFromDb(true);

    await addAuditLog(
      "CLOSE",
      "sesi_posyandu",
      jadwalId,
      notifSesi.length > 0
        ? `Sesi ditutup (${closedCount} kunjungan diarsipkan). ${notifSesi.length} sasaran terdeteksi absen/risiko (R-B07/B08, R-H04).`
        : `Sesi Posyandu Hari H resmi ditutup (${closedCount} kunjungan diarsipkan) tanpa kasus absen prioritas.`
    );
    return { closedCount, notifCount: notifSesi.length };
  }, [data.anggota, data.kunjungan, data.kunjunganAktif, addAuditLog, showToast, refreshFromDb]);

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
    await refreshFromDb();
    addAuditLog("RESET", "database", "all", "Super Admin menyinkronkan ulang seluruh data master dari InsForge Cloud.");
  }, [addAuditLog, refreshFromDb]);

  // Purge all transactions in InsForge DB + clean local visits
  const purgeAllTransactions = useCallback(async () => {
    if (dbService.isConfigured()) {
      await dbService.purgeTransactionalData();
    }
    await refreshFromDb(true);
    addAuditLog("PURGE", "database", "all", "Super Admin membersihkan seluruh data kunjungan dan transaksi.");
  }, [addAuditLog, refreshFromDb]);

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

  // Sinkronkan seluruh data input lokal ke database InsForge Cloud PostgreSQL
  const sinkronkanDataKeCloud = useCallback(async (): Promise<{ success: boolean; syncedCount: number; message: string }> => {
    if (!dbService.isConfigured()) {
      showToast("Backend InsForge belum terkonfigurasi.", "warning");
      return { success: false, syncedCount: 0, message: "InsForge belum terkonfigurasi" };
    }

    setIsLoadingDb(true);
    let syncedCount = 0;
    // D-2: ringkasan per-item agar kegagalan terlihat user, bukan hilang di console.
    const failures: Array<{ nama: string; alasan: string }> = [];

    try {
      const dbAnggota = await dbService.getAnggota().catch(() => []);
      const agtByNik = new Map<string, any>();
      (dbAnggota || []).forEach((a: any) => agtByNik.set(a.nik, a));

      // F-01: TANPA fallback jadwal[0]. Visit tanpa sesi valid ditolak eksplisit (dicatat gagal),
      // bukan ditebak ke jadwal pertama (risiko tulis ke sesi salah).
      const allVisits = [...(data.kunjunganAktif || []), ...(data.kunjungan || [])];
      const anggotaById = new Map<string, any>((data.anggota || []).map((a: any) => [a.id, a]));

      for (const v of allVisits) {
        const namaVisit = anggotaById.get(v.anggota_id)?.nama || v.anggota_id || v.id;
        let realAgt = (dbAnggota || []).find((a: any) => a.id === v.anggota_id);
        if (!realAgt) {
          const localAgt = anggotaById.get(v.anggota_id);
          if (localAgt?.nik) {
            realAgt = agtByNik.get(localAgt.nik);
          }
        }

        if (!realAgt) {
          failures.push({ nama: namaVisit, alasan: "anggota tidak ditemukan di database" });
          continue;
        }

        const jadwalId = v.jadwal_posyandu_id || v.jadwal_id;
        if (!jadwalId) {
          failures.push({ nama: namaVisit, alasan: "tanpa sesi (jadwal_posyandu_id kosong) — tidak disinkronkan" });
          continue;
        }

        let dbVisitId = v.id;
        try {
          const res = await dbService.checkIn(realAgt.id, jadwalId);
          if (res?.visit?.id) {
            dbVisitId = res.visit.id;
          }
        } catch (e) {
          console.warn("CheckIn DB sync:", e);
        }

        let didSync = false;

        if (v.pengukuran && Object.keys(v.pengukuran).length > 0) {
          try {
            await dbService.savePengukuran(dbVisitId, v.pengukuran);
            didSync = true;
          } catch (e) {
            console.warn("SavePengukuran DB sync error:", e);
          }
        }

        if (v.catatan && Object.keys(v.catatan).length > 0) {
          try {
            await dbService.savePencatatan(dbVisitId, v.catatan);
            didSync = true;
          } catch (e) {
            console.warn("SavePencatatan DB sync error:", e);
          }
        }

        if (v.pelayanan && Object.keys(v.pelayanan).length > 0) {
          try {
            await dbService.savePelayanan(dbVisitId, v.pelayanan);
            didSync = true;
          } catch (e) {
            console.warn("SavePelayanan DB sync error:", e);
          }
        }

        if (Array.isArray(v.risiko) && v.risiko.length > 0) {
          try {
            const rows = v.risiko.map((r: any) => ({
              kunjungan_id: dbVisitId,
              anggota_id: realAgt.id,
              kode_risiko: r.kode_risiko || r.kode || "R-GEN",
              deskripsi: r.deskripsi || r.judul || "Risiko",
              severity: r.severity || "warning",
              tindak_lanjut: r.tindak_lanjut || r.tindakLanjut || "Konseling & Pantau Rutin",
            }));
            await dbService.catatRisiko(rows);
            didSync = true;
          } catch (e) {
            console.warn("CatatRisiko DB sync error:", e);
          }
        }

        if (didSync) {
          syncedCount++;
        }
      }

      await refreshFromDb(true);
      // D-2: ringkasan per-item — tampilkan yang gagal agar tidak hilang diam-diam.
      const msg = failures.length > 0
        ? `Sinkronisasi: ${syncedCount} berhasil, ${failures.length} gagal (${failures.slice(0, 3).map((f) => `${f.nama}: ${f.alasan}`).join("; ")}${failures.length > 3 ? "; ..." : ""}).`
        : `Sinkronisasi berhasil! ${syncedCount} data pemeriksaan tersimpan ke database cloud.`;
      showToast(msg, failures.length > 0 ? "warning" : "success");
      return { success: failures.length === 0, syncedCount, message: msg };
    } catch (err: any) {
      console.error("Gagal sinkronisasi data ke cloud:", err);
      const msg = "Terjadi kendala saat sinkronisasi data ke database.";
      showToast(msg, "danger");
      return { success: false, syncedCount, message: msg };
    } finally {
      setIsLoadingDb(false);
    }
  }, [data, refreshFromDb, showToast]);

  return (
    <SipanduContext.Provider
      value={{
        data,
        isLoadingDb,
        activeSessionId,
        refreshFromDb,
        sinkronkanDataKeCloud,
        checkInPeserta,
        updatePengukuran,
        updatePencatatan,
        updatePelayanan,
        reopenKunjungan,
        tambahKeluarga,
        tambahAnggota,
        tambahJadwal,
        updateJadwalStatus,
        tambahPenyuluhan,
        ubahPenyuluhan,
        hapusPenyuluhan,
        updateKeluarga,
        updateAnggota,
        selesaikanKehamilan,
        verifikasiKunjungan,
        bukaKunciKunjungan,
        verifikasiBulkKunjungan,
        updateStatusRisiko,
        tutupSesiHariH,
        jadwalkanKunjunganRumah,
        updateStatusRencana,
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
