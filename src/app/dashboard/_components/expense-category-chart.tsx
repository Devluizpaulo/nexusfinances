
'use client';

import { Pie, PieChart, Cell } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { Transaction } from '@/lib/types';
import * as React from 'react';
import { useMemo } from 'react';
import { PieChart as PieChartIcon } from 'lucide-react';

type ChartDataItem = {
  name: string;
  value: number;
  percentage: string;
};

export function ExpenseCategoryChart({ transactions }: { transactions: Transaction[] }) {
  const { chartData, chartConfig } = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return { chartData: [] as ChartDataItem[], chartConfig: {} as ChartConfig };
    }

    const expenseByCat = transactions
      .filter((t) => t.type === 'expense' || !t.type)
      .reduce((acc, t) => {
        if (!acc[t.category]) {
          acc[t.category] = 0;
        }
        acc[t.category] += t.amount;
        return acc;
      }, {} as Record<string, number>);

    const total = Object.values(expenseByCat).reduce((sum, amount) => sum + amount, 0);

    const data: ChartDataItem[] = Object.entries(expenseByCat).map(([category, amount]) => ({
      name: category,
      value: amount,
      percentage: total > 0 ? ((amount / total) * 100).toFixed(0) : '0',
    }));

    const config: ChartConfig = data.reduce((acc, item, index) => {
      const palette = [
        'hsl(var(--chart-1))',
        'hsl(var(--chart-2))',
        'hsl(var(--chart-3))',
        'hsl(var(--chart-4))',
        'hsl(var(--chart-5))',
      ];
      acc[item.name] = {
        label: `${item.name} (${item.percentage}%)`,
        color: palette[index % palette.length],
      };
      return acc;
    }, {} as ChartConfig);

    return { chartData: data, chartConfig: config };
  }, [transactions]);


  return (
    <div className="card-premium h-full flex flex-col justify-between hover:shadow-lg transition-all duration-300">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/5 bg-slate-900/50 text-cyan-400">
            <PieChartIcon className="h-4.5 w-4.5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-200">Saídas e Entradas</h3>
            <p className="text-xs text-slate-400">Composição de gastos no período.</p>
          </div>
        </div>
      </div>

      <div className="flex-1 pt-2 flex items-center justify-center">
        {chartData.length > 0 ? (
          <ChartContainer
            config={chartConfig}
            className="mx-auto h-[280px] max-h-[320px] w-full"
          >
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent
                  hideLabel
                  className="border border-white/5 bg-slate-950/90 backdrop-blur-md text-xs rounded-lg shadow-xl"
                  formatter={(value, name, props) => {
                    const formattedValue = new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(value as number);
                    return (
                      <div className="flex flex-col gap-0.5 text-slate-200">
                        <span className="font-bold">{props.payload.name}</span>
                        <span className="text-slate-400">{formattedValue} ({props.payload.percentage}%)</span>
                      </div>
                    );
                  }}
                />}
              />
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                strokeWidth={2}
              >
                {chartData.map((entry) => (
                  <Cell key={`cell-${entry.name}`} fill={chartConfig[entry.name]?.color} />
                ))}
              </Pie>
              <ChartLegend
                content={<ChartLegendContent nameKey="name" />}
                className="-mt-4"
              />
            </PieChart>
          </ChartContainer>
        ) : (
          <div className="flex h-[310px] w-full items-center justify-center text-muted-foreground">
            Nenhuma despesa para exibir.
          </div>
        )}
      </div>
    </div>
  );
}
