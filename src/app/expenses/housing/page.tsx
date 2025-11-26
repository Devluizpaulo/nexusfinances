'use client';

import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { collection, query, where } from 'firebase/firestore';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import type { Recurrence } from '@/lib/types';
import { Loader2, Home, PlusCircle } from 'lucide-react';
import { RecurrenceCard } from '@/components/recurrences/recurrence-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AddTransactionSheet } from '@/components/transactions/add-transaction-sheet';
import { expenseCategories } from '@/lib/types';

const housingKeywords = ['aluguel', 'condomínio', 'hipoteca', 'iptu', 'moradia'];

export default function HousingPage() {
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const recurringExpensesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, `users/${user.uid}/expenses`), where('isRecurring', '==', true));
  }, [firestore, user]);

  const { data: expenseData, isLoading: isExpensesLoading } = useCollection<Recurrence>(recurringExpensesQuery);

  const housingExpenses = useMemo(() => {
    return (expenseData || []).filter(expense => 
        housingKeywords.some(keyword => 
          expense.category.toLowerCase().includes(keyword) || 
          expense.description.toLowerCase().includes(keyword)
        )
    );
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

  return (
    <>
       <AddTransactionSheet
        isOpen={isAddSheetOpen}
        onClose={handleCloseSheet}
        transactionType="expense"
        categories={expenseCategories}
      />
      <PageHeader
        title="Moradia"
        description="Gerencie seus principais custos de moradia, como aluguel e condomínio."
      >
        <Button onClick={handleOpenSheet} disabled={!user}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Despesa de Moradia
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
              <Home className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Despesas de Moradia</CardTitle>
          </div>
          <CardDescription>Lista de despesas recorrentes relacionadas à sua moradia.</CardDescription>
        </CardHeader>
        <CardContent>
          {housingExpenses.length > 0 ? (
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {housingExpenses.map((item) => (
                  <RecurrenceCard key={item.id} recurrence={item} />
                ))}
            </div>
          ) : (
             <div className="flex h-40 flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center">
              <h3 className="font-semibold">Nenhuma despesa de moradia encontrada</h3>
              <p className="mt-1 text-sm text-muted-foreground">Adicione seu aluguel ou condomínio como uma despesa recorrente.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
