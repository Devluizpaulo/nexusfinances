
'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { collection, query, where, doc, orderBy } from 'firebase/firestore';
import { useUser, useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import type { Transaction } from '@/lib/types';
import { Loader2, Landmark, PlusCircle, Upload } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { AddTransactionSheet } from '@/components/transactions/add-transaction-sheet';
import { ImportTransactionsSheet } from '@/components/transactions/import-transactions-sheet';
import { DataTable } from '@/components/data-table/data-table';
import { columns } from '../columns';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { isPast, isFuture, parseISO } from 'date-fns';

export default function TaxesPage() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isImportSheetOpen, setIsImportSheetOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

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
    const upcoming: Transaction[] = [];
    const overdue: Transaction[] = [];
    const paid: Transaction[] = [];

    (taxesExpenses || []).forEach(t => {
      if (t.status === 'paid') {
        paid.push(t);
      } else {
        const dueDate = parseISO(t.date);
        if (isPast(dueDate)) {
          overdue.push(t);
        } else {
          upcoming.push(t);
        }
      }
    });

    return { upcoming, overdue, paid };
  }, [taxesExpenses]);


  const handleOpenSheet = (transaction: Transaction | null = null) => {
    setEditingTransaction(transaction);
    setIsSheetOpen(true);
  };

  const handleCloseSheet = () => {
    setEditingTransaction(null);
    setIsSheetOpen(false);
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
      
       <Tabs defaultValue="upcoming" className="mt-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upcoming">A vencer</TabsTrigger>
          <TabsTrigger value="overdue">Vencidos</TabsTrigger>
          <TabsTrigger value="paid">Pagos</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming" className="mt-4">
            <DataTable
                columns={columns({ onEdit: handleOpenSheet, onStatusChange: handleStatusChange })}
                data={upcoming}
            />
        </TabsContent>
        <TabsContent value="overdue" className="mt-4">
             <DataTable
                columns={columns({ onEdit: handleOpenSheet, onStatusChange: handleStatusChange })}
                data={overdue}
            />
        </TabsContent>
         <TabsContent value="paid" className="mt-4">
             <DataTable
                columns={columns({ onEdit: handleOpenSheet, onStatusChange: handleStatusChange })}
                data={paid}
            />
        </TabsContent>
      </Tabs>

      {!taxesExpenses || taxesExpenses.length === 0 && (
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
    </>
  );
}
