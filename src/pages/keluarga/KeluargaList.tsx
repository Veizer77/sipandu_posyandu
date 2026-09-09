/**
 * SIPANDU - Data Keluarga (Daftar KK)
 * Identik dengan renderKeluargaListView legacy.
 */
import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Link2 } from "lucide-react";
import { useSipandu } from "@/lib/data-store";

export default function KeluargaList() {
  const { data } = useSipandu();
  const [q, setQ] = useState("");
  const [rt, setRt] = useState("");

  const rows = useMemo(() => {
    return data.keluarga.filter((k: any) => {
      const matchQ = k.nomor_kk.includes(q) || k.nama_kepala_keluarga.toLowerCase().includes(q.toLowerCase()) || k.alamat.toLowerCase().includes(q.toLowerCase());
      const matchRT = rt ? k.rt === rt : true;
      return matchQ && matchRT;
    });
  }, [data.keluarga, q, rt]);

  return (
    <div className="p-4 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Keluarga (KK)</h1>
          <p className="text-sm text-gray-500">Daftar Kartu Keluarga terdaftar di RW 06 Desa Mojorejo</p>
        </div>
        <Link to="/keluarga/tambah" className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl text-sm transition shadow-sm flex items-center gap-2">
          <Plus className="w-4 h-4" /> Tambah Keluarga Baru
        </Link>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari No. KK, Nama Kepala Keluarga, atau Alamat..."
            className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-sky-500 outline-none text-sm"
          />
        </div>
        <select value={rt} onChange={(e) => setRt(e.target.value)} className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none">
          <option value="">Semua RT</option>
          <option value="13">RT 13</option>
          <option value="14">RT 14</option>
          <option value="15">RT 15</option>
          <option value="16">RT 16</option>
          <option value="21">RT 21</option>
          <option value="23">RT 23</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Nomor KK</th>
                <th className="px-6 py-4">Kepala Keluarga</th>
                <th className="px-6 py-4">Alamat / RT</th>
                <th className="px-6 py-4">Anggota</th>
                <th className="px-6 py-4">SINDUKSADATI</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">Tidak ada data keluarga ditemukan</td>
                </tr>
              ) : (
                rows.map((k: any) => {
                  const count = data.anggota.filter((a: any) => a.keluarga_id === k.id).length;
                  return (
                    <tr key={k.id} className="hover:bg-gray-50/70 transition">
                      <td className="px-6 py-4 font-mono font-medium text-gray-900">{k.nomor_kk}</td>
                      <td className="px-6 py-4 font-semibold text-gray-900">{k.nama_kepala_keluarga}</td>
                      <td className="px-6 py-4 text-gray-600">
                        RT {k.rt} / RW {k.rw} · {k.alamat}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">{count} Jiwa</span>
                      </td>
                      <td className="px-6 py-4">
                        {k.sinduksadati_keluarga_id ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded-full text-xs font-semibold">
                            <Link2 className="w-3 h-3" /> Terhubung
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs">Belum Link</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link to={`/keluarga/${k.id}`} className="px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 font-semibold rounded-lg text-xs transition">
                          Lihat Detail
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
