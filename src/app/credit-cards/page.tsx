'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2, CreditCard as CreditCardIcon } from 'lucide-react';
import { collection, query, orderBy } from 'firebase/firestore';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import type { CreditCard, Transaction } from '@/lib/types';
import { AddCreditCardSheet } from '@/components/credit-cards/add-credit-card-sheet';
import { CreditCardCard } from '@/components/credit-cards/credit-card-card';
import { PageHeader } from '@/components/page-header';

export default function CreditCardsPage() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);

  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const cardsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, `users/${user.uid}/creditCards`), orderBy('name', 'asc'));
  }, [firestore, user]);

  const expensesQuery = useMemoFirebase(() => {
    if (!user) return null;
    // Querying all expenses to filter them by card client-side
    return query(collection(firestore, `users/${user.uid}/expenses`));
  }, [firestore, user]);

  const { data: cardsData, isLoading: isCardsLoading } = useCollection<CreditCard>(cardsQuery);
  const { data: expensesData, isLoading: isExpensesLoading } = useCollection<Transaction>(expensesQuery);

  const handleEditCard = (card: CreditCard) => {
    setEditingCard(card);
    setIsSheetOpen(true);
  };
  
  const handleCloseSheet = () => {
    setEditingCard(null);
    setIsSheetOpen(false);
  };

  const isLoading = isUserLoading || isCardsLoading || isExpensesLoading;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <AddCreditCardSheet 
        isOpen={isSheetOpen} 
        onClose={handleCloseSheet} 
        card={editingCard}
      />
      <PageHeader
        title="Cartões de Crédito"
        description="Gerencie suas faturas e controle seus gastos no crédito."
      >
        <Button onClick={() => setIsSheetOpen(true)} disabled={!user}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Cartão
        </Button>
      </PageHeader>
      
      <div className="space-y-8">
        {cardsData && cardsData.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {cardsData.map((card) => (
              <CreditCardCard 
                key={card.id} 
                card={card} 
                expenses={expensesData || []} 
                onEdit={handleEditCard} 
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center" style={{minHeight: '400px'}}>
             <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
              <CreditCardIcon className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Nenhum cartão de crédito cadastrado</h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">Adicione seus cartões para controlar as faturas e ter uma visão clara de para onde seu dinheiro está indo.</p>
            <Button className="mt-6" onClick={() => setIsSheetOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Primeiro Cartão
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
