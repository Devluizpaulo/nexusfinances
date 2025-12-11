'use client';

import { useState, useMemo } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import type { Transaction, Debt, Goal } from '@/lib/types';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { QuickActions } from '@/components/dashboard/quick-actions';
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
import { Loader2 } from 'lucide-react';
import { ExpenseCategoryChart } from '@/components/dashboard/expense-category-chart';
import { FinancialHealthScore } from '@/components/dashboard/financial-health-score';
import { OverdueDebtsCard } from '@/components/dashboard/overdue-debts-card';

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
    
      <div className="space-y-6">
        <DashboardHeader />
        
        <OverdueDebtsCard debts={debtData || []} />
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <BalanceCard balance={balance} income={totalIncome} expenses={totalExpenses} />
          </div>
          <FinancialHealthScore
            income={totalIncome}
            expenses={totalExpenses}
            debts={debtData || []}
            goals={goalData || []}
            transactions={allTransactions}
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
           <div className="lg:col-span-2">
            <IncomeExpenseChart transactions={allTransactions} />
           </div>
           <RecentTransactionsList transactions={allTransactions} />
        </div>
         <ExpenseCategoryChart transactions={expenseData || []} />
      </div>

       <div className="fixed bottom-6 right-6 z-40">
        <QuickActions
          onAddIncome={() => handleOpenSheet('income')}
          onAddExpense={() => handleOpenSheet('expense')}
          onAddDebt={() => handleOpenSheet('debt')}
          onAddGoal={() => handleOpenSheet('goal')}
          onAddBudget={() => handleOpenSheet('budget')}
        />
      </div>
    </>
  );
}


function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
            <Skeleton className="h-11 w-11 rounded-full" />
            <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-24" />
            </div>
        </div>
        <Skeleton className="h-10 w-36 rounded-full" />
      </div>
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  )
}
