
'use client';

import { useState, useMemo, useEffect } from 'react';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { Banknote, Landmark, CreditCard, Scale, Calendar as CalendarIcon, ArrowUpCircle, ArrowDownCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { IncomeExpenseChart } from '@/components/dashboard/income-expense-chart';
import { ExpenseCategoryChart } from '@/components/dashboard/expense-category-chart';
import { FinancialHealthScore } from '@/components/dashboard/financial-health-score';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import type { Transaction, Debt, Goal, Installment } from '@/lib/types';
import { useManageRecurrences } from '@/hooks/useManageRecurrences';
import { Calendar } from '@/components/ui/calendar';
import { startOfMonth, endOfMonth, parseISO, format, startOfDay, isBefore, endOfWeek, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { AddTransactionSheet } from '@/components/transactions/add-transaction-sheet';
import { AddDebtSheet } from '@/components/debts/add-debt-sheet';
import { AddGoalSheet } from '@/components/goals/add-goal-sheet';
import { incomeCategories, expenseCategories } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
import { useDashboardDate } from '@/context/dashboard-date-context';

type InstallmentInfo = {
  debtName: string;
  amount: number;
};

export default function DashboardPage() {
  const { selectedDate, setSelectedDate } = useDashboardDate();
  const router = useRouter();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  useManageRecurrences();

  const [isIncomeSheetOpen, setIsIncomeSheetOpen] = useState(false);
  const [isExpenseSheetOpen, setIsExpenseSheetOpen] = useState(false);
  const [isDebtSheetOpen, setIsDebtSheetOpen] = useState(false);
  const [isGoalSheetOpen, setIsGoalSheetOpen] = useState(false);

  const transactionsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, `users/${user.uid}/incomes`));
  }, [firestore, user]);

  const expensesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, `users/${user.uid}/expenses`));
  }, [firestore, user]);

  const debtsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, `users/${user.uid}/debts`));
  }, [firestore, user]);

  const goalsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, `users/${user.uid}/goals`));
  }, [firestore, user]);

  const { data: allIncomeData, isLoading: isIncomeLoading } = useCollection<Transaction>(transactionsQuery);
  const { data: allExpenseData, isLoading: isExpensesLoading } = useCollection<Transaction>(expensesQuery);
  const { data: debtData, isLoading: isDebtsLoading } = useCollection<Debt>(debtsQuery);
  const { data: goalData, isLoading: isGoalsLoading } = useCollection<Goal>(goalsQuery);

  const [installmentOverdueDates, setInstallmentOverdueDates] = useState<Date[]>([]);
  const [installmentUpcomingDates, setInstallmentUpcomingDates] = useState<Date[]>([]);
  const [installmentsByDate, setInstallmentsByDate] = useState<Record<string, InstallmentInfo[]>>({});
  const [hoveredInstallments, setHoveredInstallments] = useState<{ date: Date; items: InstallmentInfo[] } | null>(
    null,
  );

  const incomeExpenseByDate = useMemo(() => {
    const byDate: Record<string, { income: number; expense: number }> = {};

    (allIncomeData || []).forEach((t) => {
      const key = startOfDay(parseISO(t.date)).toISOString();
      if (!byDate[key]) byDate[key] = { income: 0, expense: 0 };
      byDate[key].income += t.amount;
    });

    (allExpenseData || []).forEach((t) => {
      const key = startOfDay(parseISO(t.date)).toISOString();
      if (!byDate[key]) byDate[key] = { income: 0, expense: 0 };
      byDate[key].expense += t.amount;
    });

    return byDate;
  }, [allIncomeData, allExpenseData]);

  const incomeDates = useMemo(
    () =>
      Object.entries(incomeExpenseByDate)
        .filter(([, v]) => v.income > 0)
        .map(([key]) => new Date(key)),
    [incomeExpenseByDate],
  );

  const expenseDates = useMemo(
    () =>
      Object.entries(incomeExpenseByDate)
        .filter(([, v]) => v.expense > 0)
        .map(([key]) => new Date(key)),
    [incomeExpenseByDate],
  );

  const monthlyPreview = useMemo(() => {
    const start = startOfMonth(selectedDate);
    const end = endOfMonth(selectedDate);

    const byDay: Record<string, { date: Date; income: number; expense: number; debts: number }> = {};

    Object.entries(incomeExpenseByDate).forEach(([key, value]) => {
      const date = new Date(key);
      if (date < start || date > end) return;
      const iso = startOfDay(date).toISOString();
      if (!byDay[iso]) {
        byDay[iso] = { date, income: 0, expense: 0, debts: 0 };
      }
      byDay[iso].income += value.income;
      byDay[iso].expense += value.expense;
    });

    Object.entries(installmentsByDate).forEach(([key, items]) => {
      const date = new Date(key);
      if (date < start || date > end) return;
      const iso = startOfDay(date).toISOString();
      if (!byDay[iso]) {
        byDay[iso] = { date, income: 0, expense: 0, debts: 0 };
      }
      byDay[iso].debts += items.reduce((sum, it) => sum + it.amount, 0);
    });

    return Object.values(byDay).sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [incomeExpenseByDate, installmentsByDate, selectedDate]);

  const upcomingIncomes = useMemo(() => {
    const today = startOfDay(new Date());
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    const isCurrentMonth =
      selectedDate.getMonth() === today.getMonth() && selectedDate.getFullYear() === today.getFullYear();

    const items: { date: Date; total: number }[] = [];

    Object.entries(incomeExpenseByDate).forEach(([key, value]) => {
      const date = new Date(key);
      if (date < monthStart || date > monthEnd) return;
      if (isCurrentMonth && isBefore(date, today)) return;
      if (value.income <= 0) return;

      items.push({ date, total: value.income });
    });

    items.sort((a, b) => a.date.getTime() - b.date.getTime());
    return items.slice(0, 4);
  }, [incomeExpenseByDate, selectedDate]);

  const upcomingExpenses = useMemo(() => {
    const today = startOfDay(new Date());
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    const isCurrentMonth =
      selectedDate.getMonth() === today.getMonth() && selectedDate.getFullYear() === today.getFullYear();

    const items: { date: Date; total: number }[] = [];

    Object.entries(incomeExpenseByDate).forEach(([key, value]) => {
      const date = new Date(key);
      if (date < monthStart || date > monthEnd) return;
      if (isCurrentMonth && isBefore(date, today)) return;
      if (value.expense <= 0) return;

      items.push({ date, total: value.expense });
    });

    items.sort((a, b) => a.date.getTime() - b.date.getTime());
    return items.slice(0, 4);
  }, [incomeExpenseByDate, selectedDate]);

  const { overdueInstallmentCount, upcomingInstallmentsSummary, weekTotal, monthTotal } = useMemo(() => {
    const today = startOfDay(new Date());
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
    const monthEnd = endOfMonth(today);

    let overdueCount = 0;
    const upcoming: { date: Date; totalAmount: number }[] = [];
    let weekTotalAmount = 0;
    let monthTotalAmount = 0;

    Object.entries(installmentsByDate).forEach(([key, items]) => {
      const date = new Date(key);
      const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

      if (isBefore(date, today)) {
        overdueCount += items.length;
      } else {
        upcoming.push({ date, totalAmount });

        if (!isBefore(date, today) && date <= weekEnd) {
          weekTotalAmount += totalAmount;
        }

        if (!isBefore(date, today) && date <= monthEnd) {
          monthTotalAmount += totalAmount;
        }
      }
    });

    upcoming.sort((a, b) => a.date.getTime() - b.date.getTime());

    return {
      overdueInstallmentCount: overdueCount,
      upcomingInstallmentsSummary: upcoming.slice(0, 3),
      weekTotal: weekTotalAmount,
      monthTotal: monthTotalAmount,
    };
  }, [installmentsByDate]);

  const { incomeData, expenseData } = useMemo(() => {
    const start = startOfMonth(selectedDate);
    const end = endOfMonth(selectedDate);

    const filterByMonth = (data: Transaction[] | null) => {
      if (!data) return [];
      return data.filter(t => {
        const transactionDate = parseISO(t.date);
        return transactionDate >= start && transactionDate <= end;
      });
    }

    return {
      incomeData: filterByMonth(allIncomeData),
      expenseData: filterByMonth(allExpenseData)
    };
  }, [selectedDate, allIncomeData, allExpenseData]);


  const allTransactions = useMemo(() => {
    return [...(allIncomeData || []), ...(allExpenseData || [])];
  }, [allIncomeData, allExpenseData]);


  const { totalIncome, totalExpenses, totalDebt, balance } = useMemo(() => {
    const totalIncome = incomeData?.reduce((sum, t) => sum + t.amount, 0) || 0;
    const totalExpenses = expenseData?.reduce((sum, t) => sum + t.amount, 0) || 0;
    const totalDebt = debtData?.reduce((sum, d) => sum + (d.totalAmount - (d.paidAmount || 0)), 0) || 0;

    const allTimeIncome = allIncomeData?.reduce((sum, t) => sum + t.amount, 0) || 0;
    const allTimeExpenses = allExpenseData?.reduce((sum, t) => sum + t.amount, 0) || 0;
    const balance = allTimeIncome - allTimeExpenses;

    return { totalIncome, totalExpenses, totalDebt, balance };
  }, [incomeData, expenseData, debtData, allIncomeData, allExpenseData]);


  useEffect(() => {
    const fetchInstallmentDueDates = async () => {
      if (!user || !firestore || !debtData) {
        setInstallmentOverdueDates([]);
        setInstallmentUpcomingDates([]);
        setInstallmentsByDate({});
        return;
      }

      const overdue: Date[] = [];
      const upcoming: Date[] = [];
      const byDate: Record<string, InstallmentInfo[]> = {};

      try {
        for (const debt of debtData) {
          const installmentsQuery = query(
            collection(firestore, `users/${user.uid}/debts/${debt.id}/installments`),
            where('status', '==', 'unpaid'),
          );

          const querySnapshot = await getDocs(installmentsQuery);

          querySnapshot.forEach((doc) => {
            const installment = doc.data() as Installment;
            const dueDate = startOfDay(parseISO(installment.dueDate));

            const today = startOfDay(new Date());
            if (isBefore(dueDate, today)) {
              overdue.push(dueDate);
            } else {
              upcoming.push(dueDate);
            }

            const key = dueDate.toISOString();
            if (!byDate[key]) {
              byDate[key] = [];
            }
            byDate[key].push({ debtName: debt.name, amount: installment.amount });
          });
        }
      } catch (error) {
        console.error('Erro ao buscar parcelas para o calendário:', error);
      }

      setInstallmentOverdueDates(overdue);
      setInstallmentUpcomingDates(upcoming);
      setInstallmentsByDate(byDate);
    };

    fetchInstallmentDueDates();
  }, [debtData, user, firestore]);


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  const isLoading = isUserLoading || isIncomeLoading || isExpensesLoading || isDebtsLoading || isGoalsLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="space-y-3 rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </div>
              <Skeleton className="h-7 w-28" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <Skeleton className="h-[350px] w-full rounded-lg lg:col-span-3" />
          <Skeleton className="h-[350px] w-full rounded-lg lg:col-span-2" />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Skeleton className="h-[400px] w-full rounded-lg lg:col-span-2" />
          <Skeleton className="h-[400px] w-full rounded-lg" />
        </div>
      </div>
    );
  }

  const getFirstName = (displayName: string | null | undefined) => {
    if (!displayName) return '';
    return displayName.split(' ')[0];
  }

  return (
    <>
      <AddTransactionSheet
        isOpen={isIncomeSheetOpen}
        onClose={() => setIsIncomeSheetOpen(false)}
        transactionType="income"
        categories={incomeCategories}
      />
      <AddTransactionSheet
        isOpen={isExpenseSheetOpen}
        onClose={() => setIsExpenseSheetOpen(false)}
        transactionType="expense"
        categories={expenseCategories}
      />
      <AddDebtSheet
        isOpen={isDebtSheetOpen}
        onClose={() => setIsDebtSheetOpen(false)}
      />
      <AddGoalSheet
        isOpen={isGoalSheetOpen}
        onClose={() => setIsGoalSheetOpen(false)}
      />
      <div className="space-y-8 max-w-8x1 mx-auto">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(360px,1fr)] items-start">
          <div className="space-y-8">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <h1 className="text-3xl font-semibold tracking-tight">Olá, {getFirstName(user?.displayName)}! 👋</h1>
                <p className="text-sm text-muted-foreground max-w-xl">
                  Este é o seu painel de {format(selectedDate, 'MMMM/yyyy', { locale: ptBR })}. Tudo em um só lugar, sem planilhas.
                </p>
              </div>
              <div className="flex flex-col items-center gap-2 md:flex-row">
                <QuickActions
                  onAddIncome={() => setIsIncomeSheetOpen(true)}
                  onAddExpense={() => setIsExpenseSheetOpen(true)}
                  onAddDebt={() => setIsDebtSheetOpen(true)}
                  onAddGoal={() => setIsGoalSheetOpen(true)}
                />
              </div>
            </div>

            <div className="space-y-5">
              <h2 className="text-lg font-semibold tracking-tight">Resumo do mês</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <KpiCard
                  title="Renda Total"
                  value={formatCurrency(totalIncome)}
                  icon={Landmark}
                />
                <KpiCard
                  title="Despesas Totais"
                  value={formatCurrency(totalExpenses)}
                  icon={CreditCard}
                />
                <KpiCard
                  title="Balanço Geral"
                  value={formatCurrency(balance)}
                  icon={Scale}
                  description="Saldo de todos os tempos"
                />
                <KpiCard
                  title="Dívida Pendente"
                  value={formatCurrency(totalDebt)}
                  icon={Banknote}
                  description="Total de dívidas em aberto"
                />
              </div>
            </div>

            <Separator className="my-4" />

            <div className="space-y-8">
              <section className="space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold tracking-tight">Próximos lançamentos</h2>
                </div>
                <p className="text-xs text-muted-foreground">
                  Veja o que está para entrar e sair ainda neste mês.
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Receitas a receber</CardTitle>
                      <ArrowUpCircle className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                      {upcomingIncomes.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Nenhuma receita futura este mês.</p>
                      ) : (
                        <div className="space-y-2">
                          {upcomingIncomes.map((item, index) => (
                            <div key={index} className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">
                                {format(item.date, 'dd/MM')}
                              </span>
                              <span className="font-semibold">{formatCurrency(item.total)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Despesas a pagar</CardTitle>
                      <ArrowDownCircle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                      {upcomingExpenses.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Nenhuma despesa futura este mês.</p>
                      ) : (
                        <div className="space-y-2">
                          {upcomingExpenses.map((item, index) => (
                            <div key={index} className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">
                                {format(item.date, 'dd/MM')}
                              </span>
                              <span className="font-semibold">{formatCurrency(item.total)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </section>

              <section className="space-y-2">
                <h2 className="text-lg font-semibold tracking-tight">Análise gráfica</h2>
                <p className="text-xs text-muted-foreground max-w-md">
                  Compare receitas e despesas e entenda para onde o dinheiro está indo.
                </p>
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                  <div className="lg:col-span-3">
                    <IncomeExpenseChart transactions={allTransactions} />
                  </div>
                  <div className="lg:col-span-2">
                    <ExpenseCategoryChart transactions={expenseData || []} />
                  </div>
                </div>
              </section>
            </div>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-20">
            <Card>
              <CardHeader className="border-b pb-3">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-7 w-7 text-primary" />
                  <div>
                    <CardTitle className="text-base">Calendário financeiro</CardTitle>
                    <CardDescription className="text-xs md:text-sm">
                      Visão mensal de rendas, despesas e vencimentos.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="flex justify-center px-2">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    locale={ptBR}
                    modifiers={{
                      overdue: installmentOverdueDates,
                      upcoming: installmentUpcomingDates,
                      incomeDay: incomeDates,
                      expenseDay: expenseDates,
                    }}
                    modifiersClassNames={{
                      overdue:
                        'relative after:absolute after:bottom-1 after:left-1/2 after:h-1.5 after:w-1.5 after:-translate-x-1/2 after:rounded-full after:bg-destructive',
                      upcoming:
                        'relative after:absolute after:bottom-1 after:left-1/2 after:h-1.5 after:w-1.5 after:-translate-x-1/2 after:rounded-full after:bg-amber-500',
                      incomeDay:
                        'relative after:absolute after:top-1 after:right-1 after:h-1.5 after:w-1.5 after:rounded-full after:bg-emerald-500',
                      expenseDay:
                        'relative after:absolute after:top-1 after:left-1 after:h-1.5 after:w-1.5 after:rounded-full after:bg-sky-500',
                    }}
                    className="rounded-md border w-full max-w-lg"
                    onDayMouseEnter={(day) => {
                      const key = startOfDay(day).toISOString();
                      const items = installmentsByDate[key];
                      if (items && items.length) {
                        setHoveredInstallments({ date: day, items });
                      } else {
                        setHoveredInstallments(null);
                      }
                    }}
                    onDayMouseLeave={() => setHoveredInstallments(null)}
                    onDayClick={(day) => {
                      const key = startOfDay(day).toISOString();
                      const items = installmentsByDate[key];
                      setSelectedDate(day);
                      if (items && items.length) {
                        const dateStr = format(day, 'yyyy-MM-dd');
                        router.push(`/debts?dueDate=${dateStr}`);
                      }
                    }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    Renda
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
                    Despesa
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-destructive" />
                    Parcela vencida
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                    Parcela a vencer
                  </span>
                </div>
              </CardContent>
            </Card>

            {monthlyPreview.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Preview do mês</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Resumo diário de rendas, despesas e dívidas.
                  </CardDescription>
                </CardHeader>
                <CardContent className="max-h-64 space-y-2 overflow-y-auto pr-1 text-xs">
                  {monthlyPreview.map((item) => (
                    <div
                      key={item.date.toISOString()}
                      className="flex items-center justify-between rounded-md border bg-muted/40 px-2 py-1.5"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {format(item.date, 'dd/MM', { locale: ptBR })}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {format(item.date, 'EEEE', { locale: ptBR })}
                        </span>
                      </div>
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="text-[11px] text-emerald-700">
                          + {formatCurrency(item.income)}
                        </span>
                        <span className="text-[11px] text-red-600">
                          - {formatCurrency(item.expense)}
                        </span>
                        {item.debts > 0 && (
                          <span className="text-[11px] text-amber-700">
                            ↳ {formatCurrency(item.debts)} em dívidas
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {hoveredInstallments && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Vencimentos em{' '}
                    {format(hoveredInstallments.date, "dd 'de' MMMM", { locale: ptBR })}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    {hoveredInstallments.items.map((item, index) => (
                      <li key={index} className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground">{item.debtName}</span>
                        <span className="font-medium">{formatCurrency(item.amount)}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            <FinancialHealthScore
              income={totalIncome}
              expenses={totalExpenses}
              debts={debtData || []}
              goals={goalData || []}
              transactions={expenseData || []}
            />
          </aside>
        </div>
      </div>
    </>
  );
}

