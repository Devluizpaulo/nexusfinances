'use client';

import { useMemo } from 'react';
import { PageHeader } from '@/components/page-header';
import { collection, query, where } from 'firebase/firestore';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import type { Recurrence, Transaction } from '@/lib/types';
import { Loader2, Repeat, TrendingDown, TrendingUp } from 'lucide-react';
import { RecurrenceCard } from '@/components/recurrences/recurrence-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function RecurrencesPage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const recurringIncomesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, `users/${user.uid}/incomes`), where('isRecurring', '==', true));
  }, [firestore, user]);

  const recurringExpensesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, `users/${user.uid}/expenses`), where('isRecurring', '==', true));
  }, [firestore, user]);

  const { data: incomeData, isLoading: isIncomeLoading } = useCollection<Recurrence>(recurringIncomesQuery);
  const { data: expenseData, isLoading: isExpensesLoading } = useCollection<Recurrence>(recurringExpensesQuery);

  const { totalIncome, totalExpenses, monthlyBalance } = useMemo(() => {
    const income = incomeData?.reduce((sum, item) => sum + item.amount, 0) || 0;
    const expenses = expenseData?.reduce((sum, item) => sum + item.amount, 0) || 0;
    return {
      totalIncome: income,
      totalExpenses: expenses,
      monthlyBalance: income - expenses,
    };
  }, [incomeData, expenseData]);

  const isLoading = isUserLoading || isIncomeLoading || isExpensesLoading;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return (
    <>
      <PageHeader
        title="Streams & Assinaturas"
        description="Gerencie suas despesas recorrentes (assinaturas, mensalidades, etc.) em um só lugar."
      />

      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Renda Recorrente Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{formatCurrency(totalIncome)}</div>
            <p className="text-xs text-muted-foreground">Soma de todas as suas entradas mensais fixas.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesa Recorrente Total</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</div>
            <p className="text-xs text-muted-foreground">Soma de todas as suas saídas mensais fixas.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Balanço Recorrente</CardTitle>
            <Repeat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${monthlyBalance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {formatCurrency(monthlyBalance)}
            </div>
            <p className="text-xs text-muted-foreground">A diferença entre suas recorrências de renda e despesa.</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <h2 className="text-xl font-semibold mb-4">Rendas Recorrentes</h2>
          {incomeData && incomeData.length > 0 ? (
            <div className="space-y-4">
              {incomeData.map((item) => (
                <RecurrenceCard key={item.id} recurrence={item} />
              ))}
            </div>
          ) : (
            <div className="flex h-40 items-center justify-center rounded-lg border-2 border-dashed p-8 text-center">
              <p className="text-sm text-muted-foreground">Nenhuma renda recorrente encontrada.</p>
            </div>
          )}
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-4">Despesas Recorrentes</h2>
          {expenseData && expenseData.length > 0 ? (
            <div className="space-y-4">
              {expenseData.map((item) => (
                <RecurrenceCard key={item.id} recurrence={item} />
              ))}
            </div>
          ) : (
            <div className="flex h-40 items-center justify-center rounded-lg border-2 border-dashed p-8 text-center">
              <p className="text-sm text-muted-foreground">Nenhuma despesa recorrente encontrada.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
