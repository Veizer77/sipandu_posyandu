/**
 * SIPANDU - Meja 1: Registrasi & Presensi Digital
 * Identik dengan renderMeja1RegistrasiView legacy.
 */
import React, { useDeferredValue, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import confetti from "canvas-confetti";
import { Search, LogIn } from "lucide-react";
import { MejaStepper, CategoryBadge } from "@/components/meja/MejaShared";
import { Avatar } from "@/components/Avatar";
import { useAuth } from "@/lib/auth-context";
import { getRolePrefix } from "@/lib/role-routes";
import { useSipandu } from "@/lib/data-store";
import { hitungUsia } from "@/utils/zscoreCalculator";

export default function Meja1() {
  const navigate = useNavigate();
  const { showToast, currentRole } = useAuth();
  const rolePrefix = getRolePrefix(currentRole);
  const { data, checkInPeserta } = useSipandu();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDeferredValue(query);

  const sesiAktif = data.jadwal.find((j: any) => j.status === "aktif");
  const kunjunganAktif = data.kunjunganAktif;
  const totalSasaran = data.anggota.filter((a: any) => a.status_aktif && a.kategori !== "umum").length;
  const belumHadirCount = Math.max(0, totalSasaran - kunjunganAktif.length);

  // Map keluarga_id -> nomor_kk agar pencarian bisa via Nomor KK
  const kkById = useMemo(() => {
    const m = new Map<string, string>();
    data.keluarga.forEach((k: any) => m.set(k.id, k.nomor_kk));
    return m;
  }, [data.keluarga]);

  const results = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    const list = data.anggota.filter((a: any) => {
      if (!q) return a.kategori !== "umum";
      const kk = kkById.get(a.keluarga_id) || "";
      return (
        a.nama.toLowerCase().includes(q) ||
        (a.nik && a.nik.includes(q)) ||
        kk.includes(q)
      );
    });
    return list.slice(0, 8);
  }, [debouncedQuery, data.anggota, kkById]);

  async function checkIn(anggota: any) {
    await checkInPeserta(anggota.id);
    confetti({ particleCount: 60, spread: 55, origin: { y: 0.7 }, colors: ["#0284c7", "#16a34a", "#fbbf24"] });
    showToast(`${anggota.nama} berhasil didaftarkan hadir. Lanjut ke Meja 2.`, "success");
    navigate(`${rolePrefix}/meja2/${anggota.id}`);
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
            <span className="text-[10px] text-green-700 font-bold uppercase">Sudah Hadir</span>
            <p className="text-lg font-bold text-green-800 leading-none mt-0.5">{kunjunganAktif.length}</p>
          </div>
          <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-center">
            <span className="text-[10px] text-gray-500 font-bold uppercase">Belum Hadir</span>
            <p className="text-lg font-bold text-gray-700 leading-none mt-0.5">{belumHadirCount}</p>
          </div>
        </div>
      </div>

      {/* Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Search & Result Cards */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ketik nama peserta atau NIK 16 digit..."
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl shadow-sm focus:border-sky-500 focus:ring-2 focus:ring-green-100 outline-none text-sm transition"
            />
          </div>

          <div className="space-y-3">
            {results.length === 0 ? (
              <div className="bg-white p-8 text-center rounded-2xl border border-gray-100 shadow-sm">
                <p className="text-sm text-gray-500">Tidak ada sasaran cocok dengan pencarian.</p>
                <button
                  onClick={() => navigate(`${rolePrefix}/keluarga/tambah`)}
                  className="mt-3 inline-block px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-semibold transition shadow-sm"
                >
                  Daftarkan Peserta Baru
                </button>
              </div>
            ) : (
              results.map((a: any) => {
                const isAlreadyCheckedIn = kunjunganAktif.some((k) => k.anggota_id === a.id);
                const keluarga = data.keluarga.find((k: any) => k.id === a.keluarga_id);
                const usiaInfo = hitungUsia(a.tanggal_lahir);
                const lastKunj = data.kunjungan.find((k: any) => k.anggota_id === a.id);

                return (
                  <div
                    key={a.id}
                    className={`bg-white p-4 rounded-2xl border ${isAlreadyCheckedIn ? "border-green-300 bg-green-50/20" : "border-gray-100"} shadow-sm hover:shadow transition flex flex-col sm:flex-row sm:items-center justify-between gap-4`}
                  >
                    <div className="flex items-center gap-3.5">
                      <Avatar nama={a.nama} className="w-14 h-14 rounded-2xl text-lg" />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <CategoryBadge kategori={a.kategori} />
                          <span className="text-xs text-gray-500">{usiaInfo ? usiaInfo.usiaTeks : ""}</span>
                        </div>
                        <h4 className="font-bold text-gray-900 text-base">{a.nama}</h4>
                        <p className="text-xs text-gray-500">
                          Keluarga: <strong>{keluarga ? keluarga.nama_kepala_keluarga : "—"}</strong> · RT {keluarga ? keluarga.rt : "01"}
                        </p>
                        {lastKunj?.pengukuran?.berat_badan ? (
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            BB Lalu: {lastKunj.pengukuran.berat_badan} kg ({lastKunj.pengukuran.status_gizi || "—"})
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-stretch sm:self-auto">
                      {isAlreadyCheckedIn ? (
                        <button
                          onClick={() => navigate(`${rolePrefix}/meja2/${a.id}`)}
                          className="flex-1 sm:flex-none px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold transition"
                        >
                          ✓ Sudah Hadir — Lanjut Meja 2
                        </button>
                      ) : (
                        <button
                          onClick={() => checkIn(a)}
                          className="flex-1 sm:flex-none px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                        >
                          <LogIn className="w-3.5 h-3.5" /> Daftar Hadir
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Sudah Hadir List */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-900 text-sm">Peserta Sudah Hadir Hari Ini</h3>
              <span className="text-xs text-green-700 font-bold bg-green-50 px-2 py-0.5 rounded-full">{kunjunganAktif.length} Orang</span>
            </div>

            <div className="space-y-2.5 max-h-[500px] overflow-y-auto">
              {kunjunganAktif.length === 0 ? (
                <div className="p-6 text-center text-gray-400 text-xs">Belum ada peserta yang hadir.</div>
              ) : (
                kunjunganAktif.map((k: any, idx: number) => {
                  const a = data.anggota.find((ang: any) => ang.id === k.anggota_id);
                  if (!a) return null;
                  const keluarga = data.keluarga.find((fam: any) => fam.id === a.keluarga_id);
                  return (
                    <div
                      key={k.id}
                      className="p-3 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-between hover:bg-gray-100/70 transition gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
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
                      <button
                        onClick={() => navigate(`${rolePrefix}/meja2/${a.id}`)}
                        className="shrink-0 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition shadow-sm hover:shadow"
                      >
                        Meja 2 →
                      </button>
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
