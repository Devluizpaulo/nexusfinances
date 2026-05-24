'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { ArrowDownCircle, ArrowUpCircle, Scale } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BalanceCardProps {
  balance: number;
  income: number;
  expenses: number;
}

export function BalanceCard({ balance, income, expenses }: BalanceCardProps) {
  const isPositive = balance >= 0;

  return (
    <div className="card-premium h-full flex flex-col justify-between hover:shadow-lg transition-all duration-300">
      <div>
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Balanço do Período</h3>
            <p className={cn(
              'mt-2 text-3xl font-bold tracking-tight',
              isPositive ? 'hero-gradient-text' : 'text-rose-400'
            )}>
              {formatCurrency(balance)}
            </p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/5 bg-slate-900/50 text-cyan-400">
            <Scale className="h-4.5 w-4.5" />
          </div>
        </div>
      </div>
      
      <div className="space-y-2 mt-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-2 text-xs hover:bg-slate-800/10 px-1 rounded transition-colors duration-150">
          <span className="inline-flex items-center gap-2 text-slate-400">
            <ArrowUpCircle className="h-4 w-4 text-emerald-400" />
            Entradas
          </span>
          <span className="font-bold text-emerald-400">{formatCurrency(income)}</span>
        </div>
        <div className="flex items-center justify-between pt-1 text-xs hover:bg-slate-800/10 px-1 rounded transition-colors duration-150">
          <span className="inline-flex items-center gap-2 text-slate-400">
            <ArrowDownCircle className="h-4 w-4 text-rose-400" />
            Saídas
          </span>
          <span className="font-bold text-rose-400">{formatCurrency(expenses)}</span>
        </div>
      </div>
    </div>
  );
}
