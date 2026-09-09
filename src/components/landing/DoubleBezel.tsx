// src/components/landing/DoubleBezel.tsx
import React from 'react';
import clsx from 'clsx';

interface DoubleBezelProps {
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
  variant?: 'light' | 'emerald' | 'dark' | 'glass';
}

export function DoubleBezel({
  children,
  className,
  innerClassName,
  variant = 'light',
}: DoubleBezelProps) {
  const outerVariants = {
    light: 'bg-black/[0.03] ring-1 ring-black/[0.06] shadow-[0_2px_12px_rgba(0,0,0,0.03)]',
    emerald: 'bg-emerald-950/[0.04] ring-1 ring-emerald-600/10 shadow-[0_4px_20px_rgba(13,148,136,0.05)]',
    dark: 'bg-slate-900 ring-1 ring-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.25)]',
    glass: 'bg-white/40 backdrop-blur-xl ring-1 ring-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.04)]',
  };

  const innerVariants = {
    light: 'bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] text-slate-900',
    emerald: 'bg-gradient-to-b from-white to-emerald-50/40 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] text-slate-900',
    dark: 'bg-slate-950 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] text-white',
    glass: 'bg-white/85 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] text-slate-900',
  };

  return (
    <div
      className={clsx(
        'p-1.5 sm:p-2 rounded-[2rem] transition-all duration-500 ease-apple-ease',
        outerVariants[variant],
        className
      )}
    >
      <div
        className={clsx(
          'h-full w-full rounded-[calc(2rem-0.375rem)] sm:rounded-[calc(2rem-0.5rem)] overflow-hidden',
          innerVariants[variant],
          innerClassName
        )}
      >
        {children}
      </div>
    </div>
  );
}
