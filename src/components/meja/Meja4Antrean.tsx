/**
 * SIPANDU - Meja 4: Antrean sesi aktif (ekstraksi dari Meja4.tsx, M4-028).
 * M4-001: selector kanonis (active + history, dedup). M4-002: config error
 * multi-sesi. M4-009: badge via hasAnyPelayanan. M4-027: memoized Map.
 */
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Syringe, CheckCircle2, AlertTriangle, CalendarX2 } from "lucide-react";
import { MejaStepper, CategoryBadge } from "./MejaShared";
import { Avatar } from "../Avatar";
import { useAuth } from "@/lib/auth-context";
import { getRolePrefix, getRoleMenuPath } from "@/lib/role-routes";
import { useSipandu } from "@/lib/data-store";
import { getAllSessionVisits, filterVisitsForMeja } from "@/lib/meja1Logic";
import { visitHasPengukuran } from "@/lib/meja2Logic";
import { catatanHasContent } from "@/lib/meja3Logic";
import { hasAnyPelayanan } from "@/lib/meja4Logic";
import { maskNik } from "@/lib/utils";

interface Meja4AntreanProps {
  data: any;
  navigate: (to: string) => void;
}

export function Meja4Antrean({ data, navigate }: Meja4AntreanProps) {
  const { currentRole } = useAuth();
  const rolePrefix = getRolePrefix(currentRole);
  const jadwalUrl = getRoleMenuPath("/posyandu", currentRole);
  const { activeSessionId } = useSipandu();

  const multipleActive = (data.jadwal || []).filter((j: any) => j?.status === "aktif").length > 1;

  // M4-001: selector kanonis sesi; siap dilayani = sudah dicatat Meja 3.
  // F-05: hanya tahap Meja 4 (meja_3/meja_4); visit selesai ATAU sudah melewati
  // Meja 4 (meja_5) tidak masuk antrean kerja.
  const sessionVisits = useMemo(
    () =>
      filterVisitsForMeja(
        getAllSessionVisits(data.kunjunganAktif, data.kunjungan, activeSessionId).filter(
          (k: any) => k?.status_alur !== "selesai"
        ),
        4
      ),
    [data.kunjunganAktif, data.kunjungan, activeSessionId]
  );
  const anggotaById = useMemo(() => {
    const m = new Map<string, any>();
    (data.anggota || []).forEach((a: any) => m.set(a.id, a));
    return m;
  }, [data.anggota]);

  // Siap dilayani = sudah dicatat di Meja 3 (isi, bukan sekadar baris kosong).
  const list = useMemo(
    () => sessionVisits.filter((k: any) => catatanHasContent(k.catatan)),
    [sessionVisits]
  );

  const sudahDilayani = list.filter((k: any) => hasAnyPelayanan(k.pelayanan)).length;
  const rujukanCount = list.filter((k: any) => k.pelayanan?.rujukan).length;

  if (!activeSessionId) {
    return (
      <div className="p-4 sm:p-8 space-y-6">
        <MejaStepper activeMeja={4} />
        <div className="bg-white p-12 rounded-2xl border border-gray-100 shadow-sm text-center">
          <CalendarX2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-gray-700">
            {multipleActive ? "Terdeteksi Lebih dari Satu Sesi Aktif" : "Belum Ada Sesi Posyandu Aktif"}
          </p>
          <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
            {multipleActive
              ? "Tutup/akhiri sesi ganda di halaman Jadwal Posyandu agar antrean tidak tercampur."
              : "Buka sesi hari H di halaman Jadwal Posyandu terlebih dahulu."}
          </p>
          <Link to={jadwalUrl} className="mt-4 inline-block px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold">
            Buka Jadwal Posyandu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-6">
      <MejaStepper activeMeja={4} />

      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-0.5 bg-amber-100 text-amber-800 rounded-full text-xs font-semibold mb-1">
            <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse" /> Antrean Meja 4
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Meja 4: Pelayanan Kesehatan, Imunisasi & PMT</h1>
          <p className="text-xs text-gray-500">Pilih peserta untuk mendokumentasikan pemberian Vitamin A, PMT, imunisasi balita, suplemen Fe, atau rujukan.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-green-50 border border-green-200 rounded-xl text-center">
            <span className="text-[10px] text-green-700 font-bold uppercase">Sudah Dilayani</span>
            <p className="text-lg font-bold text-green-800 leading-none mt-0.5">{sudahDilayani}</p>
          </div>
          <div className="px-4 py-2 bg-rose-50 border border-rose-200 rounded-xl text-center">
            <span className="text-[10px] text-rose-700 font-bold uppercase">Rujukan</span>
            <p className="text-lg font-bold text-rose-800 leading-none mt-0.5">{rujukanCount}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {list.length === 0 ? (
          <div className="p-12 text-center">
            <Syringe className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-gray-700">Belum Ada Peserta Siap di Meja 4</p>
            <p className="text-xs text-gray-400 mt-1">Selesaikan pencatatan peserta di Meja 3 terlebih dahulu agar muncul di sini.</p>
            <Link to={`${rolePrefix}/meja3`} className="mt-4 inline-block px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold">
              Buka Meja 3 Pencatatan
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {list.map((k: any) => {
              const a = anggotaById.get(k.anggota_id);
              if (!a) return null;
              const pel = k.pelayanan || {};
              // M4-009: semua jenis layanan dihitung.
              const hasService = hasAnyPelayanan(pel);
              const isFinished = k.status_alur === "selesai";
              const measured = visitHasPengukuran(k);

              return (
                <div key={k.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/60 transition">
                  <div className="flex items-center gap-3.5">
                    <Avatar nama={a.nama} className="w-11 h-11 rounded-2xl" />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-gray-900 text-sm">{a.nama}</h4>
                        <CategoryBadge kategori={a.kategori} />
                        {isFinished ? (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Selesai
                          </span>
                        ) : hasService ? (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Pelayanan Terisi
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full animate-pulse">
                            Menunggu Pelayanan
                          </span>
                        )}
                        {pel.rujukan && (
                          <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-bold rounded-full flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Dirujuk: {pel.tujuan_rujukan || "Puskesmas"}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap text-xs text-gray-500 mt-1">
                        <span>NIK: {maskNik(a.nik)}</span>
                        {pel.vitamin_a && <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded border border-amber-200 text-[10px] font-semibold">Vit A</span>}
                        {pel.pmt && <span className="px-1.5 py-0.5 bg-green-50 text-green-700 rounded border border-green-200 text-[10px] font-semibold">PMT</span>}
                        {pel.tablet_fe && <span className="px-1.5 py-0.5 bg-pink-50 text-pink-700 rounded border border-pink-200 text-[10px] font-semibold">Tablet Fe</span>}
                        {Array.isArray(pel.imunisasi) && pel.imunisasi.length > 0 && (
                          <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200 text-[10px] font-semibold">
                            Imunisasi: {pel.imunisasi.join(", ")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {isFinished ? null : !measured ? (
                    <button
                      onClick={() => navigate(`${rolePrefix}/meja2/${a.id}`)}
                      className="shrink-0 px-3 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-semibold"
                    >
                      Ke Meja 2
                    </button>
                  ) : (
                    <button
                      onClick={() => navigate(`${rolePrefix}/meja4/${a.id}`)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5 ${
                        hasService
                          ? "bg-gray-100 hover:bg-gray-200 text-gray-700"
                          : "bg-amber-600 hover:bg-amber-700 text-white"
                      }`}
                    >
                      <Syringe className="w-4 h-4" />
                      <span>{hasService ? "Edit Pelayanan" : "Beri Layanan"}</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
