'use client';

import { useState, useMemo } from 'react';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { Banknote, Landmark, CreditCard, Scale, Loader2 } from 'lucide-react';
import { IncomeExpenseChart } from '@/components/dashboard/income-expense-chart';
import { ExpenseCategoryChart } from '@/components/dashboard/expense-category-chart';
import { AiInsights } from '@/components/dashboard/ai-insights';
import type { FinancialInsightsInput } from '@/ai/flows/financial-insights-generator';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { Transaction, Debt, Goal, IncomeCategory, ExpenseCategory } from '@/lib/types';
import { useManageRecurrences } from '@/hooks/useManageRecurrences';
import { OverdueDebtsCard } from '@/components/dashboard/overdue-debts-card';
import { DateRangePicker } from '@/components/dashboard/date-range-picker';
import { startOfMonth, endOfMonth, parseISO, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { AddTransactionSheet } from '@/components/transactions/add-transaction-sheet';
import { AddDebtSheet } from '@/components/debts/add-debt-sheet';
import { AddGoalSheet } from '@/components/goals/add-goal-sheet';
import { incomeCategories, expenseCategories } from '@/lib/types';


export default function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  useManageRecurrences();

  const [isIncomeSheetOpen, setIsIncomeSheetOpen] = useState(false);
  const [isExpenseSheetOpen, setIsExpenseSheetOpen] = useState(false);
  const [isDebtSheetOpen, setIsDebtSheetOpen] = useState(false);
  const [isGoalSheetOpen, setIsGoalSheetOpen] = useState(false);

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

  const { data: allIncomeData, isLoading: isIncomeLoading } = useCollection<Transaction>(transactionsQuery);
  const { data: allExpenseData, isLoading: isExpensesLoading } = useCollection<Transaction>(expensesQuery);
  const { data: debtData, isLoading: isDebtsLoading } = useCollection<Debt>(debtsQuery);
  
  const { incomeData, expenseData } = useMemo(() => {
    const start = startOfMonth(selectedDate);
    const end = endOfMonth(selectedDate);
    
    const filterByMonth = (data: Transaction[] | null) => {
        if (!data) return [];
        return data.filter(t => {
            const transactionDate = parseISO(t.date);
            return transactionDate >= start && transactionDate <= end;
        });
    }

    return {
        incomeData: filterByMonth(allIncomeData),
        expenseData: filterByMonth(allExpenseData)
    };
}, [selectedDate, allIncomeData, allExpenseData]);


  const allTransactions = useMemo(() => {
    return [...(allIncomeData || []), ...(allExpenseData || [])];
  }, [allIncomeData, allExpenseData]);


  const { totalIncome, totalExpenses, totalDebt, balance, spendingByCategory } = useMemo(() => {
    const totalIncome = incomeData?.reduce((sum, t) => sum + t.amount, 0) || 0;
    const totalExpenses = expenseData?.reduce((sum, t) => sum + t.amount, 0) || 0;
    const totalDebt = debtData?.reduce((sum, d) => sum + (d.totalAmount - (d.paidAmount || 0)), 0) || 0;
    
    const allTimeIncome = allIncomeData?.reduce((sum, t) => sum + t.amount, 0) || 0;
    const allTimeExpenses = allExpenseData?.reduce((sum, t) => sum + t.amount, 0) || 0;
    const balance = allTimeIncome - allTimeExpenses;

    const spendingByCategory = expenseData?.reduce((acc, t) => {
        if (!acc[t.category]) {
          acc[t.category] = 0;
        }
        acc[t.category] += t.amount;
        return acc;
      }, {} as Record<string, number>) || {};

    return { totalIncome, totalExpenses, totalDebt, balance, spendingByCategory };
  }, [incomeData, expenseData, debtData, allIncomeData, allExpenseData]);


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
    savings: totalIncome - totalExpenses,
    spendingByCategory: spendingByCategory,
    savingsGoals: { 'Carro Novo': 25000, 'Férias': 5000 },
  };

  const isLoading = isUserLoading || isIncomeLoading || isExpensesLoading || isDebtsLoading;
  const descriptionPeriod = `em ${format(selectedDate, 'MMMM/yyyy', { locale: ptBR })}`;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <AddTransactionSheet
        isOpen={isIncomeSheetOpen}
        onClose={() => setIsIncomeSheetOpen(false)}
        transactionType="income"
        categories={incomeCategories}
      />
      <AddTransactionSheet
        isOpen={isExpenseSheetOpen}
        onClose={() => setIsExpenseSheetOpen(false)}
        transactionType="expense"
        categories={expenseCategories}
      />
      <AddDebtSheet
        isOpen={isDebtSheetOpen}
        onClose={() => setIsDebtSheetOpen(false)}
      />
      <AddGoalSheet
        isOpen={isGoalSheetOpen}
        onClose={() => setIsGoalSheetOpen(false)}
      />
      <div className="space-y-6">
        <div className="flex justify-center">
          <DateRangePicker date={selectedDate} onDateChange={setSelectedDate} />
        </div>

        <QuickActions
          onAddIncome={() => setIsIncomeSheetOpen(true)}
          onAddExpense={() => setIsExpenseSheetOpen(true)}
          onAddDebt={() => setIsDebtSheetOpen(true)}
          onAddGoal={() => setIsGoalSheetOpen(true)}
        />

        <OverdueDebtsCard debts={debtData || []} />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            title="Renda Total"
            value={formatCurrency(totalIncome)}
            icon={Landmark}
            description={`Renda total ${descriptionPeriod}`}
          />
          <KpiCard
            title="Despesas Totais"
            value={formatCurrency(totalExpenses)}
            icon={CreditCard}
            description={`Despesas totais ${descriptionPeriod}`}
          />
          <KpiCard
            title="Balanço Geral"
            value={formatCurrency(balance)}
            icon={Scale}
            description="Balanço total de todas as transações"
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
    </>
  );
}
