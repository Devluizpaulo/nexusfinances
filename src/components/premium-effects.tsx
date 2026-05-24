'use client';

import { motion } from 'framer-motion';

export function PremiumBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-slate-950">
      {/* Base radial gradients */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.15),rgba(2,6,23,0.95)),radial-gradient(circle_at_20%_0%,rgba(14,165,233,0.14),transparent_32%),radial-gradient(circle_at_85%_10%,rgba(16,185,129,0.08),transparent_28%)]" />

      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(148,163,184,.35) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,.35) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Top shimmer line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent" />

      {/* Ambient orb 1 — cyan, breathing */}
      <div
        className="absolute glow-breathing pointer-events-none"
        style={{
          width: 600,
          height: 600,
          borderRadius: '50%',
          top: '-10%',
          left: '-8%',
          background: 'radial-gradient(circle, rgba(6,182,212,0.10) 0%, transparent 65%)',
          filter: 'blur(2px)',
        }}
      />

      {/* Ambient orb 2 — emerald, breathing offset */}
      <div
        className="absolute glow-breathing pointer-events-none"
        style={{
          width: 500,
          height: 500,
          borderRadius: '50%',
          top: '30%',
          right: '-10%',
          background: 'radial-gradient(circle, rgba(16,185,129,0.09) 0%, transparent 65%)',
          filter: 'blur(2px)',
          animationDelay: '2s',
        }}
      />

      {/* Ambient orb 3 — blue accent, bottom */}
      <div
        className="absolute glow-breathing pointer-events-none"
        style={{
          width: 400,
          height: 400,
          borderRadius: '50%',
          bottom: '-5%',
          left: '40%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 65%)',
          filter: 'blur(2px)',
          animationDelay: '1s',
        }}
      />
    </div>
  );
}

export function FloatingElements() {
  return null;
}

export function GlowingCard({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={`rounded-lg border border-white/10 bg-card/70 ${className}`}
      whileHover={{ y: -2 }}
    >
      {children}
    </motion.div>
  );
}
