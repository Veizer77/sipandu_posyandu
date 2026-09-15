/**
 * SIPANDU - Meja 2: panel kanan (ekstraksi dari Meja2.tsx, M2-028).
 * - Meja2AnalysisCard: hasil analisis & status klinis live
 * - Meja2HistoryCard: riwayat pengukuran terakhir
 * - Meja2RiskCard: deteksi risiko klinis (key stabil visitId+kode+index, M2-020)
 */
import { Activity, History, HeartPulse, AlertTriangle, CheckCircle2, Baby } from "lucide-react";
import { buildRisikoKey } from "@/lib/meja2Logic";

// ---------------------------------------------------------------- analisis
interface AnalysisProps {
  isAnak: boolean;
  isBumil: boolean;
  analysis: any | null;
  bumilAnalysis: any | null;
  imt: { value: number; label: string; badge: string } | null;
  tensiAnalysis: { label: string; badge: string } | null;
  gdsAnalysis: { label: string; badge: string } | null;
  form: Record<string, any>;
  lastWeight: number | null;
}

export function Meja2AnalysisCard({
  isAnak,
  isBumil,
  analysis,
  bumilAnalysis,
  imt,
  tensiAnalysis,
  gdsAnalysis,
  form,
  lastWeight,
}: AnalysisProps) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
      <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-sky-50 text-sky-600 rounded-lg">
            <Activity className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-gray-900 text-sm">
            {isAnak ? "Hasil Analisis Z-Score WHO" : "Status & Parameter Klinis"}
          </h3>
        </div>
        <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full">
          Live Preview
        </span>
      </div>

      {isAnak && (
        <>
          {analysis ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">BB/U</p>
                  <p className="text-xl font-extrabold text-slate-900 mt-0.5">
                    {analysis.z_bbu?.toFixed(2) ?? "—"}
                  </p>
                  <span className={`mt-1.5 inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${analysis.status_bbu.badge}`}>
                    {analysis.status_bbu.label}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">TB/U</p>
                  <p className="text-xl font-extrabold text-slate-900 mt-0.5">
                    {analysis.z_tbu?.toFixed(2) ?? "—"}
                  </p>
                  <span className={`mt-1.5 inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${analysis.status_tbu.badge}`}>
                    {analysis.status_tbu.label}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">BB/TB</p>
                  <p className="text-xl font-extrabold text-slate-900 mt-0.5">
                    {analysis.z_bbtb?.toFixed(2) ?? "—"}
                  </p>
                  <span className={`mt-1.5 inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${analysis.status_bbtb.badge}`}>
                    {analysis.status_bbtb.label}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100 text-xs flex items-center justify-between">
                <div>
                  <span className="text-slate-500 text-[11px] block">Pertumbuhan vs Pengukuran Lalu:</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {analysis.statusPertumbuhan === "data_baru"
                      ? "Data pertama (tanpa baseline)"
                      : `${analysis.selisihBB >= 0 ? "+" : ""}${analysis.selisihBB.toFixed(2)} kg`}
                  </span>
                  {lastWeight && analysis.statusPertumbuhan !== "data_baru" && (
                    <span className="text-[11px] text-slate-500 ml-1.5">(dari {lastWeight} kg)</span>
                  )}
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    analysis.statusPertumbuhan === "naik"
                      ? "bg-emerald-100 text-emerald-800"
                      : analysis.statusPertumbuhan === "data_baru"
                        ? "bg-sky-100 text-sky-800"
                        : "bg-rose-100 text-rose-800"
                  }`}
                >
                  {analysis.statusPertumbuhan === "naik"
                    ? "Naik (N) ✅"
                    : analysis.statusPertumbuhan === "data_baru"
                      ? "Data Baru 🆕"
                      : "Tidak Naik (T) ⚠️"}
                </span>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-gray-500 space-y-2">
              <Baby className="w-8 h-8 text-gray-300 mx-auto" />
              <p className="font-semibold text-gray-700">Kalkulasi Z-Score WHO Otomatis</p>
              <p className="text-gray-400 max-w-xs mx-auto text-[11px]">
                Masukkan Berat Badan dan Panjang/Tinggi Badan untuk melihat Z-score status gizi balita secara live.
              </p>
            </div>
          )}
        </>
      )}

      {isBumil && (
        <div className="space-y-3">
          {bumilAnalysis && (bumilAnalysis.lilaStatus || bumilAnalysis.tdStatus || bumilAnalysis.djjStatus) ? (
            <div className="space-y-2.5">
              {bumilAnalysis.lilaStatus && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">Status LILA:</span>
                  <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] border ${bumilAnalysis.lilaStatus.badge}`}>
                    {bumilAnalysis.lilaStatus.label}
                  </span>
                </div>
              )}
              {bumilAnalysis.tdStatus && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">Tekanan Darah:</span>
                  <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] border ${bumilAnalysis.tdStatus.badge}`}>
                    {form.td_sistolik}/{form.td_diastolik} · {bumilAnalysis.tdStatus.label}
                  </span>
                </div>
              )}
              {bumilAnalysis.djjStatus && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">Detak Jantung Janin:</span>
                  <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] border ${bumilAnalysis.djjStatus.badge}`}>
                    {form.djj} bpm · {bumilAnalysis.djjStatus.label}
                  </span>
                </div>
              )}
              {bumilAnalysis.hphtInfo && (
                <div className="p-3 rounded-xl bg-pink-50/60 border border-pink-100 text-xs text-pink-900 flex items-center justify-between">
                  <span>Perkiraan Lahir (HPL):</span>
                  <span className="font-bold">{bumilAnalysis.hphtInfo.hplFormatted} ({bumilAnalysis.hphtInfo.usiaMinggu} Minggu)</span>
                </div>
              )}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-gray-500 space-y-2">
              <HeartPulse className="w-8 h-8 text-rose-300 mx-auto" />
              <p className="font-semibold text-gray-700">Pemantauan Khusus Ibu Hamil</p>
              <p className="text-gray-400 max-w-xs mx-auto text-[11px]">
                Isi LILA dan Tekanan Darah untuk mendeteksi risiko KEK dan hipertensi kehamilan secara otomatis.
              </p>
            </div>
          )}
        </div>
      )}

      {!isAnak && !isBumil && (
        <div className="space-y-3">
          {imt || tensiAnalysis || gdsAnalysis ? (
            <div className="space-y-2.5">
              {imt && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    Indeks Massa Tubuh (IMT)
                  </p>
                  <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{imt.value.toFixed(1)}</p>
                  <span className={`mt-1 inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${imt.badge}`}>
                    {imt.label}
                  </span>
                </div>
              )}
              {tensiAnalysis && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">Tekanan Darah:</span>
                  <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] border ${tensiAnalysis.badge}`}>
                    {form.td_sistolik}/{form.td_diastolik} · {tensiAnalysis.label}
                  </span>
                </div>
              )}
              {gdsAnalysis && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">Gula Darah (GDS):</span>
                  <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] border ${gdsAnalysis.badge}`}>
                    {form.gula_darah_sewaktu} mg/dL · {gdsAnalysis.label}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-gray-500 space-y-2">
              <Activity className="w-8 h-8 text-gray-300 mx-auto" />
              <p className="font-semibold text-gray-700">Analisis Kesehatan Posyandu</p>
              <p className="text-gray-400 max-w-xs mx-auto text-[11px]">
                Masukkan data antropometri dan tanda vital untuk memantau status gizi dan skrining PTM.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------- riwayat
export function Meja2HistoryCard({ riwayat }: { riwayat: any[] }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-3">
      <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
            <History className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-gray-900 text-sm">Riwayat Pengukuran Terakhir</h3>
        </div>
        <span className="text-[10px] text-gray-500 font-medium">KMS & Kunjungan Lalu</span>
      </div>

      {riwayat.length > 0 ? (
        <div className="space-y-2">
          {riwayat.map((rk: any, i: number) => {
            const p = rk.pengukuran || {};
            const lila = p.lingkar_lengan ?? p.lingkar_lengan_atas;
            const sistol = p.td_sistolik ?? p.tekanan_darah_sistol;
            const diastol = p.td_diastolik ?? p.tekanan_darah_diastol;
            return (
              <div
                key={rk.id || i}
                className="p-3 rounded-xl bg-gray-50/70 border border-gray-100 text-xs flex items-center justify-between"
              >
                <div>
                  <p className="font-bold text-gray-800">
                    {rk.waktu_hadir
                      ? new Date(rk.waktu_hadir).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {`BB: ${p.berat_badan || "—"} kg · TB: ${p.tinggi_badan || "—"} cm`}
                    {lila ? ` · LILA: ${lila} cm` : ""}
                    {sistol ? ` · TD: ${sistol}/${diastol}` : ""}
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white border border-gray-200 text-gray-700">
                  {p.status_gizi || "Tercatat"}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-4 text-center text-xs text-gray-500">
          <p className="text-gray-400 text-[11px]">
            Kunjungan pertama pada periode ini. Belum ada catatan pengukuran terdahulu.
          </p>
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------------- risiko
export function Meja2RiskCard({ risikoList, visitId }: { risikoList: any[]; visitId: string }) {
  return (
    <div
      className={`p-6 rounded-2xl border shadow-sm space-y-3 transition ${
        risikoList.length > 0 ? "bg-rose-50/40 border-rose-200" : "bg-white border-gray-100"
      }`}
    >
      <div className="flex items-center justify-between border-b border-gray-100/80 pb-3">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${risikoList.length > 0 ? "bg-rose-100 text-rose-700" : "bg-emerald-50 text-emerald-600"}`}>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <h3 className={`font-bold text-sm ${risikoList.length > 0 ? "text-rose-900" : "text-gray-900"}`}>
            Deteksi Risiko Klinis
          </h3>
        </div>
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            risikoList.length > 0 ? "bg-rose-200 text-rose-800" : "bg-emerald-100 text-emerald-800"
          }`}
        >
          {risikoList.length > 0 ? `${risikoList.length} Terdeteksi` : "Aman / Normal"}
        </span>
      </div>

      {risikoList.length > 0 ? (
        <div className="space-y-2.5">
          {risikoList.map((r, idx) => (
            <div
              key={buildRisikoKey(visitId, r.kode, idx)}
              className={`p-3 rounded-xl border text-xs ${
                r.severity === "danger"
                  ? "bg-rose-100/70 border-rose-300 text-rose-950"
                  : r.severity === "warning"
                    ? "bg-amber-100/70 border-amber-300 text-amber-950"
                    : "bg-sky-100/70 border-sky-300 text-sky-950"
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold">
                <span className="px-1.5 py-0.5 rounded bg-white/70 text-[10px]">{r.kode}</span>
                <span>{r.judul}</span>
              </div>
              <p className="mt-1 leading-relaxed text-[11px] opacity-90">{r.deskripsi}</p>
              <p className="mt-1.5 font-semibold text-[11px] pt-1 border-t border-black/5">
                Tindak Lanjut: {r.tindakLanjut}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-2 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span className="text-gray-600 text-[11px]">
            Tidak ada anomali atau risiko klinis terdeteksi pada parameter yang dimasukkan.
          </span>
        </div>
      )}
    </div>
  );
}
