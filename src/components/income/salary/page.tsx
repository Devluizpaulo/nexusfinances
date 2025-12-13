
'use client';

import { useMemo, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { collection, setDoc, updateDoc, getDocs, query, where, doc, deleteDoc, orderBy } from 'firebase/firestore';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import type { Transaction } from '@/lib/types';
import { Loader2, Briefcase, PlusCircle, TrendingUp, TrendingDown, Edit, Star, Trash2, MoreVertical, Upload } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AddTransactionSheet } from '@/components/transactions/add-transaction-sheet';
import { incomeCategories } from '@/lib/types';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"


import { Badge } from '@/components/ui/badge';
import { ImportPayslipSheet } from '@/components/income/import-payslip-sheet';
import { useToast } from '@/hooks/use-toast';

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
  const [isImportSheetOpen, setIsImportSheetOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isContractsModalOpen, setIsContractsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);

  const [contracts, setContracts] = useState<SalaryContract[]>([]);
  const [baseAmountInput, setBaseAmountInput] = useState('');
  const [companyNameInput, setCompanyNameInput] = useState('');
  const [startDateInput, setStartDateInput] = useState('');
  const [contractTypeInput, setContractTypeInput] = useState('');
  const [editingContractId, setEditingContractId] = useState<string | null>(null);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);
  const { toast } = useToast();

  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  // Query para buscar salários
  const salaryIncomesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, `users/${user.uid}/incomes`), 
      where('category', '==', 'Salário')
    );
  }, [firestore, user]);

  const { data: salaryData, isLoading: isIncomesLoading } = useCollection<Transaction>(salaryIncomesQuery);

  // Ordenação no cliente
  const sortedSalaryData = useMemo(() => {
    if (!salaryData) return [];
    return [...salaryData].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [salaryData]);

  // Buscar contratos
  useEffect(() => {
    if (!user) {
      setContracts([]);
      resetForm();
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

  // Reset do formulário
  const resetForm = () => {
    setBaseAmountInput('');
    setCompanyNameInput('');
    setStartDateInput('');
    setContractTypeInput('');
    setEditingContractId(null);
  };

  // Salvar configuração do salário
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
          { ...payload, id: newContractRef.id },
        ]);
      }

      resetForm();
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Editar contrato
  const handleEditContract = (contract: SalaryContract) => {
    setEditingContractId(contract.id ?? null);
    setBaseAmountInput(String(contract.baseAmount));
    setCompanyNameInput(contract.companyName ?? '');
    setStartDateInput(contract.startDate ?? '');
    setContractTypeInput(contract.contractType ?? '');
  };

  // Deletar contrato
  const handleDeleteContract = async (contractId: string | undefined) => {
    if (!user || !contractId) return;

    const contractsCollection = collection(firestore, `users/${user.uid}/salaryContracts`);
    const contractDocRef = doc(contractsCollection, contractId);
    await deleteDoc(contractDocRef);

    setContracts((prev) => prev.filter((c) => c.id !== contractId));

    if (editingContractId === contractId) {
      resetForm();
    }
  };

  // Definir contrato primário
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

  // Cálculos dos salários
  const { avgGross, avgNet, avgDeductions, salaryHistory } = useMemo(() => {
    if (!sortedSalaryData) return { 
      avgGross: 0, 
      avgNet: 0, 
      avgDeductions: 0, 
      salaryHistory: [] 
    };

    const salaries = sortedSalaryData.filter(t => t.grossAmount !== undefined && t.grossAmount > 0);
    
    if (salaries.length === 0) return { 
      avgGross: 0, 
      avgNet: 0, 
      avgDeductions: 0, 
      salaryHistory: sortedSalaryData.slice(0, 6) 
    };

    const totalNet = salaries.reduce((sum, s) => sum + s.amount, 0);
    const totalGross = salaries.reduce((sum, s) => sum + (s.grossAmount || 0), 0);
    const totalDeductions = salaries.reduce((sum, s) => sum + (s.totalDeductions || 0), 0);

    return {
      avgNet: totalNet / salaries.length,
      avgGross: totalGross / salaries.length,
      avgDeductions: totalDeductions / salaries.length,
      salaryHistory: sortedSalaryData.slice(0, 6)
    };
  }, [sortedSalaryData]);

  // Handlers para o sheet
  const handleOpenSheet = (transaction: Transaction | null = null) => {
    setEditingTransaction(transaction);
    setIsAddSheetOpen(true);
  };
  const handleCloseSheet = () => {
    setIsAddSheetOpen(false);
    setEditingTransaction(null);
  };
  
  const openDeleteDialog = (transaction: Transaction) => {
    setTransactionToDelete(transaction);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteTransaction = async () => {
    if (!user || !firestore || !transactionToDelete) return;

    const docRef = doc(firestore, `users/${user.uid}/incomes`, transactionToDelete.id);
    try {
        await deleteDoc(docRef);
        toast({
            title: "Salário excluído",
            description: `O registro de salário de ${formatCurrency(transactionToDelete.amount)} foi removido.`,
        });
    } catch(e) {
        toast({ variant: 'destructive', title: "Erro ao excluir", description: "Não foi possível remover o registro."})
    } finally {
        setIsDeleteDialogOpen(false);
        setTransactionToDelete(null);
    }
  }

  const isLoading = isUserLoading || isIncomesLoading || isLoadingConfig;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <AddTransactionSheet
        isOpen={isAddSheetOpen}
        onClose={handleCloseSheet}
        transactionType="income"
        categories={incomeCategories}
        transaction={editingTransaction} 
      />
       <ImportPayslipSheet 
        isOpen={isImportSheetOpen}
        onClose={() => setIsImportSheetOpen(false)}
      />

       <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o registro de salário.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTransaction} className="bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Header da página */}
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Salário</h2>
          <p className="text-muted-foreground">
            Configure seus contratos e acompanhe salários líquidos, brutos e descontos.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button variant="outline" onClick={() => setIsContractsModalOpen(true)} disabled={!user}>
            <Briefcase className="mr-2 h-4 w-4" />
            Gerenciar contratos
          </Button>
           <Button variant="outline" onClick={() => setIsImportSheetOpen(true)} disabled={!user}>
            <Upload className="mr-2 h-4 w-4" />
            Importar PDF com IA
          </Button>
        </div>
      </div>

      {/* KPIs e Histórico */}
      <div className="space-y-6">
        {/* KPIs */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <KpiCard
            title="Média Bruta"
            value={formatCurrency(avgGross)}
            icon={TrendingUp}
            description="Valor médio bruto dos últimos salários detalhados"
          />
          <KpiCard
            title="Média Líquida"
            value={formatCurrency(avgNet)}
            icon={TrendingDown}
            description="Valor médio líquido recebido"
          />
          <KpiCard
            title="Descontos Médios"
            value={formatCurrency(avgDeductions)}
            icon={TrendingDown}
            description="Média dos descontos (INSS, IRRF, etc.)"
          />
        </div>

        {/* Histórico */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico Recente</CardTitle>
            <CardDescription>
              Seus últimos salários registrados.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {salaryHistory.length > 0 ? (
              <div className="space-y-3">
                {salaryHistory.map((item) => (
                  <div key={item.id} className="group flex items-start justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50">
                    <div className="flex-1">
                      <p className="font-semibold">
                        {formatCurrency(item.amount)} 
                        <span className="text-xs text-muted-foreground"> (Líquido)</span>
                      </p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(item.date), 'PPP', { locale: ptBR })}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                           <DropdownMenuItem onClick={() => handleOpenSheet(item)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => openDeleteDialog(item)} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-40 flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center">
                <h3 className="font-semibold">Nenhum histórico de salário</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Adicione salários para ver o histórico aqui.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal de contratos */}
      <Dialog open={isContractsModalOpen} onOpenChange={setIsContractsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Contratos de Trabalho
            </DialogTitle>
            <DialogDescription>
              Cadastre e gerencie seus contratos e salários base. Defina um contrato principal para usar como referência.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <form onSubmit={handleSaveSalaryConfig} className="space-y-4">
              <div className="grid gap-3">
                <Label htmlFor="companyName">Empresa *</Label>
                <Input
                  id="companyName"
                  value={companyNameInput}
                  onChange={(e) => setCompanyNameInput(e.target.value)}
                  placeholder="Nome da empresa"
                  required
                />
              </div>

              <div className="grid gap-3">
                <Label htmlFor="baseAmount">Salário Base (R$) *</Label>
                <Input
                  id="baseAmount"
                  type="number"
                  step="0.01"
                  value={baseAmountInput}
                  onChange={(e) => setBaseAmountInput(e.target.value)}
                  placeholder="0,00"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="startDate">Data de Início</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDateInput}
                    onChange={(e) => setStartDateInput(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="contractType">Tipo de Contrato</Label>
                  <Input
                    id="contractType"
                    value={contractTypeInput}
                    onChange={(e) => setContractTypeInput(e.target.value)}
                    placeholder="CLT, PJ, etc."
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                {editingContractId && (
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                )}
                <Button type="submit" disabled={isSavingConfig}>
                  {isSavingConfig && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingContractId ? 'Atualizar' : 'Adicionar'} Contrato
                </Button>
              </div>
            </form>

            {/* Lista de contratos */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Meus Contratos</h4>
                <span className="text-sm text-muted-foreground">
                  {contracts.length} contrato(s)
                </span>
              </div>

              {contracts.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center">
                  <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">
                    Nenhum contrato cadastrado ainda.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Adicione seu primeiro contrato acima.
                  </p>
                </div>
              ) : (
                contracts.map((contract) => (
                  <div
                    key={contract.id}
                    className={`flex items-center justify-between rounded-lg border p-4 text-sm transition-colors ${
                      contract.isPrimary ? 'border-primary bg-primary/5' : ''
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-medium">{contract.companyName}</p>
                        {contract.isPrimary && (
                          <Badge variant="default" className="text-xs">
                            <Star className="h-3 w-3 mr-1 fill-current" />
                            Principal
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-1 text-muted-foreground">
                        <p>Base: {formatCurrency(contract.baseAmount)}</p>
                        {contract.contractType && (
                          <p>Tipo: {contract.contractType}</p>
                        )}
                        {contract.startDate && (
                          <p className="text-xs">
                            Início:{' '}
                            {(() => {
                              const [year, month, day] = contract.startDate!.split('-');
                              return `${day}/${month}/${year}`;
                            })()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditContract(contract)}
                        title="Editar contrato"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={contract.isPrimary ? "default" : "ghost"}
                        size="icon"
                        onClick={() => handleSetPrimaryContract(contract.id)}
                        title="Definir como principal"
                      >
                        <Star className={`h-4 w-4 ${contract.isPrimary ? 'fill-current' : ''}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteContract(contract.id)}
                        title="Excluir contrato"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
