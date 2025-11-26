'use client';

import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { collection, query, where } from 'firebase/firestore';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import type { Recurrence } from '@/lib/types';
import { Loader2, HeartPulse, PlusCircle } from 'lucide-react';
import { RecurrenceCard } from '@/components/recurrences/recurrence-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AddTransactionSheet } from '@/components/transactions/add-transaction-sheet';
import { expenseCategories } from '@/lib/types';

const healthKeywords = ['academia', 'gympass', 'plano de saúde', 'farmácia', 'terapia', 'bem-estar', 'médico', 'consulta'];

export default function HealthPage() {
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const recurringExpensesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, `users/${user.uid}/expenses`), where('isRecurring', '==', true));
  }, [firestore, user]);

  const { data: expenseData, isLoading: isExpensesLoading } = useCollection<Recurrence>(recurringExpensesQuery);

  const healthExpenses = useMemo(() => {
    return (expenseData || []).filter(expense => 
        healthKeywords.some(keyword => 
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
        title="Saúde & Bem-estar"
        description="Acompanhe seus gastos recorrentes com saúde, como academia e plano de saúde."
      >
        <Button onClick={handleOpenSheet} disabled={!user}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Despesa de Saúde
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
              <HeartPulse className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Despesas de Saúde e Bem-estar</CardTitle>
          </div>
          <CardDescription>Lista de despesas recorrentes relacionadas à sua saúde.</CardDescription>
        </CardHeader>
        <CardContent>
          {healthExpenses.length > 0 ? (
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {healthExpenses.map((item) => (
                  <RecurrenceCard key={item.id} recurrence={item} />
                ))}
            </div>
          ) : (
             <div className="flex h-40 flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center">
              <h3 className="font-semibold">Nenhuma despesa de saúde encontrada</h3>
              <p className="mt-1 text-sm text-muted-foreground">Adicione seu plano de saúde ou academia como uma despesa recorrente.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
