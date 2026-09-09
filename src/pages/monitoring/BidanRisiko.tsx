/**
 * SIPANDU - Daftar Sasaran Berisiko (PRD sitemap /monitoring/bidan/risiko)
 * State machine risiko 35.4: aktif -> ditangani | diabaikan.
 */
import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ShieldCheck, EyeOff } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useSipandu } from "@/lib/data-store";
import { CategoryBadge } from "@/components/meja/MejaShared";

const SEVERITY_CLS: Record<string, string> = {
  danger: "bg-rose-50 border-rose-200",
  warning: "bg-amber-50 border-amber-200",
  info: "bg-sky-50 border-sky-200",
};

export default function BidanRisiko() {
  const { showToast } = useAuth();
  const { data, updateStatusRisiko } = useSipandu();

  const allRisiko = useMemo(() => {
    const dariTabel = (data.risiko || []).map((r: any) => ({
      id: r.id,
      anggota_id: r.anggota_id,
      kode: r.kode_risiko || r.kode,
      judul: r.deskripsi || r.judul,
      severity: r.severity || "warning",
      tindakLanjut: r.tindak_lanjut || r.tindakLanjut,
      status: r.status || "aktif",
    }));
    const dariKunjungan = [...data.kunjunganAktif, ...data.kunjungan].flatMap((k: any) =>
      (k.risiko || []).map((r: any, idx: number) => {
        const isObj = typeof r === "object" && r !== null;
        const judul = isObj ? (r.judul || r.deskripsi || "Risiko Terdeteksi") : String(r);
        const kode = isObj ? (r.kode || r.kode_risiko || `R-${idx + 1}`) : `R-${idx + 1}`;
        const id = isObj && r.id ? r.id : `${k.id}-${kode}`;
        return {
          id,
          anggota_id: k.anggota_id,
          kode,
          judul,
          severity: (isObj && r.severity) || (judul.toLowerCase().includes("buruk") || judul.toLowerCase().includes("hipertensi") ? "danger" : "warning"),
          tindakLanjut: (isObj && (r.tindakLanjut || r.tindak_lanjut)) || "Konseling & Pantau Rutin",
          status: (isObj && r.status) || "aktif",
        };
      })
    );
    const seen = new Set<string>();
    return [...dariTabel, ...dariKunjungan].filter((r) => {
      if (!r.id || seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    });
  }, [data.risiko, data.kunjunganAktif, data.kunjungan]);

  const aktif = allRisiko.filter((r) => r.status === "aktif");
  const ditangani = allRisiko.filter((r) => r.status === "ditangani");
  const diabaikan = allRisiko.filter((r) => r.status === "diabaikan");

  function renderRow(r: any) {
    const a = data.anggota.find((x: any) => x.id === r.anggota_id);
    return (
      <div key={r.id} className={`p-3.5 rounded-xl border ${SEVERITY_CLS[r.severity] || SEVERITY_CLS.info} flex items-center justify-between gap-3`}>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[10px] font-bold text-gray-500">{r.kode || "—"}</span>
            <span className="text-xs font-bold text-gray-900">{a?.nama || "Anggota"}</span>
            {a && <CategoryBadge kategori={a.kategori} />}
          </div>
          <p className="text-[11px] text-gray-600 mt-0.5">{r.judul || r.deskripsi}</p>
          {r.tindakLanjut && <p className="text-[10px] text-gray-500 mt-0.5">Tindak lanjut: {r.tindakLanjut}</p>}
        </div>
        {r.status === "aktif" ? (
          <div className="flex gap-1.5 shrink-0">
            <button
              onClick={async () => {
                await updateStatusRisiko(r.id, "ditangani");
                showToast("Risiko ditandai ditangani.", "success");
              }}
              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold inline-flex items-center gap-1"
            >
              <ShieldCheck className="w-3 h-3" /> Tangani
            </button>
            <button
              onClick={async () => {
                await updateStatusRisiko(r.id, "diabaikan");
                showToast("Risiko ditandai diabaikan.", "warning");
              }}
              className="px-2.5 py-1.5 border border-gray-200 hover:bg-white text-gray-600 rounded-lg text-[10px] font-bold inline-flex items-center gap-1"
            >
              <EyeOff className="w-3 h-3" /> Abaikan
            </button>
          </div>
        ) : (
          <span className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-[10px] font-bold text-gray-600 capitalize shrink-0">{r.status}</span>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-6">
      <div>
        <div className="text-xs font-semibold text-rose-600 uppercase tracking-wider">Monitoring — Bidan Desa</div>
        <h1 className="text-2xl font-bold text-gray-900 mt-1">Daftar Sasaran Berisiko</h1>
        <p className="text-sm text-gray-500">Flag otomatis dari deteksi risiko: {aktif.length} aktif · {ditangani.length} ditangani · {diabaikan.length} diabaikan</p>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-rose-500" /> Aktif</h3>
          <div className="space-y-2.5">
            {aktif.length === 0 ? <p className="text-xs text-gray-400 italic">Tidak ada risiko aktif.</p> : aktif.map(renderRow)}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 text-sm mb-3">Ditangani</h3>
            <div className="space-y-2.5">
              {ditangani.length === 0 ? <p className="text-xs text-gray-400 italic">Belum ada.</p> : ditangani.map(renderRow)}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 text-sm mb-3">Diabaikan</h3>
            <div className="space-y-2.5">
              {diabaikan.length === 0 ? <p className="text-xs text-gray-400 italic">Belum ada.</p> : diabaikan.map(renderRow)}
            </div>
          </div>
        </div>
      </div>

      <div className="text-center">
        <Link to="/bidan/dashboard" className="text-xs font-semibold text-sky-600 hover:underline">← Kembali ke Dashboard Bidan</Link>
      </div>
    </div>
  );
}
