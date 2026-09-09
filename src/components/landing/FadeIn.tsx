// src/components/landing/FadeIn.tsx
import React, { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  className?: string;
}

export function FadeIn({
  children,
  delay = 0,
  direction = 'up',
  className,
}: FadeInProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      {
        threshold: 0.08,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const directionClasses = {
    up: 'translate-y-8 sm:translate-y-12',
    down: '-translate-y-8 sm:-translate-y-12',
    left: 'translate-x-8 sm:translate-x-12',
    right: '-translate-x-8 sm:-translate-x-12',
    none: 'scale-95',
  };

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={clsx(
        'transition-all duration-1000 ease-smooth-spring',
        isVisible
          ? 'opacity-100 translate-x-0 translate-y-0 scale-100 filter-none'
          : `opacity-0 blur-[2px] ${directionClasses[direction]}`,
        className
      )}
    >
      {children}
    </div>
  );
}
