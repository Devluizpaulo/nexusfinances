'use client';

import { useEffect, useRef, useState } from 'react';
import { BarChart3, Calendar, TrendingUp, Wallet } from 'lucide-react';

interface DashboardPreviewProps {
  compact?: boolean;
  animate?: boolean;
  className?: string;
}

const transactions = [
  { label: 'Salário', amount: '+R$ 4.200', color: 'text-emerald-400', dot: 'bg-emerald-400' },
  { label: 'Alimentação', amount: '-R$ 380', color: 'text-orange-400', dot: 'bg-orange-400' },
  { label: 'Transporte', amount: '-R$ 95', color: 'text-blue-400', dot: 'bg-blue-400' },
  { label: 'Lazer', amount: '-R$ 120', color: 'text-purple-400', dot: 'bg-purple-400' },
];

const goals = [
  { name: 'Viagem em julho', progress: 78, color: 'from-cyan-400 to-emerald-400' },
  { name: 'Fundo emergência', progress: 45, color: 'from-blue-400 to-cyan-400' },
  { name: 'Notebook novo', progress: 62, color: 'from-emerald-400 to-teal-400' },
];

const spendingBars = [
  { label: 'Alimentação', pct: 62, color: 'bg-orange-400' },
  { label: 'Moradia', pct: 35, color: 'bg-blue-400' },
  { label: 'Transporte', pct: 22, color: 'bg-purple-400' },
];

export function DashboardPreview({ compact = false, animate = true, className = '' }: DashboardPreviewProps) {
  const [visible, setVisible] = useState(!animate);
  const [progressValues, setProgressValues] = useState(goals.map(() => 0));
  const [barValues, setBarValues] = useState(spendingBars.map(() => 0));
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!animate) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (!prefersReduced) {
            setTimeout(() => {
              setProgressValues(goals.map((g) => g.progress));
              setBarValues(spendingBars.map((b) => b.pct));
            }, 300);
          } else {
            setProgressValues(goals.map((g) => g.progress));
            setBarValues(spendingBars.map((b) => b.pct));
          }
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [animate]);

  return (
    <div
      ref={ref}
      className={`rounded-xl border border-white/10 bg-slate-900/80 backdrop-blur-xl overflow-hidden transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} ${className}`}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-white/8 bg-slate-950/60 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <span className="ml-2 text-xs font-medium text-slate-400">Xô Planilhas — Painel de Maio</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-slate-500">ao vivo</span>
        </div>
      </div>

      <div className={`${compact ? 'p-3 gap-3' : 'p-5 gap-4'} flex flex-col`}>
        {/* Balance row */}
        <div className={`grid ${compact ? 'grid-cols-3 gap-2' : 'grid-cols-3 gap-3'}`}>
          <div className="col-span-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3">
            <p className={`${compact ? 'text-[10px]' : 'text-xs'} text-emerald-400/80 mb-1`}>Saldo</p>
            <p className={`${compact ? 'text-sm' : 'text-lg'} font-bold text-emerald-400`}>R$ 1.240</p>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className={`${compact ? 'h-2.5 w-2.5' : 'h-3 w-3'} text-emerald-400`} />
              <span className={`${compact ? 'text-[9px]' : 'text-[10px]'} text-emerald-400`}>+18%</span>
            </div>
          </div>
          <div className="col-span-1 rounded-lg bg-slate-800/60 border border-white/8 p-3">
            <p className={`${compact ? 'text-[10px]' : 'text-xs'} text-slate-400 mb-1`}>Entradas</p>
            <p className={`${compact ? 'text-sm' : 'text-base'} font-bold text-slate-100`}>R$ 4.200</p>
            <div className="flex items-center gap-1 mt-1">
              <Wallet className={`${compact ? 'h-2.5 w-2.5' : 'h-3 w-3'} text-slate-400`} />
              <span className={`${compact ? 'text-[9px]' : 'text-[10px]'} text-slate-500`}>mensal</span>
            </div>
          </div>
          <div className="col-span-1 rounded-lg bg-slate-800/60 border border-white/8 p-3">
            <p className={`${compact ? 'text-[10px]' : 'text-xs'} text-slate-400 mb-1`}>Saídas</p>
            <p className={`${compact ? 'text-sm' : 'text-base'} font-bold text-slate-100`}>R$ 2.960</p>
            <div className="flex items-center gap-1 mt-1">
              <BarChart3 className={`${compact ? 'h-2.5 w-2.5' : 'h-3 w-3'} text-slate-400`} />
              <span className={`${compact ? 'text-[9px]' : 'text-[10px]'} text-slate-500`}>-5% vs mês</span>
            </div>
          </div>
        </div>

        {!compact && (
          /* Spending bars */
          <div className="rounded-lg bg-slate-800/40 border border-white/8 p-4">
            <p className="text-xs font-semibold text-slate-300 mb-3">Gastos por categoria</p>
            <div className="space-y-2.5">
              {spendingBars.map((bar, i) => (
                <div key={bar.label}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-slate-400">{bar.label}</span>
                    <span className="text-xs text-slate-300 font-medium">{bar.pct}%</span>
                  </div>
                  <div className="w-full bg-slate-700/50 rounded-full h-1.5">
                    <div
                      className={`${bar.color} h-1.5 rounded-full transition-all duration-[1200ms] ease-out`}
                      style={{ width: `${barValues[i]}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom: Transactions + Goals */}
        <div className={`grid ${compact ? 'grid-cols-1' : 'grid-cols-2'} gap-3`}>
          <div className="rounded-lg bg-slate-800/40 border border-white/8 p-3">
            <p className={`${compact ? 'text-[10px]' : 'text-xs'} font-semibold text-slate-300 mb-2`}>Transações</p>
            <div className="space-y-2">
              {(compact ? transactions.slice(0, 3) : transactions).map((tx) => (
                <div key={tx.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${tx.dot}`} />
                    <span className={`${compact ? 'text-[10px]' : 'text-xs'} text-slate-400`}>{tx.label}</span>
                  </div>
                  <span className={`${compact ? 'text-[10px]' : 'text-xs'} font-semibold ${tx.color}`}>{tx.amount}</span>
                </div>
              ))}
            </div>
          </div>

          {!compact && (
            <div className="rounded-lg bg-slate-800/40 border border-white/8 p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-slate-300">Metas</p>
                <Calendar className="h-3 w-3 text-slate-500" />
              </div>
              <div className="space-y-3">
                {goals.map((goal, i) => (
                  <div key={goal.name}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-slate-400 truncate max-w-[120px]">{goal.name}</span>
                      <span className="text-xs font-bold text-emerald-400">{goal.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-700/50 rounded-full h-1.5">
                      <div
                        className={`bg-gradient-to-r ${goal.color} h-1.5 rounded-full transition-all duration-[1200ms] ease-out`}
                        style={{ width: `${progressValues[i]}%`, transitionDelay: `${i * 150}ms` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Alert chip */}
        <div className="flex items-center gap-2 rounded-lg border border-yellow-500/20 bg-yellow-500/8 px-3 py-2">
          <div className="h-1.5 w-1.5 rounded-full bg-yellow-400 animate-pulse shrink-0" />
          <p className={`${compact ? 'text-[10px]' : 'text-xs'} text-yellow-300`}>
            Fatura do cartão vence amanhã — R$ 480
          </p>
        </div>
      </div>
    </div>
  );
}
