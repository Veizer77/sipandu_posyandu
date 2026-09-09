// src/components/landing/ZScoreSimulator.tsx
import React, { useState, useMemo } from 'react';
import { Calculator, Sparkles, AlertTriangle, CheckCircle2, Info, ArrowRight, User } from 'lucide-react';
import { computeZScore, ZScoreResult } from '@/lib/landingZscoreCalc';
import { DoubleBezel } from './DoubleBezel';
import { FadeIn } from './FadeIn';
import clsx from 'clsx';

export function ZScoreSimulator() {
  // Input States
  const [ageMonths, setAgeMonths] = useState<number>(18);
  const [gender, setGender] = useState<'L' | 'P'>('L');
  const [weightKg, setWeightKg] = useState<number>(11.2);
  const [heightCm, setHeightCm] = useState<number>(82.5);

  // Compute live Z-score
  const result: ZScoreResult = useMemo(() => {
    return computeZScore(weightKg || 0, heightCm || 0, ageMonths || 0, gender);
  }, [weightKg, heightCm, ageMonths, gender]);

  // Preset Buttons
  const setPreset = (age: number, gen: 'L' | 'P', w: number, h: number) => {
    setAgeMonths(age);
    setGender(gen);
    setWeightKg(w);
    setHeightCm(h);
  };

  // Calculate position percentage for meter bar (-4 SD to +4 SD mapped to 0% - 100%)
  const clampedZ = Math.min(Math.max(result.zScoreBBU, -4), 4);
  const meterPercent = ((clampedZ + 4) / 8) * 100;

  return (
    <section id="kalkulator-who" className="py-20 sm:py-32 bg-[#F8F6F0]/80 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-14 sm:mb-16">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/[0.04] text-emerald-900 text-[11px] font-bold uppercase tracking-[0.2em]">
              <Calculator className="w-3.5 h-3.5 text-emerald-600" />
              <span>Live Interactive Widget</span>
            </div>
          </FadeIn>

          <FadeIn delay={100}>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Simulator Antropometri <br />
              <span className="bg-gradient-to-r from-emerald-800 to-teal-700 bg-clip-text text-transparent">
                Standar WHO 2006
              </span>
            </h2>
          </FadeIn>

          <FadeIn delay={200}>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              Coba langsung kalkulasi status gizi balita secara instan. Ubah angka usia, berat, dan tinggi badan di bawah ini untuk melihat hasil analisis real-time.
            </p>
          </FadeIn>
        </div>

        {/* Calculator Widget Container */}
        <FadeIn delay={300}>
          <DoubleBezel variant="emerald" className="max-w-5xl mx-auto">
            <div className="p-6 sm:p-10 bg-white grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12">
              
              {/* Left Column: Input Form */}
              <div className="lg:col-span-6 space-y-6">
                
                {/* Presets */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Preset Contoh Cepat:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setPreset(18, 'L', 11.2, 82.5)}
                      className="px-3 py-1 text-xs font-semibold rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                    >
                      🌟 Balita Sehat (18 Bln)
                    </button>
                    <button
                      onClick={() => setPreset(24, 'P', 8.5, 78.0)}
                      className="px-3 py-1 text-xs font-semibold rounded-full bg-amber-100/80 hover:bg-amber-200 text-amber-900 transition-colors"
                    >
                      ⚠️ Indikasi Stunting (24 Bln)
                    </button>
                    <button
                      onClick={() => setPreset(9, 'L', 6.4, 69.0)}
                      className="px-3 py-1 text-xs font-semibold rounded-full bg-rose-100/80 hover:bg-rose-200 text-rose-900 transition-colors"
                    >
                      🚨 Gizi Kurang (9 Bln)
                    </button>
                  </div>
                </div>

                {/* Form Controls */}
                <div className="space-y-5 pt-2">
                  
                  {/* Gender Selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Jenis Kelamin
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setGender('L')}
                        className={clsx(
                          'py-3 px-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all',
                          gender === 'L'
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 ring-1 ring-blue-600'
                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                        )}
                      >
                        👦 Laki-laki
                      </button>
                      <button
                        type="button"
                        onClick={() => setGender('P')}
                        className={clsx(
                          'py-3 px-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all',
                          gender === 'P'
                            ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20 ring-1 ring-rose-500'
                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                        )}
                      >
                        👧 Perempuan
                      </button>
                    </div>
                  </div>

                  {/* Age in Months */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                      <label className="uppercase tracking-wider">Usia Balita</label>
                      <span className="text-sm font-extrabold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-lg">
                        {ageMonths} Bulan ({Math.floor(ageMonths / 12)} Thn {ageMonths % 12} Bln)
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={60}
                      value={ageMonths}
                      onChange={(e) => setAgeMonths(Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-700"
                    />
                  </div>

                  {/* Weight and Height */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Berat Badan (kg)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="1"
                        max="40"
                        value={weightKg}
                        onChange={(e) => setWeightKg(parseFloat(e.target.value) || 0)}
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white transition-all"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Tinggi Badan (cm)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="30"
                        max="140"
                        value={heightCm}
                        onChange={(e) => setHeightCm(parseFloat(e.target.value) || 0)}
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                </div>
              </div>

              {/* Right Column: Live Analysis Card */}
              <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
                
                <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-xl space-y-6 relative overflow-hidden">
                  
                  {/* Card Header */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                        Hasil Analisis Z-Score WHO
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                      WHO Growth 2006
                    </span>
                  </div>

                  {/* Primary Metrics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Z-Score BB/U (Berat)
                      </span>
                      <p className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                        {result.zScoreBBU > 0 ? `+${result.zScoreBBU}` : result.zScoreBBU}{' '}
                        <span className="text-xs font-normal text-slate-400">SD</span>
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Z-Score TB/U (Tinggi)
                      </span>
                      <p className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                        {result.zScoreTBU > 0 ? `+${result.zScoreTBU}` : result.zScoreTBU}{' '}
                        <span className="text-xs font-normal text-slate-400">SD</span>
                      </p>
                    </div>
                  </div>

                  {/* Visual Meter Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                      <span>-3 SD (Buruk)</span>
                      <span>-2 SD (Kurang)</span>
                      <span>0 SD (Median)</span>
                      <span>+2 SD (Lebih)</span>
                    </div>

                    {/* Gradient Meter Track */}
                    <div className="h-3 w-full rounded-full bg-gradient-to-r from-rose-500 via-amber-400 via-emerald-400 to-blue-500 relative p-0.5 shadow-inner">
                      {/* Animated Pin */}
                      <div
                        style={{ left: `${meterPercent}%` }}
                        className="absolute -top-1.5 -translate-x-1/2 w-6 h-6 rounded-full bg-white text-slate-900 font-extrabold text-[10px] flex items-center justify-center shadow-lg border-2 border-slate-900 transition-all duration-300"
                      >
                        ●
                      </div>
                    </div>
                  </div>

                  {/* Status Badges */}
                  <div className="space-y-3 pt-2">
                    <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 flex items-start gap-3">
                      <div className="p-1 rounded-full bg-emerald-500/20 text-emerald-300 mt-0.5 shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-white uppercase tracking-wider">
                          Status BB/U: {result.statusBBU.label}
                        </p>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {result.statusBBU.description}
                        </p>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 flex items-start gap-3">
                      <div className="p-1 rounded-full bg-teal-500/20 text-teal-300 mt-0.5 shrink-0">
                        <Info className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-white uppercase tracking-wider">
                          Status TB/U: {result.statusTBU.label}
                        </p>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {result.statusTBU.description}
                        </p>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Recommendation Box */}
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-start gap-3">
                  <Info className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                      Rekomendasi Tindakan SIPANDU
                    </p>
                    <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed">
                      {result.statusBBU.recommendation}
                    </p>
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
