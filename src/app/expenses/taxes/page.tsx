'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { collection, query, where } from 'firebase/firestore';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import type { Recurrence } from '@/lib/types';
import { Loader2, Landmark, PlusCircle, Upload } from 'lucide-react';
import { RecurrenceCard } from '@/components/recurrences/recurrence-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AddTransactionSheet } from '@/components/transactions/add-transaction-sheet';
import { expenseCategories } from '@/lib/types';
import { ImportTransactionsSheet } from '@/components/transactions/import-transactions-sheet';
import { PageHeader } from '@/components/page-header';

const taxesKeywords = ['imposto', 'taxa', 'irpf', 'das', 'ipva', 'iptu'];

export default function TaxesPage() {
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [isImportSheetOpen, setIsImportSheetOpen] = useState(false);
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const recurringExpensesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, `users/${user.uid}/expenses`), where('isRecurring', '==', true));
  }, [firestore, user]);

  const { data: expenseData, isLoading: isExpensesLoading } = useCollection<Recurrence>(recurringExpensesQuery);

  const taxesExpenses = useMemo(() => {
    return (expenseData || []).filter(expense => 
        taxesKeywords.some(keyword => 
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
        title="Impostos e Taxas"
        description="Gerencie seus pagamentos recorrentes de impostos e taxas."
      >
        <Button variant="outline" onClick={() => setIsImportSheetOpen(true)} disabled={!user}>
            <Upload className="mr-2 h-4 w-4" />
            Importar PDF com IA
        </Button>
      </PageHeader>

      <Card className="mt-4">
        <CardHeader>
          <div className="flex items-center gap-3">
              <Landmark className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Pagamentos de Impostos e Taxas</CardTitle>
          </div>
          <CardDescription>Lista de impostos e taxas recorrentes.</CardDescription>
        </CardHeader>
        <CardContent>
          {taxesExpenses.length > 0 ? (
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {taxesExpenses.map((item) => (
                  <RecurrenceCard key={item.id} recurrence={item} />
                ))}
            </div>
          ) : (
             <div className="flex h-40 flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center">
              <h3 className="font-semibold">Nenhum imposto ou taxa recorrente encontrado</h3>
              <p className="mt-1 text-sm text-muted-foreground">Adicione o pagamento de um imposto como uma despesa recorrente.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

    