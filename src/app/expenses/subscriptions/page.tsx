
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

// Define as categorias e seus ícones
const subscriptionCategories = [
  { 
    id: 'media',
    title: 'Mídia & Streaming',
    keywords: ['Netflix', 'YouTube', 'Spotify', 'Amazon Prime', 'Disney+', 'HBO Max', 'Música', 'Filmes', 'Jornal', 'Revista', 'Notícias', 'Kindle', 'Livros'],
    icon: Film,
  },
  { 
    id: 'software',
    title: 'Software & IAs',
    keywords: ['Software', 'Assinatura', 'IA', 'Adobe', 'Office', 'Nuvem', 'Produtividade', 'Notion', 'ChatGPT'],
    icon: Cpu
  },
  { 
    id: 'services',
    title: 'Outros Serviços',
    keywords: ['Academia', 'Gympass', 'Yoga', 'Meditação', 'Saúde'],
    icon: Repeat,
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

  const groupedExpenses = useMemo(() => {
    const grouped: Record<string, Recurrence[]> = {
      media: [],
      software: [],
      services: []
    };
    
    const nonSubscriptionKeywords = [
        'Moradia', 'Aluguel', 'Condomínio', 'Hipoteca', 
        'Luz', 'Água', 'Gás', 'Internet', 'Celular', 'Plano',
        'IPTU', 'IPVA', 'Seguro Residencial', 'Seguro de Carro'
    ].map(k => k.toLowerCase());

    (expenseData || []).forEach(expense => {
      const expenseDescription = expense.description.toLowerCase();
      const expenseCategoryLower = expense.category.toLowerCase();

      if (nonSubscriptionKeywords.some(keyword => expenseCategoryLower.includes(keyword) || expenseDescription.includes(keyword))) {
          return; // Skip non-subscription recurring expenses
      }
      
      if (expenseCategoryLower === 'assinaturas & serviços' || expense.isRecurring) {
        let assigned = false;
        for (const cat of subscriptionCategories) {
          if (cat.id !== 'services' && cat.keywords.some(keyword => expenseDescription.includes(keyword.toLowerCase()) || expenseCategoryLower.includes(keyword.toLowerCase()))) {
            grouped[cat.id].push(expense);
            assigned = true;
            break;
          }
        }
        if (!assigned) {
          grouped['services'].push(expense);
        }
      }
    });

    return grouped;
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
  
  const hasAnySubscription = Object.values(groupedExpenses).some(arr => arr.length > 0);

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

      {hasAnySubscription ? (
        <Tabs defaultValue="media" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            {subscriptionCategories.map(cat => (
              <TabsTrigger key={cat.id} value={cat.id}>
                <cat.icon className="mr-2 h-4 w-4" />
                {cat.title}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {subscriptionCategories.map(cat => (
            <TabsContent key={cat.id} value={cat.id} className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>{cat.title}</CardTitle>
                  <CardDescription>
                    Total de {groupedExpenses[cat.id]?.length || 0} assinatura(s) nesta categoria.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {groupedExpenses[cat.id] && groupedExpenses[cat.id].length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {groupedExpenses[cat.id].map(item => (
                        <RecurrenceCard key={item.id} recurrence={item} />
                      ))}
                    </div>
                  ) : (
                    <div className="flex h-40 flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center">
                      <h3 className="font-semibold">Nenhuma assinatura encontrada</h3>
                      <p className="mt-1 text-sm text-muted-foreground">Assinaturas desta categoria aparecerão aqui.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <div className="mt-6 flex h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center">
          <h3 className="text-xl font-semibold">Nenhuma assinatura encontrada</h3>
          <p className="mt-2 text-sm text-muted-foreground">Clique em &quot;Adicionar Assinatura&quot; para começar a organizar seus serviços.</p>
        </div>
      )}
    </>
  );
}
