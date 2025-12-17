
'use client';

import { useState, useMemo, useCallback } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
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
import { TrendingUp, TrendingDown, PiggyBank, Percent, HandCoins } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { JourneyProgressCard } from '@/components/education/JourneyProgressCard';
import { ExpenseCalendar } from './_components/expense-calendar';


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
  const buildQuery = (collectionName: string, dateField: string, start: string, end: string) => {
    if (!user) return null;
    return query(
      collection(firestore, `users/${user.uid}/${collectionName}`),
      where(dateField, '>=', start),
      where(dateField, '<=', end)
    );
  };
  
  const incomesForPeriodQuery = useMemoFirebase(() => buildQuery('incomes', 'date', start, end), [user, firestore, start, end]);
  const expensesForPeriodQuery = useMemoFirebase(() => buildQuery('expenses', 'date', start, end), [user, firestore, start, end]);
  const prevIncomesQuery = useMemoFirebase(() => buildQuery('incomes', 'date', prevStart, prevEnd), [user, firestore, prevStart, prevEnd]);
  const prevExpensesQuery = useMemoFirebase(() => buildQuery('expenses', 'date', prevStart, prevEnd), [user, firestore, prevStart, prevEnd]);
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

  return (
    <>
      <AddTransactionSheet isOpen={sheetType === 'income' || sheetType === 'expense'} onClose={handleCloseSheet} transactionType={sheetType as 'income' | 'expense'} categories={sheetType === 'income' ? incomeCategories : expenseCategories} />
      <AddDebtSheet isOpen={sheetType === 'debt'} onClose={handleCloseSheet} />
      <AddGoalSheet isOpen={sheetType === 'goal'} onClose={handleCloseSheet} />
    
      <motion.div 
        className="space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <DashboardHeader onAddIncome={() => handleOpenSheet('income')} onAddExpense={() => handleOpenSheet('expense')} onAddDebt={() => handleOpenSheet('debt')} onAddGoal={() => handleOpenSheet('goal')} />
        
        <Tabs defaultValue="overview">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="analysis">Análise Detalhada</TabsTrigger>
            <TabsTrigger value="calendar">Calendário</TabsTrigger>
            <TabsTrigger value="journey">Jornada Financeira</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              <KpiCard index={0} title="Receitas do Mês" value={formatCurrency(totalIncome)} icon={TrendingUp} trend={incomeTrend} />
              <KpiCard index={1} title="Despesas do Mês" value={formatCurrency(totalExpenses)} icon={TrendingDown} trend={expenseTrend} invertTrendColor />
              <KpiCard index={2} title="Balanço Mensal" value={formatCurrency(balance)} icon={HandCoins} />
              <KpiCard index={3} title="Taxa de Poupança" value={`${savingsRate.toFixed(0)}%`} icon={Percent} />
            </div>
            
             <FinancialInsightsCard financialData={financialDataForAI} />

             <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 space-y-6">
                    <BalanceCard balance={balance} income={totalIncome} expenses={totalExpenses} />
                    <FinancialHealthScore income={totalIncome} expenses={totalExpenses} debts={debtData || []} goals={goalData || []} transactions={allTransactions}/>
                </div>
                <div className="lg:col-span-2 space-y-6">
                    <RecentTransactionsList transactions={allTransactions} onAddTransaction={() => handleOpenSheet('expense')} />
                </div>
            </div>
            <OverdueDebtsCard debts={debtData || []} />
          </TabsContent>

          <TabsContent value="analysis" className="mt-6 space-y-6">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <IncomeExpenseChart transactions={allTransactions} />
                <ExpenseCategoryChart transactions={expenseData || []} />
             </div>
          </TabsContent>

           <TabsContent value="calendar" className="mt-6">
              <ExpenseCalendar expenses={expenseData || []}/>
          </TabsContent>
          
           <TabsContent value="journey" className="mt-6">
              <JourneyProgressCard />
          </TabsContent>

        </Tabs>
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
