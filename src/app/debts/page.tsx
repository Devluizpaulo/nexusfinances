'use client';

import { Suspense, useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2, Banknote } from 'lucide-react';
import { collection, query } from 'firebase/firestore';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import type { Debt } from '@/lib/types';
import { DebtCard } from '@/components/debts/debt-card';
import { AddDebtSheet } from '@/components/debts/add-debt-sheet';
import { useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/page-header';

function DebtsContent() {
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
      <PageHeader
        title="Dívidas e Parcelamentos"
        description="Organize seus financiamentos, empréstimos e compras parceladas em um só lugar."
      >
        <Button onClick={() => setIsSheetOpen(true)} disabled={!user}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Dívida
        </Button>
      </PageHeader>
      
      {(!debtData || debtData.length === 0) ? (
        <div
          className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center"
          style={{ minHeight: '400px' }}
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
            <Banknote className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-semibold">Nenhuma dívida encontrada</h3>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Adicione suas dívidas, financiamentos e parcelamentos aqui para ter um controle centralizado e nunca mais perder um vencimento.
          </p>
          <Button className="mt-6" onClick={() => setIsSheetOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Primeira Dívida
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
          {(debtData || []).map((debt) => (
            <DebtCard key={debt.id} debt={debt} selectedDueDate={selectedDueDate || undefined} />
          ))}
        </div>
      )}
    </>
  );
}

export default function DebtsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <DebtsContent />
    </Suspense>
  );
}
