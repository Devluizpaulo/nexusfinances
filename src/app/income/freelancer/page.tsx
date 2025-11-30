'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { useUser, useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking, doc } from '@/firebase';
import type { Transaction } from '@/lib/types';
import { Loader2, PenSquare, PlusCircle, DollarSign, Users, Calendar, Upload } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AddFreelancerProjectSheet } from '@/components/freelancer/add-freelancer-project-sheet';
import { formatCurrency } from '@/lib/utils';
import { ImportPayslipSheet } from '@/components/income/import-payslip-sheet';
import { DataTable } from '@/components/data-table/data-table';
import { columns } from './columns';
import { useToast } from '@/hooks/use-toast';
import { AddTransactionSheet } from '@/components/transactions/add-transaction-sheet';
import { incomeCategories } from '@/lib/types';


export default function FreelancerPage() {
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [isImportSheetOpen, setIsImportSheetOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  const freelancerIncomesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, `users/${user.uid}/incomes`), 
      where('category', '==', 'Freelance'),
      orderBy('date', 'desc')
    );
  }, [firestore, user]);

  const { data: freelancerIncomes, isLoading: isIncomesLoading } = useCollection<Transaction>(freelancerIncomesQuery);

  const stats = useMemo(() => {
    if (!freelancerIncomes) return { totalMonthly: 0, activeProjects: 0, averagePerProject: 0 };
    
    // Consideramos "ativos" os que são recorrentes
    const recurringIncomes = freelancerIncomes.filter(income => income.isRecurring);
    const totalMonthly = recurringIncomes.reduce((sum, income) => sum + income.amount, 0);
    const activeProjects = recurringIncomes.length;
    const averagePerProject = activeProjects > 0 ? totalMonthly / activeProjects : 0;

    return {
      totalMonthly,
      activeProjects,
      averagePerProject
    };
  }, [freelancerIncomes]);

  const handleOpenSheet = (transaction: Transaction | null = null) => {
    setEditingTransaction(transaction);
    setIsAddSheetOpen(true);
  };

  const handleCloseSheet = () => {
    setEditingTransaction(null);
    setIsAddSheetOpen(false);
  };

   const handleStatusChange = (transaction: Transaction) => {
    if (!user || transaction.status === 'paid') return;
    const docRef = doc(firestore, `users/${user.uid}/incomes`, transaction.id);
    updateDocumentNonBlocking(docRef, { status: "paid" });
    toast({
      title: "Transação atualizada!",
      description: `A transação foi marcada como recebida.`,
    });
  }

  const isLoading = isUserLoading || isIncomesLoading;

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
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Renda Freelancer</h2>
            <p className="text-muted-foreground">
                Gerencie seus projetos e pagamentos em um só lugar.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsImportSheetOpen(true)} disabled={!user}>
                <Upload className="mr-2 h-4 w-4" />
                Importar Holerite/NF (IA)
            </Button>
             <Button onClick={() => handleOpenSheet()} disabled={!user}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Renda
            </Button>
          </div>
      </div>

      {freelancerIncomes && freelancerIncomes.length > 0 && (
        <div className="mt-2 grid gap-4 md:grid-cols-3 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Renda Mensal (Recorrente)</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalMonthly)}</div>
              <p className="text-xs text-muted-foreground">
                Soma dos projetos recorrentes ativos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Projetos Recorrentes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeProjects}</div>
              <p className="text-xs text-muted-foreground">
                Clientes/projetos com pagamento contínuo
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Média por Projeto Recorrente</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.averagePerProject)}</div>
              <p className="text-xs text-muted-foreground">
                Valor médio mensal dos projetos recorrentes
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {freelancerIncomes && freelancerIncomes.length > 0 ? (
          <DataTable
            columns={columns({ onEdit: handleOpenSheet, onStatusChange: handleStatusChange })}
            data={freelancerIncomes}
        />
      ) : (
        <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <PenSquare className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Nenhum projeto cadastrado</h3>
              <p className="text-sm text-muted-foreground max-w-sm mb-6">
                Comece adicionando seus primeiros clientes ou projetos como rendas para acompanhar seu fluxo de trabalho freelancer.
              </p>
              <Button onClick={() => handleOpenSheet()} disabled={!user}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Adicionar Primeiro Projeto
              </Button>
            </CardContent>
        </Card>
      )}
    </>
  );
}
