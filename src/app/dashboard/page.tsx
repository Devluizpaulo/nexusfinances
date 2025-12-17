
'use client';

import { useState, useMemo, useCallback } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import type { Transaction, Debt, Goal } from '@/lib/types';
import { startOfMonth, endOfMonth, format, subMonths } from 'date-fns';
import { AddTransactionSheet } from '@/components/transactions/add-transaction-sheet';
import { AddDebtSheet } from '@/components/debts/add-debt-sheet';
import { AddGoalSheet } from '@/components/goals/add-goal-sheet';
import { AddBudgetSheet } from '@/components/budgets/add-budget-sheet';
import { incomeCategories, expenseCategories } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardDate } from '@/context/dashboard-date-context';
import { RecentTransactionsList } from './_components/recent-transactions-list';
import { BalanceCard } from './_components/balance-card';
import { DashboardHeader } from './_components/dashboard-header';
import { IncomeExpenseChart } from '@/components/dashboard/income-expense-chart';
import { ExpenseCategoryChart } from '@/components/dashboard/expense-category-chart';
import { FinancialHealthScore } from '@/components/dashboard/financial-health-score';
import { OverdueDebtsCard } from '@/components/dashboard/overdue-debts-card';
import { ExpenseCalendar } from './_components/expense-calendar';
import { FinancialInsightsCard } from './_components/FinancialInsightsCard';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { TrendingUp, TrendingDown, PiggyBank, Percent } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function DashboardPage() {
  const { selectedDate } = useDashboardDate();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  
  const [sheetType, setSheetType] = useState<'income' | 'expense' | 'debt' | 'goal' | 'budget' | null>(null);

  const { start, end } = useMemo(() => {
    const start = startOfMonth(selectedDate);
    const end = endOfMonth(selectedDate);
    return { start, end };
  }, [selectedDate]);

  const { prevStart, prevEnd } = useMemo(() => {
    const prevMonth = subMonths(selectedDate, 1);
    const prevStart = startOfMonth(prevMonth);
    const prevEnd = endOfMonth(prevMonth);
    return { prevStart, prevEnd };
  }, [selectedDate]);

  // Queries
  const incomesForPeriodQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, `users/${user.uid}/incomes`),
      where('date', '>=', format(start, 'yyyy-MM-dd')),
      where('date', '<=', format(end, 'yyyy-MM-dd'))
    );
  }, [firestore, user, start, end]);

  const expensesForPeriodQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, `users/${user.uid}/expenses`),
      where('date', '>=', format(start, 'yyyy-MM-dd')),
      where('date', '<=', format(end, 'yyyy-MM-dd'))
    );
  }, [firestore, user, start, end]);
  
  const incomesPrevMonthQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, `users/${user.uid}/incomes`),
      where('date', '>=', format(prevStart, 'yyyy-MM-dd')),
      where('date', '<=', format(prevEnd, 'yyyy-MM-dd'))
    );
  }, [firestore, user, prevStart, prevEnd]);

  const expensesPrevMonthQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, `users/${user.uid}/expenses`),
      where('date', '>=', format(prevStart, 'yyyy-MM-dd')),
      where('date', '<=', format(prevEnd, 'yyyy-MM-dd'))
    );
  }, [firestore, user, prevStart, prevEnd]);
  
  const debtsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, `users/${user.uid}/debts`));
  }, [firestore, user]);

  const goalsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, `users/${user.uid}/goals`));
  }, [firestore, user]);

  // Data fetching
  const { data: incomeData, isLoading: isIncomeLoading } = useCollection<Transaction>(incomesForPeriodQuery);
  const { data: expenseData, isLoading: isExpensesLoading } = useCollection<Transaction>(expensesForPeriodQuery);
  const { data: incomePrevData } = useCollection<Transaction>(incomesPrevMonthQuery);
  const { data: expensePrevData } = useCollection<Transaction>(expensesPrevMonthQuery);
  const { data: debtData, isLoading: isDebtsLoading } = useCollection<Debt>(debtsQuery);
  const { data: goalData, isLoading: isGoalsLoading } = useCollection<Goal>(goalsQuery);

  const { totalIncome, totalExpenses, balance } = useMemo(() => {
    const income = incomeData?.reduce((sum, t) => sum + t.amount, 0) || 0;
    const expenses = expenseData?.reduce((sum, t) => sum + t.amount, 0) || 0;
    return {
      totalIncome: income,
      totalExpenses: expenses,
      balance: income - expenses,
    };
  }, [incomeData, expenseData]);
  
  const { prevIncome, prevExpenses, prevBalance } = useMemo(() => {
    const income = incomePrevData?.reduce((sum, t) => sum + t.amount, 0) || 0;
    const expenses = expensePrevData?.reduce((sum, t) => sum + t.amount, 0) || 0;
    return {
      prevIncome: income,
      prevExpenses: expenses,
      prevBalance: income - expenses,
    };
  }, [incomePrevData, expensePrevData]);

  const trends = useMemo(() => {
    const pct = (current: number, prev: number) => {
      if (!prev || prev === 0) return 0;
      return ((current - prev) / prev) * 100;
    };
    const savingsRate = totalIncome > 0 ? (balance / totalIncome) * 100 : 0;
    const prevSavingsRate = prevIncome > 0 ? (prevBalance / prevIncome) * 100 : 0;
    return {
      incomeTrend: pct(totalIncome, prevIncome),
      expenseTrend: pct(totalExpenses, prevExpenses),
      balanceTrend: pct(balance, prevBalance),
      savingsRate,
      savingsRateTrend: savingsRate - prevSavingsRate,
    };
  }, [totalIncome, prevIncome, totalExpenses, prevExpenses, balance, prevBalance]);
  
  const allTransactions = useMemo(() => [...(incomeData || []), ...(expenseData || [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [incomeData, expenseData]);

  const financialDataForAI = useMemo(() => ({
    userName: user?.firstName || '',
    incomes: incomeData || [],
    expenses: expenseData || [],
    debts: debtData || [],
    goals: goalData || [],
  }), [user, incomeData, expenseData, debtData, goalData]);


  const handleOpenSheet = useCallback((type: 'income' | 'expense' | 'debt' | 'goal' | 'budget') => {
    setSheetType(type);
  }, []);
  
  const handleCloseSheet = useCallback(() => {
    setSheetType(null);
  }, []);

  const isLoading = isUserLoading || isIncomeLoading || isExpensesLoading || isDebtsLoading || isGoalsLoading;

  if (isLoading) {
    return <DashboardSkeleton />;
  }
  
  return (
    <>
      <AddTransactionSheet
        isOpen={sheetType === 'income' || sheetType === 'expense'}
        onClose={handleCloseSheet}
        transactionType={sheetType === 'income' ? 'income' : 'expense'}
        categories={sheetType === 'income' ? incomeCategories : expenseCategories}
      />
      <AddDebtSheet
        isOpen={sheetType === 'debt'}
        onClose={handleCloseSheet}
      />
      <AddGoalSheet 
        isOpen={sheetType === 'goal'} 
        onClose={handleCloseSheet}
      />
      <AddBudgetSheet 
        isOpen={sheetType === 'budget'} 
        onClose={handleCloseSheet}
      />
    
      <motion.div 
        className="space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <DashboardHeader 
          onAddIncome={() => handleOpenSheet('income')}
          onAddExpense={() => handleOpenSheet('expense')}
          onAddDebt={() => handleOpenSheet('debt')}
          onAddGoal={() => handleOpenSheet('goal')}
        />
        
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            title="Receitas do mês"
            value={formatCurrency(totalIncome)}
            icon={TrendingUp}
            trend={trends.incomeTrend}
            index={0}
          />
          <KpiCard
            title="Despesas do mês"
            value={formatCurrency(totalExpenses)}
            icon={TrendingDown}
            trend={trends.expenseTrend}
            invertTrendColor
            index={1}
          />
          <KpiCard
            title="Saldo do mês"
            value={formatCurrency(balance)}
            icon={PiggyBank}
            trend={trends.balanceTrend}
            index={2}
          />
          <KpiCard
            title="Taxa de poupança"
            value={`${trends.savingsRate.toFixed(1)}%`}
            icon={Percent}
            trend={trends.savingsRateTrend}
            index={3}
          />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 space-y-6">
             <BalanceCard balance={balance} income={totalIncome} expenses={totalExpenses} />
              <IncomeExpenseChart transactions={allTransactions} />
              <FinancialHealthScore
                income={totalIncome}
                expenses={totalExpenses}
                debts={debtData || []}
                goals={goalData || []}
                transactions={allTransactions}
              />
              <FinancialInsightsCard financialData={financialDataForAI} />
          </div>
           <div className="lg:col-span-2 space-y-6">
            <ExpenseCategoryChart transactions={expenseData || []} />
            <RecentTransactionsList 
              transactions={allTransactions} 
              onAddTransaction={() => handleOpenSheet('expense')}
            />
          </div>
        </div>

        <div className="space-y-6">
            <OverdueDebtsCard debts={debtData || []} />
            <ExpenseCalendar expenses={expenseData || []} />
        </div>
      </motion.div>
    </>
  );
}


function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <motion.div 
        className="flex items-center justify-between"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full bg-slate-800/60" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-48 bg-slate-800/60" />
            <Skeleton className="h-4 w-32 bg-slate-800/60" />
          </div>
        </div>
        <Skeleton className="h-10 w-36 rounded-full bg-slate-800/60" />
      </motion.div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Skeleton className="h-24 w-full rounded-2xl bg-slate-800/60" />
          </motion.div>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <Skeleton className="h-44 w-full rounded-2xl bg-slate-800/60" />
          <Skeleton className="h-96 w-full rounded-2xl bg-slate-800/60" />
          <Skeleton className="h-64 w-full rounded-2xl bg-slate-800/60" />
        </div>
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-80 w-full rounded-2xl bg-slate-800/60" />
          <Skeleton className="h-[22rem] w-full rounded-2xl bg-slate-800/60" />
        </div>
      </div>
       <div className="space-y-6">
            <Skeleton className="h-48 w-full rounded-2xl bg-slate-800/60" />
            <Skeleton className="h-[450px] w-full rounded-2xl bg-slate-800/60" />
       </div>
    </div>
  )
}
