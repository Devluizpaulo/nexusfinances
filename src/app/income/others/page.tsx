'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { collection, query, where } from 'firebase/firestore';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import type { Recurrence } from '@/lib/types';
import { Loader2, WalletCards, PlusCircle } from 'lucide-react';
import { RecurrenceCard } from '@/components/recurrences/recurrence-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AddTransactionSheet } from '@/components/transactions/add-transaction-sheet';
import { incomeCategories } from '@/lib/types';
import { PageHeader } from '@/components/page-header';

const nonFreelancerSalaryKeywords = ['salário', 'freelance', 'projeto', 'consultoria', 'cliente'];

export default function OthersIncomePage() {
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const recurringIncomesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, `users/${user.uid}/incomes`), where('isRecurring', '==', true));
  }, [firestore, user]);

  const { data: incomeData, isLoading: isIncomesLoading } = useCollection<Recurrence>(recurringIncomesQuery);

  const otherIncomes = useMemo(() => {
    return (incomeData || []).filter(income => 
        !nonFreelancerSalaryKeywords.some(keyword => 
          income.category.toLowerCase().includes(keyword) || 
          income.description.toLowerCase().includes(keyword)
        )
    );
  }, [incomeData]);

  const isLoading = isUserLoading || isIncomesLoading;

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
        transactionType="income"
        categories={incomeCategories}
      />

      <PageHeader
        title="Outras Rendas Recorrentes"
        description="Gerencie rendas passivas, aluguéis ou outras fontes de renda recorrentes."
      >
        <Button onClick={handleOpenSheet} disabled={!user}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Outra Renda
        </Button>
      </PageHeader>

      <Card className="mt-4">
        <CardHeader>
          <div className="flex items-center gap-3">
            <WalletCards className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Rendas Recorrentes</CardTitle>
          </div>
          <CardDescription>Lista de rendas recorrentes que não são Salário ou Freelance.</CardDescription>
        </CardHeader>
        <CardContent>
          {otherIncomes.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {otherIncomes.map((item) => (
                <RecurrenceCard key={item.id} recurrence={item} />
              ))}
            </div>
          ) : (
            <div className="flex h-40 flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center">
              <h3 className="font-semibold">Nenhuma outra renda recorrente encontrada</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Adicione rendimentos de investimentos ou aluguéis como uma renda recorrente.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
