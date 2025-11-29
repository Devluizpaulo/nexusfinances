'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { collection, deleteDoc, doc, getDocs, query, setDoc, updateDoc, where, orderBy } from 'firebase/firestore';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import type { Transaction } from '@/lib/types';
import { Loader2, Briefcase, PlusCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AddTransactionSheet } from '@/components/transactions/add-transaction-sheet';
import { incomeCategories } from '@/lib/types';
import { ImportPayslipCard } from '@/components/income/import-payslip-card';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useEffect } from 'react';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);


type SalaryContract = {
  id?: string;
  baseAmount: number;
  companyName: string;
  startDate?: string;
  contractType?: string;
  isPrimary?: boolean;
};

export default function SalaryPage() {
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [contracts, setContracts] = useState<SalaryContract[]>([]);
  const [baseAmountInput, setBaseAmountInput] = useState('');
  const [companyNameInput, setCompanyNameInput] = useState('');
  const [startDateInput, setStartDateInput] = useState('');
  const [contractTypeInput, setContractTypeInput] = useState('');
  const [editingContractId, setEditingContractId] = useState<string | null>(null);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);

  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const salaryIncomesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, `users/${user.uid}/incomes`), where('category', '==', 'Salário'), orderBy('date', 'desc'));
  }, [firestore, user]);

  const { data: salaryData, isLoading: isIncomesLoading } = useCollection<Transaction>(salaryIncomesQuery);

  useEffect(() => {
    if (!user) {
      setContracts([]);
      setBaseAmountInput('');
      setCompanyNameInput('');
      setStartDateInput('');
      setContractTypeInput('');
      setEditingContractId(null);
      return;
    }

    const fetchConfig = async () => {
      setIsLoadingConfig(true);
      try {
        const contractsCollection = collection(firestore, `users/${user.uid}/salaryContracts`);
        const snapshot = await getDocs(contractsCollection);

        const loadedContracts: SalaryContract[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<SalaryContract, 'id'>),
        }));

        setContracts(loadedContracts);
      } finally {
        setIsLoadingConfig(false);
      }
    };

    fetchConfig();
  }, [firestore, user]);

  const handleSaveSalaryConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const parsedAmount = Number(baseAmountInput.replace(',', '.'));
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      return;
    }

    setIsSavingConfig(true);
    try {
      const contractsCollection = collection(firestore, `users/${user.uid}/salaryContracts`);
      const payload: SalaryContract & { userId: string } = {
        baseAmount: parsedAmount,
        companyName: companyNameInput,
        startDate: startDateInput || undefined,
        contractType: contractTypeInput || undefined,
        userId: user.uid,
      };
      if (editingContractId) {
        const contractDocRef = doc(contractsCollection, editingContractId);
        await setDoc(contractDocRef, payload, { merge: true });

        setContracts((prev) =>
          prev.map((c) => (c.id === editingContractId ? { ...c, ...payload } : c))
        );
      } else {
        const newContractRef = doc(contractsCollection);
        await setDoc(newContractRef, payload, { merge: true });

        setContracts((prev) => [
          ...prev,
          {
            ...payload,
            id: newContractRef.id,
          },
        ]);
      }

      setBaseAmountInput('');
      setCompanyNameInput('');
      setStartDateInput('');
      setContractTypeInput('');
      setEditingContractId(null);
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleEditContract = (contract: SalaryContract) => {
    setEditingContractId(contract.id ?? null);
    setBaseAmountInput(String(contract.baseAmount));
    setCompanyNameInput(contract.companyName ?? '');
    setStartDateInput(contract.startDate ?? '');
    setContractTypeInput(contract.contractType ?? '');
  };

  const handleCancelEdit = () => {
    setEditingContractId(null);
    setBaseAmountInput('');
    setCompanyNameInput('');
    setStartDateInput('');
    setContractTypeInput('');
  };

  const handleDeleteContract = async (contractId: string | undefined) => {
    if (!user || !contractId) return;

    const contractsCollection = collection(firestore, `users/${user.uid}/salaryContracts`);
    const contractDocRef = doc(contractsCollection, contractId);
    await deleteDoc(contractDocRef);

    setContracts((prev) => prev.filter((c) => c.id !== contractId));

    if (editingContractId === contractId) {
      handleCancelEdit();
    }
  };

  const handleSetPrimaryContract = async (contractId: string | undefined) => {
    if (!user || !contractId) return;

    const contractsCollection = collection(firestore, `users/${user.uid}/salaryContracts`);

    const updates = contracts.map(async (contract) => {
      if (!contract.id) return;
      const contractDocRef = doc(contractsCollection, contract.id);
      const isPrimary = contract.id === contractId;
      await updateDoc(contractDocRef, { isPrimary });
    });

    await Promise.all(updates);

    setContracts((prev) =>
      prev.map((c) => ({
        ...c,
        isPrimary: c.id === contractId,
      }))
    );
  };

  const {
    avgGross,
    avgNet,
    avgDeductions,
    salaryHistory,
  } = useMemo(() => {
    if (!salaryData) return { avgGross: 0, avgNet: 0, avgDeductions: 0, salaryHistory: [] };

    const salaries = salaryData.filter(t => t.grossAmount !== undefined && t.grossAmount > 0);
    
    if (salaries.length === 0) return { avgGross: 0, avgNet: 0, avgDeductions: 0, salaryHistory: salaryData.slice(0, 6) };

    const totalNet = salaries.reduce((sum, s) => sum + s.amount, 0);
    const totalGross = salaries.reduce((sum, s) => sum + (s.grossAmount || 0), 0);
    const totalDeductions = salaries.reduce((sum, s) => sum + (s.totalDeductions || 0), 0);

    return {
      avgNet: totalNet / salaries.length,
      avgGross: totalGross / salaries.length,
      avgDeductions: totalDeductions / salaries.length,
      salaryHistory: salaryData.slice(0, 6) // Last 6 salaries, regardless of having gross amount
    };
  }, [salaryData]);

  const isLoading = isUserLoading || isIncomesLoading || isLoadingConfig;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  const handleOpenSheet = () => {
    setIsAddSheetOpen(true);
  };

  const handleCloseSheet = () => {
    setIsAddSheetOpen(false);
  };

  return (
    <>
       <AddTransactionSheet
        isOpen={isAddSheetOpen}
        onClose={handleCloseSheet}
        transactionType="income"
        categories={incomeCategories}
        transaction={null} 
      />
      <div className="grid gap-4 mb-6 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex items-center justify-start">
          <Button onClick={handleOpenSheet} disabled={!user}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Salário
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Configuração de salários / contratos</CardTitle>
            <CardDescription>
              Cadastre múltiplas empresas ou contratos com seus respectivos salários base.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={handleSaveSalaryConfig}>
              <div className="space-y-1">
                <Label htmlFor="baseAmount">Valor base do salário</Label>
                <Input
                  id="baseAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={baseAmountInput}
                  onChange={(e) => setBaseAmountInput(e.target.value)}
                  placeholder="Ex: 5000,00"
                  disabled={!user || isSavingConfig}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="companyName">Empresa ou contratante</Label>
                <Input
                  id="companyName"
                  type="text"
                  value={companyNameInput}
                  onChange={(e) => setCompanyNameInput(e.target.value)}
                  placeholder="Nome da empresa ou contratante"
                  disabled={!user || isSavingConfig}
                />
              </div>

              <div className="space-y-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="startDate">Data de início</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDateInput}
                    onChange={(e) => setStartDateInput(e.target.value)}
                    disabled={!user || isSavingConfig}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="contractType">Tipo de contrato</Label>
                  <Input
                    id="contractType"
                    type="text"
                    value={contractTypeInput}
                    onChange={(e) => setContractTypeInput(e.target.value)}
                    placeholder="CLT, PJ, estágio, etc."
                    disabled={!user || isSavingConfig}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="text-xs text-muted-foreground">
                  {contracts.length > 0 ? (
                    <span>
                      {contracts.length} contrato(s) cadastrado(s).
                      {' '}
                      {contracts.some((c) => c.isPrimary) &&
                        '· 1 contrato principal definido.'}
                    </span>
                  ) : (
                    <span>Nenhum contrato cadastrado ainda.</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {editingContractId && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCancelEdit}
                      disabled={isSavingConfig}
                    >
                      Cancelar
                    </Button>
                  )}
                  <Button type="submit" size="sm" disabled={!user || isSavingConfig}>
                    {isSavingConfig && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                    {editingContractId ? 'Salvar alterações' : 'Adicionar contrato'}
                  </Button>
                </div>
              </div>
            </form>

            {contracts.length > 0 && (
              <div className="mt-4 space-y-2">
                {contracts.map((contract) => (
                  <div
                    key={contract.id}
                    className="flex items-center justify-between rounded-md border px-3 py-2 text-xs"
                  >
                    <div>
                      <p className="font-medium">
                        {formatCurrency(contract.baseAmount)}
                        {contract.companyName ? ` · ${contract.companyName}` : ''}
                      </p>
                      <p className="text-muted-foreground">
                        {contract.contractType && <span>{contract.contractType}</span>}
                        {contract.contractType && contract.startDate && <span> · </span>}
                        {contract.startDate && (
                          <span>
                            Início: {format(new Date(contract.startDate), 'PP', { locale: ptBR })}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant={contract.isPrimary ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleSetPrimaryContract(contract.id)}
                      >
                        {contract.isPrimary ? 'Principal' : 'Tornar principal'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditContract(contract)}
                      >
                        Editar
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteContract(contract.id)}
                      >
                        Excluir
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mb-8">
        <ImportPayslipCard />
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-8">
         <KpiCard
            title="Salário Líquido Médio"
            value={formatCurrency(avgNet)}
            icon={TrendingUp}
            description="Média dos últimos salários líquidos."
        />
         <KpiCard
            title="Salário Bruto Médio"
            value={formatCurrency(avgGross)}
            icon={TrendingUp}
            description="Média dos últimos salários brutos."
        />
        <KpiCard
            title="Descontos Médios"
            value={formatCurrency(avgDeductions)}
            icon={TrendingDown}
            description="Média dos descontos (INSS, IRRF, etc.)."
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
              <Briefcase className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Histórico de Salários</CardTitle>
          </div>
          <CardDescription>Seus últimos salários importados ou cadastrados como "Salário".</CardDescription>
        </CardHeader>
        <CardContent>
          {salaryHistory.length > 0 ? (
             <div className="space-y-3">
                {salaryHistory.map((item) => (
                  <Card key={item.id} className="p-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-semibold">{formatCurrency(item.amount)} <span className="text-xs text-muted-foreground">(Líquido)</span></p>
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(item.date), 'PPP', { locale: ptBR })}
                            </p>
                        </div>
                         {item.grossAmount && item.grossAmount > 0 ? (
                            <div className="text-right text-xs">
                                <p>Bruto: {formatCurrency(item.grossAmount || 0)}</p>
                                <p className="text-red-500">Descontos: {formatCurrency(item.totalDeductions || 0)}</p>
                            </div>
                         ) : (
                           <div className="text-right text-xs text-muted-foreground">
                             Detalhes não disponíveis
                           </div>
                         )}
                    </div>
                  </Card>
                ))}
            </div>
          ) : (
             <div className="flex h-40 flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center">
              <h3 className="font-semibold">Nenhum histórico de salário encontrado</h3>
              <p className="mt-1 text-sm text-muted-foreground">Importe um holerite ou cadastre uma renda na categoria "Salário" para começar.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
