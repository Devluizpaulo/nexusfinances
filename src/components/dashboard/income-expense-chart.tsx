
'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import type { Transaction } from '@/lib/types';
import { format, startOfMonth, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart3 } from 'lucide-react';

const chartConfig = {
  income: {
    label: 'Renda',
    color: 'hsl(var(--chart-2))',
  },
  expenses: {
    label: 'Despesas',
    color: 'hsl(var(--chart-5))',
  },
};

export function IncomeExpenseChart({ transactions }: { transactions: Transaction[] }) {
  const monthlyData = transactions.reduce((acc, transaction) => {
    const monthDate = startOfMonth(parseISO(transaction.date));
    const month = format(monthDate, 'MMM/yy', { locale: ptBR });
    if (!acc[month]) {
      acc[month] = { month, date: monthDate, income: 0, expenses: 0 };
    }
    if (transaction.type === 'income') {
      acc[month].income += transaction.amount;
    } else {
      acc[month].expenses += transaction.amount;
    }
    return acc;
  }, {} as Record<string, { month: string; date: Date; income: number; expenses: number }>);

  // Ordena pelos objetos Date para garantir a ordem cronológica correta no gráfico
  const chartData = Object.values(monthlyData).sort((a, b) => a.date.getTime() - b.date.getTime());


  return (
    <div className="card-premium h-full flex flex-col justify-between hover:shadow-lg transition-all duration-300">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/5 bg-slate-900/50 text-cyan-400">
            <BarChart3 className="h-4.5 w-4.5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-200">Visão Geral Mensal</h3>
            <p className="text-xs text-slate-400">Comparativo de rendas e despesas dos últimos meses.</p>
          </div>
        </div>
      </div>
      
      <div className="flex-1 pt-2">
        {chartData.length === 0 ? (
          <div className="flex h-[320px] w-full flex-col items-center justify-center text-center text-xs text-slate-500">
            <p>Ainda não há movimentações suficientes para mostrar o gráfico.</p>
            <p className="mt-1">Comece adicionando rendas ou despesas.</p>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[320px] max-h-[360px] w-full">
            <BarChart data={chartData} accessibilityLayer>
              <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.03)" />
              <XAxis
                dataKey="month"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }}
              />
              <YAxis
                tickFormatter={(value) => `R$${Number(value) / 1000}k`}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }}
              />
              <ChartTooltip 
                content={
                  <ChartTooltipContent 
                    className="border border-white/5 bg-slate-950/90 backdrop-blur-md text-xs rounded-lg shadow-xl"
                    formatter={(value) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value as number)} 
                  />
                } 
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="income" fill="var(--color-income)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" fill="var(--color-expenses)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        )}
      </div>
    </div>
  );
}
