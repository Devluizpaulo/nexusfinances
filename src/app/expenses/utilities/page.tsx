
'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { collection, query, where, doc, orderBy, updateDoc } from 'firebase/firestore';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import type { Transaction } from '@/lib/types';
import { Loader2, Zap, PlusCircle, Upload, Filter, X, Lightbulb, Droplet, Flame, Wifi, Phone, Tv } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ImportTransactionsSheet } from '@/components/transactions/import-transactions-sheet';
import { PageHeader } from '@/components/page-header';
import { AddUtilityBillSheet } from '@/components/utilities/add-utility-bill-sheet';
import { DataTable } from '@/components/data-table/data-table';
import { useExpenseColumns } from '../columns';
import { useToast } from '@/hooks/use-toast';
import { TransactionList } from '@/components/transactions/transaction-list';
import { AddTransactionSheet } from '@/components/transactions/add-transaction-sheet';
import { expenseCategories, utilitySubcategories } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


export default function UtilitiesPage() {
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [isImportSheetOpen, setIsImportSheetOpen] = useState(false);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all');

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

  const { data: expenseData, isLoading: isExpensesLoading, optimisticDelete } = useCollection<Transaction>(utilitiesExpensesQuery);
  
  // Filter expenses by selected subcategory
  const filteredExpenses = useMemo(() => {
    if (!expenseData) return [];
    if (selectedSubcategory === 'all') return expenseData;
    return expenseData.filter(expense => expense.subcategory === selectedSubcategory);
  }, [expenseData, selectedSubcategory]);
  
  // Get subcategory statistics
  const subcategoryStats = useMemo(() => {
    if (!expenseData) return [];
    
    return utilitySubcategories.map(subcategory => {
      const expenses = expenseData.filter(expense => expense.subcategory === subcategory);
      const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
      const pendingCount = expenses.filter(expense => expense.status === 'pending').length;
      
      return {
        subcategory,
        count: expenses.length,
        total,
        pendingCount,
        expenses
      };
    }).filter(stat => stat.count > 0);
  }, [expenseData]);
  
  // Get icon for subcategory
  const getSubcategoryIcon = (subcategory: string) => {
    switch (subcategory) {
      case 'Luz': return <Lightbulb className="h-4 w-4" />;
      case 'Água': return <Droplet className="h-4 w-4" />;
      case 'Gás': return <Flame className="h-4 w-4" />;
      case 'Internet': return <Wifi className="h-4 w-4" />;
      case 'Celular':
      case 'Telefone Fixo': return <Phone className="h-4 w-4" />;
      case 'TV por Assinatura': return <Tv className="h-4 w-4" />;
      default: return <Zap className="h-4 w-4" />;
    }
  };
  
  const handleOpenEditSheet = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsEditSheetOpen(true);
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

  const columns = useExpenseColumns({ onEdit: handleOpenEditSheet, onStatusChange: handleStatusChange, optimisticDelete });
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
      <AddTransactionSheet
        isOpen={isEditSheetOpen}
        onClose={() => setIsEditSheetOpen(false)}
        transactionType="expense"
        categories={expenseCategories}
        transaction={editingTransaction}
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
      
      {expenseData && expenseData.length > 0 && (
        <div className="space-y-4">
          {/* Filter Tabs */}
          <Tabs value={selectedSubcategory} onValueChange={setSelectedSubcategory} className="w-full">
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-5 xl:grid-cols-9">
              <TabsTrigger value="all" className="text-xs">
                Todas
              </TabsTrigger>
              {subcategoryStats.map(({ subcategory, count, pendingCount }) => (
                <TabsTrigger key={subcategory} value={subcategory} className="text-xs">
                  <div className="flex items-center gap-1">
                    {getSubcategoryIcon(subcategory)}
                    <span>{subcategory}</span>
                    {pendingCount > 0 && (
                      <Badge variant="destructive" className="ml-1 h-4 w-4 p-0 text-xs">
                        {pendingCount}
                      </Badge>
                    )}
                  </div>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      )}
      
      {filteredExpenses && filteredExpenses.length > 0 ? (
        <>
          {/* Mobile view */}
          <div className="md:hidden">
            <TransactionList 
              transactions={filteredExpenses}
              onEdit={handleOpenEditSheet}
              onStatusChange={handleStatusChange}
              transactionType="expense"
            />
          </div>

          {/* Desktop view */}
          <div className="hidden md:block">
            <DataTable
                columns={columns}
                data={filteredExpenses}
            />
          </div>
        </>
      ) : (
        filteredExpenses && filteredExpenses.length === 0 && selectedSubcategory !== 'all' ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                {getSubcategoryIcon(selectedSubcategory)}
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Nenhuma conta de {selectedSubcategory} encontrada
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm mb-6">
                Não há contas de {selectedSubcategory} cadastradas. Tente selecionar outra categoria ou adicione uma nova conta.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setSelectedSubcategory('all')}>
                  <Filter className="mr-2 h-4 w-4" />
                  Ver Todas as Contas
                </Button>
                <Button onClick={() => setIsAddSheetOpen(true)} disabled={!user}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Adicionar Conta de {selectedSubcategory}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Zap className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Nenhuma conta de consumo encontrada</h3>
              <p className="text-sm text-muted-foreground max-w-sm mb-6">
                Clique em &quot;Adicionar Conta&quot; para começar a organizar seus gastos com utilidades.
              </p>
              <Button onClick={() => setIsAddSheetOpen(true)} disabled={!user}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Adicionar Primeira Conta
              </Button>
            </CardContent>
          </Card>
        )
      )}
    </>
  );
}
