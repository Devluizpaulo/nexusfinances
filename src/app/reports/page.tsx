"use client";

import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { Transaction } from '@/lib/types';
import { DataTable } from '@/components/data-table/data-table';
import type { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { format, parseISO, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2 } from 'lucide-react';
import { IncomeExpenseChart } from '@/components/dashboard/income-expense-chart';
import { LineChart, Line, CartesianGrid, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Separator } from '@/components/ui/separator';

type FilterType = 'all' | 'income' | 'expense';

const columns: ColumnDef<Transaction & { source: 'income' | 'expense' }>[] = [
  {
    accessorKey: 'date',
    header: 'Data',
    cell: ({ row }) => {
      const date = parseISO(row.getValue('date'));
      return <span>{format(date, 'PPP', { locale: ptBR })}</span>;
    },
  },
  {
    accessorKey: 'description',
    header: 'Descrição',
  },
  {
    accessorKey: 'category',
    header: 'Categoria',
    cell: ({ row }) => <Badge variant="outline">{row.getValue('category')}</Badge>,
  },
  {
    accessorKey: 'type',
    header: 'Tipo',
    cell: ({ row }) => {
      const type = row.getValue<'income' | 'expense'>('type');
      return (
        <Badge variant={type === 'income' ? 'default' : 'secondary'}>
          {type === 'income' ? 'Renda' : 'Despesa'}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue<'paid' | 'pending'>('status');
      return (
        <Badge variant={status === 'paid' ? 'default' : 'outline'}>
          {status === 'paid' ? 'Pago/Recebido' : 'Pendente'}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'amount',
    header: () => <div className="text-right">Valor</div>,
    cell: ({ row }) => {
      const amount = Number(row.getValue('amount'));
      const formatted = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(amount);
      return <div className="text-right font-medium">{formatted}</div>;
    },
  },
];

const balanceChartConfig = {
  balance: {
    label: 'Saldo acumulado',
    color: 'hsl(var(--chart-3))',
  },
};

function BalanceOverTimeChart({ transactions }: { transactions: Transaction[] }) {
  if (!transactions.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Saldo acumulado no período</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[260px] w-full items-center justify-center text-sm text-muted-foreground">
            Não há movimentações suficientes para exibir o saldo acumulado.
          </div>
        </CardContent>
      </Card>
    );
  }

  const monthly = transactions.reduce(
    (acc, t) => {
      const monthKey = format(startOfMonth(parseISO(t.date)), 'yyyy-MM');
      if (!acc[monthKey]) {
        acc[monthKey] = { monthKey, monthLabel: format(startOfMonth(parseISO(t.date)), 'MMM yyyy', { locale: ptBR }), income: 0, expense: 0 };
      }
      if (t.type === 'income') {
        acc[monthKey].income += t.amount;
      } else {
        acc[monthKey].expense += t.amount;
      }
      return acc;
    },
    {} as Record<string, { monthKey: string; monthLabel: string; income: number; expense: number }>,
  );

  const sorted = Object.values(monthly).sort((a, b) => (a.monthKey > b.monthKey ? 1 : -1));

  let runningBalance = 0;
  const chartData = sorted.map((item) => {
    runningBalance += item.income - item.expense;
    return {
      month: item.monthLabel,
      balance: runningBalance,
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Saldo acumulado no período</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={balanceChartConfig} className="min-h-[260px] w-full">
          <LineChart data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
            <YAxis tickFormatter={(value) => `R$${Number(value) / 1000}k`} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) =>
                    new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(value as number)
                  }
                />
              }
            />
            <Line type="monotone" dataKey="balance" stroke="hsl(var(--chart-3))" strokeWidth={2} dot={false} />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export default function ReportsPage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const [filterType, setFilterType] = useState<FilterType>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const incomeQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, `users/${user.uid}/incomes`), orderBy('date', 'desc'));
  }, [firestore, user]);

  const expensesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, `users/${user.uid}/expenses`), orderBy('date', 'desc'));
  }, [firestore, user]);

  const { data: incomeData, isLoading: isIncomeLoading } = useCollection<Transaction>(incomeQuery);
  const { data: expenseData, isLoading: isExpensesLoading } = useCollection<Transaction>(expensesQuery);

  const isLoading = isUserLoading || isIncomeLoading || isExpensesLoading;

  const allTransactions = useMemo(() => {
    const incomes = (incomeData || []).map((t) => ({ ...t, source: 'income' as const }));
    const expenses = (expenseData || []).map((t) => ({ ...t, source: 'expense' as const }));
    return [...incomes, ...expenses].sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [incomeData, expenseData]);

  const filteredTransactions = useMemo(() => {
    return allTransactions.filter((t) => {
      if (filterType !== 'all' && t.type !== filterType) return false;

      if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;

      const d = parseISO(t.date);

      if (startDate) {
        const start = parseISO(startDate);
        if (d < start) return false;
      }

      if (endDate) {
        const end = parseISO(endDate);
        if (d > end) return false;
      }

      return true;
    });
  }, [allTransactions, filterType, startDate, endDate, categoryFilter]);

  const chartTransactions = useMemo<Transaction[]>(() => {
    return filteredTransactions.map((t) => ({
      id: t.id,
      type: t.type,
      amount: t.amount,
      date: t.date,
      description: t.description,
      category: t.category,
      isRecurring: t.isRecurring,
      userId: t.userId,
      recurringSourceId: t.recurringSourceId,
      status: t.status,
    }));
  }, [filteredTransactions]);

  const handleClearFilters = () => {
    setFilterType('all');
    setStartDate('');
    setEndDate('');
    setCategoryFilter('all');
  };

  const summary = useMemo(() => {
    const incomeTotal = filteredTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expenseTotal = filteredTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    const balance = incomeTotal - expenseTotal;

    const formatCurrency = (value: number) =>
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    return {
      incomeTotal,
      expenseTotal,
      balance,
      incomeTotalFormatted: formatCurrency(incomeTotal),
      expenseTotalFormatted: formatCurrency(expenseTotal),
      balanceFormatted: formatCurrency(balance),
    };
  }, [filteredTransactions]);

  const handleExportPdf = () => {
    window.print();
  };
  
  const allCategories = useMemo(() => {
    const incomeCats = user?.customIncomeCategories || [];
    const expenseCats = user?.customExpenseCategories || [];
    const transactionCats = Array.from(new Set(allTransactions.map((t) => t.category)));
    return Array.from(new Set([...incomeCats, ...expenseCats, ...transactionCats]));
  }, [user, allTransactions]);

  return (
    <>
      <PageHeader
        title="Relatórios"
        description="Filtre e exporte seus lançamentos sem montar tabelas no Excel."
      />
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6 print:space-y-4">
          <Card className="print:hidden">
            <CardHeader>
                <CardTitle>Filtros</CardTitle>
                <CardDescription>Refine os dados que você deseja visualizar e exportar.</CardDescription>
            </CardHeader>
            <CardContent>
               <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Tipo:</span>
                  <select
                    className="h-9 rounded-md border bg-background px-2 text-sm"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as FilterType)}
                  >
                    <option value="all">Todos</option>
                    <option value="income">Apenas renda</option>
                    <option value="expense">Apenas despesas</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Período:</span>
                  <input
                    type="date"
                    className="h-9 rounded-md border bg-background px-2 text-sm"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                  <span className="text-xs text-muted-foreground">até</span>
                  <input
                    type="date"
                    className="h-9 rounded-md border bg-background px-2 text-sm"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Categoria:</span>
                  <select
                    className="h-9 rounded-md border bg-background px-2 text-sm"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                  >
                    <option value="all">Todas</option>
                    {allCategories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
                 <div className="flex-grow"></div>
                 <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleClearFilters}>
                      Limpar filtros
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleExportPdf}
                      disabled={!filteredTransactions.length}
                    >
                      Exportar PDF
                    </Button>
                 </div>
              </div>
            </CardContent>
          </Card>

          <div className="mb-4 grid gap-4 md:grid-cols-3 print:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total de Renda (filtro atual)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-emerald-600">{summary.incomeTotalFormatted}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total de Despesas (filtro atual)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-600">{summary.expenseTotalFormatted}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Saldo (filtro atual)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {summary.balanceFormatted}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <IncomeExpenseChart transactions={chartTransactions} />
            <BalanceOverTimeChart transactions={chartTransactions} />
          </div>

          <Separator className="my-6" />

          <DataTable
            columns={columns}
            data={filteredTransactions}
          />
        </div>
      )}
    </>
  );
}
