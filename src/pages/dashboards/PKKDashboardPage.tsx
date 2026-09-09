import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  TrendingUp,
  Apple,
  AlertTriangle,
  Award,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  MapPin,
  ArrowUpRight,
  ShieldCheck,
  Heart
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useSipandu } from "@/lib/data-store";
import { useRTDistribution } from "@/lib/dashboard-helpers";
import { buildTrenPersen6Bulan } from "@/lib/tren6bulan";

export default function PKKDashboardPage() {
  const { currentUser } = useAuth();
  const { data } = useSipandu();

  const totalSasaran = data.anggota.filter((a: any) => a.status_aktif && a.kategori !== "umum").length;
  const totalHadir = data.kunjunganAktif.length + data.kunjungan.length;
  const persenDS = totalSasaran > 0 ? ((totalHadir / totalSasaran) * 100).toFixed(1) : "0.0";

  // Balita specific stunting prevalence
  const balitaList = useMemo(
    () => data.anggota.filter((a: any) => a.status_aktif && (a.kategori === "balita" || a.kategori === "bayi")),
    [data.anggota]
  );
  const totalBalita = balitaList.length;

  const allVisits = useMemo(() => [...data.kunjunganAktif, ...data.kunjungan], [data.kunjunganAktif, data.kunjungan]);

  const stuntingCount = useMemo(() => {
    let count = 0;
    balitaList.forEach((b: any) => {
      const v = allVisits.find((k: any) => k.anggota_id === b.id);
      if (v?.pengukuran?.z_score_tbu != null && v.pengukuran.z_score_tbu < -2) {
        count++;
      }
    });
    return count;
  }, [balitaList, allVisits]);

  const stuntingRate = totalBalita > 0 ? ((stuntingCount / totalBalita) * 100).toFixed(1) : "0.0";

  // Intervensi PMT
  const pmtCount = useMemo(() => {
    return allVisits.filter((k: any) => k.pelayanan?.pmt || k.pelayanan?.vitamin_a).length;
  }, [allVisits]);

  const bumilList = useMemo(
    () => data.anggota.filter((a: any) => a.status_aktif && (a.kategori === "ibu_hamil" || a.kategori === "bumil")),
    [data.anggota]
  );

  const rtData = useRTDistribution(data.keluarga, data.anggota, allVisits);

  // Tren D/S 6 bulan: bulan berjalan = data riil (persenDS), sisanya ilustrasi
  const trendData = buildTrenPersen6Bulan(Number(persenDS) || 0);
  const rtTertinggi = rtData.reduce(
    (best: any, r: any) => (!best || r.pct > best.pct ? r : best),
    null as any
  );

  return (
    <div className="p-4 sm:p-8 space-y-6">
      {/* Hero Section Pokja IV TP PKK */}
      <div className="bg-gradient-to-r from-purple-950 via-purple-900 to-fuchsia-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-purple-950/20 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-fuchsia-400/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute left-1/4 bottom-0 w-64 h-64 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-semibold text-purple-200 border border-white/10 shadow-sm">
              <Award className="w-3.5 h-3.5 text-amber-300" />
              <span>Pokja IV TP PKK Desa Mojorejo · Wilayah Binaan RW 06</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-1" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Selamat Datang, {currentUser?.nama_lengkap}
            </h1>
            <p className="text-purple-100 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Monitoring Kinerja Posyandu ILP, Partisipasi Kehadiran Warga (D/S), Distribusi PMT Pemulihan Bahan Pangan Lokal, dan Intervensi Pencegahan Stunting di Dusun Krajan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl flex items-center gap-3">
              <div>
                <p className="text-[10px] uppercase font-bold text-purple-200">Capaian D/S Posyandu</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xl font-extrabold text-white">{persenDS}%</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                    Target ≥80%
                  </span>
                </div>
              </div>
            </div>

            <Link
              to="/laporan"
              className="px-5 py-3 bg-white text-purple-950 hover:bg-purple-50 active:bg-purple-100 font-bold rounded-2xl shadow-md transition flex items-center gap-2 text-xs"
            >
              <Layers className="w-4 h-4 text-purple-700" />
              <span>Buka Format L-01</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 4 Performance KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase">Capaian D/S Riil</p>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-3xl font-bold text-emerald-600">{persenDS}%</h3>
          </div>
          <p className="text-xs text-gray-500 mt-1">{totalHadir} dari {totalSasaran} Jiwa Terdata</p>
          <div className="w-full bg-emerald-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${Math.min(100, Number(persenDS))}%` }} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase">Penerima PMT & Nutrisi</p>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-3xl font-bold text-purple-600">{pmtCount}</h3>
            <span className="text-xs text-purple-600 font-bold">Sasaran</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Intervensi Makanan Lokal Bergizi</p>
          <div className="w-full bg-purple-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-purple-600 h-full rounded-full"
              style={{ width: `${Math.min(100, Number(((pmtCount / Math.max(1, totalSasaran)) * 100).toFixed(0)))}%` }}
            />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase">Prevalensi Stunting RW</p>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-3xl font-bold text-amber-600">{stuntingRate}%</h3>
            <span className="text-xs text-amber-600 font-bold">Target &lt; 14%</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">{stuntingCount} dari {totalBalita} Balita Sasaran</p>
          <div className="w-full bg-amber-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-amber-500 h-full rounded-full" style={{ width: `${Math.min(100, Number(stuntingRate) * 4)}%` }} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase">Sasaran Prioritas 1000 HPK</p>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-3xl font-bold text-rose-600">{totalBalita + bumilList.length}</h3>
            <span className="text-xs text-rose-600 font-bold">Jiwa</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">{totalBalita} Balita · {bumilList.length} Ibu Hamil</p>
          <div className="w-full bg-rose-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-rose-500 h-full rounded-full" style={{ width: "100%" }} />
          </div>
        </div>
      </div>

      {/* Main Analysis: 6-Month D/S Trend & RT Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Working 6-Month D/S Bar Chart */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-xs">
                  <TrendingUp className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-bold text-sm text-gray-900">Tren Kehadiran D/S 6 Bulan Terakhir</h3>
                  <p className="text-xs text-gray-500">Evaluasi efektivitas gerakan kader Dasawisma PKK</p>
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${trendData.some((d) => !d.isIlustrasi) ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                {trendData.some((d) => !d.isIlustrasi) ? "Bulan Berjalan Riil" : "Ilustrasi"}
              </span>
            </div>

            {/* Explicit Height Chart Container */}
            <div className="relative pt-6 pb-2">
              {/* Benchmark Target Line at 85% */}
              <div className="absolute left-0 right-0 top-12 border-b-2 border-dashed border-rose-300 z-0 flex items-center justify-end">
                <span className="text-[9px] font-bold text-rose-500 bg-white px-1 -mt-4">Target Kemenkes (85%)</span>
              </div>

              <div className="h-48 flex items-end justify-between gap-3 px-2 relative z-10">
                {trendData.map((d, i) => {
                  const isCurrent = i === trendData.length - 1;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end h-full gap-1.5">
                      {d.pct !== null ? (
                        <span className={`text-[11px] font-bold ${isCurrent ? "text-purple-700" : "text-gray-600"}`}>
                          {d.pct}%
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-amber-600">Ilus.</span>
                      )}
                      <div className="w-full h-36 flex items-end justify-center">
                        {d.pct !== null ? (
                          <div
                            className="w-full max-w-[36px] rounded-t-lg transition-all duration-500 bg-purple-600 hover:bg-purple-700 shadow-md shadow-purple-600/20"
                            style={{ height: `${(d.pct / 100) * 100}%` }}
                          />
                        ) : (
                          <div
                            className="w-full max-w-[36px] rounded-t-lg border-2 border-dashed border-purple-300 bg-purple-50"
                            style={{ height: `${(Number(persenDS) / 100) * 100}%` }}
                            title="Ilustrasi: histori bulanan belum terekam"
                          />
                        )}
                      </div>
                      <span className={`text-[11px] font-semibold ${isCurrent ? "text-purple-900 font-bold" : "text-gray-400"}`}>
                        {d.bulan}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>Metode: Buku Register Posyandu & SIM PKK</span>
            <span className="text-amber-600 font-bold">
              {rtTertinggi ? `RT Tertinggi: ${rtTertinggi.label} (${rtTertinggi.pct}%)` : "Belum ada data RT"}
            </span>
          </div>
        </div>

        {/* Distribusi Penduduk & Kehadiran per RT */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center font-bold text-xs">
                  <MapPin className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-bold text-sm text-gray-900">Distribusi Sasaran & Cakupan per RT</h3>
                  <p className="text-xs text-gray-500">Wilayah RT 01 s/d RT 04 RW 06 Desa Mojorejo</p>
                </div>
              </div>
              <span className="text-xs font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full">
                {rtData.length} Rukun Tetangga
              </span>
            </div>

            <div className="space-y-3.5">
              {rtData.map((r) => (
                <div key={r.rt} className="p-3 bg-gray-50/70 border border-gray-100 rounded-xl space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-gray-900">{r.label}</span>
                      <span className="text-gray-500 ml-2 font-medium">({r.kk} KK · {r.jiwa} Jiwa)</span>
                    </div>
                    <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                      {r.pct}% Hadir
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-purple-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${r.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>Koordinasi: Ketua Kelompok Dasawisma</span>
            <span className="text-purple-700 font-semibold">
              {rtTertinggi ? `RT Tertinggi: ${rtTertinggi.label} (${rtTertinggi.pct}%)` : "Belum ada data RT"}
            </span>
          </div>
        </div>
      </div>

      {/* Program Pokja IV & Rekomendasi Aksi Dasawisma */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PMT Berbasis Pangan Lokal */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-green-100 text-green-700 flex items-center justify-center font-bold text-xs">
              <Apple className="w-4 h-4" />
            </span>
            <h3 className="font-bold text-sm text-gray-900">Intervensi PMT Pangan Lokal</h3>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            Menu PMT Posyandu Flamboyan bersumber dari bahan lokal kaya protein hewani (telur, ikan lele, hati ayam, daun kelor)
            untuk percepatan penurunan stunting 1000 HPK.
          </p>
          <div className="p-3 bg-green-50 rounded-xl border border-green-200 space-y-1">
            <p className="text-xs font-bold text-green-900">Menu Hari Ini: Bubur Singkong Hati Ayam</p>
            <p className="text-[11px] text-green-700">Energi: 250 kkal · Protein: 9.5 gr · Fe: 2.8 mg</p>
          </div>
        </div>

        {/* Gerakan 10 Program Pokok PKK */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
              <Sparkles className="w-4 h-4" />
            </span>
            <h3 className="font-bold text-sm text-gray-900">Aksi Pokja IV Bidang Kesehatan</h3>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            Penguatan peran kader dasawisma dalam pendataan sanitasi rumah tangga, jamban sehat, bebas jentik nyamuk, dan
            konseling ASI eksklusif 6 bulan.
          </p>
          <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 space-y-1">
            <p className="text-xs font-bold text-purple-900">Target Dasawisma: 100% Bebas BABS</p>
            <p className="text-[11px] text-purple-700">RW 06 telah mendeklarasikan ODF (Open Defecation Free)</p>
          </div>
        </div>

        {/* Rekomendasi Tindak Lanjut */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
              <AlertTriangle className="w-4 h-4" />
            </span>
            <h3 className="font-bold text-sm text-gray-900">Rekomendasi Prioritas PKK</h3>
          </div>
          <ul className="space-y-2 text-xs text-gray-600">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
              <span>Tingkatkan kunjungan rumah bagi balita yang mangkir 2 bulan berturut-turut di RT 03.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
              <span>Pastikan seluruh ibu hamil KEK mendapatkan distribusi PMT pemulihan selama 90 hari.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

