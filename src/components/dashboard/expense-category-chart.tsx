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

const chartConfig = {
  amount: {
    label: 'Amount',
  },
  groceries: {
    label: 'Groceries',
    color: 'hsl(var(--chart-1))',
  },
  utilities: {
    label: 'Utilities',
    color: 'hsl(var(--chart-2))',
  },
  rent: {
    label: 'Rent/Mortgage',
    color: 'hsl(var(--chart-3))',
  },
  transportation: {
    label: 'Transportation',
    color: 'hsl(var(--chart-4))',
  },
  entertainment: {
    label: 'Entertainment',
    color: 'hsl(var(--chart-5))',
  },
  other: {
    label: 'Other',
    color: 'hsl(var(--muted))',
  },
};

export function ExpenseCategoryChart({ transactions }: { transactions: Transaction[] }) {
  const expenseData = transactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => {
      const key = t.category.toLowerCase().replace('/','');
      if (!acc[key]) {
        acc[key] = { name: t.category, value: 0, fill: `var(--color-${key})` };
      }
      acc[key].value += t.amount;
      return acc;
    }, {} as Record<string, { name: string; value: number; fill: string }>);

  const chartData = Object.values(expenseData);
  const totalExpenses = chartData.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expenses by Category</CardTitle>
        <CardDescription>A breakdown of your spending.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[300px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
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
      </CardContent>
    </Card>
  );
}
