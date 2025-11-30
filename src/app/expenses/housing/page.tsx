'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import type { Recurrence, RentalContract } from '@/lib/types';
import { Loader2, Home, PlusCircle, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/page-header';
import { AddRentalContractSheet } from '@/components/housing/add-rental-contract-sheet';
import { RentalContractCard } from '@/components/housing/rental-contract-card';

const housingKeywords = ['aluguel', 'condomínio', 'hipoteca', 'iptu', 'moradia'];

export default function HousingPage() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<RentalContract | null>(null);
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const contractsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, `users/${user.uid}/rentalContracts`), orderBy('startDate', 'desc'));
  }, [firestore, user]);

  const expensesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, `users/${user.uid}/expenses`));
  }, [firestore, user]);

  const { data: contractsData, isLoading: isContractsLoading } = useCollection<RentalContract>(contractsQuery);
  const { data: expensesData, isLoading: isExpensesLoading } = useCollection<Recurrence>(expensesQuery);

  const handleEditContract = (contract: RentalContract) => {
    setEditingContract(contract);
    setIsSheetOpen(true);
  };
  
  const handleCloseSheet = () => {
    setEditingContract(null);
    setIsSheetOpen(false);
  }

  const isLoading = isUserLoading || isContractsLoading || isExpensesLoading;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <AddRentalContractSheet 
        isOpen={isSheetOpen}
        onClose={handleCloseSheet}
        contract={editingContract}
      />

      <PageHeader
        title="Moradia"
        description="Gerencie seus gastos recorrentes com moradia, como aluguel e condomínio."
      >
        <Button onClick={() => setIsSheetOpen(true)} disabled={!user}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Cadastrar Contrato de Aluguel
        </Button>
      </PageHeader>

      {contractsData && contractsData.length > 0 ? (
        <div className="space-y-4">
          {contractsData.map(contract => (
            <RentalContractCard 
              key={contract.id}
              contract={contract}
              expenses={expensesData || []}
              onEdit={handleEditContract}
            />
          ))}
        </div>
      ) : (
        <Card className="mt-4">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Home className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Contratos de Aluguel</CardTitle>
            </div>
            <CardDescription>Visualize seus contratos de aluguel e pagamentos.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-40 flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center">
              <h3 className="font-semibold">Nenhum contrato de aluguel encontrado</h3>
              <p className="mt-1 text-sm text-muted-foreground">Cadastre seu contrato para começar a gerenciar seus pagamentos de aluguel.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
