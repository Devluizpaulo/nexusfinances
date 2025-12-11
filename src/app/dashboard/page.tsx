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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDashboardDate } from '@/context/dashboard-date-context';
import { RecentTransactionsList } from './_components/recent-transactions-list';
import { BalanceCard } from './_components/balance-card';
import { DashboardHeader } from './_components/dashboard-header';
import { FinancialHealthScore } from '@/components/dashboard/financial-health-score';
import { IncomeExpenseChart } from '@/components/dashboard/income-expense-chart';
import { OverdueDebtsCard } from '@/components/dashboard/overdue-debts-card';
import { ExpenseCalendar } from './_components/expense-calendar';
import { GetFinancialInsightsOutput } from '@/ai/flows/financial-insights-flow';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';
import { getFinancialInsights } from '@/ai/flows/financial-insights-flow';
import { useToast } from '@/hooks/use-toast';

function FinancialInsightAnalysis({ analysis }: { analysis: GetFinancialInsightsOutput | null }) {
  if (!analysis) return null;
  return (
    <Card className="bg-primary/5 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Sparkles className="h-5 w-5" />
          Análise do Mês
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-foreground/80">{analysis.summary}</p>
        <ul className="space-y-2">
          {analysis.actionPoints.map((point, index) => (
            <li key={index} className="flex items-start gap-2 text-xs">
              <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { selectedDate } = useDashboardDate();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  
  const [sheetType, setSheetType] = useState<'income' | 'expense' | 'debt' | 'goal' | 'budget' | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<GetFinancialInsightsOutput | null>(null);


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
  
  const allTransactions = useMemo(() => [...(incomeData || []), ...(expenseData || [])], [incomeData, expenseData]);

  const handleGenerateInsights = async () => {
    if (!user) return;
    setIsAiLoading(true);
    setAiAnalysis(null);
    try {
      const insights = await getFinancialInsights({
        userName: user.displayName?.split(' ')[0] || 'Usuário',
        incomes: incomeData || [],
        expenses: expenseData || [],
        debts: debtData || [],
        goals: goalData || [],
      });
      if (insights) {
        setAiAnalysis(insights);
      } else {
        throw new Error('A análise não retornou dados.');
      }
    } catch (error) {
      console.error('Error generating AI insights:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao gerar análise',
        description: 'Não foi possível obter os insights. Tente novamente mais tarde.',
      });
    } finally {
      setIsAiLoading(false);
    }
  };


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

        <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr,320px]">
          <div className="space-y-6">
            <BalanceCard balance={balance} income={totalIncome} expenses={totalExpenses} />
            <OverdueDebtsCard debts={debtData || []} />
             <Button onClick={handleGenerateInsights} disabled={isAiLoading} variant="outline" className="w-full">
              {isAiLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              {isAiLoading ? 'Analisando suas finanças...' : 'Gerar Análise com IA'}
            </Button>
            {aiAnalysis && <FinancialInsightAnalysis analysis={aiAnalysis} />}
            <RecentTransactionsList transactions={allTransactions} />
          </div>

          <div className="space-y-6">
             <div className="sticky top-20">
                <ExpenseCalendar expenses={expenseData || []} />
             </div>
             <FinancialHealthScore 
                income={totalIncome} 
                expenses={totalExpenses} 
                debts={debtData || []} 
                goals={goalData || []}
                transactions={expenseData || []}
              />
          </div>
        </div>
        
        <IncomeExpenseChart transactions={allTransactions} />
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

      <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr,320px]">
        <div className="space-y-6">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
         <div className="space-y-6">
            <Skeleton className="h-80 w-full rounded-xl" />
         </div>
      </div>
      
       <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  )
}
