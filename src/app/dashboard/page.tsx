'use client';

import { useState, useMemo } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import type { Transaction, Debt, Goal } from '@/lib/types';
import { startOfMonth, endOfMonth, format } from 'date-fns';
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
  
  const allTransactions = useMemo(() => [...(incomeData || []), ...(expenseData || [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [incomeData, expenseData]);

  const financialDataForAI = useMemo(() => ({
    userName: user?.firstName || '',
    incomes: incomeData || [],
    expenses: expenseData || [],
    debts: debtData || [],
    goals: goalData || [],
  }), [user, incomeData, expenseData, debtData, goalData]);


  const handleOpenSheet = (type: 'income' | 'expense' | 'debt' | 'goal' | 'budget') => {
    setSheetType(type);
  };
  
  const handleCloseSheet = () => {
    setSheetType(null);
  };

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
    
      <div className="relative space-y-6">
        <DashboardHeader 
          onAddIncome={() => handleOpenSheet('income')}
          onAddExpense={() => handleOpenSheet('expense')}
          onAddDebt={() => handleOpenSheet('debt')}
          onAddGoal={() => handleOpenSheet('goal')}
        />
        
        <BalanceCard balance={balance} income={totalIncome} expenses={totalExpenses} />
        
        <OverdueDebtsCard debts={debtData || []} />

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 space-y-6">
                <IncomeExpenseChart transactions={allTransactions} />
                <FinancialHealthScore
                  income={totalIncome}
                  expenses={totalExpenses}
                  debts={debtData || []}
                  goals={goalData || []}
                  transactions={allTransactions}
                />
            </div>
            <div className="lg:col-span-2 space-y-6">
                <ExpenseCategoryChart transactions={expenseData || []} />
                 <RecentTransactionsList transactions={allTransactions} />
            </div>
        </div>
        
         <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3">
                <FinancialInsightsCard financialData={financialDataForAI} />
            </div>
            <div className="lg:col-span-2">
                <ExpenseCalendar expenses={expenseData || []} />
            </div>
        </div>

      </div>
    </>
  );
}


function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
             <Skeleton className="h-12 w-12 rounded-full bg-slate-800/60" />
            <div className="space-y-2">
                <Skeleton className="h-7 w-48 bg-slate-800/60" />
                <Skeleton className="h-4 w-32 bg-slate-800/60" />
            </div>
          </div>
        <Skeleton className="h-10 w-36 rounded-full bg-slate-800/60" />
      </div>

      <Skeleton className="h-44 w-full rounded-2xl bg-slate-800/60" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Skeleton className="h-96 w-full rounded-2xl bg-slate-800/60" />
        </div>
        <div className="lg:col-span-2">
           <Skeleton className="h-96 w-full rounded-2xl bg-slate-800/60" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Skeleton className="h-96 w-full rounded-2xl bg-slate-800/60" />
        <Skeleton className="h-96 w-full rounded-2xl bg-slate-800/60" />
      </div>
    </div>
  )
}
