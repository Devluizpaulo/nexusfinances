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
    const month = format(startOfMonth(parseISO(transaction.date)), 'MMM/yy', { locale: ptBR });
    if (!acc[month]) {
      acc[month] = { month, income: 0, expenses: 0 };
    }
    if (transaction.type === 'income') {
      acc[month].income += transaction.amount;
    } else {
      acc[month].expenses += transaction.amount;
    }
    return acc;
  }, {} as Record<string, { month: string; income: number; expenses: number }>);

  // Sort data by date to ensure correct order in the chart
  const chartData = Object.values(monthlyData).sort((a, b) => {
      const [aMonth, aYear] = a.month.split('/');
      const [bMonth, bYear] = b.month.split('/');
      const aDate = new Date(Number(aYear) + 2000, ptBR.localize?.month(ptBR.match.months?.findIndex(m => m.test(aMonth)) || 0));
      const bDate = new Date(Number(bYear) + 2000, ptBR.localize?.month(ptBR.match.months?.findIndex(m => m.test(bMonth)) || 0));
      return aDate.getTime() - bDate.getTime();
  });


  return (
    <Card>
      <CardHeader>
        <CardTitle>Renda vs. Despesas (Mensal)</CardTitle>
        <CardDescription>Comparativo dos últimos meses.</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex min-h-[350px] w-full flex-col items-center justify-center text-center text-sm text-muted-foreground">
            <p>Ainda não há movimentações suficientes para mostrar o gráfico.</p>
            <p className="mt-1">Comece adicionando rendas ou despesas.</p>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="min-h-[350px] w-full">
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
