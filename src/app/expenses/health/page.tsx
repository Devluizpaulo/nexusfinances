
'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { collection, query, where, doc, orderBy, updateDoc } from 'firebase/firestore';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import type { Transaction } from '@/lib/types';
import { Loader2, HeartPulse, PlusCircle, Upload, Users, Building } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { AddTransactionSheet } from '@/components/transactions/add-transaction-sheet';
import { ImportTransactionsSheet } from '@/components/transactions/import-transactions-sheet';
import { DataTable } from '@/components/data-table/data-table';
import { useExpenseColumns } from '../columns';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { ProfessionalsManager } from '@/components/health/professionals-manager';
import { formatCurrency } from '@/lib/utils';

export default function HealthExpensesPage() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isImportSheetOpen, setIsImportSheetOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isProfessionalsManagerOpen, setIsProfessionalsManagerOpen] = useState(false);

  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  const healthExpensesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, `users/${user.uid}/expenses`),
      where('category', '==', 'Saúde'),
      orderBy('date', 'desc')
    );
  }, [user, firestore]);

  const { data: healthExpenses, isLoading: isExpensesLoading, optimisticDelete } = useCollection<Transaction>(healthExpensesQuery);

  // Calculate health expenses total
  const healthTotal = useMemo(() => {
    return healthExpenses?.reduce((total, expense) => total + (expense.amount || 0), 0) || 0;
  }, [healthExpenses]);

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
    } catch (e) {
      console.error("Error updating document: ", e);
      toast({
          variant: "destructive",
          title: "Erro ao atualizar",
          description: "Não foi possível marcar a despesa como paga."
      });
    }
  }

  const columns = useExpenseColumns({ onEdit: handleOpenSheet, onStatusChange: handleStatusChange, optimisticDelete });
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
        categories={['Saúde']}
        transaction={editingTransaction}
      />
      <ImportTransactionsSheet 
        isOpen={isImportSheetOpen}
        onClose={() => setIsImportSheetOpen(false)}
      />

       <PageHeader
        title="Saúde & Bem-estar"
        description="Gerencie todos os seus gastos com saúde, desde consultas a medicamentos e planos."
      >
        <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsProfessionalsManagerOpen(true)} disabled={!user}>
                <Users className="mr-2 h-4 w-4" />
                Profissionais
            </Button>
            <Button variant="outline" onClick={() => setIsImportSheetOpen(true)} disabled={!user}>
                <Upload className="mr-2 h-4 w-4" />
                Importar Extrato
            </Button>
            <Button onClick={() => handleOpenSheet()} disabled={!user}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Despesa
            </Button>
        </div>
      </PageHeader>

      {/* Health Summary Card */}
      {healthExpenses && healthExpenses.length > 0 && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Resumo de Gastos</h3>
                <p className="text-sm text-muted-foreground">Total em despesas de saúde</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{formatCurrency(healthTotal)}</div>
                <p className="text-sm text-muted-foreground">{healthExpenses.length} transações</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {healthExpenses && healthExpenses.length > 0 ? (
        <DataTable
            columns={columns}
            data={healthExpenses}
        />
      ) : (
        <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="rounded-full bg-muted p-4 mb-4">
                    <HeartPulse className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Nenhuma despesa de saúde cadastrada</h3>
                <p className="text-sm text-muted-foreground max-w-sm mb-6">
                    Registre aqui seus gastos com consultas, exames, medicamentos, planos de saúde, academia, etc.
                </p>
                <Button onClick={() => handleOpenSheet()} disabled={!user}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Adicionar Primeira Despesa
                </Button>
            </CardContent>
        </Card>
      )}

      {/* Professionals Manager */}
      <ProfessionalsManager 
        isOpen={isProfessionalsManagerOpen} 
        onClose={() => setIsProfessionalsManagerOpen(false)} 
      />
    </>
  );
}
