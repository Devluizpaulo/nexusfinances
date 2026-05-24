
'use client';

import { useState, useMemo, useCallback } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Transaction, Debt, Goal } from '@/lib/types';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { AddTransactionSheet } from '@/components/transactions/add-transaction-sheet';
import { AddDebtSheet } from '@/components/debts/add-debt-sheet';
import { AddGoalSheet } from '@/components/goals/add-goal-sheet';
import { incomeCategories, expenseCategories } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardDate } from '@/context/dashboard-date-context';
import { RecentTransactionsList } from './_components/recent-transactions-list';
import { BalanceCard } from './_components/balance-card';
import { DashboardHeader } from './_components/dashboard-header';
import { IncomeExpenseChart } from '@/components/dashboard/income-expense-chart';
import { ExpenseCategoryChart } from '@/app/dashboard/_components/expense-category-chart';
import { FinancialHealthScore } from '@/components/dashboard/financial-health-score';
import { OverdueDebtsCard } from '@/components/dashboard/overdue-debts-card';
import { FinancialInsightsCard } from './_components/FinancialInsightsCard';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { TrendingUp, TrendingDown, Percent, HandCoins } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { JourneyProgressCard } from '@/components/education/JourneyProgressCard';
import { ExpenseCalendar } from './_components/expense-calendar';
import { PremiumBackground } from '@/components/premium-effects';
import { AICoachChat } from './_components/ai-coach-chat';
import { calculateScore } from '@/lib/education-data';


const selectStablePhrase = (phrases: string[], seed: string) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % phrases.length;
  return phrases[index];
};

