
'use client';

import { useState, useMemo, useEffect } from 'react';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { Banknote, Landmark, CreditCard, Scale, Calendar as CalendarIcon, ArrowUpCircle, ArrowDownCircle, ChevronLeft, ChevronRight, Sparkles, Loader2 as LoaderSpinner } from 'lucide-react';
import { IncomeExpenseChart } from '@/components/dashboard/income-expense-chart';
import { ExpenseCategoryChart } from '@/components/dashboard/expense-category-chart';
import { FinancialHealthScore } from '@/components/dashboard/financial-health-score';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, getDocs, orderBy, limit, collectionGroup } from 'firebase/firestore';
import type { Transaction, Debt, Goal, Installment, Budget } from '@/lib/types';
import { useManageRecurrences } from '@/hooks/useManageRecurrences';
import { Calendar } from '@/components/ui/calendar';
import { startOfMonth, endOfMonth, parseISO, format, startOfDay, isBefore, endOfWeek, addMonths, isSameMonth } from 'date-fns';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { getFinancialInsights, type GetFinancialInsightsInput } from '@/ai/flows/financial-insights-flow';
import { OverdueDebtsCard } from '@/components/dashboard/overdue-debts-card';
import { Badge } from '@/components/ui/badge';
import { GoalCard } from '@/components/goals/goal-card';
import { BudgetCard } from '@/components/budgets/budget-card';
import { AddContributionSheet } from '@/components/goals/add-contribution-sheet';
import { AddBudgetSheet } from '@/components/budgets/add-budget-sheet';

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
  const [isBudgetSheetOpen, setIsBudgetSheetOpen] = useState(false);
  const [isContributionSheetOpen, setIsContributionSheetOpen] = useState(false);

  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [selectedGoalForContribution, setSelectedGoalForContribution] = useState<Goal | null>(null);
  
  const [isInsightsLoading, setIsInsightsLoading] = useState(false);
  const [insights, setInsights] = useState<{ summary: string; actionPoints: string[] } | null>(null);

  const { start, end } = useMemo(() => {
    const start = startOfMonth(selectedDate);
    const end = endOfMonth(selectedDate);
    return { start, end };
  }, [selectedDate]);

  // Queries
  const incomesForMonthQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, `users/${user.uid}/incomes`),
      where('date', '>=', format(start, 'yyyy-MM-dd')),
      where('date', '<=', format(end, 'yyyy-MM-dd'))
    );
  }, [firestore, user, start, end]);

  const expensesForMonthQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, `users/${user.uid}/expenses`),
      where('date', '>=', format(start, 'yyyy-MM-dd')),
      where('date', '<=', format(end, 'yyyy-MM-dd'))
    );
  }, [firestore, user, start, end]);
  
  const allIncomesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, `users/${user.uid}/incomes`), orderBy('date', 'desc'));
  }, [firestore, user]);
  
  const allExpensesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, `users/${user.uid}/expenses`), orderBy('date', 'desc'));
  }, [firestore, user]);

  const debtsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, `users/${user.uid}/debts`));
  }, [firestore, user]);

  const goalsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, `users/${user.uid}/goals`));
  }, [firestore, user]);
  
  const budgetsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, `users/${user.uid}/budgets`));
  }, [firestore, user]);

  // Data fetching
  const { data: incomeData, isLoading: isIncomeLoading } = useCollection<Transaction>(incomesForMonthQuery);
  const { data: expenseData, isLoading: isExpensesLoading } = useCollection<Transaction>(expensesForMonthQuery);
  const { data: allIncomeData, isLoading: isAllIncomeLoading } = useCollection<Transaction>(allIncomesQuery);
  const { data: allExpenseData, isLoading: isAllExpensesLoading } = useCollection<Transaction>(allExpensesQuery);
  const { data: debtData, isLoading: isDebtsLoading } = useCollection<Debt>(debtsQuery);
  const { data: goalData, isLoading: isGoalsLoading } = useCollection<Goal>(goalsQuery);
  const { data: budgetsData, isLoading: isBudgetsLoading } = useCollection<Budget>(budgetsQuery);

  const [installmentOverdueDates, setInstallmentOverdueDates] = useState<Date[]>([]);
  const [installmentUpcomingDates, setInstallmentUpcomingDates] = useState<Date[]>([]);
  const [installmentsByDate, setInstallmentsByDate] = useState<Record<string, InstallmentInfo[]>>({});
  const [hoveredInstallments, setHoveredInstallments] = useState<{ date: Date; items: InstallmentInfo[] } | null>(
    null,
  );
  
  // Memos for data processing
  const allTransactions = useMemo(() => {
    const incomes = (allIncomeData || []).map(t => ({...t, type: 'income' as const}));
    const expenses = (allExpenseData || []).map(t => ({...t, type: 'expense' as const}));
    return [...incomes, ...expenses]
      .sort((a,b) => parseISO(b.date).getTime() - parseISO(a.date).getTime())
      .slice(0, 10);
  }, [allIncomeData, allExpenseData]);

  const transactionsForCharts = useMemo(() => {
    return [...(incomeData || []), ...(expenseData || [])];
  }, [incomeData, expenseData]);
  
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
  
  const monthlyBudgetsWithSpent = useMemo(() => {
    if (!budgetsData || !expenseData) return [];
    
    const budgetsForMonth = (budgetsData || []).filter(b => {
        const budgetStart = parseISO(b.startDate);
        return isSameMonth(budgetStart, selectedDate) && b.period === 'monthly';
    });

    return budgetsForMonth.map(budget => {
        const spent = expenseData
            .filter(e => e.category === budget.category)
            .reduce((sum, e) => sum + e.amount, 0);
        return { ...budget, spentAmount: spent };
    });
  }, [budgetsData, expenseData, selectedDate]);

  const { totalIncome, totalExpenses, totalDebt, balance } = useMemo(() => {
    const totalIncome = incomeData?.reduce((sum, t) => sum + t.amount, 0) || 0;
    const totalExpenses = expenseData?.reduce((sum, t) => sum + t.amount, 0) || 0;
    const totalDebt = debtData?.reduce((sum, d) => sum + (d.totalAmount - (d.paidAmount || 0)), 0) || 0;

    const allTimeIncome = allIncomeData?.reduce((sum, t) => sum + t.amount, 0) || 0;
    const allTimeExpenses = allExpenseData?.reduce((sum, t) => sum + t.amount, 0) || 0;
    const balance = allTimeIncome - allTimeExpenses;

    return { totalIncome, totalExpenses, totalDebt, balance };
  }, [incomeData, expenseData, debtData, allIncomeData, allExpenseData]);


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
  
  // Handlers
  const handleOpenGoalSheet = (goal: Goal | null = null) => {
    setEditingGoal(goal);
    setIsGoalSheetOpen(true);
  }
  const handleOpenBudgetSheet = (budget: Budget | null = null) => {
    setEditingBudget(budget);
    setIsBudgetSheetOpen(true);
  }
  const handleOpenContributionSheet = (goal: Goal) => {
    setSelectedGoalForContribution(goal);
    setIsContributionSheetOpen(true);
  };
  
  useEffect(() => {
    setInsights(null);
  }, [selectedDate]);

  useEffect(() => {
    const fetchInstallmentDueDates = async () => {
      if (!user || !firestore) {
        setInstallmentOverdueDates([]);
        setInstallmentUpcomingDates([]);
        setInstallmentsByDate({});
        return;
      }
  
      // This is a collection group query. It requires an index on `status` in firestore.rules
      // or in the Firebase console.
      const installmentsQuery = query(
        collectionGroup(firestore, `installments`),
        where('userId', '==', user.uid),
        where('status', '==', 'unpaid')
      );
  
      const overdue: Date[] = [];
      const upcoming: Date[] = [];
      const byDate: Record<string, InstallmentInfo[]> = {};
      const debtNames: Record<string, string> = {};
  
      try {
        // Fetch all debts once to map debtId to debtName
        const debtsSnapshot = await getDocs(query(collection(firestore, `users/${user.uid}/debts`)));
        debtsSnapshot.forEach(doc => {
          debtNames[doc.id] = (doc.data() as Debt).name;
        });
  
        // Fetch all unpaid installments in a single query
        const querySnapshot = await getDocs(installmentsQuery);
  
        querySnapshot.forEach((doc) => {
          const installment = doc.data() as Installment;
          const debtName = debtNames[installment.debtId] || 'Dívida desconhecida';
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
          byDate[key].push({ debtName, amount: installment.amount });
        });
  
        setInstallmentOverdueDates(overdue);
        setInstallmentUpcomingDates(upcoming);
        setInstallmentsByDate(byDate);
      } catch (error) {
        console.error('Erro ao buscar parcelas para o calendário:', error);
      }
    };
  
    fetchInstallmentDueDates();
  }, [user, firestore]);
  
  const handleGenerateInsights = async () => {
    setIsInsightsLoading(true);
    setInsights(null);

    const input: GetFinancialInsightsInput = {
      userName: user?.displayName?.split(' ')[0] || 'Usuário',
      incomes: incomeData || [],
      expenses: expenseData || [],
      debts: debtData || [],
      goals: goalData || [],
    };

    try {
        const result = await getFinancialInsights(input);
        setInsights(result);
    } catch(e) {
        console.error("Error generating insights:", e);
        // Handle error in UI
    } finally {
        setIsInsightsLoading(false);
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };
  
  const isLoading = isUserLoading || isIncomeLoading || isExpensesLoading || isAllIncomeLoading || isAllExpensesLoading || isDebtsLoading || isGoalsLoading || isBudgetsLoading;

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
        transaction={editingTransaction}
      />
      <AddTransactionSheet
        isOpen={isExpenseSheetOpen}
        onClose={() => setIsExpenseSheetOpen(false)}
        transactionType="expense"
        categories={expenseCategories}
        transaction={editingTransaction}
      />
      <AddDebtSheet
        isOpen={isDebtSheetOpen}
        onClose={() => setIsDebtSheetOpen(false)}
      />
      <AddGoalSheet 
        isOpen={isGoalSheetOpen} 
        onClose={() => handleOpenGoalSheet(null)}
        goal={editingGoal} 
      />
      {selectedGoalForContribution && (
          <AddContributionSheet 
            isOpen={isContributionSheetOpen} 
            onClose={() => setIsContributionSheetOpen(false)} 
            goal={selectedGoalForContribution} 
          />
      )}
      <AddBudgetSheet 
        isOpen={isBudgetSheetOpen} 
        onClose={() => handleOpenBudgetSheet(null)}
        budget={editingBudget}
      />
      <div className="space-y-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Olá, {getFirstName(user?.displayName)}! 👋</h1>
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

        <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(360px,1fr)] items-start">
          <div className="space-y-8">
            <div className="space-y-4">
              <OverdueDebtsCard debts={debtData || []} />
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
            
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <IncomeExpenseChart transactions={transactionsForCharts} />
              <ExpenseCategoryChart transactions={transactionsForCharts} />
            </div>

            <Separator className="my-4" />
            
             <Tabs defaultValue="insights" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="insights">Análise com IA</TabsTrigger>
                <TabsTrigger value="transactions">Últimos Lançamentos</TabsTrigger>
                <TabsTrigger value="budgets">Limites</TabsTrigger>
                <TabsTrigger value="goals">Metas</TabsTrigger>
              </TabsList>

               <TabsContent value="insights" className="mt-4">
                 <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-amber-500" />
                            Análise do seu mês
                            </CardTitle>
                            <CardDescription>
                            Receba um resumo e dicas personalizadas com inteligência artificial.
                            </CardDescription>
                        </div>
                        <Button size="sm" onClick={handleGenerateInsights} disabled={isInsightsLoading}>
                            {isInsightsLoading && <LoaderSpinner className="mr-2 h-4 w-4 animate-spin" />}
                            Gerar Análise
                        </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isInsightsLoading ? (
                        <div className="space-y-4">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-5/6" />
                        </div>
                    ) : insights ? (
                         <div className="prose prose-sm max-w-none text-foreground dark:prose-invert">
                            <p>{insights.summary}</p>
                            <h3>Pontos de Ação</h3>
                            <ul>
                                {insights.actionPoints.map((point, index) => (
                                    <li key={index}>{point}</li>
                                ))}
                            </ul>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-center text-sm text-muted-foreground p-8">
                            <p>Clique em "Gerar Análise" para obter um resumo inteligente da sua vida financeira neste mês.</p>
                        </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="transactions" className="mt-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Últimos Lançamentos</CardTitle>
                        <CardDescription>As 10 movimentações mais recentes.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {allTransactions.map(t => (
                                <div key={t.id} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`flex h-8 w-8 items-center justify-center rounded-full bg-muted ${t.type === 'income' ? 'text-emerald-500' : 'text-red-500'}`}>
                                            {t.type === 'income' ? <ArrowUpCircle size={20} /> : <ArrowDownCircle size={20} />}
                                        </div>
                                        <div>
                                            <p className="font-medium">{t.description}</p>
                                            <p className="text-sm text-muted-foreground">{t.category} &bull; {format(parseISO(t.date), "dd/MM")}</p>
                                        </div>
                                    </div>
                                    <p className={`font-semibold ${t.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>{formatCurrency(t.amount)}</p>
                                </div>
                            ))}
                             {allTransactions.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhuma transação encontrada.</p>}
                        </div>
                    </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="budgets" className="mt-4">
                 {monthlyBudgetsWithSpent.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {monthlyBudgetsWithSpent.map(budget => (
                            <BudgetCard key={budget.id} budget={budget} onEdit={handleOpenBudgetSheet} />
                        ))}
                    </div>
                ) : (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center text-center p-8 min-h-60">
                            <h3 className="font-semibold">Nenhum limite de gasto para este mês.</h3>
                            <p className="mt-1 text-sm text-muted-foreground">Crie limites para ter um controle mais preciso dos seus gastos.</p>
                            <Button className="mt-4" size="sm" onClick={() => router.push('/budgets')}>
                                Criar Limite
                            </Button>
                        </CardContent>
                    </Card>
                )}
              </TabsContent>

              <TabsContent value="goals" className="mt-4">
                {goalData && goalData.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {goalData.slice(0, 4).map(goal => (
                            <GoalCard key={goal.id} goal={goal} onAddContribution={handleOpenContributionSheet} onEdit={handleOpenGoalSheet} />
                        ))}
                    </div>
                ) : (
                     <Card>
                        <CardContent className="flex flex-col items-center justify-center text-center p-8 min-h-60">
                            <h3 className="font-semibold">Comece a sonhar!</h3>
                            <p className="mt-1 text-sm text-muted-foreground">Você ainda não tem nenhuma meta. Que tal criar a primeira?</p>
                             <Button className="mt-4" size="sm" onClick={() => router.push('/goals')}>
                                Criar Meta
                            </Button>
                        </CardContent>
                    </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-20">
            <Card>
              <CardHeader className="border-b pb-3">
                <div className="flex items-center gap-3">
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
                        {item.income > 0 && <span className="text-[11px] text-emerald-700">
                          + {formatCurrency(item.income)}
                        </span>}
                        {item.expense > 0 && <span className="text-[11px] text-red-600">
                          - {formatCurrency(item.expense)}
                        </span>}
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
