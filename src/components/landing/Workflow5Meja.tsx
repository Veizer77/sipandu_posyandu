// src/components/landing/Workflow5Meja.tsx
import React, { useState } from 'react';
import { UserCheck, Scale, FileText, Syringe, HeartHandshake, ArrowRight, CheckCircle2, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';
import { DoubleBezel } from './DoubleBezel';
import { FadeIn } from './FadeIn';
import clsx from 'clsx';

export function Workflow5Meja() {
  const [selectedMeja, setSelectedMeja] = useState<number>(0);

  const mejaList = [
    {
      nomor: 'Meja 1',
      nama: 'Pendaftaran & Presensi',
      icon: UserCheck,
      color: 'blue',
      tagline: 'Identifikasi Cepat & Klasifikasi Sasaran',
      desc: 'Kader cukup memasukkan NIK atau Nama sasaran. Sistem langsung mengenali klasifikasi sasaran (Bayi, Balita, Ibu Hamil, WUS, atau Lansia) dan mencetak tiket alur digital secara instan.',
      fitur: [
        'Pencarian auto-complete berbasis NIK atau No. KK',
        'Deteksi otomatis status kehadiran bulan sebelumnya',
        'Antrean digital langsung mengalir ke Meja 2',
      ],
      preview: {
        header: 'Tiket Registrasi Sasaran',
        badge: 'Meja 1 • Sukses Presensi',
        main: 'No. Antrean: A-014',
        sub: 'Nama: Rayyan Bagaskara (12 Bln) • NIK: 3579010408230002',
        footer: 'Status: Menuju Meja 2 (Pengukuran)',
      },
    },
    {
      nomor: 'Meja 2',
      nama: 'Pengukuran & Antropometri',
      icon: Scale,
      color: 'amber',
      tagline: 'Kalkulasi Otomatis Z-Score Standar WHO 2006',
      desc: 'Input metrik fisik lengkap (Berat Badan, Tinggi/Panjang Badan, Lingkar Kepala, Lingkar Lengan Atas). Bagi lansia & bumil, tersedia input tekanan darah dan skrining metabolik.',
      fitur: [
        'Kalkulator WHO 2006 (BB/U, TB/U, BB/TB) real-time',
        'Komparasi otomatis terhadap berat badan bulan lalu',
        'Peringatan otomatis indikasi 2T (BB tidak naik 2 bulan)',
      ],
      preview: {
        header: 'Hasil Pemeriksaan Antropometri',
        badge: 'Meja 2 • Z-Score WHO Realtime',
        main: 'BB: 9.8 kg (+0.4 kg) • TB: 76.5 cm',
        sub: 'Z-Score BB/U: -0.12 SD • Status: Gizi Baik (Normal)',
        footer: 'Indikator Pertumbuhan: N (Naik)',
      },
    },
    {
      nomor: 'Meja 3',
      nama: 'Pencatatan Rekam Medis',
      icon: FileText,
      color: 'purple',
      tagline: 'Sinkronisasi Data Tanpa Salin Kertas',
      desc: 'Bebaskan kader dari menyalin data antar formulir. Data dari Meja 1 dan 2 otomatis terintegrasi ke rekam medis individu dan histori KMS digital dalam database.',
      fitur: [
        'Pembaruan otomatis buku KIA & KMS digital',
        'Zero-redundancy: satu kali input untuk semua kebutuhan',
        'Audit log mencatat waktu dan petugas pemeriksa',
      ],
      preview: {
        header: 'Rekam Medis Digital Tersimpan',
        badge: 'Meja 3 • Sinkronisasi Cloud',
        main: 'Histori Kunjungan Ke-12',
        sub: 'Data antropometri & tanda vital tersimpan di database.',
        footer: 'Data siap diakses Meja 4 & Bidan Desa',
      },
    },
    {
      nomor: 'Meja 4',
      nama: 'Pelayanan & Imunisasi',
      icon: Syringe,
      color: 'teal',
      tagline: 'Manajemen Vaksinasi & Suplementasi Presisi',
      desc: 'Pemberian imunisasi wajib nasional sesuai jadwal usia, distribusi Kapsul Vitamin A, PMT Pemulihan, Tablet Tambah Darah (Fe) untuk bumil, dan skrining AKS untuk lansia.',
      fitur: [
        'Checklist imunisasi wajib (HB-0, BCG, DPT, Polio, IPV, MR)',
        'Pencatatan nomor batch dan vial vaksin',
        'Pemantauan kepatuhan konsumsi Tablet Fe ibu hamil',
      ],
      preview: {
        header: 'Layanan Kesehatan Diberikan',
        badge: 'Meja 4 • Checklist Tuntas',
        main: 'Imunisasi: MR-1 (Campak Rubella)',
        sub: 'Vitamin A Biru (100.000 IU) • PMT Biskuit Balita Diberikan',
        footer: 'Jadwal Berikutnya: DPT Booster (Usia 18 Bln)',
      },
    },
    {
      nomor: 'Meja 5',
      nama: 'Penyuluhan & Validasi',
      icon: HeartHandshake,
      color: 'emerald',
      tagline: 'Konseling Terarah & Pengesahan Bidan Desa',
      desc: 'Kader memberikan konseling gizi spesifik sesuai hasil pengukuran hari itu. Bidan Desa melakukan verifikasi klinis dan langsung membuat tiket rujukan jika ditemukan indikasi risiko tinggi.',
      fitur: [
        'Rekomendasi konseling gizi otomatis berdasarkan status BB',
        'Validasi digital oleh Bidan Desa',
        'Sistem rujukan cepat ke Puskesmas / RS Rujukan',
      ],
      preview: {
        header: 'Validasi & Konseling Tuntas',
        badge: 'Meja 5 • Terverifikasi Bidan',
        main: 'Status Verifikasi: VALID',
        sub: 'Konseling: ASI Eksklusif dilanjutkan MP-ASI bergizi seimbang.',
        footer: 'Kunjungan Hari-H Selesai',
      },
    },
  ];

  const current = mejaList[selectedMeja];
  const CurrentIcon = current.icon;

  return (
    <section id="alur-5-meja" className="py-20 sm:py-32 bg-[#FDFBF7] relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-14 sm:mb-16">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/[0.04] text-emerald-800 text-[11px] font-bold uppercase tracking-[0.2em]">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Standar Operasional Posyandu ILP</span>
            </div>
          </FadeIn>

          <FadeIn delay={100}>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Alur 5 Meja yang <br />
              <span className="bg-gradient-to-r from-emerald-800 to-teal-700 bg-clip-text text-transparent">
                Terintegrasi & Bebas Hambatan
              </span>
            </h2>
          </FadeIn>

          <FadeIn delay={200}>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              Setiap pos pelayanan terhubung dalam satu jalur data real-time. Tidak ada antrean ganda atau data tercecer.
            </p>
          </FadeIn>
        </div>

        {/* Step Selector Tabs */}
        <FadeIn delay={300}>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3 p-1.5 rounded-3xl bg-black/[0.03] ring-1 ring-black/5 mb-10">
            {mejaList.map((meja, idx) => {
              const Icon = meja.icon;
              const isSelected = selectedMeja === idx;
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedMeja(idx)}
                  className={clsx(
                    'flex flex-col items-center sm:items-start p-3 sm:p-4 rounded-2xl transition-all duration-300 text-left relative overflow-hidden',
                    isSelected
                      ? 'bg-white shadow-[0_4px_20px_rgba(0,0,0,0.06)] ring-1 ring-black/5 text-slate-900'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
                  )}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <div
                      className={clsx(
                        'w-7 h-7 rounded-xl flex items-center justify-center transition-colors',
                        isSelected ? 'bg-emerald-800 text-white' : 'bg-slate-100 text-slate-600'
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      {meja.nomor}
                    </span>
                  </div>
                  <p className="font-bold text-xs sm:text-sm leading-snug line-clamp-1">
                    {meja.nama.split('&')[0]}
                  </p>
                </button>
              );
            })}
          </div>
        </FadeIn>

        {/* Detail Panel Card */}
        <FadeIn delay={400}>
          <DoubleBezel variant="emerald" className="max-w-5xl mx-auto">
            <div className="p-6 sm:p-10 bg-white grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 items-center">
              
              {/* Left Column: Description & Features */}
              <div className="lg:col-span-7 space-y-6">
                
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900">
                    <CurrentIcon className="w-4 h-4" />
                    <span>{current.nomor} • {current.nama}</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                    {current.tagline}
                  </h3>
                </div>

                <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
                  {current.desc}
                </p>

                {/* Feature Checklist */}
                <div className="space-y-3 pt-2">
                  {current.fitur.map((f, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-sm font-medium text-slate-700">{f}</span>
                    </div>
                  ))}
                </div>

                {/* Step indicator footer */}
                <div className="pt-4 flex items-center gap-4 text-xs font-semibold text-slate-400 border-t border-slate-100">
                  <span>Tahap {selectedMeja + 1} dari 5</span>
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${((selectedMeja + 1) / 5) * 100}%` }}
                      className="h-full bg-emerald-700 rounded-full transition-all duration-500"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: High-Fidelity UI Component Card */}
              <div className="lg:col-span-5">
                <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-xl space-y-5 relative overflow-hidden">
                  
                  {/* Subtle Glow inside card */}
                  <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />

                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      {current.preview.header}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {current.preview.badge}
                    </span>
                  </div>

                  <div className="space-y-2 py-2">
                    <p className="text-lg sm:text-xl font-extrabold text-white">
                      {current.preview.main}
                    </p>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                      {current.preview.sub}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3 text-xs text-emerald-300">
                    <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span className="font-semibold">{current.preview.footer}</span>
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
