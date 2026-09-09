// src/components/landing/FAQSection.tsx
import React, { useState } from 'react';
import { ChevronDown, HelpCircle, Sparkles } from 'lucide-react';
import { DoubleBezel } from './DoubleBezel';
import { FadeIn } from './FadeIn';
import clsx from 'clsx';

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Apakah kader posyandu yang belum terbiasa teknologi bisa menggunakannya?',
      a: 'Sangat bisa! Antarmuka SIPANDU dirancang dengan prinsip kesederhanaan maksimal (zero learning curve). Alur pengisian form disusun berurutan mengikuti meja pelayanan posyandu nyata, dilengkapi tombol-tombol besar dan panduan visual jelas.',
    },
    {
      q: 'Bagaimana jika koneksi internet di lokasi posyandu kurang stabil?',
      a: 'SIPANDU dibangun dengan arsitektur web modern yang sangat ringan dan efisien dalam konsumsi data seluler. Cukup dengan koneksi internet standar pada smartphone kader, input data dan kalkulasi Z-score tetap berjalan mulus.',
    },
    {
      q: 'Bagaimana sistem menghitung status gizi balita dan stunting?',
      a: 'SIPANDU menerapkan rumus baku WHO Child Growth Standards 2006 (metode LMS dengan penyesuaian SD23) yang diakui resmi oleh Kementerian Kesehatan RI. Saat berat dan tinggi badan dimasukkan, nilai Z-Score BB/U, TB/U, dan BB/TB langsung terhitung otomatis.',
    },
    {
      q: 'Apakah format laporan bulanan sudah sesuai standar Puskesmas & Dinkes?',
      a: 'Ya, seluruh format ekspor PDF dan Excel telah disesuaikan dengan formulir rekapitulasi bulanan Posyandu ILP Kemenkes, memuat cakupan kehadiran sasaran (D/S), klasifikasi gizi, cakupan imunisasi, vitamin A, tablet Fe, hingga hasil skrining lansia.',
    },
    {
      q: 'Apakah data NIK dan privasi rekam medis warga terjamin aman?',
      a: 'Keamanan data adalah prioritas utama. Database dilindungi dengan Row-Level Security (RLS) dan enkripsi tingkat enterprise. Setiap perubahan data tercatat secara otomatis dalam Audit Log sehingga transparan dan tidak dapat dimanipulasi.',
    },
  ];

  return (
    <section id="faq" className="py-20 sm:py-32 bg-[#F8F6F0]/70 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="text-center space-y-4 mb-14 sm:mb-16">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/[0.04] text-slate-800 text-[11px] font-bold uppercase tracking-[0.2em]">
              <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Tanya Jawab</span>
            </div>
          </FadeIn>

          <FadeIn delay={100}>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Pertanyaan yang <br />
              <span className="bg-gradient-to-r from-emerald-800 to-teal-700 bg-clip-text text-transparent">
                Sering Diajukan
              </span>
            </h2>
          </FadeIn>

          <FadeIn delay={200}>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              Jawaban seputar adopsi sistem, keamanan data, dan kemudahan pengoperasian di lapangan.
            </p>
          </FadeIn>
        </div>

        {/* Accordion List */}
        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <FadeIn key={idx} delay={idx * 80}>
                <DoubleBezel variant="light" className="transition-all">
                  <div className="bg-white rounded-2xl overflow-hidden">
                    <button
                      onClick={() => setOpenIndex(isOpen ? null : idx)}
                      className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
                    >
                      <span className="font-bold text-base sm:text-lg text-slate-900 leading-snug">
                        {faq.q}
                      </span>
                      <div
                        className={clsx(
                          'w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-600 transition-transform duration-300',
                          isOpen ? 'rotate-180 bg-emerald-100 text-emerald-800' : ''
                        )}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </button>

                    {isOpen && (
                      <div className="px-5 sm:px-6 pb-6 pt-1 text-slate-600 text-sm sm:text-base leading-relaxed border-t border-slate-100">
                        {faq.a}
                      </div>
                    )}
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
