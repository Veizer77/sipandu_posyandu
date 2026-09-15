/**
 * SIPANDU - Meja 2: Antrean sesi aktif (ekstraksi dari Meja2.tsx, M2-028).
 * M2-001: HANYA menampilkan kunjungan milik sesi aktif (prop sessionVisits).
 */
import { Link } from "react-router-dom";
import { Scale, CheckCircle2, CalendarX2 } from "lucide-react";
import { MejaStepper, CategoryBadge } from "./MejaShared";
import { Avatar } from "../Avatar";
import WHO_ENGINE from "@/utils/zscoreCalculator";
import { maskNik } from "@/lib/utils";

interface Meja2AntreanProps {
  sessionVisits: any[];
  anggotaById: Map<string, any>;
  keluargaById: Map<string, any>;
  activeSessionId: string | null;
  sesiAktif: any | null;
  multipleActive: boolean;
  rolePrefix: string;
  jadwalUrl: string;
  onMulaiUkur: (anggotaId: string) => void;
}

export function Meja2Antrean({
  sessionVisits,
  anggotaById,
  keluargaById,
  activeSessionId,
  sesiAktif,
  multipleActive,
  rolePrefix,
  jadwalUrl,
  onMulaiUkur,
}: Meja2AntreanProps) {
  const sudahDiukur = sessionVisits.filter(
    (k: any) => k.pengukuran && (k.pengukuran.berat_badan || k.pengukuran.tinggi_badan)
  ).length;
  const belumDiukur = sessionVisits.length - sudahDiukur;

  // Tanpa sesi aktif yang valid -> blocked (jangan tampilkan antrean lintas sesi).
  if (!activeSessionId || !sesiAktif) {
    return (
      <div className="p-4 sm:p-8 space-y-6">
        <MejaStepper activeMeja={2} />
        <div className="bg-white p-12 rounded-2xl border border-gray-100 shadow-sm text-center">
          <CalendarX2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-gray-700">
            {multipleActive ? "Terdeteksi Lebih dari Satu Sesi Aktif" : "Belum Ada Sesi Posyandu Aktif"}
          </p>
          <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
            {multipleActive
              ? "Tutup/akhiri sesi ganda di halaman Jadwal Posyandu agar antrean Meja 2 tidak tercampur."
              : "Buka sesi hari H di halaman Jadwal Posyandu terlebih dahulu sebelum melakukan pengukuran."}
          </p>
          <Link
            to={jadwalUrl}
            className="mt-4 inline-block px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold"
          >
            Buka Jadwal Posyandu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-6">
      <MejaStepper activeMeja={2} />

      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold mb-1">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" /> Antrean Meja 2
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Meja 2: Pengukuran & Antropometri</h1>
          <p className="text-xs text-gray-500">
            Pilih peserta yang telah registrasi di Meja 1 untuk melakukan pengukuran antropometri.
            {sesiAktif?.tema || sesiAktif?.tanggal ? (
              <> Sesi: <strong className="text-gray-700">{sesiAktif.tema || sesiAktif.tanggal}</strong></>
            ) : null}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-xl text-center min-w-[100px]">
            <span className="text-[10px] text-blue-700 font-bold uppercase">Sudah Diukur</span>
            <p className="text-lg font-bold text-blue-800 leading-none mt-0.5">{sudahDiukur}</p>
          </div>
          <div className="px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl text-center min-w-[100px]">
            <span className="text-[10px] text-amber-700 font-bold uppercase">Menunggu</span>
            <p className="text-lg font-bold text-amber-800 leading-none mt-0.5">{belumDiukur}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {sessionVisits.length === 0 ? (
          <div className="p-12 text-center">
            <Scale className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-gray-700">Belum Ada Peserta Terdaftar di Meja 1</p>
            <p className="text-xs text-gray-400 mt-1">
              Lakukan pendaftaran kehadiran peserta di Meja 1 terlebih dahulu (sesi ini).
            </p>
            <Link
              to={`${rolePrefix}/meja1`}
              className="mt-4 inline-block px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold"
            >
              Buka Meja 1 Registrasi
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {sessionVisits.map((k: any) => {
              const a = anggotaById.get(k.anggota_id);
              if (!a) return null;
              const p = k.pengukuran;
              const isDone = Boolean(p && (p.berat_badan || p.tinggi_badan));
              const keluarga = keluargaById.get(a.keluarga_id);

              return (
                <div
                  key={k.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/60 transition"
                >
                  <div className="flex items-center gap-3.5">
                    <Avatar nama={a.nama} className="w-12 h-12 rounded-2xl" />
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className="font-bold text-gray-900 text-sm">{a.nama}</h4>
                        <CategoryBadge kategori={a.kategori} />
                        {isDone ? (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Sudah Diukur
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full animate-pulse">
                            Menunggu Pengukuran
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        NIK: {maskNik(a.nik)} · Usia:{" "}
                        {WHO_ENGINE.hitungUsia(a.tanggal_lahir)?.usiaTeks || "—"}
                        {isDone && (
                          <>
                            {" · "}
                            {`BB: ${p.berat_badan || "—"} kg · TB: ${p.tinggi_badan || "—"} cm `}
                            {(p.lingkar_lengan ?? p.lingkar_lengan_atas) && `· LILA: ${p.lingkar_lengan ?? p.lingkar_lengan_atas} cm `}
                            {(p.td_sistolik ?? p.tekanan_darah_sistol) && `· TD: ${p.td_sistolik ?? p.tekanan_darah_sistol}/${p.td_diastolik ?? p.tekanan_darah_diastol} `}
                            {p.status_gizi && `· Status: ${p.status_gizi}`}
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => onMulaiUkur(a.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 ${
                      isDone
                        ? "bg-gray-100 hover:bg-gray-200 text-gray-700"
                        : "bg-sky-600 hover:bg-sky-700 text-white shadow-sky-600/20"
                    }`}
                  >
                    <Scale className="w-4 h-4" />
                    <span>{isDone ? "Edit Pengukuran" : "Mulai Ukur"}</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
