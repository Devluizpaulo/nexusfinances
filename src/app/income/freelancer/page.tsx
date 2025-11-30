'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { collection, query, where } from 'firebase/firestore';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import type { Recurrence } from '@/lib/types';
import { Loader2, PenSquare, PlusCircle, Calendar, DollarSign, Users, Upload } from 'lucide-react';
import { RecurrenceCard } from '@/components/recurrences/recurrence-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AddFreelancerProjectSheet } from '@/components/freelancer/add-freelancer-project-sheet';
import { formatCurrency } from '@/lib/utils';
import { ImportPayslipSheet } from '@/components/income/import-payslip-sheet';

const freelancerKeywords = ['freelance', 'projeto', 'consultoria', 'cliente', 'contrato', 'serviço'];

export default function FreelancerPage() {
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [isImportSheetOpen, setIsImportSheetOpen] = useState(false);
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const freelancerIncomesQuery = useMemoFirebase(() => {
    if (!user) return null;
    // Corrigido: buscar pela categoria 'Freelance' diretamente.
    return query(collection(firestore, `users/${user.uid}/incomes`), where('category', '==', 'Freelance'));
  }, [firestore, user]);

  const { data: freelancerIncomes, isLoading: isIncomesLoading } = useCollection<Recurrence>(freelancerIncomesQuery);

  // Estatísticas calculadas
  const stats = useMemo(() => {
    if (!freelancerIncomes) return { totalMonthly: 0, activeProjects: 0, averagePerProject: 0 };
    
    // Consideramos "ativos" os que são recorrentes
    const activeProjectsData = freelancerIncomes.filter(income => income.isRecurring);
    const totalMonthly = activeProjectsData.reduce((sum, income) => sum + income.amount, 0);
    const activeProjects = activeProjectsData.length;
    const averagePerProject = activeProjects > 0 ? totalMonthly / activeProjects : 0;

    return {
      totalMonthly,
      activeProjects,
      averagePerProject
    };
  }, [freelancerIncomes]);

  const isLoading = isUserLoading || isIncomesLoading;

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
      <AddFreelancerProjectSheet
        isOpen={isAddSheetOpen}
        onClose={handleCloseSheet}
      />
       <ImportPayslipSheet 
        isOpen={isImportSheetOpen}
        onClose={() => setIsImportSheetOpen(false)}
      />
      <div className="mb-6 flex items-center justify-end gap-2">
         <Button variant="outline" onClick={() => setIsImportSheetOpen(true)} disabled={!user}>
            <Upload className="mr-2 h-4 w-4" />
            Importar Holerite/NF (IA)
        </Button>
      </div>

      {/* Cards de Estatísticas */}
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

      {/* Lista de Projetos/Clientes */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <PenSquare className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Projetos e Clientes</CardTitle>
              <CardDescription>
                Suas rendas de trabalhos freelancer organizadas por cliente ou projeto.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {freelancerIncomes && freelancerIncomes.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                <span>{freelancerIncomes.length} item(s) encontrado(s)</span>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {freelancerIncomes.map((item) => (
                  <RecurrenceCard key={item.id} recurrence={item} />
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <PenSquare className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Nenhum projeto cadastrado</h3>
              <p className="text-sm text-muted-foreground max-w-sm mb-6">
                Comece adicionando seus primeiros clientes ou projetos como rendas recorrentes para acompanhar seu fluxo de trabalho freelancer.
              </p>
              <Button onClick={handleOpenSheet} disabled={!user}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Adicionar Primeiro Projeto
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dicas e Informações */}
      {(!freelancerIncomes || freelancerIncomes.length === 0) && (
        <Card className="mt-6 border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg mt-1">
                <Users className="h-4 w-4 text-blue-600 dark:text-blue-300" />
              </div>
              <div>
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  Dica para Freelancers
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Cadastre seus projetos usando o botão "Adicionar Primeiro Projeto". Todos os itens com a categoria "Freelance" aparecerão automaticamente aqui.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
