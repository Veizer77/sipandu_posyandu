// src/components/landing/ComparisonSection.tsx
import React from 'react';
import { XCircle, CheckCircle2, FileSpreadsheet, Cpu, Clock, Zap, BookOpen, Database, ShieldAlert, Sparkles } from 'lucide-react';
import { DoubleBezel } from './DoubleBezel';
import { FadeIn } from './FadeIn';

export function ComparisonSection() {
  const comparisonItems = [
    {
      title: 'Pencatatan & Arsip Sasaran',
      icon: BookOpen,
      manual: {
        title: 'Buku Register Fisik & Excel Manual',
        desc: 'Buku tebal mudah sobek/hilang, tulisan tangan sulit dibaca, dan pencarian NIK warga memakan waktu bermenit-menit.',
      },
      digital: {
        title: 'Database Terpusat & Pencarian Instan 1 Detik',
        desc: 'Cari riwayat keluarga cukup ketik nama/NIK. Semua data tersimpan aman di cloud dengan backup otomatis.',
      },
    },
    {
      title: 'Perhitungan Status Gizi & KMS',
      icon: Cpu,
      manual: {
        title: 'Hitung Manual & Plot Kurva Rentan Salah',
        desc: 'Kader harus menghitung usia bulan manual dan mencocokkan grafik KMS fisik satu per satu.',
      },
      digital: {
        title: 'Auto-Kalkulasi Z-Score WHO 2006 Realtime',
        desc: 'Ketik berat & tinggi badan, status gizi (BB/U, TB/U, BB/TB) dan kurva pertumbuhan langsung terhitung presisi.',
      },
    },
    {
      title: 'Pembuatan Laporan Bulanan (D/S)',
      icon: FileSpreadsheet,
      manual: {
        title: 'Rekap Berjam-jam & Kader Kelelahan',
        desc: 'Butuh 2–4 jam menyalin lembar register ke form rekapitulasi dinas setiap akhir bulan.',
      },
      digital: {
        title: 'Ekspor Dokumen PDF Resmi 1-Klik',
        desc: 'Laporan format standar Kemenkes & Dinas Kesehatan terbit otomatis dalam 1 detik lengkap dengan tanda tangan.',
      },
    },
    {
      title: 'Deteksi Dini Stunting & Intervensi',
      icon: ShieldAlert,
      manual: {
        title: 'Kasus Berisiko Terdeteksi Terlambat',
        desc: 'Balita dengan berat tidak naik (2T) atau mangkir 2 bulan sering luput karena tidak ada sistem pengingat.',
      },
      digital: {
        title: 'Radar Sweeping & Notifikasi Otomatis',
        desc: 'Sistem memberi peringatan instan dan membuat tiket kunjungan rumah untuk balita dan bumil risti.',
      },
    },
  ];

  return (
    <section className="py-20 sm:py-32 bg-[#F8F6F0]/60 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16 sm:mb-20">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/[0.04] text-slate-800 text-[11px] font-bold uppercase tracking-[0.2em]">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Sebelum vs Sesudah SIPANDU</span>
            </div>
          </FadeIn>
          
          <FadeIn delay={100}>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Mengapa Posyandu Perlu <br />
              <span className="bg-gradient-to-r from-emerald-800 to-teal-700 bg-clip-text text-transparent">
                Beralih ke Digital?
              </span>
            </h2>
          </FadeIn>

          <FadeIn delay={200}>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              Bandingkan beban kerja administratif konvensional dengan kecepatan dan akurasi sistem digital terintegrasi.
            </p>
          </FadeIn>
        </div>

        {/* Comparison Grid */}
        <div className="space-y-6 sm:space-y-8">
          {comparisonItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <FadeIn key={idx} delay={idx * 100}>
                <DoubleBezel variant="light" className="hover:shadow-md transition-shadow">
                  <div className="p-5 sm:p-7 bg-white">
                    
                    {/* Item Category Title */}
                    <div className="flex items-center gap-2.5 pb-4 mb-5 border-b border-slate-100">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                        <Icon className="w-4 h-4" />
                      </div>
                      <h3 className="font-bold text-base sm:text-lg text-slate-900">
                        {item.title}
                      </h3>
                    </div>

                    {/* Side-by-side comparison */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                      
                      {/* Manual Way (Before) */}
                      <div className="p-4 sm:p-5 rounded-2xl bg-rose-50/50 border border-rose-100 flex items-start gap-3.5">
                        <div className="p-1 rounded-full bg-rose-100 text-rose-600 mt-0.5 shrink-0">
                          <XCircle className="w-4 h-4" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-rose-900 uppercase tracking-wider">
                            Cara Manual (Konvensional)
                          </p>
                          <p className="text-sm font-semibold text-rose-950">
                            {item.manual.title}
                          </p>
                          <p className="text-xs text-rose-800/80 leading-relaxed">
                            {item.manual.desc}
                          </p>
                        </div>
                      </div>

                      {/* SIPANDU Way (After) */}
                      <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/70 border border-emerald-100 flex items-start gap-3.5">
                        <div className="p-1 rounded-full bg-emerald-100 text-emerald-700 mt-0.5 shrink-0">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                            Dengan Solusi SIPANDU
                          </p>
                          <p className="text-sm font-semibold text-emerald-950">
                            {item.digital.title}
                          </p>
                          <p className="text-xs text-emerald-800/80 leading-relaxed">
                            {item.digital.desc}
                          </p>
                        </div>
                      </div>

                    </div>
                  </div>
                </DoubleBezel>
              </FadeIn>
            );
          })}
        </div>

      </div>
    </section>
  );
}
