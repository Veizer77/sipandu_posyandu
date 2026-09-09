// src/components/landing/Navbar.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Sparkles, Activity, Calculator, Users, Layers, HelpCircle } from 'lucide-react';
import { Button } from './Button';
import clsx from 'clsx';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Alur 5 Meja', href: '#alur-5-meja', icon: Activity },
    { label: 'Kalkulator WHO', href: '#kalkulator-who', icon: Calculator },
    { label: 'Multi-Role', href: '#multi-role', icon: Users },
    { label: 'Inovasi', href: '#fitur-inovasi', icon: Layers },
    { label: 'FAQ', href: '#faq', icon: HelpCircle },
  ];

  return (
    <>
      <header
        className={clsx(
          'fixed top-0 left-0 right-0 z-50 flex items-center justify-center px-4 sm:px-6 transition-all duration-500 ease-apple-ease',
          scrolled ? 'py-3 sm:py-4' : 'py-5 sm:py-6'
        )}
      >
        <div
          className={clsx(
            'flex items-center justify-between w-full max-w-6xl px-4 sm:px-6 py-2.5 sm:py-3 rounded-full transition-all duration-500 ease-apple-ease',
            scrolled
              ? 'bg-white/80 backdrop-blur-2xl ring-1 ring-black/[0.08] shadow-[0_8px_30px_rgba(0,0,0,0.06)]'
              : 'bg-white/60 backdrop-blur-lg ring-1 ring-black/[0.05] shadow-[0_4px_20px_rgba(0,0,0,0.02)]'
          )}
        >
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="relative w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full bg-emerald-50 ring-1 ring-emerald-600/20 p-1 group-hover:scale-105 transition-transform duration-300">
              <img
                src="/logo/logo_only.png"
                alt="SIPANDU Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900 leading-tight">
                SIPANDU
              </span>
              <span className="text-[9px] uppercase tracking-widest font-semibold text-emerald-700 leading-none">
                Posyandu ILP
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1 bg-black/[0.03] p-1 rounded-full ring-1 ring-black/5">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-950 hover:bg-white rounded-full transition-all duration-200"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden sm:flex items-center gap-3">
            <Button
              href="/login"
              variant="primary"
              size="sm"
              className="!py-2 !px-4"
            >
              Masuk ke Sistem
            </Button>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Buka Menu Navigasi"
            className="sm:hidden relative p-2 rounded-full text-slate-700 hover:text-slate-950 hover:bg-black/5 transition-colors focus:outline-none"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Glass Menu Overlay */}
      <div
        className={clsx(
          'fixed inset-0 z-40 bg-white/95 backdrop-blur-2xl flex flex-col justify-between p-6 pt-24 transition-all duration-500 ease-apple-ease sm:hidden',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none -translate-y-4'
        )}
      >
        <div className="space-y-3">
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400 px-4">
            Navigasi Halaman
          </p>
          <div className="space-y-1">
            {navLinks.map((link, idx) => {
              const Icon = link.icon;
              return (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  style={{ transitionDelay: `${idx * 40}ms` }}
                  className="flex items-center gap-3.5 px-4 py-3.5 text-base font-semibold text-slate-800 hover:bg-emerald-50 hover:text-emerald-800 rounded-2xl transition-all"
                >
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span>{link.label}</span>
                </a>
              );
            })}
          </div>
        </div>

        <div className="space-y-3 pt-6 border-t border-slate-100">
          <Button
            href="/login"
            variant="primary"
            size="lg"
            className="w-full justify-center"
            onClick={() => setIsOpen(false)}
          >
            Buka Portal SIPANDU
          </Button>
          <p className="text-center text-[11px] text-slate-400">
            Posyandu ILP Flamboyan RW 06 Desa Mojorejo
          </p>
        </div>
      </div>
    </>
  );
}
