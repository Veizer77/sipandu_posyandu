import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  Building2,
  TrendingDown,
  Coins,
  FileSpreadsheet,
  Users,
  Baby,
  Heart,
  UserCheck,
  ShieldCheck,
  Calendar,
  Layers,
  ArrowUpRight,
  Sparkles
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useSipandu } from "@/lib/data-store";
import { useRTDistribution } from "@/lib/dashboard-helpers";
import { buildTrenPersen6Bulan } from "@/lib/tren6bulan";

export default function KadesDashboardPage() {
  const { currentUser } = useAuth();
  const { data } = useSipandu();

  const totalJiwa = data.anggota.filter((a: any) => a.status_aktif).length;
  const totalKK = data.keluarga.length;

  const balitaCount = data.anggota.filter((a: any) => a.status_aktif && (a.kategori === "balita" || a.kategori === "bayi")).length;
  const bumilCount = data.anggota.filter((a: any) => a.status_aktif && (a.kategori === "ibu_hamil" || a.kategori === "bumil")).length;
  const lansiaCount = data.anggota.filter((a: any) => a.status_aktif && a.kategori === "lansia").length;

  const allVisits = useMemo(() => [...data.kunjunganAktif, ...data.kunjungan], [data.kunjunganAktif, data.kunjungan]);

  const stuntingCount = useMemo(() => {
    let count = 0;
    const balitaIds = new Set(
      data.anggota.filter((a: any) => a.status_aktif && (a.kategori === "balita" || a.kategori === "bayi")).map((b: any) => b.id)
    );
    allVisits.forEach((v: any) => {
      if (balitaIds.has(v.anggota_id) && v.pengukuran?.z_score_tbu != null && v.pengukuran.z_score_tbu < -2) {
        count++;
      }
    });
    return count;
  }, [data.anggota, allVisits]);

  const stuntingRate = balitaCount > 0 ? ((stuntingCount / balitaCount) * 100).toFixed(1) : "0.0";
  const rtData = useRTDistribution(data.keluarga, data.anggota, allVisits);

  // Tren penurunan stunting 6 bulan: bulan berjalan = data riil, sisanya ilustrasi
  const stuntingTrend = buildTrenPersen6Bulan(Number(stuntingRate) || 0);
  const adaHistoriStunting = stuntingTrend.some((d) => !d.isIlustrasi);

  // APBDes: angka bersumber dari input manual desa (bukan terekam sistem) -> ditandai ilustrasi
  const apbdes = {
    totalAnggaran: 52000000,
    terealisasi: 48600000,
    persen: 93.5,
    pos: [
      { nama: "PMT Bahan Pangan Lokal Balita & Bumil KEK", alokasi: 25000000, realisasi: 24200000, pct: 96.8 },
      { nama: "Operasional & Insentif Kader Posyandu ILP", alokasi: 15000000, realisasi: 14500000, pct: 96.7 },
      { nama: "Pengadaan & Kalibrasi Alat Antropometri Kemenkes", alokasi: 7000000, realisasi: 6400000, pct: 91.4 },
      { nama: "KIE, Edukasi Gizi & Sanitasi Jamban Sehat", alokasi: 5000000, realisasi: 3500000, pct: 70.0 },
    ],
  };

  return (
    <div className="p-4 sm:p-8 space-y-6">
      {/* Hero Section Eksekutif Kepala Desa */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-emerald-950/25 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-teal-400/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute left-1/4 bottom-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-semibold text-emerald-200 border border-white/10 shadow-sm">
              <Building2 className="w-3.5 h-3.5 text-emerald-300" />
              <span>Pemerintahan Desa Mojorejo · Laporan Eksekutif Kesehatan RW 06</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-1" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Selamat Datang, {currentUser?.nama_lengkap}
            </h1>
            <p className="text-emerald-100 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Ikhtisar Kesehatan Masyarakat, Angka Prevalensi Stunting, Realisasi Alokasi APBDes Bidang Kesehatan, serta Sinkronisasi Satu Data Kependudukan SINDUKSADATI.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl flex items-center gap-3">
              <div>
                <p className="text-[10px] uppercase font-bold text-emerald-200">Realisasi APBDes Kesehatan</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xl font-extrabold text-white">{apbdes.persen}%</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                    Rp 48,6 Jt
                  </span>
                </div>
              </div>
            </div>

            <Link
              to="/laporan"
              className="px-5 py-3 bg-white text-emerald-950 hover:bg-emerald-50 active:bg-emerald-100 font-bold rounded-2xl shadow-md transition flex items-center gap-2 text-xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              <span>Format L-01 Eksekutif</span>
            </Link>
            <Link
              to="/integrasi"
              className="px-4 py-3 bg-white/10 hover:bg-white/20 active:bg-white/25 backdrop-blur-md text-white border border-white/20 font-semibold rounded-2xl transition flex items-center gap-2 text-xs"
            >
              <Users className="w-4 h-4 text-teal-300" />
              <span>SINDUKSADATI</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Top 4 Executive Scorecard Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase">Populasi RW 06</p>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-3xl font-bold text-gray-900">{totalJiwa}</h3>
            <span className="text-xs text-gray-500 font-medium">Jiwa</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Total {totalKK} Kepala Keluarga (KK)</p>
          <div className="w-full bg-gray-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-emerald-600 h-full rounded-full" style={{ width: "100%" }} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase">Prevalensi Stunting</p>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-3xl font-bold text-amber-600">{stuntingRate}%</h3>
            <span className="text-xs text-amber-600 font-bold flex items-center">
              <TrendingDown className="w-3.5 h-3.5 mr-0.5" /> Real-time
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">{stuntingCount} Kasus dari {balitaCount} Balita</p>
          <div className="w-full bg-amber-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-amber-500 h-full rounded-full" style={{ width: `${Math.min(100, Number(stuntingRate) * 4)}%` }} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase">Realisasi Dana Desa Gizi</p>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-3xl font-bold text-emerald-600">{apbdes.persen}%</h3>
          </div>
          <p className="text-xs text-gray-500 mt-1">Rp {(apbdes.terealisasi / 1000000).toFixed(1)} Jt / Rp {(apbdes.totalAnggaran / 1000000).toFixed(1)} Jt</p>
          <div className="w-full bg-emerald-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${apbdes.persen}%` }} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase">Sasaran Rentan Wilayah</p>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-3xl font-bold text-sky-600">{balitaCount + bumilCount + lansiaCount}</h3>
            <span className="text-xs text-sky-600 font-bold">Jiwa</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">{balitaCount} Balita · {bumilCount} Bumil · {lansiaCount} Lansia</p>
          <div className="w-full bg-sky-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-sky-600 h-full rounded-full" style={{ width: "100%" }} />
          </div>
        </div>
      </div>

      {/* Main Grid: Stunting Trend & APBDes Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grafik Penurunan Prevalensi Stunting 6 Bulan */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                  <TrendingDown className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-bold text-sm text-gray-900">Kurva Penurunan Prevalensi Stunting RW 06</h3>
                  <p className="text-xs text-gray-500">Evaluasi efektivitas intervensi gizi Dana Desa 2026</p>
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${adaHistoriStunting ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                {adaHistoriStunting ? "Bulan Berjalan Riil" : "Ilustrasi"}
              </span>
            </div>

            {/* Explicit Height Chart Container */}
            <div className="relative pt-6 pb-2">
              {/* Benchmark Target Line at 14% */}
              <div className="absolute left-0 right-0 top-14 border-b-2 border-dashed border-emerald-400 z-0 flex items-center justify-end">
                <span className="text-[9px] font-bold text-emerald-600 bg-white px-1 -mt-4">Batas Aman RPJMD (14%)</span>
              </div>

              <div className="h-48 flex items-end justify-between gap-3 px-2 relative z-10">
                {stuntingTrend.map((d, i) => {
                  const isCurrent = i === stuntingTrend.length - 1;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end h-full gap-1.5">
                      {d.pct !== null ? (
                        <span className={`text-[11px] font-bold ${isCurrent ? "text-emerald-700" : "text-gray-600"}`}>
                          {d.pct}%
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-amber-600">Ilus.</span>
                      )}
                      <div className="w-full h-36 flex items-end justify-center">
                        {d.pct !== null ? (
                          <div
                            className="w-full max-w-[36px] rounded-t-lg transition-all duration-500 bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20"
                            style={{ height: `${(d.pct / 25) * 100}%` }}
                          />
                        ) : (
                          <div
                            className="w-full max-w-[36px] rounded-t-lg border-2 border-dashed border-amber-300 bg-amber-50"
                            style={{ height: `${(Number(stuntingRate) / 25) * 100}%` }}
                            title="Ilustrasi: histori bulanan belum terekam"
                          />
                        )}
                      </div>
                      <span className={`text-[11px] font-semibold ${isCurrent ? "text-emerald-900 font-bold" : "text-gray-400"}`}>
                        {d.bulan}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>Standar Penilaian: E-PPGBM Kemenkes RI</span>
            <span className="text-amber-700 font-bold">
              {adaHistoriStunting ? "Cek tren riil bulan berjalan" : "Histori ilustrasi — bulan berjalan riil"}
            </span>
          </div>
        </div>

        {/* Realisasi APBDes Bidang Kesehatan */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                  <Coins className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-bold text-sm text-gray-900">Serapan Anggaran Kesehatan Desa (APBDes 2026)</h3>
                  <p className="text-xs text-gray-500">Alokasi khusus Dana Desa untuk Posyandu & Gizi Masyarakat</p>
                </div>
              </div>
              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
                Ilustrasi · Input Manual Desa
              </span>
            </div>

            <div className="space-y-3.5">
              {apbdes.pos.map((p, idx) => (
                <div key={idx} className="p-3 bg-gray-50/70 border border-gray-100 rounded-xl space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-gray-800">{p.nama}</span>
                    <span className="font-bold text-emerald-700">{p.pct}%</span>
                  </div>
                  <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${p.pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-gray-500">
                    <span>Realisasi: Rp {(p.realisasi).toLocaleString("id-ID")}</span>
                    <span>Pagu: Rp {(p.alokasi).toLocaleString("id-ID")}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>Sisa Anggaran: Rp {(apbdes.totalAnggaran - apbdes.terealisasi).toLocaleString("id-ID")}</span>
            <span className="text-amber-700 font-semibold">Angka Ilustrasi · Audit BPD Menyusul</span>
          </div>
        </div>
      </div>

      {/* Rincian Sebaran RT RW 06 */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Distribusi Kependudukan & Cakupan Layanan per RT</h3>
            <p className="text-xs text-gray-500">Sebaran 4 RT di RW 06 Dusun Krajan Desa Mojorejo</p>
          </div>
          <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full">
            Total {totalKK} KK
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {rtData.map((item) => (
            <div key={item.rt} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800">RT {item.rt}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  {item.pct}% Hadir
                </span>
              </div>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">{item.jiwa} <span className="text-xs font-normal text-slate-500">Jiwa</span></div>
              <p className="text-xs text-slate-500">{item.kk} Kartu Keluarga (KK)</p>
            </div>
          ))}
        </div>
      </div>

      {/* Rekomendasi Kebijakan Anggaran Desa Berbasis Data Riil */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-3 border-b border-gray-100 pb-3">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <h3 className="font-bold text-gray-900 text-sm">Rekomendasi Kebijakan Musrenbangdes (Berbasis Data Riil Posyandu)</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-600">
          <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-1.5">
            <h4 className="font-bold text-emerald-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              Kelanjutan Subsidi PMT Pangan Lokal
            </h4>
            <p className="leading-relaxed">
              Pertahankan alokasi PMT berbasis bahan pangan lokal (ikan air tawar, telur ayam peternak lokal Mojorejo)
              guna mempertahankan angka stunting di bawah 14%.
            </p>
          </div>

          <div className="p-3.5 bg-sky-50/60 border border-sky-200 rounded-xl space-y-1.5">
            <h4 className="font-bold text-sky-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 shrink-0" />
              Peremajaan Alat Antropometri Terkalibrasi
            </h4>
            <p className="leading-relaxed">
              Dukung pemenuhan alat antropometri standar Kemenkes RI (infantometer digital, stadiometer, timbangan digital)
              untuk memastikan akurasi data Z-Score.
            </p>
          </div>

          <div className="p-3.5 bg-purple-50/60 border border-purple-200 rounded-xl space-y-1.5">
            <h4 className="font-bold text-purple-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              Integrasi Satu Data Desa SINDUKSADATI
            </h4>
            <p className="leading-relaxed">
              Sinkronisasi data riil kependudukan dan kesehatan warga RW 06 secara rutin setiap tanggal 15 agar perencanaan
              bansos dan jaminan kesehatan tepat sasaran.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

