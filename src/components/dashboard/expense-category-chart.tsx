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

export function ExpenseCategoryChart({ transactions }: { transactions: Transaction[] }) {
  const { chartData, chartConfig } = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return { chartData: [], chartConfig: {} };
    }

    const expenseData = transactions
      .filter((t) => t.type === 'expense')
      .reduce((acc, t) => {
        const key = t.category;
        if (!acc[key]) {
          acc[key] = { name: t.category, value: 0 };
        }
        acc[key].value += t.amount;
        return acc;
      }, {} as Record<string, { name: string; value: number }>);
    
    const chartData = Object.values(expenseData);

    const config: ChartConfig = chartData.reduce((acc, item, index) => {
      const palette = [
        'hsl(var(--chart-1))',
        'hsl(var(--chart-2))',
        'hsl(var(--chart-3))',
        'hsl(var(--chart-4))',
        'hsl(var(--chart-5))',
      ];
      acc[item.name] = {
        label: item.name,
        color: palette[index % palette.length],
      };
      return acc;
    }, {} as ChartConfig);

    return { chartData, chartConfig };
  }, [transactions]);


  return (
    <Card>
      <CardHeader>
        <CardTitle>Despesas por Categoria</CardTitle>
        <CardDescription>Análise dos gastos no período selecionado.</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-center">
        {chartData.length > 0 ? (
            <ChartContainer
              config={chartConfig}
              className="mx-auto aspect-square max-h-[350px]"
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
                            <span>{formattedValue}</span>
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
          <div className="flex h-[350px] w-full items-center justify-center text-muted-foreground">
            Nenhuma despesa para exibir.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
