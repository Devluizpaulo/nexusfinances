'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { collection, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import type { Transaction } from '@/lib/types';
import { Loader2, WalletCards, PlusCircle, Upload } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { AddOtherExpenseSheet } from '@/components/expenses/add-other-expense-sheet';
import { ImportTransactionsSheet } from '@/components/transactions/import-transactions-sheet';
import { DataTable } from '@/components/data-table/data-table';
import { columns } from '../columns';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { PenSquare } from 'lucide-react';

const specificExpenseCategories = [
    'Moradia', 'Contas de Consumo', 'Impostos & Taxas', 'Assinaturas & Serviços'
];

export default function OthersExpensesPage() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isImportSheetOpen, setIsImportSheetOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  const allExpensesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, `users/${user.uid}/expenses`),
      orderBy('date', 'desc')
    );
  }, [user, firestore]);
  
  const { data: allExpenses, isLoading: isExpensesLoading } = useCollection<Transaction>(allExpensesQuery);

  const otherExpenses = useMemo(() => {
    if (!allExpenses) return [];
    return allExpenses.filter(expense => {
        const categoryLower = expense.category.toLowerCase();
        // Check if the category is NOT one of the specific ones
        return !specificExpenseCategories.some(specificCat => 
            categoryLower.includes(specificCat.toLowerCase())
        );
    });
  }, [allExpenses]);
  

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
      <AddOtherExpenseSheet
        isOpen={isSheetOpen}
        onClose={handleCloseSheet}
        transaction={editingTransaction}
      />
       <ImportTransactionsSheet 
        isOpen={isImportSheetOpen}
        onClose={() => setIsImportSheetOpen(false)}
      />

      <PageHeader
        title="Outras Despesas"
        description="Gerencie gastos avulsos ou que não se encaixam nas categorias principais."
      >
        <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsImportSheetOpen(true)} disabled={!user}>
              <Upload className="mr-2 h-4 w-4" />
              Importar PDF com IA
            </Button>
             <Button onClick={() => handleOpenSheet()} disabled={!user}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Despesa
            </Button>
        </div>
      </PageHeader>
      
      {otherExpenses.length > 0 ? (
          <DataTable
            columns={columns({ onEdit: handleOpenSheet, onStatusChange: handleStatusChange })}
            data={otherExpenses}
        />
      ) : (
        <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <PenSquare className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Nenhuma outra despesa cadastrada</h3>
              <p className="text-sm text-muted-foreground max-w-sm mb-6">
                Registre aqui seus gastos com alimentação, lazer, compras e outras categorias que não possuem uma seção dedicada.
              </p>
              <Button onClick={() => handleOpenSheet()} disabled={!user}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Adicionar Primeira Despesa
              </Button>
            </CardContent>
        </Card>
      )}
    </>
  );
}
