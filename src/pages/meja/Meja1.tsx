/**
 * SIPANDU - Meja 1: Registrasi & Presensi Digital
 * Identik dengan renderMeja1RegistrasiView legacy.
 *
 * PERBAIKAN AUDIT MEJA 1:
 * - Seluruh logika kehadiran dibatasi pada SESI AKTIF (kunjunganSesi).
 * - Daftar peserta difilter menurut sasaran sesi (tidak menampilkan kategori di luar target).
 * - Counter hadir/belum hadir/umum dihitung dari satu sumber kunjunganSesi.
 * - Riwayat kunjungan terakhir diurutkan berdasarkan waktu, bukan elemen pertama array.
 * - Tombol check-in memiliki state loading per peserta (cegah double submit).
 * - Halaman memblokir diri bila tidak ada sesi aktif atau terdapat >1 sesi aktif.
 */
import React, { useDeferredValue, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import confetti from "canvas-confetti";
import { Search, LogIn, CheckCircle2, RefreshCw, AlertTriangle, CalendarX2 } from "lucide-react";
import { MejaStepper, CategoryBadge } from "@/components/meja/MejaShared";
import { Avatar } from "@/components/Avatar";
import { useAuth } from "@/lib/auth-context";
import { getRolePrefix, getRoleMenuPath } from "@/lib/role-routes";
import { useSipandu } from "@/lib/data-store";
import {
  getSessionVisits,
  getLatestVisitByAnggota,
  filterSasaranBelumHadir,
  getStatusAntreanMeja1,
} from "@/lib/meja1Logic";
import { hitungUsia } from "@/utils/zscoreCalculator";

export default function Meja1() {
  const navigate = useNavigate();
  const { showToast, currentRole } = useAuth();
  const rolePrefix = getRolePrefix(currentRole);
  const jadwalUrl = getRoleMenuPath("/posyandu", currentRole);
  const { data, checkInPeserta, sinkronkanDataKeCloud, isLoadingDb } = useSipandu();
  const [query, setQuery] = useState("");
  const [pendingIds, setPendingIds] = useState<Set<string>>(() => new Set());
  const debouncedQuery = useDeferredValue(query);

  // Deteksi sesi aktif (harus tepat satu)
  const sesiAktifList = data.jadwal.filter((j: any) => j.status === "aktif");
  const sesiAktif = sesiAktifList[0] || null;

  // Sasaran sesi aktif (jika kosong, anggap ILP/semua kategori utama + umum).
  // Kategori "umum" selalu diikutkan: pasien umum check-in lewat Meja 1 juga.
  const targetSasaran = sesiAktif?.sasaran && sesiAktif.sasaran.length > 0
    ? [...sesiAktif.sasaran, "umum"]
    : ["bayi", "balita", "wus", "lansia", "ibu_hamil", "umum"];
  const targetSasaranSet = useMemo(() => new Set<string>(targetSasaran), [targetSasaran]);
  const isSasaran = (kat: string) => targetSasaranSet.has(kat);

  // Kunjungan HANYA untuk sesi aktif: gabung kunjunganAktif (belum selesai) + history (selesai) sesi ini
  const kunjunganSesi = useMemo(
    () => getSessionVisits([...(data.kunjunganAktif || []), ...(data.kunjungan || [])], sesiAktif?.id),
    [data.kunjunganAktif, data.kunjungan, sesiAktif?.id]
  );

  // Maps untuk menghindari O(n^2) lookup berulang
  const anggotaById = useMemo(() => {
    const m = new Map<string, any>();
    data.anggota.forEach((a: any) => m.set(a.id, a));
    return m;
  }, [data.anggota]);

  const keluargaById = useMemo(() => {
    const m = new Map<string, any>();
    data.keluarga.forEach((k: any) => m.set(k.id, k));
    return m;
  }, [data.keluarga]);

  const kkById = useMemo(() => {
    const m = new Map<string, string>();
    data.keluarga.forEach((k: any) => m.set(k.id, k.nomor_kk));
    return m;
  }, [data.keluarga]);

  // Kunjungan terakhir per anggota (diurutkan waktu) untuk menampilkan BB lalu
  const lastVisitByAnggota = useMemo(
    () => getLatestVisitByAnggota([...(data.kunjunganAktif || []), ...(data.kunjungan || [])]),
    [data.kunjunganAktif, data.kunjungan]
  );

  const presentMemberIds = useMemo(
    () => new Set(kunjunganSesi.map((k: any) => k.anggota_id)),
    [kunjunganSesi]
  );

  const totalSasaran = data.anggota.filter(
    (a: any) => a.status_aktif && a.kategori !== "umum" && isSasaran(a.kategori)
  ).length;

  const sasaranHadirCount = data.anggota.filter(
    (a: any) =>
      a.status_aktif &&
      a.kategori !== "umum" &&
      isSasaran(a.kategori) &&
      presentMemberIds.has(a.id)
  ).length;

  const umumHadirCount = kunjunganSesi.filter((k: any) => {
    const a = anggotaById.get(k.anggota_id);
    return a ? a.kategori === "umum" || !isSasaran(a.kategori) : false;
  }).length;

  const belumHadirCount = Math.max(0, totalSasaran - sasaranHadirCount);

  // Daftar warga: hanya sasaran sesi yang belum hadir
  const results = useMemo(
    () =>
      filterSasaranBelumHadir(
        data.anggota,
        targetSasaranSet,
        presentMemberIds,
        debouncedQuery,
        kkById
      ),
    [debouncedQuery, data.anggota, kkById, presentMemberIds, targetSasaranSet]
  );

  async function checkIn(anggota: any) {
    if (pendingIds.has(anggota.id)) return;
    setPendingIds((prev) => {
      const n = new Set(prev);
      n.add(anggota.id);
      return n;
    });
    try {
      const res = await checkInPeserta(anggota.id);
      if (res && res.success) {
        confetti({ particleCount: 60, spread: 55, origin: { y: 0.7 }, colors: ["#0284c7", "#16a34a", "#fbbf24"] });
        showToast(`${anggota.nama} berhasil didaftarkan hadir.`, "success");
      }
      // Tidak auto-navigate agar petugas bisa mendaftarkan warga lain secara terus menerus
    } finally {
      setPendingIds((prev) => {
        const n = new Set(prev);
        n.delete(anggota.id);
        return n;
      });
    }
  }

  // Guard: lebih dari satu sesi aktif -> konflik konfigurasi
  if (sesiAktifList.length > 1) {
    return (
      <div className="p-4 sm:p-8 max-w-2xl mx-auto my-8">
        <div className="bg-white rounded-3xl border border-rose-200 shadow-sm p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto text-rose-600">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-black text-gray-900">Terdapat Beberapa Sesi Aktif</h2>
            <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
              Terdeteksi <span className="font-bold text-rose-600">{sesiAktifList.length}</span> sesi posyandu berstatus Aktif.
              Meja 1 hanya dapat berjalan dengan tepat satu sesi aktif. Silakan tutup sesi lainnya di halaman Jadwal.
            </p>
          </div>
          <Link
            to={jadwalUrl}
            className="inline-flex px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-sm shadow-md shadow-sky-600/20 transition items-center gap-2"
          >
            <CalendarX2 className="w-4 h-4" /> Kelola Jadwal
          </Link>
        </div>
      </div>
    );
  }

  // Guard: tidak ada sesi aktif
  if (!sesiAktif) {
    return (
      <div className="p-4 sm:p-8 max-w-2xl mx-auto my-8">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto text-amber-600">
            <CalendarX2 className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-black text-gray-900">Belum Ada Sesi Posyandu Aktif</h2>
            <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
              Pelayanan alur 5 Meja memerlukan sesi posyandu yang berstatus <span className="font-bold text-emerald-600">Aktif</span>.
              Mulai atau aktifkan sesi hari ini di halaman Jadwal Posyandu.
            </p>
          </div>
          <Link
            to={jadwalUrl}
            className="inline-flex px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-sm shadow-md shadow-sky-600/20 transition items-center gap-2"
          >
            <CalendarX2 className="w-4 h-4" /> Kelola Jadwal
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-6">
      <MejaStepper activeMeja={1} />

      {/* Status Header */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-0.5 bg-green-100 text-green-800 rounded-full text-xs font-semibold mb-1">
            <span className="w-2 h-2 rounded-full bg-green-600 animate-pulse" /> Sesi Hari H Aktif{sesiAktif?.tema ? ` — ${sesiAktif.tema}` : ""}
          </div>
          <h2 className="text-xl font-bold text-gray-900">Meja 1: Registrasi & Presensi Digital</h2>
          <p className="text-xs text-gray-500">Cari peserta via Nama, NIK, atau Nomor KK, lalu klik "Daftar Hadir"</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-green-50 border border-green-200 rounded-xl text-center">
            <span className="text-[10px] text-green-700 font-bold uppercase">Sasaran Hadir</span>
            <div className="flex items-baseline justify-center gap-1.5 mt-0.5">
              <p className="text-lg font-bold text-green-800 leading-none">{sasaranHadirCount}</p>
              {umumHadirCount > 0 && (
                <span className="text-[10px] font-semibold text-amber-700 bg-amber-100/80 px-1.5 py-0.5 rounded-md">
                  +{umumHadirCount} umum
                </span>
              )}
            </div>
          </div>
          <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-center">
            <span className="text-[10px] text-gray-500 font-bold uppercase">Belum Hadir</span>
            <p className="text-lg font-bold text-gray-700 leading-none mt-0.5">{belumHadirCount}</p>
          </div>
          <button
            type="button"
            onClick={() => sinkronkanDataKeCloud()}
            disabled={isLoadingDb}
            title="Klik untuk menyinkronkan seluruh data inputan lokal ke database InsForge Cloud PostgreSQL"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 text-xs font-bold transition active:scale-95 disabled:opacity-60 cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingDb ? "animate-spin text-sky-600" : "text-sky-500"}`} />
            <span className="hidden sm:inline">{isLoadingDb ? "Menyinkronkan..." : "Sinkron ke Cloud"}</span>
            <span className="sm:hidden">{isLoadingDb ? "Sync..." : "Sync"}</span>
          </button>
        </div>
      </div>

      {/* Split Layout: Fixed Height Dual Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Panel: Sasaran & Pencarian (Fixed Header + Scrollable List) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-gray-100 shadow-sm p-5 flex flex-col h-[560px] lg:h-[calc(100vh-280px)] min-h-[480px]">
          {/* Header & Search Bar (Pinned at top of card) */}
          <div className="pb-4 border-b border-gray-100 space-y-3 shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Daftar Warga (Belum Hadir)</h3>
                <p className="text-xs text-gray-500">Pilih warga yang datang untuk registrasi kehadiran</p>
              </div>
              <span className="text-xs text-sky-700 font-bold bg-sky-50 border border-sky-100 px-2.5 py-1 rounded-full">
                {results.length} Warga
              </span>
            </div>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ketik nama peserta, NIK, atau Nomor KK..."
                className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-gray-200 rounded-xl shadow-xs focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none text-sm transition"
              />
            </div>
          </div>

          {/* Scrollable Results List */}
          <div className="flex-1 overflow-y-auto pr-1 pt-3 space-y-3">
            {results.length === 0 ? (
              <div className="p-8 text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 mt-2">
                <p className="text-sm text-gray-500">Tidak ada warga cocok dengan pencarian.</p>
                <button
                  onClick={() => navigate(`${rolePrefix}/keluarga/tambah`)}
                  className="mt-3 inline-block px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-semibold transition shadow-sm"
                >
                  Daftarkan Peserta Baru
                </button>
              </div>
            ) : (
              results.map((a: any) => {
                const isAlreadyCheckedIn = kunjunganSesi.some((k: any) => k.anggota_id === a.id);
                const keluarga = keluargaById.get(a.keluarga_id);
                const usiaInfo = hitungUsia(a.tanggal_lahir);
                const lastKunj = lastVisitByAnggota.get(a.id);

                return (
                  <div
                    key={a.id}
                    className={`p-3.5 sm:p-4 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 ${
                      isAlreadyCheckedIn
                        ? "border-emerald-200 bg-emerald-50/20"
                        : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-xs"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar nama={a.nama} className="w-12 h-12 rounded-2xl text-base shrink-0" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <CategoryBadge kategori={a.kategori} />
                          <span className="text-xs text-gray-500">{usiaInfo ? usiaInfo.usiaTeks : ""}</span>
                        </div>
                        <h4 className="font-bold text-gray-900 text-sm truncate">{a.nama}</h4>
                        <p className="text-xs text-gray-500 truncate">
                          Keluarga: <strong>{keluarga ? keluarga.nama_kepala_keluarga : "—"}</strong> · RT {keluarga ? keluarga.rt : "01"}
                        </p>
                        {lastKunj?.pengukuran?.berat_badan ? (
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            BB Lalu: {lastKunj.pengukuran.berat_badan} kg ({lastKunj.pengukuran.status_gizi || "—"})
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-stretch sm:self-auto shrink-0">
                      {isAlreadyCheckedIn ? (
                        <button
                          disabled
                          className="flex-1 sm:flex-none px-3.5 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-not-allowed"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Sudah Hadir
                        </button>
                      ) : (
                        <button
                          onClick={() => checkIn(a)}
                          disabled={pendingIds.has(a.id)}
                          className="flex-1 sm:flex-none px-4 py-2 bg-sky-600 hover:bg-sky-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
                        >
                          {pendingIds.has(a.id) ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Mendaftarkan...
                            </>
                          ) : (
                            <>
                              <LogIn className="w-3.5 h-3.5" /> Daftar Hadir
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Panel: Peserta Sudah Hadir (Fixed Sticky Panel) */}
        <div className="lg:col-span-5 lg:sticky lg:top-6">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 flex flex-col h-[560px] lg:h-[calc(100vh-280px)] min-h-[480px]">
            {/* Header (Pinned at top of card) */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 shrink-0">
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Peserta Sudah Hadir Hari Ini</h3>
                <p className="text-xs text-gray-500">Antrean masuk Meja 2</p>
              </div>
              <span className="text-xs text-emerald-700 font-bold bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
                {kunjunganSesi.length} Orang
              </span>
            </div>

            {/* Scrollable Attendance List */}
            <div className="flex-1 overflow-y-auto pr-1 pt-3 space-y-2.5">
              {kunjunganSesi.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-xs bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 mt-2">
                  Belum ada peserta yang hadir. Silakan klik "Daftar Hadir" pada daftar di sebelah kiri.
                </div>
              ) : (
                kunjunganSesi.map((k: any, idx: number) => {
                  const a = anggotaById.get(k.anggota_id);
                  if (!a) return null;
                  const keluarga = keluargaById.get(a.keluarga_id);
                  // status_alur selesai (seluruh meja) selalu badge — bukan tombol Meja 2,
                  // walau baris pengukuran kosong karena Meja 2 terlewati.
                  const statusAntrean = getStatusAntreanMeja1(k);
                  const isMeja2Done = statusAntrean !== "menunggu_meja2";

                  return (
                    <div
                      key={k.id}
                      className="p-3 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-between hover:bg-gray-100/70 transition gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div className="min-w-0 flex flex-col justify-center">
                          <h5 className="font-bold text-gray-900 text-xs truncate leading-snug">
                            {a.nama}
                          </h5>
                          <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                            <CategoryBadge kategori={a.kategori} />
                            {keluarga && (
                              <span className="text-[10px] text-gray-400 font-medium">
                                RT {keluarga.rt}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {isMeja2Done ? (
                        <span className="shrink-0 px-3 py-1.5 bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1">
                          ✓ Selesai
                        </span>
                      ) : (
                        <button
                          onClick={() => navigate(`${rolePrefix}/meja2/${a.id}`)}
                          className="shrink-0 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition shadow-xs hover:shadow"
                        >
                          Meja 2 →
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
