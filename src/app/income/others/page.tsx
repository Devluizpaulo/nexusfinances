
'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { collection, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import type { Transaction } from '@/lib/types';
import { Loader2, WalletCards, PlusCircle, Upload } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { AddOtherIncomeSheet } from '@/components/income/add-other-income-sheet';
import { ImportTransactionsSheet } from '@/components/transactions/import-transactions-sheet';
import { DataTable } from '@/components/data-table/data-table';
import { columns } from '../columns';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { PenSquare } from 'lucide-react';


const nonFreelancerSalaryKeywords = ['salário', 'freelance'];

export default function OthersIncomePage() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isImportSheetOpen, setIsImportSheetOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  const allIncomesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, `users/${user.uid}/incomes`),
      orderBy('date', 'desc')
    );
  }, [user, firestore]);
  
  const { data: allIncomes, isLoading: isIncomesLoading } = useCollection<Transaction>(allIncomesQuery);

  const otherIncomes = useMemo(() => {
    if (!allIncomes) return [];
    return allIncomes.filter(income => {
        const categoryLower = income.category.toLowerCase();
        return !nonFreelancerSalaryKeywords.some(keyword => categoryLower.includes(keyword));
    });
  }, [allIncomes]);
  

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
    const docRef = doc(firestore, `users/${user.uid}/incomes`, transaction.id);
    try {
        await updateDoc(docRef, { status: "paid" });
        toast({
        title: "Transação atualizada!",
        description: `A transação foi marcada como recebida.`,
        });
    } catch (e) {
        console.error("Error updating transaction status:", e);
        toast({
            variant: "destructive",
            title: "Erro ao atualizar",
            description: "Não foi possível marcar a transação como recebida."
        });
    }
  }

  const isLoading = isUserLoading || isIncomesLoading;

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
      
      {otherIncomes.length > 0 ? (
          <DataTable
            columns={columns({ onEdit: handleOpenSheet, onStatusChange: handleStatusChange })}
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
