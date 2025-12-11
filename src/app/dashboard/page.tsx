'use client';

import { useState, useMemo } from 'react';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { Landmark, CreditCard, Scale, PiggyBank } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import type { Transaction, Debt, Goal } from '@/lib/types';
import { startOfMonth, endOfMonth, format, subMonths, addMonths } from 'date-fns';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { AddTransactionSheet } from '@/components/transactions/add-transaction-sheet';
import { AddDebtSheet } from '@/components/debts/add-debt-sheet';
import { AddGoalSheet } from '@/components/goals/add-goal-sheet';
import { incomeCategories, expenseCategories } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useDashboardDate } from '@/context/dashboard-date-context';
import { RecentTransactionsList } from './_components/recent-transactions-list';
import { BalanceCard } from './_components/balance-card';
import { DashboardHeader } from './_components/dashboard-header';

export default function DashboardPage() {
  const { selectedDate } = useDashboardDate();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [sheetType, setSheetType] = useState<'income' | 'expense' | 'debt' | 'goal' | null>(null);

  const { start, end } = useMemo(() => {
    const start = startOfMonth(selectedDate);
    const end = endOfMonth(selectedDate);
    return { start, end };
  }, [selectedDate]);

  // Queries
  const transactionsQuery = useMemoFirebase(() => {
    if (!user) return null;
    const oneMonthAgo = subMonths(end, 1);
    return query(
      collection(firestore, `users/${user.uid}/expenses`), // Fetch all for recent list
      orderBy('date', 'desc')
    );
  }, [firestore, user, end]);

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
  const { data: recentTransactions, isLoading: isTransactionsLoading } = useCollection<Transaction>(transactionsQuery);
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

  const handleOpenSheet = (type: 'income' | 'expense' | 'debt' | 'goal') => {
    setSheetType(type);
    setIsSheetOpen(true);
  };
  
  const handleCloseSheet = () => {
    setIsSheetOpen(false);
    setSheetType(null);
  };

  const isLoading = isUserLoading || isIncomeLoading || isExpensesLoading || isTransactionsLoading;

  if (isLoading) {
    return <DashboardSkeleton />;
  }
  
  return (
    <>
      <AddTransactionSheet
        isOpen={isSheetOpen && (sheetType === 'income' || sheetType === 'expense')}
        onClose={handleCloseSheet}
        transactionType={sheetType === 'income' ? 'income' : 'expense'}
        categories={sheetType === 'income' ? incomeCategories : expenseCategories}
      />
      <AddDebtSheet
        isOpen={isSheetOpen && sheetType === 'debt'}
        onClose={handleCloseSheet}
      />
      <AddGoalSheet 
        isOpen={isSheetOpen && sheetType === 'goal'} 
        onClose={handleCloseSheet}
      />
    
      <div className="space-y-6">
        <DashboardHeader />

        <div className="space-y-4">
          <BalanceCard balance={balance} income={totalIncome} expenses={totalExpenses} />
          <QuickActions
              onAddIncome={() => handleOpenSheet('income')}
              onAddExpense={() => handleOpenSheet('expense')}
              onAddDebt={() => handleOpenSheet('debt')}
              onAddGoal={() => handleOpenSheet('goal')}
          />
        </div>
        
        <RecentTransactionsList transactions={recentTransactions ?? []} />
      </div>
    </>
  );
}


function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>

      {/* Balance Card Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-40" />
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
             <Skeleton className="h-4 w-16" />
             <Skeleton className="h-6 w-24" />
          </div>
           <div className="space-y-1 text-right">
             <Skeleton className="h-4 w-16 ml-auto" />
             <Skeleton className="h-6 w-24 ml-auto" />
          </div>
        </CardContent>
      </Card>
      
      {/* Quick Actions Skeleton */}
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>

      {/* Recent Transactions Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <Skeleton className="h-5 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>

    </div>
  )
}
