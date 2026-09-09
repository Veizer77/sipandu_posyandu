// src/components/landing/HeroSection.tsx
import React, { useState } from 'react';
import { Sparkles, ShieldCheck, Activity, Users, ArrowRight, HeartPulse, CheckCircle2, AlertTriangle, TrendingUp, Zap, FileText } from 'lucide-react';
import { DoubleBezel } from './DoubleBezel';
import { Button } from './Button';
import { FadeIn } from './FadeIn';

export function HeroSection() {
  const [activeTab, setActiveTab] = useState<'operasional' | 'kurva' | 'alert'>('operasional');

  return (
    <section className="relative pt-32 sm:pt-40 pb-20 sm:pb-32 overflow-hidden">
      {/* Background Soft Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[900px] h-[400px] bg-gradient-to-br from-emerald-100/60 via-teal-50/40 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/3 right-10 w-72 h-72 bg-lime-100/40 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* Top Text Content */}
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto space-y-6 sm:space-y-8">
          
          {/* Eyebrow Tag */}
          <FadeIn delay={100}>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-900/[0.04] ring-1 ring-emerald-700/20 text-emerald-900 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.18em]">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
              <span>Standar Baru Posyandu ILP Digital</span>
            </div>
          </FadeIn>

          {/* Main Headline */}
          <FadeIn delay={200}>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.12] sm:leading-[1.08]">
              Digitalisasi Posyandu <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-emerald-800 via-teal-700 to-emerald-900 bg-clip-text text-transparent">
                Tanpa Ribet.
              </span>{' '}
              Tumbuh Kembang Presisi.
            </h1>
          </FadeIn>

          {/* Subtitle */}
          <FadeIn delay={300}>
            <p className="text-base sm:text-xl text-slate-600 max-w-2xl font-normal leading-relaxed">
              Tinggalkan tumpukan buku register dan hitung manual. SIPANDU mengintegrasikan registrasi 5 meja, kalkulasi Z-Score WHO real-time, deteksi dini stunting, hingga laporan bulanan instan 1-klik.
            </p>
          </FadeIn>

          {/* Dual CTAs */}
          <FadeIn delay={400}>
            <div className="flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto pt-2">
              <Button
                href="/login"
                variant="primary"
                size="lg"
                className="w-full sm:w-auto shadow-[0_8px_30px_rgba(15,23,42,0.18)]"
              >
                Masuk ke Sistem Posyandu
              </Button>
              <Button
                href="#kalkulator-who"
                variant="outline"
                size="lg"
                className="w-full sm:w-auto"
                showIcon={false}
              >
                Coba Kalkulator WHO
              </Button>
            </div>
          </FadeIn>

          {/* Trust Badges */}
          <FadeIn delay={500}>
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 pt-4 text-xs font-semibold text-slate-500">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Standar Antropometri Kemenkes RI</span>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-teal-600" />
                <span>Kalkulator WHO 2006 (LMS Table)</span>
              </div>
              <div className="flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-rose-500" />
                <span>Integrasi Layanan Primer (ILP)</span>
              </div>
            </div>
          </FadeIn>
        </div>

        {/* Hero Interactive Mockup */}
        <FadeIn delay={600} className="mt-14 sm:mt-20">
          <DoubleBezel variant="emerald" className="max-w-5xl mx-auto">
            <div className="p-4 sm:p-8 bg-white space-y-6">
              
              {/* Mockup Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 ring-1 ring-emerald-600/20 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-emerald-700" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base sm:text-lg font-bold text-slate-900">
                        Posyandu ILP Flamboyan RW 06
                      </h3>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                        Sesi Hari-H Aktif
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Desa Mojorejo, Kec. Junrejo, Kota Batu • Pelayanan Siklus Hidup
                    </p>
                  </div>
                </div>

                {/* Mockup Sub-Nav Switcher */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
                  <button
                    onClick={() => setActiveTab('operasional')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      activeTab === 'operasional'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Antrean 5 Meja
                  </button>
                  <button
                    onClick={() => setActiveTab('kurva')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      activeTab === 'kurva'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    KMS Digital
                  </button>
                  <button
                    onClick={() => setActiveTab('alert')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      activeTab === 'alert'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Radar Risiko (3)
                  </button>
                </div>
              </div>

              {/* Dynamic Content Based on Tab */}
              {activeTab === 'operasional' && (
                <div className="space-y-6">
                  {/* Top Stats Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Sasaran</p>
                      <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">142</p>
                      <p className="text-[10px] text-slate-400 mt-1">Balita, Bumil, Lansia</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100">
                      <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Hadir Hari Ini</p>
                      <p className="text-2xl sm:text-3xl font-extrabold text-emerald-900 mt-1">87 <span className="text-xs font-semibold text-emerald-700">(61.2%)</span></p>
                      <p className="text-[10px] text-emerald-600 mt-1">Target D/S terpenuhi</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-100">
                      <p className="text-[11px] font-bold text-teal-800 uppercase tracking-wider">Layanan Tuntas</p>
                      <p className="text-2xl sm:text-3xl font-extrabold text-teal-900 mt-1">66</p>
                      <p className="text-[10px] text-teal-600 mt-1">Imunisasi & Konseling OK</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-100">
                      <p className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">Deteksi Risiko</p>
                      <p className="text-2xl sm:text-3xl font-extrabold text-rose-900 mt-1">3 <span className="text-xs font-semibold text-rose-700">Kasus</span></p>
                      <p className="text-[10px] text-rose-600 mt-1">Perlu Sweeping / Rujukan</p>
                    </div>
                  </div>

                  {/* 5 Meja Queue Visual Pipeline */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <span>Alur Antrean 5 Meja Real-time</span>
                      <span className="text-slate-400 font-normal">Auto-update setiap pemeriksaan</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                      <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-100">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold text-blue-700 uppercase">Meja 1</span>
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-200 text-blue-800">4 Antre</span>
                        </div>
                        <p className="text-xs font-bold text-slate-800 mt-1">Pendaftaran</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">Scan NIK / KK Cepat</p>
                      </div>

                      <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-100">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold text-amber-700 uppercase">Meja 2</span>
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-800">3 Antre</span>
                        </div>
                        <p className="text-xs font-bold text-slate-800 mt-1">Pengukuran</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">BB, TB, LK, Z-Score</p>
                      </div>

                      <div className="p-3 rounded-xl bg-purple-50/80 border border-purple-100">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold text-purple-700 uppercase">Meja 3</span>
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-200 text-purple-800">Auto</span>
                        </div>
                        <p className="text-xs font-bold text-slate-800 mt-1">Pencatatan</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">Sinkronisasi Cloud</p>
                      </div>

                      <div className="p-3 rounded-xl bg-teal-50/80 border border-teal-100">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold text-teal-700 uppercase">Meja 4</span>
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-200 text-teal-800">2 Antre</span>
                        </div>
                        <p className="text-xs font-bold text-slate-800 mt-1">Pelayanan</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">Imunisasi & Vit A</p>
                      </div>

                      <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-100 col-span-2 sm:col-span-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold text-emerald-700 uppercase">Meja 5</span>
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200 text-emerald-800">12 Hadir</span>
                        </div>
                        <p className="text-xs font-bold text-slate-800 mt-1">Penyuluhan</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">Konseling Gizi</p>
                      </div>
                    </div>
                  </div>

                  {/* Sample Live Patient Processing Card */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-900 to-teal-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-white/10 ring-1 ring-white/20 flex items-center justify-center font-extrabold text-lg text-emerald-300">
                        AN
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm sm:text-base">Alvaro Nathan Pratama</p>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 text-emerald-200 font-medium">Balita • 18 Bln</span>
                        </div>
                        <p className="text-xs text-emerald-200/80">
                          BB: 11.2 kg • TB: 83.0 cm • LiLA: 15.0 cm • Z-Score BB/U: <span className="text-emerald-300 font-bold">+0.24 SD</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500 text-slate-950 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Gizi Baik (Normal)
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'kurva' && (
                <div className="space-y-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">Kurva Pertumbuhan Z-Score WHO (KMS Digital)</h4>
                      <p className="text-xs text-slate-500">Pelacakan tren berat badan balita 0–24 bulan</p>
                    </div>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                      Status: Naik Teratur (N)
                    </span>
                  </div>

                  {/* Simulated Growth Chart Graph */}
                  <div className="h-44 w-full bg-white rounded-xl border border-slate-200 p-4 flex items-end justify-between gap-2 relative overflow-hidden">
                    {/* Background reference lines */}
                    <div className="absolute inset-x-0 top-1/4 border-b border-dashed border-red-200 text-[9px] text-red-400 pl-2">+2 SD (Risiko Lebih)</div>
                    <div className="absolute inset-x-0 top-1/2 border-b border-dashed border-emerald-200 text-[9px] text-emerald-500 pl-2">Median (Standar WHO)</div>
                    <div className="absolute inset-x-0 bottom-1/4 border-b border-dashed border-amber-200 text-[9px] text-amber-400 pl-2">-2 SD (Gizi Kurang)</div>

                    {/* Bars for months */}
                    {[
                      { m: 'Bln 1', h: 32, bb: '4.5 kg' },
                      { m: 'Bln 3', h: 44, bb: '6.2 kg' },
                      { m: 'Bln 6', h: 56, bb: '7.8 kg' },
                      { m: 'Bln 9', h: 68, bb: '8.9 kg' },
                      { m: 'Bln 12', h: 76, bb: '9.8 kg' },
                      { m: 'Bln 15', h: 84, bb: '10.5 kg' },
                      { m: 'Bln 18', h: 92, bb: '11.2 kg' },
                    ].map((pt, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1 z-10">
                        <span className="text-[10px] font-bold text-emerald-800">{pt.bb}</span>
                        <div
                          style={{ height: `${pt.h}%` }}
                          className="w-full max-w-[28px] bg-gradient-to-t from-emerald-600 to-teal-500 rounded-t-lg transition-all duration-700"
                        />
                        <span className="text-[9px] text-slate-400 font-medium">{pt.m}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'alert' && (
                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-rose-50/80 border border-rose-100 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-rose-500 text-white">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-rose-950">Budi Santoso (14 Bulan) • Indikasi 2T (BB Tidak Naik 2x)</p>
                        <p className="text-xs text-rose-700/90 mt-0.5">BB bulan lalu: 8.1 kg, BB sekarang: 8.1 kg. Otomatis masuk jadwal sweeping.</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-rose-800 bg-rose-200/80 px-2.5 py-1 rounded-full whitespace-nowrap">
                      Sweeping Rumah
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-100 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-amber-500 text-white">
                        <HeartPulse className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-amber-950">Ny. Siti Aminah (Bumil) • TD 145/95 mmHg (Hipertensi)</p>
                        <p className="text-xs text-amber-700/90 mt-0.5">Deteksi risiko kehamilan. Direkomendasikan rujukan ke Bidan Desa / Faskes.</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-amber-800 bg-amber-200/80 px-2.5 py-1 rounded-full whitespace-nowrap">
                      Rujukan Klinis
                    </span>
                  </div>
                </div>
              )}

            </div>
          </DoubleBezel>
        </FadeIn>

      </div>
    </section>
  );
}
