
"use client";

import { useMemo, useState } from 'react';
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
import {
  ArrowDownRight,
  ArrowUpRight,
  Scale,
  PieChart as PieChartIcon,
  ListOrdered,
  BarChart3,
  LayoutGrid,
  Calendar,
  Tag,
  Filter as Funnel,
  FileDown,
} from 'lucide-react';

type FilterType = 'all' | 'income' | 'expense';
type ReportType = 'overview' | 'income' | 'expense' | 'categories';

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
      const type = row.getValue<'income' | 'expense'>('type');

      const isExpense = type === 'expense';
      const signed = isExpense ? -Math.abs(amount) : Math.abs(amount);

      const formatted = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(signed);

      return (
        <div
          className={
            'text-right font-medium ' +
            (isExpense ? 'text-red-600' : 'text-emerald-600')
          }
        >
          {formatted}
        </div>
      );
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
  const [reportType, setReportType] = useState<ReportType>('overview');
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
    return [...incomes, ...expenses].sort((a, b) => a.date.localeCompare(b.date));
  }, [incomeData, expenseData]);

  const filteredTransactions = useMemo(() => {
    const effectiveType: FilterType =
      reportType === 'income' ? 'income' : reportType === 'expense' ? 'expense' : filterType;

    return allTransactions.filter((t) => {
      if (effectiveType !== 'all' && t.type !== effectiveType) return false;

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
  }, [allTransactions, filterType, startDate, endDate, categoryFilter, reportType]);

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

    const currentPeriodDates = filteredTransactions.map((t) => parseISO(t.date));
    const hasPeriod = currentPeriodDates.length > 0;

    const minDate = hasPeriod ? currentPeriodDates.reduce((a, b) => (a < b ? a : b)) : null;
    const maxDate = hasPeriod ? currentPeriodDates.reduce((a, b) => (a > b ? a : b)) : null;

    let prevIncomeTotal = 0;
    let prevExpenseTotal = 0;
    let prevBalance = 0;

    if (hasPeriod && minDate && maxDate) {
      const monthsDiff = Math.max(
        1,
        (maxDate.getFullYear() - minDate.getFullYear()) * 12 + (maxDate.getMonth() - minDate.getMonth()) + 1,
      );

      const prevEnd = new Date(minDate);
      prevEnd.setDate(prevEnd.getDate() - 1);

      const prevStart = new Date(prevEnd);
      prevStart.setMonth(prevStart.getMonth() - monthsDiff + 1);

      const allIncome = (incomeData || []) as Transaction[];
      const allExpenses = (expenseData || []) as Transaction[];

      const inPrevRange = (t: Transaction) => {
        const d = parseISO(t.date);
        return d >= prevStart && d <= prevEnd;
      };

      prevIncomeTotal = allIncome.filter(inPrevRange).reduce((sum, t) => sum + t.amount, 0);
      prevExpenseTotal = allExpenses.filter(inPrevRange).reduce((sum, t) => sum + t.amount, 0);
      prevBalance = prevIncomeTotal - prevExpenseTotal;
    }

    const formatCurrency = (value: number) =>
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    const pctChange = (current: number, prev: number) => {
      if (prev === 0) return current === 0 ? 0 : 100;
      return ((current - prev) / prev) * 100;
    };

    const incomeChange = pctChange(incomeTotal, prevIncomeTotal);
    const expenseChange = pctChange(expenseTotal, prevExpenseTotal);
    const balanceChange = pctChange(balance, prevBalance);

    return {
      incomeTotal,
      expenseTotal,
      balance,
      incomeTotalFormatted: formatCurrency(incomeTotal),
      expenseTotalFormatted: formatCurrency(expenseTotal),
      balanceFormatted: formatCurrency(balance),
      incomeChange,
      expenseChange,
      balanceChange,
      hasComparison: hasPeriod,
    };
  }, [filteredTransactions, incomeData, expenseData]);

  const handleExportPdf = async () => {
    if (!filteredTransactions.length) return;

    const rows = filteredTransactions.map((t) => ({
      date: t.date,
      description: t.description,
      category: t.category,
      type: t.type === 'income' ? 'Renda' : 'Despesa',
      amount: t.amount,
    }));

    try {
      const res = await fetch('/api/reports/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rows }),
      });

      if (!res.ok) {
        console.error('Falha ao gerar PDF');
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'relatorio-nexusfinances.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao baixar PDF', error);
    }
  };
  
  const allCategories = useMemo(() => {
    const incomeCats = user?.customIncomeCategories || [];
    const expenseCats = user?.customExpenseCategories || [];
    const transactionCats = Array.from(new Set(allTransactions.map((t) => t.category)));
    return Array.from(new Set([...incomeCats, ...expenseCats, ...transactionCats]));
  }, [user, allTransactions]);

  const kpiDetails = useMemo(() => {
    if (!filteredTransactions.length) {
      return {
        count: 0,
        avgTicket: 0,
        avgTicketFormatted: 'R$ 0,00',
        topIncomeCategory: null as string | null,
        topExpenseCategory: null as string | null,
      };
    }

    const count = filteredTransactions.length;
    const totalAbs = filteredTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const avgTicket = totalAbs / count;

    const formatCurrency = (value: number) =>
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    const incomeByCategory: Record<string, number> = {};
    const expenseByCategory: Record<string, number> = {};

    for (const t of filteredTransactions) {
      if (t.type === 'income') {
        incomeByCategory[t.category] = (incomeByCategory[t.category] || 0) + t.amount;
      } else {
        expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
      }
    }

    const topIncomeCategory = Object.entries(incomeByCategory).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    const topExpenseCategory = Object.entries(expenseByCategory).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    return {
      count,
      avgTicket,
      avgTicketFormatted: formatCurrency(avgTicket || 0),
      topIncomeCategory,
      topExpenseCategory,
    };
  }, [filteredTransactions]);

  return (
    <>
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-8 print:space-y-4">
          <Card className="print:hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Funnel className="h-4 w-4 text-primary" />
                Filtros do período
              </CardTitle>
              <CardDescription>
                Escolha o recorte que faz sentido para a sua análise.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div className="flex flex-1 flex-wrap items-end gap-4 rounded-md bg-muted/40 p-3">
                  <div className="flex flex-col gap-1 min-w-[200px]">
                    <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                      <BarChart3 className="h-3 w-3" />
                      Modo de visualização
                    </span>
                    <select
                      className="h-9 rounded-md border border-border bg-background px-2 text-sm hover:border-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                      value={reportType}
                      onChange={(e) => setReportType(e.target.value as ReportType)}
                    >
                      <option value="overview">Visão geral</option>
                      <option value="income">Foco em renda</option>
                      <option value="expense">Foco em despesas</option>
                      <option value="categories">Por categorias</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1 min-w-[180px]">
                    <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                      <LayoutGrid className="h-3 w-3" />
                      Tipo
                    </span>
                    <select
                      className="h-9 rounded-md border border-border bg-background px-2 text-sm hover:border-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value as FilterType)}
                    >
                      <option value="all">Renda e despesas</option>
                      <option value="income">Apenas renda</option>
                      <option value="expense">Apenas despesas</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1 min-w-[160px]">
                    <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      Período inicial
                    </span>
                    <input
                      type="date"
                      className="h-9 rounded-md border border-border bg-background px-2 text-sm hover:border-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-1 min-w-[160px]">
                    <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      Período final
                    </span>
                    <input
                      type="date"
                      className="h-9 rounded-md border border-border bg-background px-2 text-sm hover:border-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-1 min-w-[200px]">
                    <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                      <Tag className="h-3 w-3" />
                      Categoria
                    </span>
                    <select
                      className="h-9 rounded-md border border-border bg-background px-2 text-sm hover:border-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                      <option value="all">Todas as categorias</option>
                      {allCategories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground hover:text-foreground"
                    onClick={handleClearFilters}
                  >
                    Limpar filtros
                  </Button>
                  <Button
                      variant="default"
                      size="sm"
                      className="gap-1 text-xs"
                      onClick={handleExportPdf}
                      disabled={!filteredTransactions.length}
                  >
                      <FileDown className="h-3 w-3" />
                      Exportar PDF
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="grid gap-4 md:grid-cols-3 print:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Renda total
                </CardTitle>
                <ArrowUpRight className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-emerald-600">{summary.incomeTotalFormatted}</p>
                {summary.hasComparison && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {summary.incomeChange >= 0 ? '↑' : '↓'}{' '}
                    {Math.abs(summary.incomeChange).toFixed(1)}% em relação ao período anterior
                  </p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Despesas totais
                </CardTitle>
                <ArrowDownRight className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-600">{summary.expenseTotalFormatted}</p>
                {summary.hasComparison && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {summary.expenseChange >= 0 ? '↑' : '↓'}{' '}
                    {Math.abs(summary.expenseChange).toFixed(1)}% em relação ao período anterior
                  </p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Saldo do período
                </CardTitle>
                <Scale className="h-4 w-4 text-sky-500" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {summary.balanceFormatted}
                </p>
                {summary.hasComparison && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {summary.balanceChange >= 0 ? '↑' : '↓'}{' '}
                    {Math.abs(summary.balanceChange).toFixed(1)}% em relação ao período anterior
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-3 print:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Lançamentos no período
                </CardTitle>
                <ListOrdered className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{kpiDetails.count}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Considerando todas as entradas e saídas filtradas.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Ticket médio por lançamento
                </CardTitle>
                <PieChartIcon className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{kpiDetails.avgTicketFormatted}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Média considerando valores absolutos de renda e despesas.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-col space-y-1 pb-2">
                <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Destaques de categorias
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-xs text-muted-foreground">
                <p>
                  Principal fonte de renda:{' '}
                  <span className="font-medium text-emerald-600">
                    {kpiDetails.topIncomeCategory ?? '—'}
                  </span>
                </p>
                <p>
                  Maior centro de despesas:{' '}
                  <span className="font-medium text-red-600">
                    {kpiDetails.topExpenseCategory ?? '—'}
                  </span>
                </p>
              </CardContent>
            </Card>
          </div>

          <div className={`grid grid-cols-1 gap-6 ${reportType === 'categories' ? 'lg:grid-cols-1' : 'lg:grid-cols-2'}`}>
            {(reportType === 'overview' || reportType === 'income' || reportType === 'expense') && (
              <IncomeExpenseChart transactions={chartTransactions} />
            )}
            {(reportType === 'overview' || reportType === 'categories') && (
              <BalanceOverTimeChart transactions={chartTransactions} />
            )}
          </div>

          {filteredTransactions.length > 0 && (
            <div className={`grid grid-cols-1 gap-6 ${reportType === 'categories' ? 'lg:grid-cols-2' : 'lg:grid-cols-2'}`}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-semibold">Top categorias de renda</CardTitle>
                  <CardDescription>
                    As categorias que mais contribuíram para a sua entrada de dinheiro neste período.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const incomeByCategory: Record<string, number> = {};
                    for (const t of filteredTransactions) {
                      if (t.type === 'income') {
                        incomeByCategory[t.category] = (incomeByCategory[t.category] || 0) + t.amount;
                      }
                    }
                    const entries = Object.entries(incomeByCategory).sort((a, b) => b[1] - a[1]);
                    const total = entries.reduce((sum, [, value]) => sum + value, 0);

                    if (!entries.length) {
                      return (
                        <p className="text-sm text-muted-foreground">
                          Não há rendas suficientes neste recorte para montar o ranking.
                        </p>
                      );
                    }

                    return (
                      <div className="space-y-3">
                        {entries.map(([category, value]) => {
                          const pct = total ? (value / total) * 100 : 0;
                          return (
                            <div key={category} className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-medium">{category}</span>
                                <span className="text-muted-foreground">
                                  {new Intl.NumberFormat('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL',
                                  }).format(value)}{' '}
                                  · {pct.toFixed(1)}%
                                </span>
                              </div>
                              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                                <div
                                  className="h-full rounded-full bg-emerald-500"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-semibold">Top categorias de despesas</CardTitle>
                  <CardDescription>
                    Para onde está indo a maior parte do seu dinheiro neste período.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const expenseByCategory: Record<string, number> = {};
                    for (const t of filteredTransactions) {
                      if (t.type === 'expense') {
                        expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
                      }
                    }
                    const entries = Object.entries(expenseByCategory).sort((a, b) => b[1] - a[1]);
                    const total = entries.reduce((sum, [, value]) => sum + value, 0);

                    if (!entries.length) {
                      return (
                        <p className="text-sm text-muted-foreground">
                          Não há despesas suficientes neste recorte para montar o ranking.
                        </p>
                      );
                    }

                    return (
                      <div className="space-y-3">
                        {entries.map(([category, value]) => {
                          const pct = total ? (value / total) * 100 : 0;
                          return (
                            <div key={category} className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-medium">{category}</span>
                                <span className="text-muted-foreground">
                                  {new Intl.NumberFormat('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL',
                                  }).format(value)}{' '}
                                  · {pct.toFixed(1)}%
                                </span>
                              </div>
                              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                                <div
                                  className="h-full rounded-full bg-red-500"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </div>
          )}

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
