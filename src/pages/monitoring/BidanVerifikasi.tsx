/**
 * SIPANDU - Verifikasi Kunjungan oleh Bidan
 * Alur verifikasi PRD F-08: Draft -> Diperiksa -> Valid (dapat dikembalikan ke Draft).
 */
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, ClipboardList, FileCheck2, Eye, Undo2, CheckCheck, X } from "lucide-react";
import { CategoryBadge } from "@/components/meja/MejaShared";
import { useAuth } from "@/lib/auth-context";
import { useSipandu } from "@/lib/data-store";

const VERIF_BADGE: Record<string, { label: string; cls: string; icon?: React.ReactNode }> = {
  draft: { label: "Draft", cls: "bg-slate-100 text-slate-600 border-slate-200" },
  diperiksa: { label: "Diperiksa", cls: "bg-amber-50 text-amber-700 border-amber-200", icon: <Eye className="w-3 h-3" /> },
  valid: { label: "Valid", cls: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: <CheckCircle2 className="w-3 h-3" /> },
};

export default function BidanVerifikasi() {
  const { showToast } = useAuth();
  const { data, verifikasiKunjungan, verifikasiBulkKunjungan } = useSipandu();
  const list = data.kunjunganAktif;

  const draftCount = list.filter((k: any) => (k.status_verifikasi || "draft") === "draft").length;
  const diperiksaCount = list.filter((k: any) => k.status_verifikasi === "diperiksa").length;
  const validCount = list.filter((k: any) => k.status_verifikasi === "valid").length;

  const pendingIds = list
    .filter((k: any) => (k.status_verifikasi || "draft") !== "valid")
    .map((k: any) => k.id);

  async function validasiSemua() {
    if (pendingIds.length === 0) return;
    await verifikasiBulkKunjungan(pendingIds, "valid");
    showToast(`${pendingIds.length} kunjungan divalidasi sekaligus oleh Bidan.`, "success");
  }

  async function mulaiPeriksa(id: string) {
    await verifikasiKunjungan(id, "diperiksa");
    showToast("Kunjungan ditandai sedang diperiksa oleh Bidan.", "info");
  }

  async function validasi(id: string) {
    await verifikasiKunjungan(id, "valid");
    showToast("Data kunjungan terverifikasi valid oleh Bidan.", "success");
  }

  // Kembalikan ke Draft wajib menyertakan catatan perbaikan (PRD F-08)
  const [returnId, setReturnId] = useState<string | null>(null);
  const [returnNote, setReturnNote] = useState("");

  async function konfirmasiKembalikan() {
    if (!returnId) return;
    const note = returnNote.trim();
    if (!note) {
      showToast("Catatan perbaikan wajib diisi sebelum mengembalikan ke Draft.", "danger");
      return;
    }
    await verifikasiKunjungan(returnId, "draft", note);
    showToast("Kunjungan dikembalikan ke Draft untuk diperbaiki Kader.", "warning");
    setReturnId(null);
    setReturnNote("");
  }

  return (
    <div className="p-4 sm:p-8 space-y-6">
      <div>
        <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Verifikasi Kunjungan — Bidan Desa</div>
        <h1 className="text-2xl font-bold text-gray-900 mt-1">Antrian Verifikasi Data Kunjungan Hari H</h1>
        <p className="text-sm text-gray-500">Periksa dan validasi data pengukuran kader sebelum masuk laporan bulanan.</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-blue-900">
              {draftCount} Menunggu · {diperiksaCount} Diperiksa · {validCount} Valid
            </h3>
            <p className="text-xs text-blue-700">Alur: Draft → Diperiksa → Valid. Hanya kunjungan Valid yang masuk laporan resmi.</p>
          </div>
        </div>
        {pendingIds.length > 0 && (
          <button
            onClick={validasiSemua}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm inline-flex items-center gap-1.5 shrink-0"
          >
            <CheckCheck className="w-4 h-4" /> Validasi Semua ({pendingIds.length})
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold border-b border-gray-100">
            <tr>
              <th className="px-4 py-3">Waktu Hadir</th>
              <th className="px-4 py-3">Peserta</th>
              <th className="px-4 py-3">BB / TB / Z-Score</th>
              <th className="px-4 py-3">Status Gizi</th>
              <th className="px-4 py-3">Vitamin A</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {list.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-gray-400 text-xs">Tidak ada antrian verifikasi.</td></tr>
            ) : (
              list.map((k: any) => {
                const a = data.anggota.find((x: any) => x.id === k.anggota_id);
                if (!a) return null;
                const status = k.status_verifikasi || "draft";
                const badge = VERIF_BADGE[status] || VERIF_BADGE.draft;
                return (
                  <tr key={k.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {new Date(k.waktu_hadir).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-4 py-3">
                      <Link to={`/anggota/${a.id}`} className="font-semibold text-gray-900 text-xs hover:text-sky-700">
                        {a.nama}
                      </Link>
                      <div className="mt-0.5"><CategoryBadge kategori={a.kategori} /></div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-700 font-mono">
                      {k.pengukuran?.berat_badan || "—"} / {k.pengukuran?.tinggi_badan || k.pengukuran?.panjang_badan || "—"} ({k.pengukuran?.z_score_bbu?.toFixed(1) || "—"})
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-bold">
                        {k.pengukuran?.status_gizi || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {k.pelayanan?.vitamin_a ? (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-bold">✓ Diberikan</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 border ${badge.cls}`}>
                        {badge.icon} {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {status === "valid" ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Valid
                          </span>
                          <button
                            onClick={() => { setReturnId(k.id); setReturnNote(""); }}
                            title="Kembalikan ke Draft (wajib catatan)"
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                          >
                            <Undo2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1.5">
                          {status === "draft" ? (
                            <button
                              onClick={() => mulaiPeriksa(k.id)}
                              className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold shadow-sm inline-flex items-center gap-1.5"
                            >
                              <Eye className="w-3 h-3" /> Periksa
                            </button>
                          ) : (
                            <button
                              onClick={() => { setReturnId(k.id); setReturnNote(""); }}
                              className="px-2.5 py-1.5 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5"
                            >
                              <Undo2 className="w-3 h-3" /> Kembalikan
                            </button>
                          )}
                          <button
                            onClick={() => validasi(k.id)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm inline-flex items-center gap-1.5"
                          >
                            <FileCheck2 className="w-3 h-3" /> Validasi
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {returnId && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setReturnId(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Kembalikan ke Draft</h3>
              <button onClick={() => setReturnId(null)} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-gray-500">
              Cantumkan alasan perbaikan agar Kader dapat menindaklanjuti. Catatan wajib diisi.
            </p>
            <textarea
              value={returnNote}
              onChange={(e) => setReturnNote(e.target.value)}
              rows={3}
              placeholder="Contoh: Berat badan belum terisi, mohon diukur ulang di Meja 2."
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-300"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setReturnId(null)}
                className="px-4 py-2 text-gray-600 font-semibold rounded-xl text-sm hover:bg-gray-100"
              >
                Batal
              </button>
              <button
                onClick={konfirmasiKembalikan}
                disabled={!returnNote.trim()}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm"
              >
                Kembalikan ke Draft
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
