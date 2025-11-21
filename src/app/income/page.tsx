'use client';

import { useState } from 'react';
import { collection, query, orderBy } from 'firebase/firestore';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { DataTable } from '@/components/data-table/data-table';
import { columns } from './columns';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2 } from 'lucide-react';
import { AddTransactionSheet } from '@/components/transactions/add-transaction-sheet';
import { incomeCategories, type Transaction } from '@/lib/types';

export default function IncomePage() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const incomeQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, `users/${user.uid}/incomes`),
      orderBy('date', 'desc')
    );
  }, [firestore, user]);

  const { data: incomeData, isLoading: isIncomeLoading } = useCollection<Transaction>(incomeQuery);

  const handleOpenSheet = (transaction: Transaction | null = null) => {
    setEditingTransaction(transaction);
    setIsSheetOpen(true);
  };

  const handleCloseSheet = () => {
    setIsSheetOpen(false);
    setEditingTransaction(null);
  };

  const isLoading = isUserLoading || isIncomeLoading;

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
        transactionType="income"
        categories={incomeCategories}
        transaction={editingTransaction}
      />
      <PageHeader
        title="Renda"
        description="Acompanhe e gerencie todas as suas fontes de renda."
      >
        <Button onClick={() => handleOpenSheet()} disabled={!user}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Renda
        </Button>
      </PageHeader>
      <DataTable columns={columns({ onEdit: handleOpenSheet })} data={incomeData || []} />
    </>
  );
}
