// src/components/landing/Button.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import clsx from 'clsx';

interface ButtonProps {
  children: React.ReactNode;
  href?: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'lime' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  showIcon?: boolean;
  external?: boolean;
  target?: string;
}

export function Button({
  children,
  href,
  variant = 'primary',
  size = 'md',
  className,
  onClick,
  showIcon = true,
  external = false,
  target,
}: ButtonProps) {
  const sizeClasses = {
    sm: 'px-4 py-2 text-xs',
    md: 'px-5 py-2.5 sm:px-6 sm:py-3 text-sm',
    lg: 'px-7 py-3.5 sm:px-8 sm:py-4 text-base font-semibold',
  };

  const variantClasses = {
    primary:
      'bg-slate-900 text-white hover:bg-slate-800 shadow-[0_4px_16px_rgba(15,23,42,0.15)] active:scale-[0.98]',
    secondary:
      'bg-emerald-800 text-white hover:bg-emerald-900 shadow-[0_4px_20px_rgba(6,95,70,0.2)] active:scale-[0.98]',
    lime:
      'bg-[#8db600] text-slate-950 font-bold hover:bg-[#7ea300] shadow-[0_4px_20px_rgba(141,182,0,0.25)] active:scale-[0.98]',
    outline:
      'bg-white text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50/80 shadow-sm active:scale-[0.98]',
    ghost:
      'bg-transparent text-slate-700 hover:text-slate-950 hover:bg-black/5 active:scale-[0.98]',
  };

  const iconBgClasses = {
    primary: 'bg-white/15 text-white',
    secondary: 'bg-white/20 text-white',
    lime: 'bg-black/15 text-slate-950',
    outline: 'bg-slate-100 text-slate-800',
    ghost: 'bg-black/10 text-slate-900',
  };

  const baseClasses =
    'group relative inline-flex items-center justify-center gap-3 rounded-full font-medium transition-all duration-300 ease-apple-ease select-none';

  const iconElement = showIcon ? (
    <div
      className={clsx(
        'flex items-center justify-center rounded-full transition-transform duration-300 ease-apple-ease group-hover:translate-x-1 group-hover:-translate-y-0.5 group-hover:scale-105',
        size === 'sm' ? 'w-5 h-5' : size === 'lg' ? 'w-8 h-8' : 'w-6 h-6 sm:w-7 sm:h-7',
        iconBgClasses[variant]
      )}
    >
      {external ? (
        <ArrowUpRight className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5 sm:w-4 sm:h-4'} strokeWidth={2.2} />
      ) : (
        <ArrowRight className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5 sm:w-4 sm:h-4'} strokeWidth={2.2} />
      )}
    </div>
  ) : null;

  if (href) {
    const isAnchor = href.startsWith('#');
    const isExt = external || href.startsWith('http');

    if (isAnchor || isExt) {
      return (
        <a
          href={href}
          target={target || (isExt ? '_blank' : undefined)}
          rel={isExt ? 'noopener noreferrer' : undefined}
          className={clsx(baseClasses, sizeClasses[size], variantClasses[variant], className)}
        >
          <span>{children}</span>
          {iconElement}
        </a>
      );
    }

    return (
      <Link
        to={href}
        className={clsx(baseClasses, sizeClasses[size], variantClasses[variant], className)}
      >
        <span>{children}</span>
        {iconElement}
      </Link>
    );
  }

  return (
    <button
      onClick={onClick}
      className={clsx(baseClasses, sizeClasses[size], variantClasses[variant], className)}
    >
      <span>{children}</span>
      {iconElement}
    </button>
  );
}
