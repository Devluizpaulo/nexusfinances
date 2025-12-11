'use client';

import { useState, useMemo } from 'react';
import { collection, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { DataTable } from '@/components/data-table/data-table';
import { columns } from './columns';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2, Upload } from 'lucide-react';
import { AddTransactionSheet } from '@/components/transactions/add-transaction-sheet';
import { expenseCategories, type Transaction } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useSearchParams, useRouter } from 'next/navigation';
import { ImportTransactionsSheet } from '@/components/transactions/import-transactions-sheet';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { startOfMonth, endOfMonth, startOfYear, endOfYear, parseISO, isWithinInterval } from 'date-fns';

type ViewMode = 'month' | 'year' | 'all';

export default function ExpensesPage() {
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [isImportSheetOpen, setIsImportSheetOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  
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
    if (!expenseData) return [];

    const now = new Date();
    
    let filtered = expenseData;

    if (viewMode === 'month') {
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);
      filtered = expenseData.filter(t => {
        const transactionDate = parseISO(t.date);
        return isWithinInterval(transactionDate, { start: monthStart, end: monthEnd });
      });
    } else if (viewMode === 'year') {
      const yearStart = startOfYear(now);
      const yearEnd = endOfYear(now);
      filtered = expenseData.filter(t => {
        const transactionDate = parseISO(t.date);
        return isWithinInterval(transactionDate, { start: yearStart, end: yearEnd });
      });
    }

    const dateFilter = searchParams.get('date');
    if (dateFilter) {
      return filtered.filter((t) => t.date === dateFilter);
    }
    
    return filtered;

  }, [expenseData, searchParams, viewMode]);

  const handleOpenSheet = (transaction: Transaction | null = null) => {
    setEditingTransaction(transaction);
    setIsAddSheetOpen(true);
  };

  const handleCloseSheet = () => {
    setIsAddSheetOpen(false);
    setEditingTransaction(null);
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
        isOpen={isAddSheetOpen}
        onClose={handleCloseSheet}
        transactionType="expense"
        categories={expenseCategories}
        transaction={editingTransaction}
      />
      <ImportTransactionsSheet 
        isOpen={isImportSheetOpen}
        onClose={() => setIsImportSheetOpen(false)}
      />
      <PageHeader
        title="Todos os Gastos"
        description="Anote seus gastos em segundos e veja o impacto direto no seu mês, sem planilhas."
      >
        <div className="flex flex-col-reverse sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsImportSheetOpen(true)} disabled={!user}>
                <Upload className="mr-2 h-4 w-4" />
                Importar Extrato PDF
            </Button>

            <Button onClick={() => handleOpenSheet()} disabled={!user}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Registrar gasto
            </Button>
        </div>
      </PageHeader>
      
       <div className="flex justify-between items-center mb-4">
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
          <TabsList>
            <TabsTrigger value="month">Mês Atual</TabsTrigger>
            <TabsTrigger value="year">Ano Atual</TabsTrigger>
            <TabsTrigger value="all">Tudo</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

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
