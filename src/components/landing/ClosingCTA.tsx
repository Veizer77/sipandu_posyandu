// src/components/landing/ClosingCTA.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, ShieldCheck, HeartPulse, Activity } from 'lucide-react';
import { Button } from './Button';
import { DoubleBezel } from './DoubleBezel';
import { FadeIn } from './FadeIn';

export function ClosingCTA() {
  return (
    <footer className="relative bg-slate-950 text-white pt-20 sm:pt-32 pb-12 overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-emerald-600/20 via-teal-700/10 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        
        {/* Main CTA Box */}
        <FadeIn>
          <DoubleBezel variant="dark" className="max-w-4xl mx-auto mb-20 sm:mb-28">
            <div className="p-8 sm:p-14 bg-gradient-to-b from-slate-900 to-slate-950 text-center space-y-6 sm:space-y-8">
              
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase tracking-[0.2em] border border-emerald-500/20">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Mulai Transformasi Posyandu</span>
              </div>

              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
                Siap Wujudkan Posyandu <br />
                <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
                  Bebas Stunting & Nol Kertas?
                </span>
              </h2>

              <p className="text-slate-300 text-sm sm:text-lg max-w-2xl mx-auto font-normal leading-relaxed">
                Bergabunglah dengan standar baru pelayanan posyandu terpadu. Pantau tumbuh kembang balita secara akurat dan permudah kerja para kader relawan.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Button
                  href="/login"
                  variant="lime"
                  size="lg"
                  className="w-full sm:w-auto !text-slate-950 shadow-[0_10px_30px_rgba(141,182,0,0.3)]"
                >
                  Masuk ke Sistem Posyandu
                </Button>
                <Button
                  href="#kalkulator-who"
                  variant="ghost"
                  size="lg"
                  className="w-full sm:w-auto text-white hover:text-white hover:bg-white/10"
                  showIcon={false}
                >
                  Coba Kalkulator WHO 2006
                </Button>
              </div>

              <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-medium">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Standar Kemenkes RI
                </span>
                <span className="flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-teal-400" /> Z-Score LMS WHO
                </span>
                <span className="flex items-center gap-1.5">
                  <HeartPulse className="w-4 h-4 text-rose-400" /> Integrasi Layanan Primer
                </span>
              </div>

            </div>
          </DoubleBezel>
        </FadeIn>

        {/* Footer Navigation Bar */}
        <div className="pt-12 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
          
          {/* Logo & Description */}
          <div className="space-y-2 flex flex-col items-center md:items-start">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/10 p-1.5 flex items-center justify-center ring-1 ring-white/20">
                <img
                  src="/logo/logo_only.png"
                  alt="SIPANDU Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="font-extrabold text-lg tracking-tight text-white">
                SIPANDU
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-sm">
              Sistem Informasi Posyandu ILP Flamboyan RW 06, Desa Mojorejo, Kec. Junrejo, Kota Batu.
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-slate-400">
            <a href="#alur-5-meja" className="hover:text-white transition-colors">
              Alur 5 Meja
            </a>
            <a href="#kalkulator-who" className="hover:text-white transition-colors">
              Kalkulator WHO
            </a>
            <a href="#multi-role" className="hover:text-white transition-colors">
              Multi-Role Dashboard
            </a>
            <a href="#fitur-inovasi" className="hover:text-white transition-colors">
              Fitur Inovasi
            </a>
            <a href="#faq" className="hover:text-white transition-colors">
              FAQ
            </a>
            <Link
              to="/login"
              className="text-emerald-400 hover:text-emerald-300 transition-colors font-bold"
            >
              Masuk Sistem ↗
            </Link>
          </div>

        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} SIPANDU. Hak Cipta Dilindungi Undang-Undang.</p>
          <p>Dirancang untuk Posyandu Integrasi Layanan Primer (ILP) Indonesia.</p>
        </div>

      </div>
    </footer>
  );
}
