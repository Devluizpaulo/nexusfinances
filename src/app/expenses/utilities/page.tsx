
'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import type { Recurrence, Transaction } from '@/lib/types';
import { Loader2, Zap, PlusCircle, Upload } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ImportTransactionsSheet } from '@/components/transactions/import-transactions-sheet';
import { PageHeader } from '@/components/page-header';
import { AddUtilityBillSheet } from '@/components/utilities/add-utility-bill-sheet';
import { DataTable } from '@/components/data-table/data-table';
import { columns } from '../columns';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc } from 'firebase/firestore';

export default function UtilitiesPage() {
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [isImportSheetOpen, setIsImportSheetOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  const utilitiesExpensesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, `users/${user.uid}/expenses`),
      where('category', '==', 'Contas de Consumo'),
      orderBy('date', 'desc')
    );
  }, [firestore, user]);

  const { data: expenseData, isLoading: isExpensesLoading } = useCollection<Transaction>(utilitiesExpensesQuery);
  
  const handleOpenSheet = (transaction: Transaction | null = null) => {
    setEditingTransaction(transaction);
    setIsAddSheetOpen(true);
  };
  
  const handleStatusChange = (transaction: Transaction) => {
    if (!user || transaction.status === 'paid') return;
    const docRef = doc(firestore, `users/${user.uid}/expenses`, transaction.id);
    updateDoc(docRef, { status: "paid" });
    toast({
      title: "Transação atualizada!",
      description: `A despesa foi marcada como paga.`,
    });
  }

  const isLoading = isUserLoading || isExpensesLoading;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <AddUtilityBillSheet
        isOpen={isAddSheetOpen}
        onClose={() => setIsAddSheetOpen(false)}
      />
       <ImportTransactionsSheet 
        isOpen={isImportSheetOpen}
        onClose={() => setIsImportSheetOpen(false)}
      />

      <PageHeader
        title="Contas de Consumo"
        description="Gerencie suas contas mensais de luz, água, internet, etc."
      >
        <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsImportSheetOpen(true)} disabled={!user}>
                <Upload className="mr-2 h-4 w-4" />
                Importar Fatura com IA
            </Button>
            <Button onClick={() => setIsAddSheetOpen(true)} disabled={!user}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Conta
            </Button>
        </div>
      </PageHeader>
      
      {expenseData && expenseData.length > 0 ? (
        <DataTable
            columns={columns({ onEdit: handleOpenSheet, onStatusChange: handleStatusChange })}
            data={expenseData}
        />
      ) : (
        <div className="mt-6 flex h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center">
          <Zap className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold">Nenhuma conta de consumo encontrada</h3>
          <p className="mt-2 text-sm text-muted-foreground">Clique em "Adicionar Conta" para começar a organizar seus gastos com utilidades.</p>
        </div>
      )}
    </>
  );
}
