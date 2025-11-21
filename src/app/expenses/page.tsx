'use client';

import { useState } from 'react';
import { mockTransactions } from '@/lib/data';
import { DataTable } from '@/components/data-table/data-table';
import { columns } from './columns';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { AddTransactionSheet } from '@/components/transactions/add-transaction-sheet';
import { expenseCategories } from '@/lib/types';

export default function ExpensesPage() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const expenseData = mockTransactions.filter((t) => t.type === 'expense');

  return (
    <>
      <AddTransactionSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        transactionType="expense"
        categories={expenseCategories}
      />
      <PageHeader
        title="Despesas"
        description="Acompanhe e gerencie todas as suas despesas."
      >
        <Button onClick={() => setIsSheetOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Despesa
        </Button>
      </PageHeader>
      <DataTable columns={columns} data={expenseData} />
    </>
  );
}
