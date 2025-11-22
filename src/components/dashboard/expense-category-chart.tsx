'use client';

import { Pie, PieChart } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { Transaction } from '@/lib/types';
import * as React from 'react';
import { useMemo } from 'react';

const chartConfig = {
  amount: {
    label: 'Valor',
  },
};

export function ExpenseCategoryChart({ transactions }: { transactions: Transaction[] }) {
  const chartData = useMemo(() => {
    const expenseData = transactions
      .filter((t) => t.type === 'expense')
      .reduce((acc, t) => {
        const key = t.category.toLowerCase();
        if (!acc[key]) {
          acc[key] = { name: t.category, value: 0 };
        }
        acc[key].value += t.amount;
        return acc;
      }, {} as Record<string, { name: string; value: number }>);

    const palette = [
      '#f97316', // laranja - Mercado
      '#0ea5e9', // azul - Transporte / outros
      '#22c55e', // verde - Lazer
      '#a855f7', // roxo - Escola / educação
      '#e11d48', // vermelho - Moradia / contas
      '#eab308', // amarelo - Vestuário / extras
      '#6366f1', // azul arroxeado - Investimentos
      '#14b8a6', // teal - Outras despesas
    ];

    return Object.values(expenseData).map((item, index) => ({
      ...item,
      fill: palette[index % palette.length],
    }));
  }, [transactions]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Despesas por Categoria</CardTitle>
        <CardDescription>Uma análise detalhada de seus gastos.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 pb-0 md:flex-row md:items-center">
        {chartData.length > 0 ? (
          <>
            <ChartContainer
              config={chartConfig}
              className="mx-auto aspect-square max-h-[260px] md:max-h-[300px] md:w-2/3"
            >
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel formatter={(value, name, props) => {
                    const formattedValue = new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(value as number);
                    return (
                      <div className="flex flex-col">
                        <span>{props.payload.name}</span>
                        <span className="font-bold">{formattedValue}</span>
                      </div>
                    );
                  }}/>}
                />
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  // pizza cheia, sem furo no meio
                  innerRadius={0}
                  strokeWidth={1}
                />
              </PieChart>
            </ChartContainer>

            <div className="flex flex-wrap gap-2 text-xs md:w-1/3 md:text-sm">
              {chartData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: item.fill as string }}
                  />
                  <span>{item.name}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex h-[300px] w-full items-center justify-center text-muted-foreground">
            Nenhuma despesa para exibir.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