export default function DashboardPage() {
  const { selectedDate } = useDashboardDate();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  
  const [sheetType, setSheetType] = useState<'income' | 'expense' | 'debt' | 'goal' | null>(null);

  const { start, end } = useMemo(() => {
    const start = startOfMonth(selectedDate);
    const end = endOfMonth(selectedDate);
    return { start: start.toISOString(), end: end.toISOString() };
  }, [selectedDate]);

  const { prevStart, prevEnd } = useMemo(() => {
    const prevMonth = subMonths(selectedDate, 1);
    return { 
      prevStart: startOfMonth(prevMonth).toISOString(), 
      prevEnd: endOfMonth(prevMonth).toISOString() 
    };
  }, [selectedDate]);

  // Queries
  const buildQuery = useCallback((collectionName: string, dateField: string, start: string, end: string) => {
    if (!user) return null;
    return query(
      collection(firestore, `users/${user.uid}/${collectionName}`),
      where(dateField, '>=', start),
      where(dateField, '<=', end)
    );
  }, [user, firestore]);
  
  const incomesForPeriodQuery = useMemoFirebase(() => buildQuery('incomes', 'date', start, end), [buildQuery, start, end]);
  const expensesForPeriodQuery = useMemoFirebase(() => buildQuery('expenses', 'date', start, end), [buildQuery, start, end]);
  const prevIncomesQuery = useMemoFirebase(() => buildQuery('incomes', 'date', prevStart, prevEnd), [buildQuery, prevStart, prevEnd]);
  const prevExpensesQuery = useMemoFirebase(() => buildQuery('expenses', 'date', prevStart, prevEnd), [buildQuery, prevStart, prevEnd]);
  const allDebtsQuery = useMemoFirebase(() => user ? query(collection(firestore, `users/${user.uid}/debts`)) : null, [user, firestore]);
  const allGoalsQuery = useMemoFirebase(() => user ? query(collection(firestore, `users/${user.uid}/goals`)) : null, [user, firestore]);

  // Data fetching
  const { data: incomeData, isLoading: isIncomeLoading } = useCollection<Transaction>(incomesForPeriodQuery);
  const { data: expenseData, isLoading: isExpensesLoading } = useCollection<Transaction>(expensesForPeriodQuery);
  const { data: prevIncomeData, isLoading: isPrevIncomeLoading } = useCollection<Transaction>(prevIncomesQuery);
  const { data: prevExpenseData, isLoading: isPrevExpensesLoading } = useCollection<Transaction>(prevExpensesQuery);
  const { data: debtData, isLoading: isDebtsLoading } = useCollection<Debt>(allDebtsQuery);
  const { data: goalData, isLoading: isGoalsLoading } = useCollection<Goal>(allGoalsQuery);

  const { totalIncome, totalExpenses, balance, savingsRate } = useMemo(() => {
    const income = incomeData?.reduce((sum, t) => sum + t.amount, 0) || 0;
    const expenses = expenseData?.reduce((sum, t) => sum + t.amount, 0) || 0;
    const rate = income > 0 ? ((income - expenses) / income) * 100 : 0;
    return {
      totalIncome: income,
      totalExpenses: expenses,
      balance: income - expenses,
      savingsRate: rate < 0 ? 0 : rate,
    };
  }, [incomeData, expenseData]);

  const { prevTotalIncome, prevTotalExpenses } = useMemo(() => {
      const income = prevIncomeData?.reduce((sum, t) => sum + t.amount, 0) || 0;
      const expenses = prevExpenseData?.reduce((sum, t) => sum + t.amount, 0) || 0;
      return { prevTotalIncome: income, prevTotalExpenses: expenses };
  }, [prevIncomeData, prevExpenseData]);
  
  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const incomeTrend = calculateTrend(totalIncome, prevTotalIncome);
  const expenseTrend = calculateTrend(totalExpenses, prevTotalExpenses);

  const allTransactions = useMemo(() => 
    [...(incomeData || []), ...(expenseData || [])]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), 
    [incomeData, expenseData]
  );

  // Microcopy Contextual Engine
  const subtitleMessage = useMemo(() => {
    if (!user) return 'Resumo financeiro do período selecionado';

    const seed = `${selectedDate.getFullYear()}-${selectedDate.getMonth()}`;

    // 1. Goal near completion (Progress >= 80% and < 100%) - Highest Priority
    if (goalData && goalData.length > 0) {
      const nearCompleteGoals = goalData.filter(g => {
        if (g.targetAmount <= 0) return false;
        const progress = g.currentAmount / g.targetAmount;
        return progress >= 0.8 && progress < 1.0;
      });

      if (nearCompleteGoals.length > 0) {
        const goalIndex = Math.abs(seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % nearCompleteGoals.length;
        const goal = nearCompleteGoals[goalIndex];
        const phrases = [
          `Falta muito pouco para completar sua meta: ${goal.name}! 🚀`,
          `Sua meta "${goal.name}" está quase lá! Continue assim! 🎯`,
          `Você está muito perto de conquistar a meta: ${goal.name}! Quase lá! 🌟`
        ];
        return selectStablePhrase(phrases, seed);
      }
    }

    // 2. Negative balance
    if (balance < 0) {
      const phrases = [
        "Os gastos subiram um pouco este mês. Que tal dar uma olhada nas despesas? ⚠️",
        "Seu balanço está ligeiramente no vermelho. Atenção aos desvios! 💸",
        "Atenção: saídas maiores que as entradas no período. 🔍",
        "Balanço negativo detectado. Vamos recalcular a rota? 🗺️"
      ];
      return selectStablePhrase(phrases, seed);
    }

    // 3. Positive balance with high savings rate
    if (balance > 0 && savingsRate > 30) {
      const phrases = [
        `Seu mês está excelente! Taxa de poupança muito saudável de ${savingsRate.toFixed(0)}%. 💰`,
        `Sensacional! Taxa de poupança em ${savingsRate.toFixed(0)}% este mês. Continue assim! 🚀`,
        `Belo trabalho! Poupar ${savingsRate.toFixed(0)}% da sua renda é um patamar premium. 💎`
      ];
      return selectStablePhrase(phrases, seed);
    }

    // 4. Standard positive balance
    if (balance > 0) {
      const phrases = [
        "Seu mês está saudável! 🎉",
        "Boa organização este mês! 👍",
        "Seu balanço continua positivo. 📈",
        "As finanças estão sob controle por aqui. 💎",
        "Belo progresso este mês. Mantenha o foco! 🌟"
      ];
      return selectStablePhrase(phrases, seed);
    }

    // 5. Default case
    const defaultPhrases = [
      "Acompanhe seus dados financeiros em tempo real e evolua. 📊",
      "Que tal planejar seu próximo passo financeiro hoje? 🎯",
      "Organize suas finanças com simplicidade e precisão. ✨"
    ];
    return selectStablePhrase(defaultPhrases, seed);
  }, [user, selectedDate, goalData, balance, savingsRate]);

  const handleOpenSheet = useCallback((type: 'income' | 'expense' | 'debt' | 'goal') => {
    setSheetType(type);
  }, []);
  
  const handleCloseSheet = useCallback(() => {
    setSheetType(null);
  }, []);

  const isLoading = isUserLoading || isIncomeLoading || isExpensesLoading || isDebtsLoading || isGoalsLoading || isPrevIncomeLoading || isPrevExpensesLoading;

  if (isLoading) {
    return <DashboardSkeleton />;
  }
  
  const financialDataForAI = {
      userName: user?.firstName || 'Usuário',
      incomes: incomeData || [],
      expenses: expenseData || [],
      debts: debtData || [],
      goals: goalData || [],
  };

  // Pre-calculate data details for AI Coach context
  const healthScoreVal = useMemo(() => {
    return calculateScore(totalIncome, totalExpenses, debtData || [], goalData || [], allTransactions).score;
  }, [totalIncome, totalExpenses, debtData, goalData, allTransactions]);

  const activeGoalsData = useMemo(() => {
    return (goalData || []).map(g => ({
      name: g.name,
      target: g.targetAmount,
      current: g.currentAmount
    }));
  }, [goalData]);

  const topExpensesData = useMemo(() => {
    if (!expenseData || expenseData.length === 0) return [];
    const groups: Record<string, number> = {};
    expenseData.forEach(e => {
      groups[e.category] = (groups[e.category] || 0) + e.amount;
    });
    const total = Object.values(groups).reduce((a, b) => a + b, 0);
    return Object.entries(groups).map(([category, amount]) => ({
      category,
      amount,
      percentage: total > 0 ? (amount / total) * 100 : 0
    })).sort((a, b) => b.amount - a.amount);
  }, [expenseData]);

  const financialSummaryForAI = {
    totalIncome,
    totalExpenses,
    balance,
    savingsRate,
    debtCount: debtData?.length || 0,
    goalCount: goalData?.length || 0,
    healthScore: healthScoreVal,
    activeGoals: activeGoalsData,
    topExpenses: topExpensesData,
  };

  return (
    <>
      <PremiumBackground />
      <AddTransactionSheet isOpen={sheetType === 'income' || sheetType === 'expense'} onClose={handleCloseSheet} transactionType={sheetType as 'income' | 'expense'} categories={sheetType === 'income' ? incomeCategories : expenseCategories} />
      <AddDebtSheet isOpen={sheetType === 'debt'} onClose={handleCloseSheet} />
      <AddGoalSheet isOpen={sheetType === 'goal'} onClose={handleCloseSheet} />
    
      <motion.div 
        className="space-y-6 relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <DashboardHeader 
          onAddIncome={() => handleOpenSheet('income')} 
          onAddExpense={() => handleOpenSheet('expense')} 
          onAddDebt={() => handleOpenSheet('debt')} 
          onAddGoal={() => handleOpenSheet('goal')}
          subtitle={subtitleMessage}
        />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative"
        >
          <Tabs defaultValue="overview" className="relative">
            <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-lg border border-slate-800 bg-slate-950/70 p-1 backdrop-blur sm:grid-cols-5">
              <TabsTrigger value="overview" className="rounded-md text-xs transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground sm:text-sm">Visão Geral</TabsTrigger>
              <TabsTrigger value="analysis" className="rounded-md text-xs transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground sm:text-sm">Análise</TabsTrigger>
              <TabsTrigger value="calendar" className="rounded-md text-xs transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground sm:text-sm">Calendário</TabsTrigger>
              <TabsTrigger value="journey" className="rounded-md text-xs transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground sm:text-sm">Jornada</TabsTrigger>
              <TabsTrigger value="ai-coach" className="rounded-md text-xs transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground sm:text-sm">IA</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6 space-y-6">
              <motion.div 
                key={`kpis-${selectedDate.toISOString()}`}
                className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, staggerChildren: 0.05 }}
              >
                <KpiCard index={0} title="Receitas do Mês" value={formatCurrency(totalIncome)} icon={TrendingUp} trend={incomeTrend} />
                <KpiCard index={1} title="Despesas do Mês" value={formatCurrency(totalExpenses)} icon={TrendingDown} trend={expenseTrend} invertTrendColor />
                <KpiCard index={2} title="Balanço Mensal" value={formatCurrency(balance)} icon={HandCoins} />
                <KpiCard index={3} title="Taxa de Poupança" value={`${savingsRate.toFixed(0)}%`} icon={Percent} />
              </motion.div>
              
              <motion.div
                key={`insights-${selectedDate.toISOString()}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <FinancialInsightsCard financialData={financialDataForAI} />
              </motion.div>

              <motion.div 
                key={`dashboard-layout-${selectedDate.toISOString()}`}
                className="grid grid-cols-1 lg:grid-cols-5 gap-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="lg:col-span-3 space-y-6">
                    <BalanceCard balance={balance} income={totalIncome} expenses={totalExpenses} />
                    <FinancialHealthScore income={totalIncome} expenses={totalExpenses} debts={debtData || []} goals={goalData || []} transactions={allTransactions}/>
                </div>
                <div className="lg:col-span-2 space-y-6">
                    <RecentTransactionsList transactions={allTransactions} onAddTransaction={() => handleOpenSheet('expense')} />
                </div>
              </motion.div>
              
              <motion.div
                key={`debts-${selectedDate.toISOString()}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <OverdueDebtsCard debts={debtData || []} />
              </motion.div>
            </TabsContent>

            <TabsContent value="analysis" className="mt-6 space-y-6">
              <motion.div 
                key={`analysis-${selectedDate.toISOString()}`}
                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <IncomeExpenseChart transactions={allTransactions} />
                <ExpenseCategoryChart transactions={expenseData || []} />
              </motion.div>
            </TabsContent>

            <TabsContent value="calendar" className="mt-6">
              <motion.div
                key={`calendar-${selectedDate.toISOString()}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <ExpenseCalendar expenses={expenseData || []}/>
              </motion.div>
            </TabsContent>
            
            <TabsContent value="journey" className="mt-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <JourneyProgressCard />
              </motion.div>
            </TabsContent>
            
            <TabsContent value="ai-coach" className="mt-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <AICoachChat userName={user?.firstName || 'Usuário'} financialData={financialSummaryForAI} />
              </motion.div>
            </TabsContent>

          </Tabs>
        </motion.div>
      </motion.div>
    </>
  );
}


function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <motion.div className="flex items-center justify-between" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2"><Skeleton className="h-7 w-48" /><Skeleton className="h-4 w-32" /></div>
        </div>
        <Skeleton className="h-10 w-36 rounded-full" />
      </motion.div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-28 w-full rounded-2xl" />
      </div>
       <Skeleton className="h-20 w-full rounded-2xl" />
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
        <div className="lg:col-span-2">
           <Skeleton className="h-[28.75rem] w-full rounded-2xl" />
        </div>
      </div>
    </div>
  )
}
