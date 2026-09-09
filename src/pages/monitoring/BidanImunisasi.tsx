/**
 * SIPANDU - Status Imunisasi Sasaran (PRD sitemap /monitoring/bidan/imunisasi)
 * Ringkasan kelengkapan imunisasi seluruh bayi/balita berbasis jadwal Bab 10.
 */
import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { Syringe } from "lucide-react";
import { useSipandu } from "@/lib/data-store";
import { useAuth } from "@/lib/auth-context";
import { statusImunisasi } from "@/utils/jadwalImunisasi";
import { hitungUsia } from "@/utils/zscoreCalculator";

export default function BidanImunisasi() {
  const { data } = useSipandu();
  const { showToast } = useAuth();

  const rows = useMemo(() => {
    const anak = data.anggota.filter((a: any) => a.status_aktif && (a.kategori === "bayi" || a.kategori === "balita"));
    const diberikanByAnggota = new Map<string, Set<string>>();
    [...data.kunjungan, ...data.kunjunganAktif].forEach((k: any) => {
      const set = diberikanByAnggota.get(k.anggota_id) || new Set<string>();
      (k?.pelayanan?.imunisasi || []).forEach((j: string) => set.add(j));
      diberikanByAnggota.set(k.anggota_id, set);
    });

    return anak
      .map((a: any) => {
        const usia = hitungUsia(a.tanggal_lahir);
        const totalBulan = usia?.totalBulan || 0;
        const diberikan = Array.from(diberikanByAnggota.get(a.id) || []);
        const status = statusImunisasi(totalBulan, diberikan);
        const sudah = status.filter((s) => s.status === "sudah").length;
        const terlambat = status.filter((s) => s.status === "terlambat");
        const jatuhTempo = status.filter((s) => s.status === "jatuh_tempo");
        return { anggota: a, totalBulan, sudah, total: status.length, terlambat, jatuhTempo };
      })
      .sort((x, y) => y.terlambat.length - x.terlambat.length || y.totalBulan - x.totalBulan);
  }, [data.anggota, data.kunjungan, data.kunjunganAktif]);

  const lengkap = rows.filter((r) => r.terlambat.length === 0 && r.sudah === r.total).length;
  const adaTertunggak = rows.filter((r) => r.terlambat.length > 0).length;
  const persen = rows.length > 0 ? Math.round((lengkap / rows.length) * 100) : 0;

  return (
    <div className="p-4 sm:p-8 space-y-6">
      <div>
        <div className="text-xs font-semibold text-sky-600 uppercase tracking-wider">Monitoring — Bidan Desa</div>
        <h1 className="text-2xl font-bold text-gray-900 mt-1">Status Imunisasi Sasaran</h1>
        <p className="text-sm text-gray-500">Kelengkapan imunisasi dasar {rows.length} bayi/balita sesuai jadwal nasional</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm text-center">
          <p className="text-xs text-gray-400 font-semibold uppercase">Lengkap</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{lengkap}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm text-center">
          <p className="text-xs text-gray-400 font-semibold uppercase">Ada Tertunggak</p>
          <p className="text-2xl font-bold text-rose-600 mt-1">{adaTertunggak}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm text-center">
          <p className="text-xs text-gray-400 font-semibold uppercase">% Kelengkapan</p>
          <p className="text-2xl font-bold text-sky-600 mt-1">{persen}%</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold border-b border-gray-100">
            <tr>
              <th className="px-4 py-3">Anak</th>
              <th className="px-4 py-3">Usia</th>
              <th className="px-4 py-3">Progres</th>
              <th className="px-4 py-3">Tertunggak</th>
              <th className="px-4 py-3">Jatuh Tempo</th>
              <th className="px-4 py-3 text-center">Detail</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400 text-xs">Belum ada sasaran bayi/balita.</td></tr>
            ) : (
              rows.map((r) => (
                <tr key={r.anggota.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-xs font-bold text-gray-900">{r.anggota.nama}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{r.totalBulan} bln</td>
                  <td className="px-4 py-3 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500" style={{ width: `${(r.sudah / r.total) * 100}%` }} />
                      </div>
                      <span className="text-gray-500 font-semibold">{r.sudah}/{r.total}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {r.terlambat.length > 0 ? (
                      <button onClick={() => showToast(`${r.anggota.nama}: ${r.terlambat.map((t) => t.jenis.id).join(", ")}`, "warning")} className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full font-bold">
                        {r.terlambat.length} jenis
                      </button>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {r.jatuhTempo.length > 0 ? (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-bold">{r.jatuhTempo.map((t) => t.jenis.id).join(", ")}</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Link to={`/anggota/${r.anggota.id}`} className="text-xs font-semibold text-sky-600 hover:underline">Profil</Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
