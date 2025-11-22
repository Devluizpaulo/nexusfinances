'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2 } from 'lucide-react';
import { collection, query } from 'firebase/firestore';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import type { Debt } from '@/lib/types';
import { DebtCard } from '@/components/debts/debt-card';
import { AddDebtSheet } from '@/components/debts/add-debt-sheet';
import { useSearchParams } from 'next/navigation';

export default function DebtsPage() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const searchParams = useSearchParams();
  const selectedDueDate = searchParams.get('dueDate');

  const debtsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, `users/${user.uid}/debts`));
  }, [firestore, user]);

  const { data: debtData, isLoading: isDebtsLoading } = useCollection<Debt>(debtsQuery);
  
  const isLoading = isUserLoading || isDebtsLoading;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <AddDebtSheet isOpen={isSheetOpen} onClose={() => setIsSheetOpen(false)} />
      <PageHeader title="Dívidas" description="Gerencie seus empréstimos e parcelamentos.">
        <Button onClick={() => setIsSheetOpen(true)} disabled={!user}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Dívida
        </Button>
      </PageHeader>
      <div className="grid gap-6 md:grid-cols-2">
        {(debtData || []).map((debt) => (
          <DebtCard key={debt.id} debt={debt} selectedDueDate={selectedDueDate || undefined} />
        ))}
      </div>
       {(!debtData || debtData.length === 0) && !isLoading && (
        <div className="col-span-full mt-10 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-transparent p-8 text-center">
            <h3 className="text-xl font-semibold tracking-tight">Nenhuma dívida encontrada</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Comece adicionando uma nova dívida para ver seus detalhes aqui.
            </p>
            <Button className="mt-4" onClick={() => setIsSheetOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Primeira Dívida
            </Button>
        </div>
      )}
    </>
  );
}
