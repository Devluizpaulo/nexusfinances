'use client';

import { useMemo } from 'react';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { Banknote, Landmark, CreditCard, Wallet, Loader2 } from 'lucide-react';
import { IncomeExpenseChart } from '@/components/dashboard/income-expense-chart';
import { ExpenseCategoryChart } from '@/components/dashboard/expense-category-chart';
import { AiInsights } from '@/components/dashboard/ai-insights';
import type { FinancialInsightsInput } from '@/ai/flows/financial-insights-generator';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { Transaction, Debt } from '@/lib/types';
import { useManageRecurrences } from '@/hooks/useManageRecurrences';
import { OverdueDebtsCard } from '@/components/dashboard/overdue-debts-card';

export default function DashboardPage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  useManageRecurrences();

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

  const { data: incomeData, isLoading: isIncomeLoading } = useCollection<Transaction>(transactionsQuery);
  const { data: expenseData, isLoading: isExpensesLoading } = useCollection<Transaction>(expensesQuery);
  const { data: debtData, isLoading: isDebtsLoading } = useCollection<Debt>(debtsQuery);

  const allTransactions = useMemo(() => {
    return [...(incomeData || []), ...(expenseData || [])];
  }, [incomeData, expenseData]);


  const { totalIncome, totalExpenses, totalDebt, savings, spendingByCategory } = useMemo(() => {
    const totalIncome = incomeData?.reduce((sum, t) => sum + t.amount, 0) || 0;
    const totalExpenses = expenseData?.reduce((sum, t) => sum + t.amount, 0) || 0;
    const totalDebt = debtData?.reduce((sum, d) => sum + (d.totalAmount - (d.paidAmount || 0)), 0) || 0;
    const savings = totalIncome - totalExpenses;

    const spendingByCategory = expenseData?.reduce((acc, t) => {
        if (!acc[t.category]) {
          acc[t.category] = 0;
        }
        acc[t.category] += t.amount;
        return acc;
      }, {} as Record<string, number>) || {};

    return { totalIncome, totalExpenses, totalDebt, savings, spendingByCategory };
  }, [incomeData, expenseData, debtData]);


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };
  
  const financialData: FinancialInsightsInput = {
    income: totalIncome,
    expenses: totalExpenses,
    debts: totalDebt,
    savings: savings,
    spendingByCategory: spendingByCategory,
    savingsGoals: { 'Carro Novo': 25000, 'Férias': 5000 },
  };

  const isLoading = isUserLoading || isIncomeLoading || isExpensesLoading || isDebtsLoading;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
       <OverdueDebtsCard debts={debtData || []} />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Renda Total"
          value={formatCurrency(totalIncome)}
          icon={Landmark}
          description="Renda total neste período"
        />
        <KpiCard
          title="Despesas Totais"
          value={formatCurrency(totalExpenses)}
          icon={CreditCard}
          description="Despesas totais neste período"
        />
        <KpiCard
          title="Economias"
          value={formatCurrency(savings)}
          icon={Wallet}
          description="Renda menos despesas"
        />
        <KpiCard
          title="Dívida Pendente"
          value={formatCurrency(totalDebt)}
          icon={Banknote}
          description="Saldo devedor total restante"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <IncomeExpenseChart transactions={allTransactions} />
        </div>
        <div className="lg:col-span-2">
          <ExpenseCategoryChart transactions={expenseData || []} />
        </div>
      </div>

      <div>
        <AiInsights financialData={financialData} />
      </div>
    </div>
  );
}
