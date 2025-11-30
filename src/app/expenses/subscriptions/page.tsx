'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { collection, query, where } from 'firebase/firestore';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import type { Recurrence } from '@/lib/types';
import { Loader2, Film, HeartPulse, Cpu, Newspaper, Repeat, PlusCircle, Upload } from 'lucide-react';
import { RecurrenceCard } from '@/components/recurrences/recurrence-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AddSubscriptionSheet } from '@/components/subscriptions/add-subscription-sheet';
import { ImportTransactionsSheet } from '@/components/transactions/import-transactions-sheet';
import { PageHeader } from '@/components/page-header';

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

export default function SubscriptionsPage() {
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [isImportSheetOpen, setIsImportSheetOpen] = useState(false);
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const recurringExpensesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, `users/${user.uid}/expenses`), where('isRecurring', '==', true));
  }, [firestore, user]);

  const { data: expenseData, isLoading: isExpensesLoading } = useCollection<Recurrence>(recurringExpensesQuery);

  const { groupedExpenses } = useMemo(() => {
    const grouped: Record<string, Recurrence[]> = { 'Outras Assinaturas': [] };
    subscriptionCategories.forEach(cat => { grouped[cat.title] = [] });
    
    // Explicit keywords for items that are NOT subscriptions
    const nonSubscriptionKeywords = [
        'Moradia', 'Aluguel', 'Condomínio', 'Hipoteca', 
        'Luz', 'Água', 'Gás', 'Internet', 'Celular', 'Plano',
        'IPTU', 'IPVA', 'Seguro Residencial', 'Seguro de Carro'
    ].map(k => k.toLowerCase());

    (expenseData || []).forEach(expense => {
      const expenseDescription = expense.description.toLowerCase();
      const expenseCategory = expense.category.toLowerCase();

      // First, check if this is explicitly NOT a subscription
      const isNonSubscription = nonSubscriptionKeywords.some(keyword => 
        expenseCategory.includes(keyword) || 
        expenseDescription.includes(keyword)
      );
      
      if (isNonSubscription) {
          return; // Skip this expense entirely
      }

      // If not excluded, try to find a matching subscription category
      const foundCategory = subscriptionCategories.find(cat => 
        cat.keywords.some(keyword => 
          expenseCategory.includes(keyword.toLowerCase()) || 
          expenseDescription.includes(keyword.toLowerCase())
        )
      );
      
      if (foundCategory) {
        grouped[foundCategory.title].push(expense);
      } else {
        // If it's not a non-subscription and doesn't fit any main category, it's an "Other" subscription.
        grouped['Outras Assinaturas'].push(expense);
      }
    });

    return { groupedExpenses: grouped };
  }, [expenseData]);

  const isLoading = isUserLoading || isExpensesLoading;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  const handleOpenSheet = () => {
    setIsAddSheetOpen(true);
  };

  const handleCloseSheet = () => {
    setIsAddSheetOpen(false);
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const allCategories = [...subscriptionCategories, { title: 'Outras Assinaturas', icon: Repeat, keywords: [] }];

  return (
    <>
       <AddSubscriptionSheet
        isOpen={isAddSheetOpen}
        onClose={handleCloseSheet}
      />
       <ImportTransactionsSheet 
        isOpen={isImportSheetOpen}
        onClose={() => setIsImportSheetOpen(false)}
      />
      <PageHeader
        title="Streams & Assinaturas"
        description="Gerencie seus serviços recorrentes de streaming, software e outros."
      >
        <div className="flex gap-2">
          <Button onClick={() => setIsAddSheetOpen(true)} disabled={!user}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Nova Assinatura
          </Button>
          <Button variant="outline" onClick={() => setIsImportSheetOpen(true)} disabled={!user}>
            <Upload className="mr-2 h-4 w-4" />
            Importar PDF com IA
          </Button>
        </div>
      </PageHeader>


      <div className="space-y-6 mt-4">
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
             <div className="flex h-40 flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center">
              <h3 className="font-semibold">Nenhuma assinatura encontrada</h3>
              <p className="mt-1 text-sm text-muted-foreground">Clique em "Adicionar Assinatura" para começar a organizar seus serviços.</p>
            </div>
        )}
      </div>
    </>
  );
}
