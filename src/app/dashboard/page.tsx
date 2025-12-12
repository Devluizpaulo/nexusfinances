
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
import { ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { ExpenseCategoryChart } from '@/components/dashboard/expense-category-chart';
import { FinancialHealthScore } from '@/components/dashboard/financial-health-score';
import { OverdueDebtsCard } from '@/components/dashboard/overdue-debts-card';
import { ExpenseCalendar } from './_components/expense-calendar';
import { formatCurrency } from '@/lib/utils';

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
    
      <div className="space-y-6 bg-slate-950/60 p-1 rounded-3xl sm:p-2">
        <div className="space-y-4 rounded-3xl border border-slate-900/60 bg-gradient-to-b from-slate-950/90 to-slate-900/70 px-4 py-4 sm:px-6 sm:py-5 shadow-[0_18px_45px_-30px_rgba(15,23,42,1)]">
          <DashboardHeader />

          <div className="mt-4 grid gap-4 md:grid-cols-3 items-stretch">
            <div className="md:col-span-2">
              <BalanceCard balance={balance} income={totalIncome} expenses={totalExpenses} />
            </div>

            <div className="grid gap-4 md:grid-rows-2">
              <div className="flex flex-col justify-between rounded-2xl border border-slate-800/80 bg-slate-950/80 p-4 sm:p-5 shadow-[0_18px_45px_-30px_rgba(15,23,42,1)] transition hover:border-slate-700/80 hover:bg-slate-900/90">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Entradas no mês</span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-500/30">
                    <ArrowUpCircle className="h-5 w-5 text-emerald-300" />
                  </div>
                </div>
                <p className="mt-2 text-2xl font-semibold text-emerald-300">
                  {formatCurrency(totalIncome)}
                </p>
                <span className="mt-1 text-[11px] text-slate-500">Total de receitas registradas no período.</span>
              </div>

              <div className="flex flex-col justify-between rounded-2xl border border-slate-800/80 bg-slate-950/80 p-4 sm:p-5 shadow-[0_18px_45px_-30px_rgba(15,23,42,1)] transition hover:border-slate-700/80 hover:bg-slate-900/90">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Despesas no mês</span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-500/20 border border-rose-500/30">
                    <ArrowDownCircle className="h-5 w-5 text-rose-300" />
                  </div>
                </div>
                <p className="mt-2 text-2xl font-semibold text-rose-300">
                  {formatCurrency(totalExpenses)}
                </p>
                <span className="mt-1 text-[11px] text-slate-500">Somatório das suas saídas neste período.</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-2xl border border-slate-900/60 bg-slate-950/70 p-4 sm:p-5 shadow-[0_18px_45px_-30px_rgba(15,23,42,1)]">
            <IncomeExpenseChart transactions={allTransactions} />
          </div>
          <div className="rounded-2xl border border-slate-900/60 bg-slate-950/70 p-4 sm:p-5 shadow-[0_18px_45px_-30px_rgba(15,23,42,1)]">
              <FinancialHealthScore
                income={totalIncome}
                expenses={totalExpenses}
                debts={debtData || []}
                goals={goalData || []}
                transactions={allTransactions}
              />
            </div>
        </div>

        <div className="hidden lg:block rounded-2xl border border-slate-900/60 bg-slate-950/70 p-4 sm:p-5 shadow-[0_18px_45px_-30px_rgba(15,23,42,1)]">
          <ExpenseCalendar expenses={expenseData || []} />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-900/60 bg-slate-950/70 p-4 sm:p-5 shadow-[0_18px_45px_-30px_rgba(15,23,42,1)]">
            <RecentTransactionsList transactions={allTransactions} />
          </div>
          <div className="rounded-2xl border border-slate-900/60 bg-slate-950/70 p-4 sm:p-5 shadow-[0_18px_45px_-30px_rgba(15,23,42,1)]">
            <ExpenseCategoryChart transactions={expenseData || []} />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-900/60 bg-slate-950/70 p-4 sm:p-5 shadow-[0_18px_45px_-30px_rgba(15,23,42,1)]">
          <OverdueDebtsCard debts={debtData || []} />
        </div>
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
    <div className="space-y-6 bg-slate-950/60 p-1 rounded-3xl sm:p-2 animate-pulse">
      <div className="space-y-4 rounded-3xl border border-slate-900/60 bg-gradient-to-b from-slate-950/90 to-slate-900/70 px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-11 w-11 rounded-full bg-slate-800/60" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-32 bg-slate-800/60" />
              <Skeleton className="h-4 w-24 bg-slate-800/60" />
            </div>
          </div>
          <Skeleton className="h-10 w-36 rounded-full bg-slate-800/60" />
        </div>
        <Skeleton className="h-40 w-full rounded-2xl bg-slate-800/60" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Skeleton className="h-96 w-full rounded-2xl bg-slate-800/60" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-80 w-full rounded-2xl bg-slate-800/60" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Skeleton className="h-96 w-full rounded-2xl bg-slate-800/60" />
        <Skeleton className="h-96 w-full rounded-2xl bg-slate-800/60" />
      </div>
    </div>
  )
}
