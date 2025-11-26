
'use client';

import { useMemo } from 'react';
import { PageHeader } from '@/components/page-header';
import { collection, query, where } from 'firebase/firestore';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import type { Recurrence } from '@/lib/types';
import { Loader2, Repeat, TrendingDown, TrendingUp, Film, HeartPulse, Cpu, Newspaper } from 'lucide-react';
import { RecurrenceCard } from '@/components/recurrences/recurrence-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Define as categorias e seus ícones
const subscriptionCategories = [
  { 
    title: 'Streaming & Mídia',
    keywords: ['Netflix', 'YouTube', 'Spotify', 'Amazon Prime', 'Disney+', 'HBO Max', 'Música', 'Filmes'],
    icon: Film,
  },
  { 
    title: 'Bem-estar & Academia',
    keywords: ['Academia', 'Gympass', 'Yoga', 'Meditação', 'Saúde'],
    icon: HeartPulse
  },
  { 
    title: 'Software & IAs',
    keywords: ['Software', 'Assinatura', 'IA', 'Adobe', 'Office', 'Nuvem', 'Produtividade'],
    icon: Cpu
  },
  {
    title: 'Notícias & Leitura',
    keywords: ['Jornal', 'Revista', 'Notícias', 'Kindle', 'Livros'],
    icon: Newspaper
  }
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

  const { totalIncome, totalExpenses, monthlyBalance, groupedExpenses } = useMemo(() => {
    const income = incomeData?.reduce((sum, item) => sum + item.amount, 0) || 0;
    const expenses = expenseData?.reduce((sum, item) => sum + item.amount, 0) || 0;

    const grouped: Record<string, Recurrence[]> = { 'Outras Assinaturas': [] };
    subscriptionCategories.forEach(cat => grouped[cat.title] = []);

    (expenseData || []).forEach(expense => {
      const foundCategory = subscriptionCategories.find(cat => 
        cat.keywords.some(keyword => 
          expense.category.toLowerCase().includes(keyword.toLowerCase()) || 
          expense.description.toLowerCase().includes(keyword.toLowerCase())
        )
      );
      
      if (foundCategory) {
        grouped[foundCategory.title].push(expense);
      } else {
        grouped['Outras Assinaturas'].push(expense);
      }
    });

    return {
      totalIncome: income,
      totalExpenses: expenses,
      monthlyBalance: income - expenses,
      groupedExpenses: grouped
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

  const allCategories = [...subscriptionCategories, { title: 'Outras Assinaturas', icon: Repeat, keywords: [] }];

  return (
    <>
      <PageHeader
        title="Streams & Assinaturas"
        description="Gerencie suas despesas recorrentes (assinaturas, mensalidades, etc.) em um só lugar."
      />

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
        {allCategories.map(({ title, icon: Icon }) => {
          const items = groupedExpenses[title];
          if (!items || items.length === 0) return null;
          
          const categoryTotal = items.reduce((sum, item) => sum + item.amount, 0);

          return (
             <Card key={title}>
              <CardHeader>
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">{title}</CardTitle>
                   </div>
                   <Badge variant="secondary">{formatCurrency(categoryTotal)}/mês</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {items.map((item) => (
                      <RecurrenceCard key={item.id} recurrence={item} />
                    ))}
                </div>
              </CardContent>
            </Card>
          )
        })}

        {Object.values(groupedExpenses).every(arr => arr.length === 0) && (
             <div className="flex h-40 items-center justify-center rounded-lg border-2 border-dashed p-8 text-center">
              <p className="text-sm text-muted-foreground">Nenhuma despesa recorrente encontrada. Adicione uma na tela de Despesas.</p>
            </div>
        )}
      </div>
    </>
  );
}
