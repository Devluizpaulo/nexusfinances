'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { collection, query, where } from 'firebase/firestore';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import type { Recurrence } from '@/lib/types';
import { Loader2, Zap, PlusCircle, Upload } from 'lucide-react';
import { RecurrenceCard } from '@/components/recurrences/recurrence-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AddTransactionSheet } from '@/components/transactions/add-transaction-sheet';
import { expenseCategories } from '@/lib/types';
import { ImportTransactionsSheet } from '@/components/transactions/import-transactions-sheet';
import { PageHeader } from '@/components/page-header';

const utilitiesKeywords = ['luz', 'energia', 'água', 'gás', 'internet', 'celular', 'plano', 'fatura'];

export default function UtilitiesPage() {
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [isImportSheetOpen, setIsImportSheetOpen] = useState(false);
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const recurringExpensesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, `users/${user.uid}/expenses`), where('isRecurring', '==', true));
  }, [firestore, user]);

  const { data: expenseData, isLoading: isExpensesLoading } = useCollection<Recurrence>(recurringExpensesQuery);

  const utilitiesExpenses = useMemo(() => {
    return (expenseData || []).filter(expense => 
        utilitiesKeywords.some(keyword => 
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
       <ImportTransactionsSheet 
        isOpen={isImportSheetOpen}
        onClose={() => setIsImportSheetOpen(false)}
      />

      <PageHeader
        title="Contas de Consumo"
        description="Gerencie suas contas mensais de luz, água, internet, etc."
      >
        <Button variant="outline" onClick={() => setIsImportSheetOpen(true)} disabled={!user}>
            <Upload className="mr-2 h-4 w-4" />
            Importar PDF com IA
        </Button>
        <Button onClick={handleOpenSheet} disabled={!user}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Conta
        </Button>
      </PageHeader>

      <Card className="mt-4">
        <CardHeader>
          <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Contas de Consumo Recorrentes</CardTitle>
          </div>
          <CardDescription>Lista de suas contas mensais de consumo.</CardDescription>
        </CardHeader>
        <CardContent>
          {utilitiesExpenses.length > 0 ? (
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {utilitiesExpenses.map((item) => (
                  <RecurrenceCard key={item.id} recurrence={item} />
                ))}
            </div>
          ) : (
             <div className="flex h-40 flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center">
              <h3 className="font-semibold">Nenhuma conta de consumo encontrada</h3>
              <p className="mt-1 text-sm text-muted-foreground">Adicione suas contas como despesas recorrentes para vê-las aqui.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
