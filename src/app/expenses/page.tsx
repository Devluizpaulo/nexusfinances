'use client';

import { useState, useMemo } from 'react';
import { collection, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { DataTable } from '@/components/data-table/data-table';
import { columns } from './columns';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2, Upload } from 'lucide-react';
import { AddTransactionSheet } from '@/components/transactions/add-transaction-sheet';
import { expenseCategories, type Transaction } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useSearchParams, useRouter } from 'next/navigation';
import { ImportTransactionsSheet } from '@/components/transactions/import-transactions-sheet';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { startOfMonth, endOfMonth, startOfYear, endOfYear, parseISO, isWithinInterval } from 'date-fns';
import { TransactionList } from '@/components/transactions/transaction-list';

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
      
      <div className="space-y-6 bg-slate-950/60 p-1 rounded-3xl sm:p-2">
        <div className="space-y-4 rounded-3xl border border-slate-900/60 bg-gradient-to-b from-slate-950/90 to-slate-900/70 px-4 py-4 sm:px-6 sm:py-5 shadow-[0_18px_45px_-30px_rgba(15,23,42,1)]">
          <div className="flex justify-between items-center">
            <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
              <TabsList className="bg-slate-900/80 border border-slate-800/60">
                <TabsTrigger value="month" className="text-sm text-slate-300 data-[state=active]:bg-slate-800 data-[state=active]:text-white">Mês Atual</TabsTrigger>
                <TabsTrigger value="year" className="text-sm text-slate-300 data-[state=active]:bg-slate-800 data-[state=active]:text-white">Ano Atual</TabsTrigger>
                <TabsTrigger value="all" className="text-sm text-slate-300 data-[state=active]:bg-slate-800 data-[state=active]:text-white">Tudo</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-2">
               <Button variant="outline" size="sm" onClick={() => setIsImportSheetOpen(true)} disabled={!user} className="border-slate-700 bg-slate-900/80 text-slate-200 hover:bg-slate-800 hover:border-slate-600">
                    <Upload className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Importar PDF</span>
                </Button>
                <Button size="sm" onClick={() => handleOpenSheet()} disabled={!user} className="bg-rose-500/20 border-rose-500/30 text-rose-300 hover:bg-rose-500/30 hover:border-rose-500/50">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Registrar gasto</span>
                </Button>
            </div>
          </div>
        </div>
      </div>

      {searchParams.get('date') && (
        <div className="mb-3 rounded-2xl border border-slate-800/80 bg-slate-950/80 px-4 py-3 text-xs text-slate-400 shadow-[0_18px_45px_-30px_rgba(15,23,42,1)]">
          <span>
            Filtrando despesas do dia{' '}
            <span className="font-medium text-slate-200">{searchParams.get('date')}</span>.
          </span>{' '}
          <button
            type="button"
            onClick={() => router.push('/expenses')}
            className="ml-2 font-semibold text-rose-300 underline-offset-2 hover:underline"
          >
            Limpar filtro
          </button>
        </div>
      )}

      {/* Mobile view */}
      <div className="md:hidden rounded-2xl border border-slate-900/60 bg-slate-950/70 p-4 sm:p-5 shadow-[0_18px_45px_-30px_rgba(15,23,42,1)]">
        <TransactionList 
          transactions={filteredExpenseData}
          onEdit={handleOpenSheet}
          onStatusChange={handleStatusChange}
          transactionType="expense"
        />
      </div>

      {/* Desktop view */}
      <div className="hidden md:block rounded-2xl border border-slate-900/60 bg-slate-950/70 p-4 sm:p-5 shadow-[0_18px_45px_-30px_rgba(15,23,42,1)]">
        <DataTable
          columns={columns({ onEdit: handleOpenSheet, onStatusChange: handleStatusChange })}
          data={filteredExpenseData}
        />
      </div>
    </>
  );
}
