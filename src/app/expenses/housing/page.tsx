'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { collection, query, orderBy } from 'firebase/firestore';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import type { RentalContract } from '@/lib/types';
import { Loader2, Home, PlusCircle, Settings, History } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { AddRentalContractSheet } from '@/components/housing/add-rental-contract-sheet';
import { RentalContractCard } from '@/components/housing/rental-contract-card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ManageContractsDialog } from '@/components/housing/manage-contracts-dialog';
import { addYears, parseISO } from 'date-fns';


export default function HousingPage() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<RentalContract | null>(null);
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const contractsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, `users/${user.uid}/rentalContracts`), orderBy('startDate', 'desc'));
  }, [firestore, user]);

  const { data: contractsData, isLoading: isContractsLoading } = useCollection<RentalContract>(contractsQuery);

  const { activeContracts, inactiveContracts } = useMemo(() => {
    const active: RentalContract[] = [];
    const inactive: RentalContract[] = [];

    (contractsData || []).forEach(contract => {
      if (contract.status === 'inactive') {
        inactive.push(contract);
      } else {
        active.push(contract);
      }
    });

    return { activeContracts: active, inactiveContracts: inactive };
  }, [contractsData]);

  const handleEditContract = (contract: RentalContract, isRenewal = false) => {
    if (isRenewal && contract.endDate) {
      // Prepare o contrato para renovação
      const newStartDate = addYears(parseISO(contract.endDate), 0); // Começa onde o último terminou
      const newEndDate = addYears(newStartDate, 1);
      
      setEditingContract({
        ...contract,
        startDate: newStartDate.toISOString(),
        endDate: newEndDate.toISOString(),
        // Opcional: resetar valores ou manter? Manter é mais fácil para o usuário ajustar.
      });
    } else {
      setEditingContract(contract);
    }
    setIsSheetOpen(true);
  };
  
  const handleCloseSheet = () => {
    setEditingContract(null);
    setIsSheetOpen(false);
  }

  const isLoading = isUserLoading || isContractsLoading;

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
      <ManageContractsDialog
        isOpen={isManageDialogOpen}
        onClose={() => setIsManageDialogOpen(false)}
        contracts={contractsData || []}
        onEditContract={handleEditContract}
      />

      <PageHeader
        title="Moradia"
        description="Hub de gestão para seus contratos de aluguel, condomínio e outros custos residenciais."
      >
        <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsManageDialogOpen(true)} disabled={!user}>
                <Settings className="mr-2 h-4 w-4" />
                Gerenciar Contratos
            </Button>
            <Button onClick={() => { setEditingContract(null); setIsSheetOpen(true); }} disabled={!user}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Cadastrar Contrato
            </Button>
        </div>
      </PageHeader>

      {activeContracts.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Contratos Ativos</h2>
          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
            {activeContracts.map(contract => (
              <RentalContractCard 
                key={contract.id}
                contract={contract}
                onEdit={handleEditContract}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="flex h-40 flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center">
          <Home className="h-10 w-10 text-muted-foreground mb-4"/>
          <h3 className="font-semibold">Nenhum contrato ativo encontrado</h3>
          <p className="mt-1 text-sm text-muted-foreground">Cadastre seu aluguel ou condomínio para começar a gerenciar.</p>
        </div>
      )}

      {inactiveContracts.length > 0 && (
         <Accordion type="single" collapsible className="w-full mt-8">
            <AccordionItem value="item-1">
                <AccordionTrigger>
                    <h2 className="text-lg font-semibold">Contratos Encerrados ({inactiveContracts.length})</h2>
                </AccordionTrigger>
                <AccordionContent className="pt-4 grid gap-6 md:grid-cols-1 lg:grid-cols-2">
                    {inactiveContracts.map(contract => (
                        <RentalContractCard 
                            key={contract.id}
                            contract={contract}
                            onEdit={handleEditContract}
                        />
                    ))}
                </AccordionContent>
            </AccordionItem>
        </Accordion>
      )}
    </>
  );
}
