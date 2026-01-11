
'use client';

import { useState, useMemo, useCallback } from 'react';
import { collection, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { DataTable } from '@/components/data-table/data-table';
import { useExpenseColumns } from './columns';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { PlusCircle, Loader2, Upload, TrendingDown, BarChart3, PieChart } from 'lucide-react';
import { AddTransactionSheet } from '@/components/transactions/add-transaction-sheet';
import { expenseCategories, type Transaction } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useSearchParams, useRouter } from 'next/navigation';
import { ImportTransactionsSheet } from '@/components/transactions/import-transactions-sheet';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { startOfMonth, endOfMonth, startOfYear, endOfYear, parseISO, isWithinInterval, differenceInMonths } from 'date-fns';
import { TransactionList } from '@/components/transactions/transaction-list';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { formatCurrency } from '@/lib/utils';
import { IncomeExpenseChart } from '@/components/dashboard/income-expense-chart';
import { ExpenseCategoryChart } from '@/components/dashboard/expense-category-chart';

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
    
    return filtered.sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
  }, [expenseData, searchParams, viewMode]);

  const { totalExpenses, averageMonthlyExpense, topCategory } = useMemo(() => {
    if (!filteredExpenseData || filteredExpenseData.length === 0) {
      return { totalExpenses: 0, averageMonthlyExpense: 0, topCategory: 'N/A' };
    }

    const total = filteredExpenseData.reduce((sum, t) => sum + t.amount, 0);

    const firstDate = parseISO(filteredExpenseData[filteredExpenseData.length - 1].date);
    const lastDate = parseISO(filteredExpenseData[0].date);
    const monthCount = differenceInMonths(lastDate, firstDate) + 1;
    const average = total / (monthCount > 0 ? monthCount : 1);
    
    const categoryTotals = filteredExpenseData.reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
    }, {} as Record<string, number>);

    const topCat = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    return {
        totalExpenses: total,
        averageMonthlyExpense: average,
        topCategory: topCat
    };
  }, [filteredExpenseData]);


  const handleOpenSheet = useCallback((transaction: Transaction | null = null) => {
    setEditingTransaction(transaction);
    setIsAddSheetOpen(true);
  }, []);

  const handleCloseSheet = useCallback(() => {
    setIsAddSheetOpen(false);
    setEditingTransaction(null);
  }, []);

  const handleStatusChange = useCallback(async (transaction: Transaction) => {
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
  }, [user, firestore, toast]);

  const handleDeleteTransaction = useCallback(async (transaction: Transaction) => {
    if (!user) return;
    
    const docRef = doc(firestore, `users/${user.uid}/expenses`, transaction.id);
    try {
      await deleteDoc(docRef);
      toast({
        title: "Transação excluída",
        description: `A despesa "${transaction.description}" foi removida com sucesso.`,
      });
    } catch (error) {
      console.error("Error deleting transaction:", error);
      toast({
        variant: "destructive",
        title: "Erro ao excluir",
        description: "Não foi possível remover a despesa. Tente novamente.",
      });
      throw error;
    }
  }, [user, firestore, toast]);
  
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
      
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
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
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <KpiCard
            title="Despesa Total no Período"
            value={formatCurrency(totalExpenses)}
            icon={TrendingDown}
          />
          <KpiCard
            title="Gasto Médio Mensal"
            value={formatCurrency(averageMonthlyExpense)}
            icon={BarChart3}
          />
          <KpiCard
            title="Principal Categoria de Gasto"
            value={topCategory}
            icon={PieChart}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3">
                <IncomeExpenseChart transactions={filteredExpenseData} />
            </div>
            <div className="lg:col-span-2">
                <ExpenseCategoryChart transactions={filteredExpenseData} />
            </div>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Histórico de Despesas</CardTitle>
                <CardDescription>
                    Todas as suas despesas registradas no período selecionado.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {searchParams.get('date') && (
                    <div className="mb-3 rounded-md border bg-muted/50 p-3 text-xs text-muted-foreground">
                    <span>
                        Filtrando despesas do dia{' '}
                        <span className="font-medium text-foreground">{searchParams.get('date')}</span>.
                    </span>{' '}
                    <button
                        type="button"
                        onClick={() => router.push('/expenses')}
                        className="ml-2 font-semibold text-primary underline-offset-2 hover:underline"
                    >
                        Limpar filtro
                    </button>
                    </div>
                )}
                {/* Mobile view */}
                <div className="md:hidden">
                    <TransactionList 
                    transactions={filteredExpenseData}
                    onEdit={handleOpenSheet}
                    onStatusChange={handleStatusChange}
                    onDelete={handleDeleteTransaction}
                    transactionType="expense"
                    />
                </div>
                {/* Desktop view */}
                <div className="hidden md:block">
                    <DataTable
                        columns={columns}
                        data={filteredExpenseData}
                    />
                </div>
            </CardContent>
        </Card>
      </div>
    </>
  );
}
