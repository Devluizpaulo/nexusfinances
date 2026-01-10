'use client';

import { motion } from 'framer-motion';

export function PremiumBackground() {
  return (
    <>
      {/* Animated gradient orbs */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        {/* Main gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950/20 to-slate-950" />
        
        {/* Animated blobs */}
        <motion.div
          className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-blue-600/10 blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            repeatType: 'reverse',
          }}
        />
        
        <motion.div
          className="absolute -right-40 top-1/2 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl"
          animate={{
            x: [0, -50, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            repeatType: 'reverse',
            delay: 2,
          }}
        />
        
        <motion.div
          className="absolute left-1/2 -bottom-40 h-80 w-80 -translate-x-1/2 rounded-full bg-blue-500/5 blur-3xl"
          animate={{
            y: [0, -50, 0],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            repeatType: 'reverse',
            delay: 4,
          }}
        />

        {/* Grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(79, 172, 254, .05) 25%, rgba(79, 172, 254, .05) 26%, transparent 27%, transparent 74%, rgba(79, 172, 254, .05) 75%, rgba(79, 172, 254, .05) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(79, 172, 254, .05) 25%, rgba(79, 172, 254, .05) 26%, transparent 27%, transparent 74%, rgba(79, 172, 254, .05) 75%, rgba(79, 172, 254, .05) 76%, transparent 77%, transparent)',
            backgroundSize: '50px 50px'
          }}
        />
      </div>
    </>
  );
}

export function FloatingElements() {
  const elements = Array.from({ length: 6 });

  return (
    <div className="absolute inset-0 -z-5 overflow-hidden">
      {elements.map((_, i) => (
        <motion.div
          key={i}
          className="absolute h-1 w-1 rounded-full bg-blue-400/30"
          animate={{
            y: [0, -100, 0],
            x: [0, Math.random() * 100 - 50, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 4 + i,
            repeat: Infinity,
            delay: i * 0.5,
          }}
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
        />
      ))}
    </div>
  );
}

export function GlowingCard({ 
  children, 
  className = '' 
}: { 
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={`glow-border rounded-2xl ${className}`}
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 10 }}
    >
      <div className="gradient-border-inner">
        {children}
      </div>
    </motion.div>
  );
}
