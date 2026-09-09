// src/components/landing/ImpactMetrics.tsx
import React from 'react';
import { TrendingUp, Clock, ShieldCheck, CheckCircle2, Quote, Sparkles, Star } from 'lucide-react';
import { DoubleBezel } from './DoubleBezel';
import { FadeIn } from './FadeIn';

export function ImpactMetrics() {
  const stats = [
    {
      value: '90%',
      label: 'Hemat Waktu Laporan',
      desc: 'Dari 3–4 jam rekap manual menjadi selesai seketika dalam 1 menit.',
    },
    {
      value: '100%',
      label: 'Akurasi Z-Score WHO',
      desc: 'Eliminasi kesalahan hitung usia bulan dan salah plot kurva KMS manual.',
    },
    {
      value: '< 24 Jam',
      label: 'Respon Cepat Sweeping',
      desc: 'Balita 2T dan mangkir 2 sesi langsung masuk agenda intervensi kader.',
    },
    {
      value: '0 Lembar',
      label: 'Zero-Paperwork',
      desc: 'Seluruh riwayat rekam medis tersimpan aman dan terintegrasi digital.',
    },
  ];

  const testimonials = [
    {
      quote:
        'Dulu setelah posyandu selesai, kami kader masih harus lembur berjam-jam nyalin data dari buku register tebal ke lembar rekapitulasi dinas. Sejak pakai SIPANDU, begitu meja 5 selesai, laporan PDF langsung jadi dan tinggal dikirim!',
      author: 'Ibu Rahayu',
      role: 'Ketua Kader Posyandu Flamboyan RW 06',
      location: 'Desa Mojorejo, Kota Batu',
    },
    {
      quote:
        'Deteksi dini stunting jadi jauh lebih terarah. Kalau ada balita yang beratnya tidak naik 2 bulan berturut-turut (2T), sistem langsung menyalakan tanda peringatan sehingga saya bisa segera verifikasi dan jadwalkan PMT pemulihan.',
      author: 'Bidan Anisa, S.Tr.Keb',
      role: 'Bidan Desa',
      location: 'Wilayah Kerja Puskesmas Junrejo',
    },
    {
      quote:
        'Sebagai Kepala Desa, saya bisa melihat statistik riil kehadiran warga dan status gizi anak-anak secara transparan setiap saat. Ini memudahkan kami menyusun APBDes berbasis data nyata untuk pencegahan stunting.',
      author: 'Bpk. H. Bambang',
      role: 'Kepala Desa',
      location: 'Pemerintah Desa Mojorejo',
    },
  ];

  return (
    <section className="py-20 sm:py-32 bg-[#FDFBF7] relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-14 sm:mb-20">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/[0.04] text-slate-800 text-[11px] font-bold uppercase tracking-[0.2em]">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Dampak Nyata di Lapangan</span>
            </div>
          </FadeIn>

          <FadeIn delay={100}>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Meringankan Kerja Kader, <br />
              <span className="bg-gradient-to-r from-emerald-800 to-teal-700 bg-clip-text text-transparent">
                Menyelamatkan Tumbuh Kembang
              </span>
            </h2>
          </FadeIn>

          <FadeIn delay={200}>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              Hasil nyata implementasi digitalisasi posyandu dalam meningkatkan efisiensi dan ketepatan intervensi kesehatan.
            </p>
          </FadeIn>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-16 sm:mb-24">
          {stats.map((st, idx) => (
            <FadeIn key={idx} delay={idx * 100}>
              <DoubleBezel variant="light" className="h-full">
                <div className="p-6 sm:p-7 bg-white text-center flex flex-col justify-center h-full space-y-2">
                  <p className="text-3xl sm:text-5xl font-extrabold text-emerald-800 tracking-tight">
                    {st.value}
                  </p>
                  <p className="font-bold text-sm sm:text-base text-slate-900">
                    {st.label}
                  </p>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {st.desc}
                  </p>
                </div>
              </DoubleBezel>
            </FadeIn>
          ))}
        </div>

        {/* Testimonial Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {testimonials.map((t, idx) => (
            <FadeIn key={idx} delay={200 + idx * 100}>
              <DoubleBezel variant="emerald" className="h-full">
                <div className="p-6 sm:p-8 bg-white h-full flex flex-col justify-between space-y-6">
                  
                  <div className="space-y-4">
                    <div className="flex gap-1 text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400" />
                      ))}
                    </div>
                    <p className="text-slate-700 text-sm leading-relaxed italic">
                      "{t.quote}"
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-800 text-white font-bold text-sm flex items-center justify-center shrink-0">
                      {t.author.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-slate-900 leading-tight">
                        {t.author}
                      </p>
                      <p className="text-xs text-emerald-800 font-semibold mt-0.5">
                        {t.role}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {t.location}
                      </p>
                    </div>
                  </div>

                </div>
              </DoubleBezel>
            </FadeIn>
          ))}
        </div>

      </div>
    </section>
  );
}
