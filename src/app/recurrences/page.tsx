
'use client';

import { useMemo } from 'react';
import { collection, query, where } from 'firebase/firestore';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import type { Recurrence } from '@/lib/types';
import { Loader2, Repeat, TrendingDown, TrendingUp, Home, Zap } from 'lucide-react';
import { RecurrenceCard } from '@/components/recurrences/recurrence-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Define as categorias e seus ícones
const mainRecurringCategories = [
  { 
    title: 'Moradia',
    keywords: ['aluguel', 'condomínio', 'hipoteca', 'iptu'],
    icon: Home,
  },
  {
    title: 'Contas de Consumo',
    keywords: ['luz', 'energia', 'água', 'gás', 'internet', 'celular', 'plano', 'fatura'],
    icon: Zap,
  },
];

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

  const { totalIncome, totalExpenses, monthlyBalance, otherRecurrences } = useMemo(() => {
    const income = incomeData?.reduce((sum, item) => sum + item.amount, 0) || 0;
    const expenses = expenseData?.reduce((sum, item) => sum + item.amount, 0) || 0;

    const allCategorizedKeywords = mainRecurringCategories.flatMap(c => c.keywords);
    const streamingKeywords = ['netflix', 'youtube', 'spotify', 'amazon prime', 'disney+', 'hbo max', 'música', 'filmes', 'software', 'assinatura', 'ia', 'adobe', 'office', 'nuvem', 'produtividade', 'jornal', 'revista', 'notícias', 'kindle', 'livros'];
    
    const others = (expenseData || []).filter(expense => {
        const description = expense.description.toLowerCase();
        const category = expense.category.toLowerCase();
        
        const isMainCategory = allCategorizedKeywords.some(keyword => category.includes(keyword) || description.includes(keyword));
        const isStreaming = streamingKeywords.some(keyword => category.includes(keyword) || description.includes(keyword));

        return !isMainCategory && !isStreaming;
    });

    return {
      totalIncome: income,
      totalExpenses: expenses,
      monthlyBalance: income - expenses,
      otherRecurrences: others
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
      <div className="mb-8 grid gap-4 md:grid-cols-3">
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
            <CardTitle className="text-sm font-medium">Balanço Recorrente</CardTitle>
            <Repeat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${monthlyBalance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {formatCurrency(monthlyBalance)}
            </div>
            <p className="text-xs text-muted-foreground">O impacto mensal das suas recorrências.</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Repeat className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Outras Recorrências</CardTitle>
                </div>
            </div>
          </CardHeader>
          <CardContent>
            {otherRecurrences.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {otherRecurrences.map((item) => (
                      <RecurrenceCard key={item.id} recurrence={item} />
                    ))}
                </div>
            ) : (
                <div className="flex h-40 items-center justify-center rounded-lg border-2 border-dashed p-8 text-center">
                  <p className="text-sm text-muted-foreground">Nenhuma outra despesa recorrente encontrada.</p>
                </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
