
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
    <Card className="h-full rounded-xl p-4 sm:p-5">
      <CardHeader className="p-0 flex flex-row items-center justify-between gap-3">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400">
              <PieChartIcon className="h-4 w-4" />
            </span>
            Saídas e Entradas
          </CardTitle>
          <CardDescription className="mt-1 text-xs">
            Composição de gastos no período.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-0 mt-2 flex items-center justify-center">
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
                    formatter={(value, name, props) => {
                       const formattedValue = new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(value as number);
                        return (
                          <div className="flex flex-col">
                            <span className="font-bold">{props.payload.name}</span>
                            <span>{formattedValue} ({props.payload.percentage}%)</span>
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
      </CardContent>
    </Card>
  );
}
