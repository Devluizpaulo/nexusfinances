
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
    <Card className="h-full rounded-2xl border border-slate-900/60 bg-slate-950/70 p-4 sm:p-5 shadow-[0_18px_45px_-30px_rgba(15,23,42,1)]">
      <CardHeader className="p-0">
        <CardTitle className="text-base text-slate-200">Visão Geral Mensal</CardTitle>
        <CardDescription className="mt-1 text-xs">Comparativo de rendas e despesas dos últimos meses.</CardDescription>
      </CardHeader>
      <CardContent className="p-0 pt-4">
        {chartData.length === 0 ? (
          <div className="flex h-[360px] w-full flex-col items-center justify-center text-center text-sm text-muted-foreground">
            <p>Ainda não há movimentações suficientes para mostrar o gráfico.</p>
            <p className="mt-1">Comece adicionando rendas ou despesas.</p>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[360px] max-h-[420px] w-full">
            <BarChart data={chartData} accessibilityLayer>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="month"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                tickFormatter={(value) => `R$${Number(value) / 1000}k`}
                tick={{ fontSize: 12 }}
              />
              <ChartTooltip content={<ChartTooltipContent formatter={(value) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value as number)} />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="income" fill="var(--color-income)" radius={4} />
              <Bar dataKey="expenses" fill="var(--color-expenses)" radius={4} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
