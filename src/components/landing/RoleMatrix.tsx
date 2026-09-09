// src/components/landing/RoleMatrix.tsx
import React, { useState } from 'react';
import { Users, Stethoscope, Award, Landmark, CheckCircle2, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { DoubleBezel } from './DoubleBezel';
import { FadeIn } from './FadeIn';
import clsx from 'clsx';

export function RoleMatrix() {
  const [activeRole, setActiveRole] = useState<number>(0);

  const roles = [
    {
      id: 'kader',
      title: 'Kader Posyandu',
      badge: 'Garda Terdepan Pelayanan',
      icon: Users,
      color: 'emerald',
      tagline: 'Entri Data Kilat, Antrean Tertib & Agenda Sweeping Terstruktur',
      desc: 'Didesain dengan antarmuka yang sangat ramah pengguna (zero learning curve) agar kader relawan dapat menginput data dengan cepat melalui smartphone atau laptop tanpa perlu menghitung rumus manual.',
      benefits: [
        'Formulir pendaftaran dan pengukuran 5 meja secepat kilat',
        'Deteksi instan status gizi balita & kurva pertumbuhan',
        'Daftar tugas sweeping otomatis untuk warga yang absen atau 2T',
      ],
      mockup: {
        title: 'Dashboard Operasional Kader',
        status: 'Mode: Petugas Lapangan',
        metrics: [
          { label: 'Presensi Hari-H', value: '87 / 142', sub: '61.2% Capaian D/S' },
          { label: 'Tugas Sweeping', value: '3 Warga', sub: 'Indikasi 2T / Absen' },
        ],
        highlight: 'Fitur Unggulan: Auto-generate Tiket Antrean & Log Sweeping Foto',
      },
    },
    {
      id: 'bidan',
      title: 'Bidan Desa',
      badge: 'Otoritas Validasi Klinis',
      icon: Stethoscope,
      color: 'teal',
      tagline: 'Verifikasi Hasil Pemeriksaan & Respon Cepat Rujukan',
      desc: 'Bidan Desa dapat memantau setiap data yang diinput kader secara real-time, melakukan validasi medis, memantau balita berisiko stunting, serta menerbitkan rujukan ke Puskesmas/RS.',
      benefits: [
        'Panel validasi satu klik untuk seluruh hasil pemeriksaan kader',
        'Pemantauan khusus Ibu Hamil Risiko Tinggi (Bumil Risti)',
        'Riwayat rujukan faskes terintegrasi dengan catatan medis',
      ],
      mockup: {
        title: 'Portal Monitoring Klinis Bidan',
        status: 'Mode: Verifikator Medis',
        metrics: [
          { label: 'Perlu Validasi', value: '1 Sesi', sub: 'Posyandu Flamboyan' },
          { label: 'Kasus Pantauan', value: '2 Balita', sub: 'Z-Score < -2.0 SD' },
        ],
        highlight: 'Fitur Unggulan: Digital Signature Validasi & Rekam Rujukan Klinis',
      },
    },
    {
      id: 'pkk',
      title: 'Ketua TP PKK',
      badge: 'Penggerak Program Keluarga',
      icon: Award,
      color: 'blue',
      tagline: 'Pantau Capaian D/S & Partisipasi Warga per RT/RW',
      desc: 'Ketua Tim Penggerak PKK desa mendapatkan gambaran utuh efektivitas posyandu, tingkat kehadiran keluarga, dan keberhasilan penyaluran Vitamin A serta PMT.',
      benefits: [
        'Grafik tren kehadiran D/S bulanan untuk evaluasi berkala',
        'Peta sebaran sasaran aktif dan mangkir per RT',
        'Bahan laporan formal untuk rapat koordinasi TP PKK Kecamatan',
      ],
      mockup: {
        title: 'Dashboard Kinerja TP PKK',
        status: 'Mode: Penggerak & Evaluator',
        metrics: [
          { label: 'Rerata D/S Desa', value: '88.4%', sub: 'Target Nasional: 80%' },
          { label: 'Cakupan Vit A', value: '96.2%', sub: 'Periode Agustus' },
        ],
        highlight: 'Fitur Unggulan: Matriks Kepatuhan Program & Sebaran per Wilayah RT',
      },
    },
    {
      id: 'kades',
      title: 'Kepala Desa & Pemdes',
      badge: 'Pengambil Kebijakan Desa',
      icon: Landmark,
      color: 'slate',
      tagline: 'Ringkasan Eksekutif & Dasar Alokasi Dana Desa Sehat',
      desc: 'Kepala Desa memiliki data riil dan transparan tentang kondisi kesehatan masyarakat desa sebagai dasar perencanaan anggaran APBDes bidang pencegahan stunting.',
      benefits: [
        'Ringkasan eksekutif kesehatan warga desa sekali pandang',
        'Evaluasi efektivitas alokasi dana intervensi gizi & PMT',
        'Laporan resmi siap cetak untuk pertanggungjawaban publik',
      ],
      mockup: {
        title: 'Ringkasan Eksekutif Kepala Desa',
        status: 'Mode: Eksekutif Desa',
        metrics: [
          { label: 'Prevalensi Stunting', value: '2.1%', sub: 'Turun dari 4.5% (2025)' },
          { label: 'Efektivitas PMT', value: '94%', sub: 'Realisasi APBDes 2026' },
        ],
        highlight: 'Fitur Unggulan: Evidence-Based Policy Dashboard untuk APBDes Sehat',
      },
    },
  ];

  const current = roles[activeRole];
  const CurrentIcon = current.icon;

  return (
    <section id="multi-role" className="py-20 sm:py-32 bg-[#FDFBF7] relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-14 sm:mb-16">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/[0.04] text-slate-800 text-[11px] font-bold uppercase tracking-[0.2em]">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Multi-Role Access Control (RBAC)</span>
            </div>
          </FadeIn>

          <FadeIn delay={100}>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Dashboard Khusus untuk <br />
              <span className="bg-gradient-to-r from-emerald-800 to-teal-700 bg-clip-text text-transparent">
                Setiap Peran Pengguna
              </span>
            </h2>
          </FadeIn>

          <FadeIn delay={200}>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              Mulai dari kader lapangan, tenaga medis, hingga pengambil kebijakan desa memiliki hak akses dan antarmuka yang disesuaikan secara presisi.
            </p>
          </FadeIn>
        </div>

        {/* Role Selector Tabs */}
        <FadeIn delay={300}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 p-1.5 rounded-3xl bg-black/[0.03] ring-1 ring-black/5 mb-10">
            {roles.map((r, idx) => {
              const Icon = r.icon;
              const isSelected = activeRole === idx;
              return (
                <button
                  key={r.id}
                  onClick={() => setActiveRole(idx)}
                  className={clsx(
                    'flex items-center gap-3 p-3 sm:p-4 rounded-2xl transition-all duration-300 text-left',
                    isSelected
                      ? 'bg-white shadow-[0_4px_20px_rgba(0,0,0,0.06)] ring-1 ring-black/5 text-slate-900 font-bold'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-white/50 font-medium'
                  )}
                >
                  <div
                    className={clsx(
                      'w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors',
                      isSelected ? 'bg-emerald-800 text-white' : 'bg-slate-100 text-slate-600'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm leading-tight">{r.title}</p>
                    <p className="text-[10px] text-slate-400 font-normal hidden sm:block">
                      {r.badge.split(' ')[0]}...
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </FadeIn>

        {/* Role Content Card */}
        <FadeIn delay={400}>
          <DoubleBezel variant="emerald" className="max-w-5xl mx-auto">
            <div className="p-6 sm:p-10 bg-white grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 items-center">
              
              {/* Left Column: Role Details */}
              <div className="lg:col-span-7 space-y-6">
                
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900">
                    <CurrentIcon className="w-4 h-4" />
                    <span>{current.badge}</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                    {current.tagline}
                  </h3>
                </div>

                <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
                  {current.desc}
                </p>

                {/* Benefits */}
                <div className="space-y-3 pt-2">
                  {current.benefits.map((b, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-sm font-medium text-slate-700">{b}</span>
                    </div>
                  ))}
                </div>

              </div>

              {/* Right Column: High-Fidelity Simulated Dashboard Card */}
              <div className="lg:col-span-5">
                <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-xl space-y-5 relative overflow-hidden">
                  
                  {/* Glowing backdrop */}
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />

                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div>
                      <p className="text-xs font-bold text-white">{current.mockup.title}</p>
                      <p className="text-[10px] text-slate-400">{current.mockup.status}</p>
                    </div>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-2 gap-3">
                    {current.mockup.metrics.map((m, i) => (
                      <div key={i} className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{m.label}</p>
                        <p className="text-xl font-extrabold text-white mt-1">{m.value}</p>
                        <p className="text-[10px] text-emerald-300 mt-0.5">{m.sub}</p>
                      </div>
                    ))}
                  </div>

                  {/* Feature Highlight Pill */}
                  <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2.5 text-xs text-emerald-300">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-medium text-[11px] leading-relaxed">{current.mockup.highlight}</span>
                  </div>

                </div>
              </div>

            </div>
          </DoubleBezel>
        </FadeIn>

      </div>
    </section>
  );
}
