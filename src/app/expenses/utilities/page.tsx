
'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { collection, query, where, orderBy, doc, updateDoc } from 'firebase/firestore';
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
import { TransactionList } from '@/components/transactions/transaction-list';

export default function UtilitiesPage() {
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [isImportSheetOpen, setIsImportSheetOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  const utilitiesExpensesQuery = useMemoFirebase(() => {
    if (!user) return null;
    console.log('Creating utilities query for user:', user.uid);
    console.log('Category filter:', 'Contas de Consumo');
    console.log('Collection path:', `users/${user.uid}/expenses`);
    return query(
      collection(firestore, `users/${user.uid}/expenses`),
      where('category', '==', 'Contas de Consumo'),
      orderBy('date', 'desc')
    );
  }, [firestore, user]);

  const { data: expenseData, isLoading: isExpensesLoading } = useCollection<Transaction>(utilitiesExpensesQuery);

  // Debug: Log the query and results
  console.log('Utilities Query:', utilitiesExpensesQuery);
  console.log('Utilities Data:', expenseData);
  console.log('Is Loading:', isExpensesLoading);
  console.log('User:', user);
  
  // Test query without category filter
  const allExpensesQuery = useMemoFirebase(() => {
    if (!user) return null;
    console.log('Creating ALL expenses query for user:', user.uid);
    return query(
      collection(firestore, `users/${user.uid}/expenses`),
      orderBy('date', 'desc')
    );
  }, [firestore, user]);

  const { data: allExpenses } = useCollection<Transaction>(allExpensesQuery);
  console.log('All Expenses Data:', allExpenses);
  console.log('All Expenses Length:', allExpenses?.length);
  
  // Filter manually to see if category matches
  const manualFiltered = allExpenses?.filter(expense => {
    console.log('Checking expense:', expense.category, 'vs', 'Contas de Consumo', expense.category === 'Contas de Consumo');
    console.log('Expense details:', expense);
    return expense.category === 'Contas de Consumo';
  });
  console.log('Manual filtered utilities:', manualFiltered);
  
  // Try different category variations
  const categoryVariations = [
    'Contas de Consumo',
    'Contas de Consumo ',
    ' Contas de Consumo',
    'Contas de Consumo\n',
    'Contas de Consumo\t'
  ];
  
  const testVariations = categoryVariations.map(cat => ({
    category: cat,
    matches: allExpenses?.filter(expense => expense.category === cat)
  }));
  
  console.log('Category variations test:', testVariations);
  
  // Use manual filtered data for now
  const effectiveExpenseData = manualFiltered || expenseData;
  
  const handleOpenSheet = (transaction: Transaction | null = null) => {
    setEditingTransaction(transaction);
    setIsAddSheetOpen(true);
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
      
      {effectiveExpenseData && effectiveExpenseData.length > 0 ? (
        <>
          {/* Mobile view */}
          <div className="md:hidden">
            <TransactionList 
              transactions={effectiveExpenseData}
              onEdit={handleOpenSheet}
              onStatusChange={handleStatusChange}
              transactionType="expense"
            />
          </div>

          {/* Desktop view */}
          <div className="hidden md:block">
            <DataTable
                columns={columns({ onEdit: handleOpenSheet, onStatusChange: handleStatusChange })}
                data={effectiveExpenseData}
            />
          </div>
        </>
      ) : (
        <div className="mt-6 flex h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center">
          <Zap className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold">Nenhuma conta de consumo encontrada</h3>
          <p className="mt-2 text-sm text-muted-foreground">Clique em &quot;Adicionar Conta&quot; para começar a organizar seus gastos com utilidades.</p>
        </div>
      )}
    </>
  );
}
