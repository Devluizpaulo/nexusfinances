
'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { collection, query, where, doc, orderBy, updateDoc } from 'firebase/firestore';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import type { Transaction } from '@/lib/types';
import { Loader2, Landmark, PlusCircle, Upload } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { AddTransactionSheet } from '@/components/transactions/add-transaction-sheet';
import { ImportTransactionsSheet } from '@/components/transactions/import-transactions-sheet';
import { DataTable } from '@/components/data-table/data-table';
import { useExpenseColumns } from '../columns';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { isPast, parseISO, startOfDay } from 'date-fns';
import { TransactionList } from '@/components/transactions/transaction-list';

type ActiveTab = 'all' | 'upcoming' | 'overdue' | 'paid';

export default function TaxesPage() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isImportSheetOpen, setIsImportSheetOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('all');

  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  const taxesExpensesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, `users/${user.uid}/expenses`),
      where('category', '==', 'Impostos & Taxas'),
      orderBy('date', 'desc')
    );
  }, [user, firestore]);

  const { data: taxesExpenses, isLoading: isExpensesLoading } = useCollection<Transaction>(taxesExpensesQuery);
  
  const { upcoming, overdue, paid } = useMemo(() => {
    const data = {
        upcoming: [] as Transaction[],
        overdue: [] as Transaction[],
        paid: [] as Transaction[],
    };

    for (const t of taxesExpenses ?? []) {
        if (t.status === 'paid') {
            data.paid.push(t);
            continue;
        }

        const dueDate = new Date(t.date);
        if (isNaN(dueDate.getTime())) {
            data.upcoming.push(t);
            continue;
        }

        if (isPast(startOfDay(dueDate))) {
            data.overdue.push(t);
        } else {
            data.upcoming.push(t);
        }
    }

    return data;
  }, [taxesExpenses]);

  const tableData = useMemo(() => {
    switch (activeTab) {
      case 'all':
        return taxesExpenses ?? [];
      case 'upcoming':
        return upcoming;
      case 'overdue':
        return overdue;
      case 'paid':
        return paid;
      default:
        return [];
    }
  }, [activeTab, upcoming, overdue, paid, taxesExpenses]);


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
    } catch(e) {
        toast({
            variant: "destructive",
            title: "Erro ao atualizar",
            description: "Não foi possível marcar a despesa como paga. Tente novamente.",
        });
    }
  }

  const handleDeleteTransaction = async (transaction: Transaction) => {
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
        categories={['Impostos & Taxas']}
        transaction={editingTransaction}
      />
      <ImportTransactionsSheet 
        isOpen={isImportSheetOpen}
        onClose={() => setIsImportSheetOpen(false)}
      />

       <PageHeader
        title="Impostos e Taxas"
        description="Gerencie seus pagamentos de impostos (IPTU, IPVA, IRPF, etc) e taxas governamentais."
      >
        <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsImportSheetOpen(true)} disabled={!user}>
                <Upload className="mr-2 h-4 w-4" />
                Importar Comprovante
            </Button>
            <Button onClick={() => handleOpenSheet()} disabled={!user}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Imposto/Taxa
            </Button>
        </div>
      </PageHeader>
      
       <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ActiveTab)} className="mt-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">Todos ({(taxesExpenses ?? []).length})</TabsTrigger>
          <TabsTrigger value="upcoming">A vencer ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="overdue">Vencidos ({overdue.length})</TabsTrigger>
          <TabsTrigger value="paid">Pagos ({paid.length})</TabsTrigger>
        </TabsList>
        <div className="mt-4">
          {(taxesExpenses ?? []).length > 0 ? (
            <>
              {/* Mobile view */}
              <div className="md:hidden">
                <TransactionList 
                  transactions={tableData}
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
                  data={tableData}
                />
              </div>
            </>
          ) : (
             <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 px-4 text-center">
                    <div className="rounded-full bg-muted p-4 mb-4">
                        <Landmark className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Nenhum imposto ou taxa cadastrado</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mb-6">
                        Registre aqui seus impostos e taxas para manter um controle detalhado e evitar surpresas.
                    </p>
                    <Button onClick={() => handleOpenSheet()} disabled={!user}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Adicionar Primeiro Lançamento
                    </Button>
                </CardContent>
            </Card>
          )}
        </div>
      </Tabs>
    </>
  );
}
