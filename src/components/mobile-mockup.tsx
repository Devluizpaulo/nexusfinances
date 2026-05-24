'use client';

import { DashboardPreview } from './dashboard-preview';

interface MobileMockupProps {
  className?: string;
}

export function MobileMockup({ className = '' }: MobileMockupProps) {
  return (
    <div
      className={`mobile-mockup-float ${className}`}
      style={{
        transform: 'rotate(6deg)',
        filter: 'drop-shadow(0 32px 48px rgba(0,0,0,0.6)) drop-shadow(0 0 24px rgba(6,182,212,0.18))',
      }}
    >
      {/* Phone frame */}
      <div
        className="relative bg-slate-900 rounded-[2.8rem] border-2 border-slate-700/80 overflow-hidden"
        style={{ width: 220, minHeight: 420 }}
      >
        {/* Ambient glow inside frame */}
        <div className="absolute inset-0 pointer-events-none rounded-[2.6rem] bg-gradient-to-b from-cyan-500/5 via-transparent to-emerald-500/5 z-10" />

        {/* Notch */}
        <div className="relative flex justify-center pt-3 pb-1 bg-slate-950 z-20">
          <div className="flex items-center gap-2 bg-slate-900 rounded-full px-4 py-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-slate-700" />
            <div className="h-1.5 w-8 rounded-full bg-slate-700" />
            <div className="h-1.5 w-1.5 rounded-full bg-slate-700" />
          </div>
        </div>

        {/* Screen content */}
        <div className="bg-slate-950 px-2 pb-4 pt-1">
          {/* Status bar */}
          <div className="flex items-center justify-between px-1 pb-2">
            <span className="text-[9px] text-slate-500 font-medium">9:41</span>
            <div className="flex items-center gap-1">
              <span className="text-[9px] text-slate-500">●●●</span>
            </div>
          </div>

          {/* Mini dashboard */}
          <DashboardPreview compact animate={false} className="text-[10px]" />
        </div>

        {/* Home bar */}
        <div className="flex justify-center py-3 bg-slate-950">
          <div className="h-1 w-16 rounded-full bg-slate-700" />
        </div>

        {/* Side buttons (decorative) */}
        <div className="absolute -right-[3px] top-20 h-8 w-[3px] rounded-r-sm bg-slate-600" />
        <div className="absolute -left-[3px] top-16 h-6 w-[3px] rounded-l-sm bg-slate-600" />
        <div className="absolute -left-[3px] top-24 h-10 w-[3px] rounded-l-sm bg-slate-600" />
        <div className="absolute -left-[3px] top-36 h-10 w-[3px] rounded-l-sm bg-slate-600" />
      </div>
    </div>
  );
}
