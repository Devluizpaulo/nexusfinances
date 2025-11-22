
'use client';

import { useState, useMemo, useEffect } from 'react';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { Banknote, Landmark, CreditCard, Scale, Calendar as CalendarIcon, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { IncomeExpenseChart } from '@/components/dashboard/income-expense-chart';
import { ExpenseCategoryChart } from '@/components/dashboard/expense-category-chart';
import { FinancialHealthScore } from '@/components/dashboard/financial-health-score';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import type { Transaction, Debt, Goal, Installment } from '@/lib/types';
import { useManageRecurrences } from '@/hooks/useManageRecurrences';
import { OverdueDebtsCard } from '@/components/dashboard/overdue-debts-card';
import { Calendar } from '@/components/ui/calendar';
import { startOfMonth, endOfMonth, parseISO, format, startOfDay, isBefore, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { AddTransactionSheet } from '@/components/transactions/add-transaction-sheet';
import { AddDebtSheet } from '@/components/debts/add-debt-sheet';
import { AddGoalSheet } from '@/components/goals/add-goal-sheet';
import { incomeCategories, expenseCategories } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { DateRangePicker } from '@/components/dashboard/date-range-picker';
import { Separator } from '@/components/ui/separator';

type InstallmentInfo = {
  debtName: string;
  amount: number;
};

export default function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
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
      <div className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">Olá, {getFirstName(user?.displayName)}! 👋</h1>
            <p className="text-sm text-muted-foreground">
              Aqui está o resumo financeiro de {format(selectedDate, 'MMMM/yyyy', { locale: ptBR })}.
            </p>
          </div>
          <div className="flex flex-col items-center gap-2 md:flex-row">
            <DateRangePicker date={selectedDate} onDateChange={setSelectedDate} />
            <QuickActions
                onAddIncome={() => setIsIncomeSheetOpen(true)}
                onAddExpense={() => setIsExpenseSheetOpen(true)}
                onAddDebt={() => setIsDebtSheetOpen(true)}
                onAddGoal={() => setIsGoalSheetOpen(true)}
            />
          </div>
        </div>

        <OverdueDebtsCard debts={debtData || []} />

        <div className="space-y-2">
            <h2 className="text-lg font-medium tracking-tight">Resumo do Mês</h2>
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

         <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h2 className="text-lg font-medium tracking-tight mb-2">Próximos Lançamentos</h2>
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
                        <div key={index} className="flex justify-between items-center text-sm">
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
                        <div key={index} className="flex justify-between items-center text-sm">
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
          </div>
          <div className="lg:col-span-1">
              <FinancialHealthScore
                  income={totalIncome}
                  expenses={totalExpenses}
                  debts={debtData || []}
                  goals={goalData || []}
                  transactions={expenseData || []}
              />
          </div>
        </div>

        <div className="space-y-2">
            <h2 className="text-lg font-medium tracking-tight">Análise Gráfica</h2>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
              <div className="lg:col-span-3">
                <IncomeExpenseChart transactions={allTransactions} />
              </div>
              <div className="lg:col-span-2">
                <ExpenseCategoryChart transactions={expenseData || []} />
              </div>
            </div>
        </div>
        
         <Card>
            <CardHeader className="border-b pb-3">
                <div className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-primary" />
                <div>
                    <CardTitle className="text-base">Central de Rotinas</CardTitle>
                    <CardDescription className="text-xs md:text-sm">
                    Calendário de pagamentos e prévia do mês.
                    </CardDescription>
                </div>
                </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                <div className="md:col-span-2 flex flex-col items-center">
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
                      className="rounded-md border mx-auto"
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
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground mx-auto mt-2">
                      <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      Renda
                      </span>
                      <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-sky-500" />
                      Despesa
                      </span>
                      <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-destructive" />
                      Vencida
                      </span>
                      <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-amber-500" />
                      A vencer
                      </span>
                  </div>
                </div>
                {hoveredInstallments && (
                <div className="hidden flex-1 space-y-2 rounded-md bg-muted/60 p-3 text-sm md:block">
                    <p className="text-xs font-semibold text-muted-foreground">
                    Vencimentos em{' '}
                    {format(hoveredInstallments.date, "dd 'de' MMMM", { locale: ptBR })}
                    </p>
                    <ul className="space-y-1">
                    {hoveredInstallments.items.map((item, index) => (
                        <li key={index} className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground">{item.debtName}</span>
                        <span className="font-medium">
                            {formatCurrency(item.amount)}
                        </span>
                        </li>
                    ))}
                    </ul>
                </div>
                )}
            </CardContent>
        </Card>
      </div>
    </>
  );
}
