// src/components/landing/BentoGrid.tsx
import React from 'react';
import { Radar, FileDown, HeartPulse, ShieldCheck, Smartphone, Sparkles, CheckCircle2, ArrowRight, Zap, Lock, Layers } from 'lucide-react';
import { DoubleBezel } from './DoubleBezel';
import { FadeIn } from './FadeIn';

export function BentoGrid() {
  return (
    <section id="fitur-inovasi" className="py-20 sm:py-32 bg-[#F8F6F0]/70 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-14 sm:mb-20">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/[0.04] text-emerald-900 text-[11px] font-bold uppercase tracking-[0.2em]">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Inovasi & Arsitektur Terpadu</span>
            </div>
          </FadeIn>

          <FadeIn delay={100}>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Fitur Lengkap untuk <br />
              <span className="bg-gradient-to-r from-emerald-800 to-teal-700 bg-clip-text text-transparent">
                Transformasi Total Posyandu
              </span>
            </h2>
          </FadeIn>

          <FadeIn delay={200}>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              Teknologi yang dirancang bukan hanya untuk mencatat data, tetapi aktif membantu kader mendeteksi risiko dan mempercepat intervensi kesehatan warga.
            </p>
          </FadeIn>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Card 1: Radar Sweeping (Col Span 7) */}
          <FadeIn delay={100} className="md:col-span-7">
            <DoubleBezel variant="emerald" className="h-full">
              <div className="p-6 sm:p-8 bg-white h-full flex flex-col justify-between space-y-6">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                    <Radar className="w-5 h-5 animate-pulse" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                    Radar Sweeping & Deteksi Balita 2T
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Sistem otomatis menandai sasaran yang absen 2 bulan berturut-turut atau balita dengan berat badan tidak naik (2T) untuk langsung dibuatkan jadwal kunjungan rumah (*sweeping*) dengan upload foto bukti lapangan.
                  </p>
                </div>

                {/* Simulated Radar Alert Card */}
                <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-100 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold text-rose-900">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                      3 Sasaran Butuh Kunjungan Rumah
                    </span>
                    <span className="text-[10px] bg-rose-200/80 text-rose-900 px-2 py-0.5 rounded-full">
                      Prioritas Minggu Ini
                    </span>
                  </div>
                  <p className="text-xs text-rose-800/90 leading-relaxed">
                    • <strong>Budi Santoso</strong> (RT 02) — 2T (BB tidak naik 2 bulan)<br />
                    • <strong>Sari Dewi</strong> (RT 04) — Mangkir 2 sesi berturut-turut
                  </p>
                </div>
              </div>
            </DoubleBezel>
          </FadeIn>

          {/* Card 2: Laporan PDF 1-Klik (Col Span 5) */}
          <FadeIn delay={200} className="md:col-span-5">
            <DoubleBezel variant="light" className="h-full">
              <div className="p-6 sm:p-8 bg-white h-full flex flex-col justify-between space-y-6">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center">
                    <FileDown className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                    Ekspor Laporan PDF Standar Kemenkes 1-Klik
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Cetak rekapitulasi kehadiran D/S, status gizi Z-Score, dan distribusi suplementasi bulanan dalam format resmi siap tanda tangan.
                  </p>
                </div>

                {/* PDF Badge Graphic */}
                <div className="p-4 rounded-2xl bg-slate-900 text-white flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-emerald-300">Laporan_Bulanan_Posyandu.pdf</p>
                    <p className="text-[10px] text-slate-400">Format Resmi Dinas Kesehatan • A4 Ready</p>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-white/10 text-xs font-bold text-white flex items-center gap-1">
                    <FileDown className="w-3.5 h-3.5" /> PDF
                  </div>
                </div>
              </div>
            </DoubleBezel>
          </FadeIn>

          {/* Card 3: Siklus Hidup ILP (Col Span 4) */}
          <FadeIn delay={300} className="md:col-span-4">
            <DoubleBezel variant="light" className="h-full">
              <div className="p-6 sm:p-8 bg-white h-full space-y-4">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <HeartHandshakeIcon className="w-5 h-5" />
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
                  Layanan Seluruh Siklus Hidup
                </h3>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                  Bukan hanya balita. SIPANDU melayani Ibu Hamil (Bumil Risti), Wanita Usia Subur, hingga Skrining Kemandirian (AKS) Lansia.
                </p>
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {['Bayi/Balita', 'Ibu Hamil', 'WUS', 'Lansia'].map((c, i) => (
                    <span key={i} className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
                      ✓ {c}
                    </span>
                  ))}
                </div>
              </div>
            </DoubleBezel>
          </FadeIn>

          {/* Card 4: Keamanan Data & Audit Log (Col Span 4) */}
          <FadeIn delay={400} className="md:col-span-4">
            <DoubleBezel variant="light" className="h-full">
              <div className="p-6 sm:p-8 bg-white h-full space-y-4">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
                  Keamanan Data & Audit Trail
                </h3>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                  Setiap penambahan atau perubahan data tercatat dengan trigger audit log PostgreSQL. Perlindungan data NIK warga terjamin aman.
                </p>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[10px] font-semibold text-slate-500 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Row-Level Security (RLS) & PostgreSQL Trigger</span>
                </div>
              </div>
            </DoubleBezel>
          </FadeIn>

          {/* Card 5: Mobile First & Responsif (Col Span 4) */}
          <FadeIn delay={500} className="md:col-span-4">
            <DoubleBezel variant="light" className="h-full">
              <div className="p-6 sm:p-8 bg-white h-full space-y-4">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
                  <Smartphone className="w-5 h-5" />
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
                  Ringan di HP Kader Lapangan
                </h3>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                  Dirancang khusus agar enteng dibuka di browser HP kader dengan koneksi seluler desa tanpa memakan memori perangkat.
                </p>
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 text-[10px] font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Optimal di Android & iOS</span>
                </div>
              </div>
            </DoubleBezel>
          </FadeIn>

        </div>

      </div>
    </section>
  );
}

function HeartHandshakeIcon(props: any) {
  return <HeartPulse {...props} />;
}
