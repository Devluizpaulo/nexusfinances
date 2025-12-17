
'use client';

import { useMemo, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { collection, query, orderBy, where, doc, updateDoc } from 'firebase/firestore';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import type { Transaction } from '@/lib/types';
import { Loader2, PlusCircle, Upload, PenSquare } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { AddOtherIncomeSheet } from '@/components/income/add-other-income-sheet';
import { ImportTransactionsSheet } from '@/components/transactions/import-transactions-sheet';
import { DataTable } from '@/components/data-table/data-table';
import { useIncomeColumns } from '../columns';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { specificExpenseCategories, incomeCategories } from '@/lib/types';

const otherIncomeKeywords = ['Salário', 'Freelance'];

export default function OthersIncomePage() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isImportSheetOpen, setIsImportSheetOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  const otherIncomesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, `users/${user.uid}/incomes`),
      where('category', 'not-in', otherIncomeKeywords),
      orderBy('category'),
      orderBy('date', 'desc')
    );
  }, [user, firestore]);
  
  const { data: otherIncomes, isLoading: isExpensesLoading } = useCollection<Transaction>(otherIncomesQuery);

  const handleOpenSheet = useCallback((transaction: Transaction | null = null) => {
    setEditingTransaction(transaction);
    setIsSheetOpen(true);
  }, []);

  const handleCloseSheet = useCallback(() => {
    setEditingTransaction(null);
    setIsSheetOpen(false);
  }, []);

  const handleStatusChange = useCallback(async (transaction: Transaction) => {
    if (!user || transaction.status === 'paid') return;
    const docRef = doc(firestore, `users/${user.uid}/incomes`, transaction.id);
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
  
  const columns = useIncomeColumns({ onEdit: handleOpenSheet, onStatusChange: handleStatusChange });

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
      <AddOtherIncomeSheet
        isOpen={isSheetOpen}
        onClose={handleCloseSheet}
        transaction={editingTransaction}
      />
       <ImportTransactionsSheet 
        isOpen={isImportSheetOpen}
        onClose={() => setIsImportSheetOpen(false)}
      />

      <PageHeader
        title="Outras Rendas"
        description="Gerencie rendas passivas, aluguéis ou outras fontes de renda avulsas ou recorrentes."
      >
        <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsImportSheetOpen(true)} disabled={!user}>
              <Upload className="mr-2 h-4 w-4" />
              Importar PDF com IA
            </Button>
             <Button onClick={() => handleOpenSheet()} disabled={!user}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Renda
            </Button>
        </div>
      </PageHeader>
      
      {otherIncomes && otherIncomes.length > 0 ? (
          <DataTable
            columns={columns}
            data={otherIncomes}
        />
      ) : (
        <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <PenSquare className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Nenhuma outra renda cadastrada</h3>
              <p className="text-sm text-muted-foreground max-w-sm mb-6">
                Registre aqui seus rendimentos de investimentos, aluguéis ou qualquer outra entrada que não seja salário ou freelance.
              </p>
              <Button onClick={() => handleOpenSheet()} disabled={!user}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Adicionar Primeira Renda
              </Button>
            </CardContent>
        </Card>
      )}
    </>
  );
}
