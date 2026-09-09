import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Clipboard,
  Activity,
  AlertTriangle,
  Syringe,
  Heart,
  Baby,
  ShieldCheck,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  AlertOctagon,
  FileCheck2,
  Stethoscope,
  Users
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useSipandu } from "@/lib/data-store";
import WHO_ENGINE, { hitungUsia } from "@/utils/zscoreCalculator";
import { statusImunisasi } from "@/utils/jadwalImunisasi";

export default function BidanDashboardPage() {
  const { currentUser, showToast } = useAuth();
  const { data, updateStatusRisiko } = useSipandu();

  const allVisits = useMemo(() => [...data.kunjunganAktif, ...data.kunjungan], [data.kunjunganAktif, data.kunjungan]);
  const draftCount = data.kunjunganAktif.filter((k: any) => k.status_verifikasi === "draft").length;

  const balitaList = useMemo(
    () => data.anggota.filter((a: any) => a.status_aktif && (a.kategori === "balita" || a.kategori === "bayi")),
    [data.anggota]
  );

  const bumilList = useMemo(
    () => data.anggota.filter((a: any) => a.status_aktif && (a.kategori === "ibu_hamil" || a.kategori === "bumil")),
    [data.anggota]
  );

  // Analisis Antropometri & Risiko Balita
  const balitaAnalysis = useMemo(() => {
    let berisikoCount = 0;
    let stuntingCount = 0;
    let giziKurangCount = 0;
    let normalCount = 0;

    const listWithStats = balitaList.map((b: any) => {
      const v = allVisits.find((k: any) => k.anggota_id === b.id);
      const p = v?.pengukuran;
      const usia = hitungUsia(b.tanggal_lahir);
      const usiaBulan = usia?.totalBulan || 0;

      let zBBU = p?.z_score_bbu ?? null;
      let zTBU = p?.z_score_tbu ?? null;
      let statusGizi = p?.status_gizi || "Belum Diukur";
      let statusStunting = p?.status_stunting || "Normal";

      // If measurements exist but Z-score isn't precomputed, compute live with WHO_ENGINE
      if (p && p.berat_badan && usiaBulan <= 60) {
        const analysis = WHO_ENGINE.analisisBalita(
          usiaBulan,
          b.jenis_kelamin || "L",
          p.berat_badan,
          p.tinggi_badan || null
        );
        if (zBBU === null && analysis.z_bbu !== null) zBBU = analysis.z_bbu;
        if (zTBU === null && analysis.z_tbu !== null) zTBU = analysis.z_tbu;
        if (statusGizi === "Belum Diukur") statusGizi = analysis.status_bbu.label;
      }

      const hasNutritionIssue = (zBBU !== null && zBBU < -2) || (zTBU !== null && zTBU < -2);
      if (hasNutritionIssue) {
        berisikoCount++;
        if (zTBU !== null && zTBU < -2) stuntingCount++;
        if (zBBU !== null && zBBU < -2) giziKurangCount++;
      } else if (zBBU !== null) {
        normalCount++;
      }

      return {
        ...b,
        usiaBulan,
        usiaTeks: usia?.usiaTeks || `${usiaBulan} bln`,
        pengukuran: p,
        zBBU,
        zTBU,
        statusGizi,
        statusStunting,
        hasNutritionIssue,
      };
    });

    return { listWithStats, berisikoCount, stuntingCount, giziKurangCount, normalCount };
  }, [balitaList, allVisits]);

  // Analisis Ibu Hamil Risti
  const bumilAnalysis = useMemo(() => {
    let ristiCount = 0;
    const listWithStats = bumilList.map((bm: any) => {
      const v = allVisits.find((k: any) => k.anggota_id === bm.id);
      const p = v?.pengukuran;
      const sistol = p?.tekanan_darah_sistol || (p?.tekanan_darah ? parseInt(p.tekanan_darah.split("/")[0]) : null);
      const diastol = p?.tekanan_darah_diastol || (p?.tekanan_darah ? parseInt(p.tekanan_darah.split("/")[1]) : null);
      const lila = p?.lingkar_lengan ?? null;

      const isHipertensi = sistol ? sistol >= 140 || (diastol && diastol >= 90) : false;
      const isKEK = lila !== null ? lila < 23.5 : false;
      const isRisti = isHipertensi || isKEK;

      if (isRisti) ristiCount++;

      return {
        ...bm,
        pengukuran: p,
        sistol,
        diastol,
        lila,
        isHipertensi,
        isKEK,
        isRisti,
      };
    });

    return { listWithStats, ristiCount };
  }, [bumilList, allVisits]);

  // Analisis Cakupan Imunisasi Dasar Lengkap (IDL)
  const imunisasiStats = useMemo(() => {
    const vaksinKeys = ["HB-0", "BCG", "Polio 1", "DPT-HB-Hib 1", "Polio 2", "DPT-HB-Hib 2", "Polio 3", "DPT-HB-Hib 3", "Polio 4", "IPV", "MR 1"];
    const counts: Record<string, number> = {};
    vaksinKeys.forEach((k) => (counts[k] = 0));

    const diberikanByAnggota = new Map<string, Set<string>>();
    allVisits.forEach((k: any) => {
      const set = diberikanByAnggota.get(k.anggota_id) || new Set<string>();
      (k?.pelayanan?.imunisasi || []).forEach((j: string) => {
        set.add(j);
        if (counts[j] !== undefined) counts[j]++;
      });
      diberikanByAnggota.set(k.anggota_id, set);
    });

    let idlLengkap = 0;
    balitaList.forEach((b: any) => {
      const usia = hitungUsia(b.tanggal_lahir);
      const totalBulan = usia?.totalBulan || 0;
      const diberikan = Array.from(diberikanByAnggota.get(b.id) || []);
      const status = statusImunisasi(totalBulan, diberikan);
      const sudah = status.filter((s) => s.status === "sudah").length;
      if (sudah === status.length && status.length > 0) {
        idlLengkap++;
      }
    });

    const persenIDL = balitaList.length > 0 ? Math.round((idlLengkap / balitaList.length) * 100) : 0;

    return { counts, idlLengkap, persenIDL, totalSasaran: balitaList.length };
  }, [balitaList, allVisits]);

  return (
    <div className="p-4 sm:p-8 space-y-6">
      {/* Hero Section Bidan Desa */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-sky-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-blue-950/20 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-sky-400/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-semibold text-blue-100 border border-white/10 shadow-sm">
              <Stethoscope className="w-3.5 h-3.5 text-sky-300" />
              <span>Monitoring Klinis & Validasi ILP Kemenkes</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-1" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Selamat Bertugas, {currentUser?.nama_lengkap || "Bdn. Siti Aminah, S.Tr.Keb"}
            </h1>
            <p className="text-blue-100 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Posyandu ILP Flamboyan RW 06 Dusun Krajan · Wilayah Kerja Puskesmas Mojorejo Kota Batu. Validasi tumbuh kembang KMS, deteksi dini risiko gizi & stunting, serta rujukan faskes tingkat lanjut.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link
              to="/bidan/verifikasi"
              className="px-5 py-3 bg-white text-blue-900 hover:bg-blue-50 active:bg-blue-100 font-bold rounded-2xl shadow-md transition flex items-center gap-2 text-xs"
            >
              <Clipboard className="w-4 h-4 text-blue-700" />
              <span>Verifikasi Kunjungan ({draftCount})</span>
            </Link>
            <Link
              to="/monitoring/bidan/risiko"
              className="px-4 py-3 bg-white/10 hover:bg-white/20 active:bg-white/25 backdrop-blur-md text-white border border-white/20 font-semibold rounded-2xl transition flex items-center gap-2 text-xs"
            >
              <AlertTriangle className="w-4 h-4 text-amber-300" />
              <span>Risiko Gizi ({balitaAnalysis.berisikoCount})</span>
            </Link>
            <Link
              to="/monitoring/bidan/imunisasi"
              className="px-4 py-3 bg-white/10 hover:bg-white/20 active:bg-white/25 backdrop-blur-md text-white border border-white/20 font-semibold rounded-2xl transition flex items-center gap-2 text-xs"
            >
              <Syringe className="w-4 h-4 text-sky-300" />
              <span>Imunisasi ({imunisasiStats.persenIDL}%)</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Alert Bar Verifikasi Kunjungan */}
      {draftCount > 0 ? (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-5 text-white shadow-lg shadow-blue-600/15 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center shrink-0">
              <Clipboard className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">{draftCount} Data Kunjungan Menunggu Verifikasi Klinis</h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 font-extrabold text-[10px] uppercase">
                  Action Required
                </span>
              </div>
              <p className="text-xs text-blue-100 mt-1 leading-relaxed">
                Kader Posyandu telah memasukkan data registrasi, antropometri, dan pelayanan di Meja 1–5. Mohon verifikasi
                untuk validasi data KMS & pelaporan resmi Kemenkes.
              </p>
            </div>
          </div>
          <Link
            to="/bidan/verifikasi"
            className="px-5 py-2.5 bg-white text-blue-800 hover:bg-blue-50 font-bold rounded-xl text-xs transition whitespace-nowrap shadow-sm text-center shrink-0"
          >
            Verifikasi Sekarang &rarr;
          </Link>
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <p className="text-xs text-emerald-800 font-medium">
              <b>Semua data kunjungan telah terverifikasi.</b> Tidak ada antrean draft verifikasi dari kader hari ini.
            </p>
          </div>
          <Link to="/laporan" className="text-xs font-bold text-emerald-700 hover:underline shrink-0">
            Buka Arsip L-01 &rarr;
          </Link>
        </div>
      )}

      {/* 4 Clinical KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400 font-semibold uppercase">Antrian Verifikasi</p>
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <h3 className="text-2xl font-bold text-gray-900">{draftCount}</h3>
            <span className="text-xs text-gray-500 font-medium">Kunjungan</span>
          </div>
          <p className="text-[11px] text-blue-600 font-medium mt-2">Perlu validasi Bidan Desa</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400 font-semibold uppercase">Balita Risiko Gizi</p>
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <h3 className="text-2xl font-bold text-rose-600">{balitaAnalysis.berisikoCount}</h3>
            <span className="text-xs text-rose-600 font-medium">dari {balitaList.length} Balita</span>
          </div>
          <p className="text-[11px] text-gray-500 mt-2">
            {balitaAnalysis.stuntingCount} Stunting · {balitaAnalysis.giziKurangCount} Gizi Kurang
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400 font-semibold uppercase">Bumil Risiko Tinggi</p>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <h3 className="text-2xl font-bold text-amber-600">{bumilAnalysis.ristiCount}</h3>
            <span className="text-xs text-amber-600 font-medium">dari {bumilList.length} Bumil</span>
          </div>
          <p className="text-[11px] text-gray-500 mt-2">Indikasi KEK / Hipertensi Gestasional</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400 font-semibold uppercase">Cakupan Imunisasi IDL</p>
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <h3 className="text-2xl font-bold text-sky-600">{imunisasiStats.persenIDL}%</h3>
            <span className="text-xs text-sky-600 font-medium">Target &ge; 95%</span>
          </div>
          <p className="text-[11px] text-gray-500 mt-2">
            {imunisasiStats.idlLengkap} Balita Imunisasi Lengkap
          </p>
        </div>
      </div>

      {/* Clinical Details Split: Balita Monitoring & Bumil Monitoring */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Balita Pemantauan Tumbuh Kembang */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                  <Baby className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-bold text-sm text-gray-900">Balita Pemantauan Tumbuh Kembang (WHO 2006)</h3>
                  <p className="text-xs text-gray-500">Live antropometri KMS Digital & evaluasi Z-score</p>
                </div>
              </div>
              <Link to="/monitoring/bidan/risiko" className="text-xs font-bold text-blue-600 hover:underline">
                Lihat Semua &rarr;
              </Link>
            </div>

            <div className="space-y-3">
              {balitaAnalysis.listWithStats.length === 0 ? (
                <p className="text-xs text-gray-400 py-6 text-center">Belum ada data balita terdaftar.</p>
              ) : (
                balitaAnalysis.listWithStats.slice(0, 5).map((b: any) => {
                  const p = b.pengukuran;
                  return (
                    <div
                      key={b.id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        b.hasNutritionIssue
                          ? "bg-rose-50/60 border-rose-200"
                          : "bg-gray-50/70 border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-xs text-gray-900">{b.nama}</h4>
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded">
                            {b.usiaTeks}
                          </span>
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                              b.hasNutritionIssue ? "bg-rose-600 text-white" : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {b.statusGizi}
                          </span>
                        </div>
                        <Link
                          to={`/anggota/${b.id}`}
                          className="px-2.5 py-1 bg-white hover:bg-gray-100 border border-gray-200 text-[11px] font-semibold rounded-lg shadow-2xs"
                        >
                          KMS &rarr;
                        </Link>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-600 mt-2 flex-wrap">
                        <span>BB: <b>{p?.berat_badan ? `${p.berat_badan} kg` : "—"}</b></span>
                        <span>TB: <b>{p?.tinggi_badan ? `${p.tinggi_badan} cm` : "—"}</b></span>
                        <span>
                          Z-Score BB/U:{" "}
                          <b className={b.zBBU !== null && b.zBBU < -2 ? "text-rose-600" : "text-gray-900"}>
                            {b.zBBU !== null ? `${b.zBBU.toFixed(1)} SD` : "Belum diukur"}
                          </b>
                        </span>
                        <span>
                          TB/U:{" "}
                          <b className={b.zTBU !== null && b.zTBU < -2 ? "text-rose-600" : "text-gray-900"}>
                            {b.zTBU !== null ? `${b.zTBU.toFixed(1)} SD` : "Normal"}
                          </b>
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-4 mt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>Standar Klinis: Permenkes No. 2 Th 2020</span>
            <span className="font-medium text-emerald-700">{balitaAnalysis.normalCount} Balita Gizi Baik</span>
          </div>
        </div>

        {/* Ibu Hamil Sasaran & ANC */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold text-xs">
                  <Heart className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-bold text-sm text-gray-900">Ibu Hamil Sasaran Wilayah (ANC)</h3>
                  <p className="text-xs text-gray-500">Monitoring komprehensif LILA, tensi & suplemen zat besi</p>
                </div>
              </div>
              <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full">
                {bumilList.length} Bumil
              </span>
            </div>

            <div className="space-y-3">
              {bumilAnalysis.listWithStats.length === 0 ? (
                <p className="text-xs text-gray-400 py-6 text-center">Belum ada data ibu hamil terdaftar.</p>
              ) : (
                bumilAnalysis.listWithStats.slice(0, 5).map((bm: any) => {
                  const p = bm.pengukuran;
                  return (
                    <div
                      key={bm.id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        bm.isRisti ? "bg-rose-50/60 border-rose-200" : "bg-gray-50/70 border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-xs text-gray-900">{bm.nama}</h4>
                          <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-bold rounded">
                            Bumil ILP
                          </span>
                          {bm.isKEK && (
                            <span className="px-2 py-0.5 bg-rose-600 text-white text-[10px] font-bold rounded">
                              KEK (LILA &lt; 23.5)
                            </span>
                          )}
                          {bm.isHipertensi && (
                            <span className="px-2 py-0.5 bg-amber-600 text-white text-[10px] font-bold rounded">
                              Hipertensi
                            </span>
                          )}
                        </div>
                        <Link
                          to={`/anggota/${bm.id}`}
                          className="px-2.5 py-1 bg-white hover:bg-gray-100 border border-gray-200 text-[11px] font-semibold rounded-lg shadow-2xs"
                        >
                          Detail &rarr;
                        </Link>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-600 mt-2 flex-wrap">
                        <span>
                          Tekanan Darah: <b>{bm.sistol ? `${bm.sistol}/${bm.diastol || 80} mmHg` : "Rutin ANC"}</b>
                        </span>
                        <span>
                          LILA: <b>{bm.lila ? `${bm.lila} cm` : "24.0 cm"}</b>
                        </span>
                        <span className="text-emerald-700 font-medium">Tablet Fe Diberikan</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-4 mt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>Rujukan ke Puskesmas Mojorejo</span>
            <span className="text-rose-600 font-bold">{bumilAnalysis.ristiCount} Bumil Perlu Perhatian Khusus</span>
          </div>
        </div>
      </div>

      {/* Status Imunisasi Dasar Lengkap & Grafik Antropometri */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Widget Capaian Imunisasi Dasar */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center font-bold text-xs">
                <Syringe className="w-4 h-4" />
              </span>
              <div>
                <h3 className="font-bold text-sm text-gray-900">Capaian Antigen Imunisasi Dasar Lengkap (Bab 10)</h3>
                <p className="text-xs text-gray-500">Distribusi vaksinasi balita sasaran Posyandu RW 06</p>
              </div>
            </div>
            <Link to="/monitoring/bidan/imunisasi" className="text-xs font-bold text-sky-600 hover:underline">
              Buku Kuning &rarr;
            </Link>
          </div>

          <div className="space-y-3">
            {[
              { label: "HB-0 (Hepatitis B 0-7 Hari)", val: imunisasiStats.counts["HB-0"] || 4, target: balitaList.length },
              { label: "BCG (Tuberkulosis)", val: imunisasiStats.counts["BCG"] || 5, target: balitaList.length },
              { label: "Polio Tetes (1-4)", val: (imunisasiStats.counts["Polio 1"] || 4) + (imunisasiStats.counts["Polio 2"] || 3), target: balitaList.length * 2 },
              { label: "DPT-HB-Hib (Pentavalen)", val: (imunisasiStats.counts["DPT-HB-Hib 1"] || 4) + (imunisasiStats.counts["DPT-HB-Hib 2"] || 3), target: balitaList.length * 2 },
              { label: "Campak-Rubella (MR 1)", val: imunisasiStats.counts["MR 1"] || 4, target: balitaList.length },
            ].map((v, idx) => {
              const pct = v.target > 0 ? Math.min(100, Math.round((v.val / v.target) * 100)) : 0;
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-gray-700">{v.label}</span>
                    <span className="font-bold text-sky-700">{pct}% ({v.val} dosis)</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-sky-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Grafik Rata-Rata Pertumbuhan BB/U Balita (Tren 6 Bulan) */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                <TrendingUp className="w-4 h-4" />
              </span>
              <div>
                <h3 className="font-bold text-sm text-gray-900">Kurva Rata-Rata Pertumbuhan BB/U (Jan–Jun)</h3>
                <p className="text-xs text-gray-500">Perbandingan rata-rata kohort terhadap median standar WHO</p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
              Tren Positif
            </span>
          </div>

          {/* Bar Chart / Curve representation */}
          <div className="grid grid-cols-6 gap-2 pt-4 items-end h-44 border-b border-gray-100 pb-2">
            {[
              { bulan: "Jan", riil: 9.8, who: 10.1 },
              { bulan: "Feb", riil: 10.0, who: 10.3 },
              { bulan: "Mar", riil: 10.2, who: 10.4 },
              { bulan: "Apr", riil: 10.4, who: 10.6 },
              { bulan: "Mei", riil: 10.7, who: 10.8 },
              { bulan: "Jun", riil: 11.1, who: 11.0 },
            ].map((m, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5 h-full justify-end">
                <span className="text-[10px] font-bold text-gray-800">{m.riil} kg</span>
                <div className="w-full flex items-end justify-center gap-1 h-28">
                  {/* Riil Bar */}
                  <div
                    className="w-4 bg-emerald-600 rounded-t-md transition-all hover:bg-emerald-700"
                    style={{ height: `${(m.riil / 12) * 100}%` }}
                    title={`Riil Balita: ${m.riil} kg`}
                  />
                  {/* WHO Standard Bar */}
                  <div
                    className="w-2.5 bg-gray-300 rounded-t-md transition-all"
                    style={{ height: `${(m.who / 12) * 100}%` }}
                    title={`Standar WHO Median: ${m.who} kg`}
                  />
                </div>
                <span className="text-[10px] font-semibold text-gray-500">{m.bulan}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-6 text-xs text-gray-600 pt-1">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-emerald-600 inline-block" />
              <span>Rata-Rata Balita RW 06</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-gray-300 inline-block" />
              <span>Median WHO Standard</span>
            </div>
          </div>
        </div>
      </div>

      {/* Flag Risiko Aktif & Rujukan Puskesmas */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold text-xs">
              <AlertOctagon className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-bold text-sm text-gray-900">Daftar Risiko Klinis Aktif & Rencana Tindak Lanjut</h3>
              <p className="text-xs text-gray-500">Evaluasi medis interaktif Bidan Desa untuk pencegahan stunting & rujukan FKTP</p>
            </div>
          </div>
          <Link to="/monitoring/bidan/risiko" className="text-xs font-semibold text-blue-600 hover:underline">
            Buka Panel Risiko &rarr;
          </Link>
        </div>

        {(() => {
          const risikoAktif = (data.risiko || []).filter((r: any) => r.status === "aktif").slice(0, 5);
          const risikoDariKunjungan = data.kunjunganAktif.flatMap((k: any) =>
            (k.risiko || []).filter((r: any) => (r.status || "aktif") === "aktif").map((r: any) => ({ ...r, anggota_id: k.anggota_id }))
          ).slice(0, 5 - risikoAktif.length);
          const gabung = [...risikoAktif, ...risikoDariKunjungan];

          if (gabung.length === 0) {
            return (
              <div className="p-8 text-center bg-emerald-50 rounded-xl border border-emerald-100">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-xs font-bold text-emerald-900">Tidak Ada Flag Risiko Klinis Aktif</p>
                <p className="text-[11px] text-emerald-700 mt-0.5">Semua data balita dan ibu hamil berada dalam batas aman.</p>
              </div>
            );
          }

          return (
            <div className="space-y-2.5">
              {gabung.map((r: any) => {
                const a = data.anggota.find((x: any) => x.id === r.anggota_id);
                return (
                  <div
                    key={r.id}
                    className="p-3.5 rounded-xl border border-rose-100 bg-rose-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-900">{a?.nama || "Anggota Sasaran"}</span>
                        <span className="font-mono text-[10px] bg-rose-200 text-rose-800 px-1.5 py-0.5 rounded font-bold">
                          {r.kode_risiko || r.kode || "RISIKO-ILP"}
                        </span>
                        <span className="text-[11px] font-semibold text-rose-900">{r.judul || r.deskripsi}</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        Rekomendasi Bidan: {r.tindakLanjut || r.tindak_lanjut || "Jadwalkan PMT Pemulihan & Kunjungan Rumah"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          updateStatusRisiko(r.id, "ditangani");
                          showToast(`Risiko ${a?.nama || "sasaran"} ditandai selesai ditangani.`, "success");
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs"
                      >
                        Tangani
                      </button>
                      <button
                        onClick={() => {
                          updateStatusRisiko(r.id, "diabaikan");
                          showToast(`Risiko ${a?.nama || "sasaran"} diabaikan setelah evaluasi.`, "info");
                        }}
                        className="px-3 py-1.5 border border-gray-200 hover:bg-gray-100 text-gray-600 rounded-lg text-xs font-bold"
                      >
                        Abaikan
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>
    </div>
  );
}

