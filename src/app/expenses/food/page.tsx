
'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { collection, query, where, doc, orderBy, updateDoc } from 'firebase/firestore';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import type { Transaction } from '@/lib/types';
import { Loader2, Utensils, PlusCircle, Upload } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { AddTransactionSheet } from '@/components/transactions/add-transaction-sheet';
import { ImportTransactionsSheet } from '@/components/transactions/import-transactions-sheet';
import { DataTable } from '@/components/data-table/data-table';
import { useExpenseColumns } from '../columns';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';

export default function FoodExpensesPage() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isImportSheetOpen, setIsImportSheetOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  const foodExpensesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, `users/${user.uid}/expenses`),
      where('category', '==', 'Alimentação'),
      orderBy('date', 'desc')
    );
  }, [user, firestore]);

  const { data: foodExpenses, isLoading: isExpensesLoading } = useCollection<Transaction>(foodExpensesQuery);

  const handleOpenSheet = (transaction: Transaction | null = null) => {
    setEditingTransaction(transaction);
    setIsSheetOpen(true);
  };

  const handleCloseSheet = () => {
    setEditingTransaction(null);
    setIsSheetOpen(false);
  };
  
  const handleStatusChange = async (transaction: Transaction) => {
    if (!user || transaction.status === 'paid') return;
    const docRef = doc(firestore, `users/${user.uid}/expenses`, transaction.id);
    try {
      await updateDoc(docRef, { status: "paid" });
      toast({
        title: "Transação atualizada!",
        description: `A despesa foi marcada como paga.`,
      });
    } catch (e) {
      console.error("Error updating document: ", e);
      toast({
          variant: "destructive",
          title: "Erro ao atualizar",
          description: "Não foi possível marcar a despesa como paga."
      });
    }
  }
  
  const columns = useExpenseColumns({ onEdit: handleOpenSheet, onStatusChange: handleStatusChange });

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
      <AddTransactionSheet
        isOpen={isSheetOpen}
        onClose={handleCloseSheet}
        transactionType="expense"
        categories={['Alimentação']}
        transaction={editingTransaction}
      />
      <ImportTransactionsSheet 
        isOpen={isImportSheetOpen}
        onClose={() => setIsImportSheetOpen(false)}
      />

       <PageHeader
        title="Alimentação"
        description="Gerencie seus gastos com mercado, restaurantes, delivery e lanches."
      >
        <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsImportSheetOpen(true)} disabled={!user}>
                <Upload className="mr-2 h-4 w-4" />
                Importar Extrato
            </Button>
            <Button onClick={() => handleOpenSheet()} disabled={!user}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Despesa
            </Button>
        </div>
      </PageHeader>

      {foodExpenses && foodExpenses.length > 0 ? (
        <DataTable
            columns={columns}
            data={foodExpenses}
        />
      ) : (
        <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="rounded-full bg-muted p-4 mb-4">
                    <Utensils className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Nenhuma despesa de alimentação cadastrada</h3>
                <p className="text-sm text-muted-foreground max-w-sm mb-6">
                    Registre aqui seus gastos com mercado, restaurantes, delivery, etc., para entender seus hábitos alimentares.
                </p>
                <Button onClick={() => handleOpenSheet()} disabled={!user}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Adicionar Primeira Despesa
                </Button>
            </CardContent>
        </Card>
      )}
    </>
  );
}
