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
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import type { Transaction } from '@/lib/types';
import * as React from 'react';
import { useMemo } from 'react';

const chartConfig = {
  amount: {
    label: 'Valor',
  },
  mercado: {
    label: 'Mercado',
    color: 'hsl(var(--chart-1))',
  },
  contas: {
    label: 'Contas',
    color: 'hsl(var(--chart-2))',
  },
  'aluguel/hipoteca': {
    label: 'Aluguel/Hipoteca',
    color: 'hsl(var(--chart-3))',
  },
  transporte: {
    label: 'Transporte',
    color: 'hsl(var(--chart-4))',
  },
  lazer: {
    label: 'Lazer',
    color: 'hsl(var(--chart-5))',
  },
  outros: {
    label: 'Outros',
    color: 'hsl(var(--muted))',
  },
};

export function ExpenseCategoryChart({ transactions }: { transactions: Transaction[] }) {
  const chartData = useMemo(() => {
    const expenseData = transactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => {
      const key = t.category.toLowerCase().replace('/','').replace(' ', '');
      if (!acc[key]) {
        acc[key] = { name: t.category, value: 0, fill: `var(--color-${key})` };
      }
      acc[key].value += t.amount;
      return acc;
    }, {} as Record<string, { name: string; value: number; fill: string }>);

    return Object.values(expenseData);
  }, [transactions]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Despesas por Categoria</CardTitle>
        <CardDescription>Uma análise detalhada de seus gastos.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
      {chartData.length > 0 ? (
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[300px]"
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
              innerRadius="60%"
              strokeWidth={5}
            />
             <ChartLegend
              content={<ChartLegendContent nameKey="name" />}
              className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
            />
          </PieChart>
        </ChartContainer>
      ) : (
        <div className="flex h-[300px] w-full items-center justify-center text-muted-foreground">
          Nenhuma despesa para exibir.
        </div>
      )}
      </CardContent>
    </Card>
  );
}
