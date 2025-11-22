'use client';

import { useState, useMemo } from 'react';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { useCollection, useFirestore, useUser, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { DataTable } from '@/components/data-table/data-table';
import { columns } from './columns';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2 } from 'lucide-react';
import { AddTransactionSheet } from '@/components/transactions/add-transaction-sheet';
import { expenseCategories, type Transaction } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useSearchParams, useRouter } from 'next/navigation';

export default function ExpensesPage() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();

  const expensesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, `users/${user.uid}/expenses`),
      orderBy('date', 'desc')
    );
  }, [firestore, user]);

  const { data: expenseData, isLoading: isExpensesLoading } = useCollection<Transaction>(expensesQuery);

  const filteredExpenseData = useMemo(() => {
    const dateFilter = searchParams.get('date');
    if (!dateFilter || !expenseData) return expenseData || [];

    return expenseData.filter((t) => t.date === dateFilter);
  }, [expenseData, searchParams]);

  const handleOpenSheet = (transaction: Transaction | null = null) => {
    setEditingTransaction(transaction);
    setIsSheetOpen(true);
  };

  const handleCloseSheet = () => {
    setIsSheetOpen(false);
    setEditingTransaction(null);
  };

  const handleStatusChange = (transaction: Transaction) => {
    if (!user || transaction.status === 'paid') return;
    const docRef = doc(firestore, `users/${user.uid}/expenses`, transaction.id);
    updateDocumentNonBlocking(docRef, { status: "paid" });
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
      <AddTransactionSheet
        isOpen={isSheetOpen}
        onClose={handleCloseSheet}
        transactionType="expense"
        categories={expenseCategories}
        transaction={editingTransaction}
      />
      <PageHeader
        title="Despesas"
        description="Acompanhe e gerencie todas as suas despesas."
      >
        <Button onClick={() => handleOpenSheet()} disabled={!user}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Despesa
        </Button>
      </PageHeader>
      {searchParams.get('date') && (
        <div className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          <span>
            Filtrando despesas do dia{' '}
            <span className="font-medium">{searchParams.get('date')}</span>.
          </span>{' '}
          <button
            type="button"
            onClick={() => router.push('/expenses')}
            className="ml-2 font-semibold text-amber-900 underline-offset-2 hover:underline"
          >
            Limpar filtro
          </button>
        </div>
      )}
      <DataTable
        columns={columns({ onEdit: handleOpenSheet, onStatusChange: handleStatusChange })}
        data={filteredExpenseData}
      />
    </>
  );
}
