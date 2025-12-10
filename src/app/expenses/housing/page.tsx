
'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { collection, query, orderBy, where, doc } from 'firebase/firestore';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import type { RentalContract, Transaction } from '@/lib/types';
import { Loader2, Home, PlusCircle, Settings } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { AddRentalContractSheet } from '@/components/housing/add-rental-contract-sheet';
import { RentalContractCard } from '@/components/housing/rental-contract-card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ManageContractsDialog } from '@/components/housing/manage-contracts-dialog';
import { addYears, parseISO } from 'date-fns';
import { DataTable } from '@/components/data-table/data-table';
import { columns } from '../columns';
import { useToast } from '@/hooks/use-toast';
import { AddTransactionSheet } from '@/components/transactions/add-transaction-sheet';
import { expenseCategories } from '@/lib/types';
import { updateDoc } from "firebase/firestore";

export default function HousingPage() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<RentalContract | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  const contractsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, `users/${user.uid}/rentalContracts`),
      orderBy('startDate', 'desc')
    );
  }, [firestore, user]);
  
  const housingExpensesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, `users/${user.uid}/expenses`),
      where('category', '==', 'Moradia'),
      orderBy('date', 'desc')
    );
  }, [firestore, user]);

  const { data: contractsData, isLoading: isContractsLoading } = useCollection<RentalContract>(contractsQuery);
  const { data: housingExpenses, isLoading: isExpensesLoading } = useCollection<Transaction>(housingExpensesQuery);

  const { activeContracts, inactiveContracts } = useMemo(() => {
    const active: RentalContract[] = [];
    const inactive: RentalContract[] = [];

    (contractsData || []).forEach(contract => {
      contract.status === 'inactive' ? inactive.push(contract) : active.push(contract);
    });

    return { activeContracts: active, inactiveContracts: inactive };
  }, [contractsData]);

  const handleEditContract = (contract: RentalContract, isRenewal = false) => {
    if (isRenewal && contract.endDate) {
      const startDate = parseISO(contract.endDate);
      const endDate = addYears(startDate, 1);

      setEditingContract({
        ...contract,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });
    } else {
      setEditingContract(contract);
    }
    setIsSheetOpen(true);
  };
  
  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsSheetOpen(true);
  }

  const handleCloseSheet = () => {
    setEditingContract(null);
    setEditingTransaction(null);
    setIsSheetOpen(false);
  };
  
  const handleStatusChange = (transaction: Transaction) => {
    if (!user || transaction.status === 'paid') return;
    const docRef = doc(firestore, `users/${user.uid}/expenses`, transaction.id);
    updateDoc(docRef, { status: "paid" }).then(() => {
        toast({
            title: "Transação atualizada!",
            description: `A despesa foi marcada como paga.`,
        });
    }).catch((e) => {
        console.error("Error updating document: ", e);
        toast({
            variant: "destructive",
            title: "Erro ao atualizar",
            description: "Não foi possível marcar a despesa como paga."
        });
    });
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
        isOpen={isSheetOpen && !editingTransaction}
        onClose={handleCloseSheet}
        contract={editingContract}
      />
      <AddTransactionSheet
        isOpen={isSheetOpen && !!editingTransaction}
        onClose={handleCloseSheet}
        transactionType="expense"
        categories={expenseCategories}
        transaction={editingTransaction}
      />

      <ManageContractsDialog
        isOpen={isManageDialogOpen}
        onClose={() => setIsManageDialogOpen(false)}
        contracts={contractsData || []}
        onEditContract={handleEditContract}
      />

      <PageHeader
        title="Moradia"
        description="Gerencie contratos de aluguel, condomínio e demais despesas residenciais em um único lugar."
      >
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsManageDialogOpen(true)}
            disabled={!user || !contractsData || contractsData.length === 0}
          >
            <Settings className="mr-2 h-4 w-4" />
            Gerenciar Contratos
          </Button>

          <Button
            onClick={() => {
              setEditingContract(null);
              setIsSheetOpen(true);
            }}
            disabled={!user}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Cadastrar Contrato
          </Button>
        </div>
      </PageHeader>
      
      <div className="space-y-6">
        {activeContracts.length > 0 && (
          <section className="space-y-4">
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
          </section>
        )}
        
        <section>
          <h2 className="text-lg font-semibold mb-4">Histórico de Despesas de Moradia</h2>
          {(housingExpenses ?? []).length > 0 ? (
            <DataTable
              columns={columns({ onEdit: handleEditTransaction, onStatusChange: handleStatusChange })}
              data={housingExpenses}
            />
          ) : (
             <div className="flex h-40 flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center">
              <Home className="h-10 w-10 text-muted-foreground mb-4" />
              <h3 className="font-semibold">Nenhuma despesa de moradia encontrada</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Cadastre um contrato ou uma despesa avulsa para começar.
              </p>
            </div>
          )}
        </section>

        {inactiveContracts.length > 0 && (
          <Accordion type="single" collapsible className="w-full mt-8">
            <AccordionItem value="inactive-contracts">
              <AccordionTrigger>
                <h2 className="text-lg font-semibold">
                  Contratos Encerrados ({inactiveContracts.length})
                </h2>
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
      </div>
    </>
  );
}
