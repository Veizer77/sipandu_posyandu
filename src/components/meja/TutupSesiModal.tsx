/**
 * SIPANDU - Modal konfirmasi tutup sesi (ekstraksi dari Rekap.tsx, RK-036).
 * RK-016/RK-033: checklist kelengkapan (visit belum selesai, penyuluhan,
 * verifikasi) + opsi tutup paksa. RK-005: guard double-click + spinner.
 */
import { AlertOctagon, Lock, AlertTriangle, CheckCircle2, X } from "lucide-react";
import type { TutupChecklist } from "@/lib/rekapLogic";

interface TutupSesiModalProps {
  tanggalLabel: string;
  hadirCount: number;
  followUpCount: number;
  rujukanCount: number;
  checklist: TutupChecklist;
  isClosing: boolean;
  closeError: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export function TutupSesiModal({
  tanggalLabel,
  hadirCount,
  followUpCount,
  rujukanCount,
  checklist,
  isClosing,
  closeError,
  onCancel,
  onConfirm,
}: TutupSesiModalProps) {
  const incomplete = !checklist.lengkap;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
            <AlertOctagon className="w-6 h-6" />
          </div>
          <button
            onClick={onCancel}
            disabled={isClosing}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <h3 className="text-lg font-bold text-gray-900">Konfirmasi Tutup Sesi Hari H</h3>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
            Anda akan menutup sesi Posyandu <b>{tanggalLabel}</b>. Seluruh
            antrean aktif ({hadirCount} kunjungan) akan diarsipkan menjadi riwayat resmi posyandu dan diteruskan ke
            Laporan Bulanan L-01.
          </p>
        </div>

        <div className="p-3 bg-gray-50 rounded-xl space-y-2 text-xs text-gray-600">
          <div className="flex justify-between">
            <span>Peserta Hadir Terlayani:</span>
            <span className="font-bold text-emerald-600">{hadirCount} Jiwa</span>
          </div>
          <div className="flex justify-between">
            <span>Rencana Kunjungan Rumah:</span>
            <span className="font-bold text-amber-600">{followUpCount} Sasaran</span>
          </div>
          <div className="flex justify-between">
            <span>Kasus Rujukan Puskesmas:</span>
            <span className="font-bold text-rose-600">{rujukanCount} Kasus</span>
          </div>
        </div>

        {incomplete ? (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1.5">
            <p className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" /> Sesi belum lengkap:
            </p>
            <ul className="list-disc list-inside space-y-0.5">
              {checklist.belumAlur.map((b) => (
                <li key={b.stage}>
                  {b.count} peserta {b.label}
                </li>
              ))}
              {checklist.tanpaPenyuluhan && <li>Belum ada penyuluhan tercatat di Meja 5</li>}
              {checklist.belumVerifikasi > 0 && (
                <li>{checklist.belumVerifikasi} kunjungan belum diverifikasi Bidan</li>
              )}
            </ul>
            <p className="pt-1">Anda dapat kembali menyelesaikannya, atau tutup paksa — data yang kurang tetap kurang di laporan.</p>
          </div>
        ) : (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Sesi siap difinalisasi
            </p>
            {checklist.menungguTutup > 0 ? (
              <p>
                {checklist.menungguTutup} peserta telah menyelesaikan Meja 4 dan menunggu penutupan sesi
                untuk ditandai selesai
                {checklist.sudahSelesai > 0 && (
                  <> (ditambah {checklist.sudahSelesai} yang sudah berstatus selesai — total{" "}
                  {checklist.sudahSelesai + checklist.menungguTutup} tercatat selesai setelah sesi ditutup)</>
                )}
                .
              </p>
            ) : (
              <p>Seluruh peserta sesi ini sudah selesai dilayani.</p>
            )}
            {checklist.belumVerifikasi > 0 && (
              <p className="text-amber-800">
                Catatan: {checklist.belumVerifikasi} kunjungan belum diverifikasi Bidan — verifikasi sebelum
                menutup bila memungkinkan.
              </p>
            )}
          </div>
        )}

        {closeError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-semibold">
            {closeError} Tidak ada data yang diubah. Coba lagi.
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isClosing}
            className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 font-bold rounded-xl text-xs transition"
          >
            {incomplete ? "Kembali & Selesaikan" : "Batal"}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isClosing}
            className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs shadow-md shadow-rose-600/20 transition flex items-center justify-center gap-1.5"
          >
            {isClosing ? (
              <>Menutup…</>
            ) : (
              <>
                <Lock className="w-4 h-4" /> {incomplete ? "Tutup Paksa Sesi" : "Ya, Tutup Sesi Resmi"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
