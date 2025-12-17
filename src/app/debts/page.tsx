
'use client';

import { Suspense, useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2, Banknote } from 'lucide-react';
import { collection, query, orderBy } from 'firebase/firestore';
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
  
  const selectedDueDate = useMemo(() => searchParams.get('dueDate'), [searchParams]);

  const debtsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, `users/${user.uid}/debts`), orderBy('totalAmount', 'desc'));
  }, [firestore, user]);

  const { data: debtData, isLoading: isDebtsLoading } = useCollection<Debt>(debtsQuery);
  
  const handleOpenSheet = useCallback(() => {
    setIsSheetOpen(true);
  }, []);

  const handleCloseSheet = useCallback(() => {
    setIsSheetOpen(false);
  }, []);

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
      <AddDebtSheet isOpen={isSheetOpen} onClose={handleCloseSheet} />
      <PageHeader
        title="Dívidas e Parcelamentos"
        description="Organize seus financiamentos, empréstimos e compras parceladas em um só lugar."
      >
        <Button onClick={handleOpenSheet} disabled={!user} className="bg-rose-500/20 border-rose-500/30 text-rose-300 hover:bg-rose-500/30 hover:border-rose-500/50">
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Dívida
        </Button>
      </PageHeader>
      
      {(!debtData || debtData.length === 0) ? (
        <div
          className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-800/60 bg-slate-950/70 p-12 text-center shadow-[0_18px_45px_-30px_rgba(15,23,42,1)]"
          style={{ minHeight: '400px' }}
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/10 mb-4">
            <Banknote className="h-8 w-8 text-rose-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-100">Nenhuma dívida encontrada</h3>
          <p className="mt-2 max-w-sm text-sm text-slate-400">
            Adicione suas dívidas, financiamentos e parcelamentos aqui para ter um controle centralizado e nunca mais perder um vencimento.
          </p>
          <Button className="mt-6 bg-rose-500/20 border-rose-500/30 text-rose-300 hover:bg-rose-500/30 hover:border-rose-500/50" onClick={handleOpenSheet}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Primeira Dívida
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
          {(debtData || []).map((debt) => (
            <div key={debt.id} className="rounded-2xl border border-slate-900/60 bg-slate-950/70 p-4 sm:p-5 shadow-[0_18px_45px_-30px_rgba(15,23,42,1)]">
              <DebtCard debt={debt} selectedDueDate={selectedDueDate || undefined} />
            </div>
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
