// src/pages/LandingPage.tsx
import React from 'react';
import { Navbar } from '@/components/landing/Navbar';
import { HeroSection } from '@/components/landing/HeroSection';
import { ComparisonSection } from '@/components/landing/ComparisonSection';
import { Workflow5Meja } from '@/components/landing/Workflow5Meja';
import { ZScoreSimulator } from '@/components/landing/ZScoreSimulator';
import { RoleMatrix } from '@/components/landing/RoleMatrix';
import { BentoGrid } from '@/components/landing/BentoGrid';
import { ImpactMetrics } from '@/components/landing/ImpactMetrics';
import { FAQSection } from '@/components/landing/FAQSection';
import { ClosingCTA } from '@/components/landing/ClosingCTA';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#FDFBF7] text-slate-900 overflow-x-hidden selection:bg-teal-500/20 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Floating Header */}
      <Navbar />

      {/* Hero Section */}
      <HeroSection />

      {/* Before vs After Comparison */}
      <ComparisonSection />

      {/* 5-Meja Workflow Walkthrough */}
      <Workflow5Meja />

      {/* Live WHO 2006 Z-Score Simulator */}
      <ZScoreSimulator />

      {/* Multi-Role Access Control Matrix */}
      <RoleMatrix />

      {/* Asymmetric Bento Grid Features */}
      <BentoGrid />

      {/* Quantifiable Impact & User Testimonials */}
      <ImpactMetrics />

      {/* Frequently Asked Questions */}
      <FAQSection />

      {/* Closing Call-to-Action & Footer */}
      <ClosingCTA />
    </main>
  );
}
