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
    <Card className="h-full rounded-lg border-slate-800 bg-card/75 shadow-sm">
      <CardHeader className="p-5 pb-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-sm font-medium text-slate-400">Resumo do Período</CardTitle>
            <CardDescription className={cn('mt-2 text-3xl font-bold tracking-normal', isPositive ? 'text-emerald-300' : 'text-rose-300')}>
              {formatCurrency(balance)}
            </CardDescription>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-cyan-300">
            <Scale className="h-5 w-5" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 p-5 pt-1">
        <div className="flex items-center justify-between rounded-lg bg-slate-950/50 px-3 py-2 text-sm">
          <span className="inline-flex items-center gap-2 text-muted-foreground">
            <ArrowUpCircle className="h-4 w-4 text-emerald-300" />
            Entradas
          </span>
          <span className="font-semibold text-emerald-300">{formatCurrency(income)}</span>
        </div>
        <div className="flex items-center justify-between rounded-lg bg-slate-950/50 px-3 py-2 text-sm">
          <span className="inline-flex items-center gap-2 text-muted-foreground">
            <ArrowDownCircle className="h-4 w-4 text-rose-300" />
            Saídas
          </span>
          <span className="font-semibold text-rose-300">{formatCurrency(expenses)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
