'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { collection, query, where } from 'firebase/firestore';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import type { Recurrence } from '@/lib/types';
import { Loader2, PenSquare, PlusCircle, Calendar, DollarSign, Users } from 'lucide-react';
import { RecurrenceCard } from '@/components/recurrences/recurrence-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AddTransactionSheet } from '@/components/transactions/add-transaction-sheet';
import { incomeCategories } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

const freelancerKeywords = ['freelance', 'projeto', 'consultoria', 'cliente', 'contrato', 'serviço'];

export default function FreelancerPage() {
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const recurringIncomesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, `users/${user.uid}/incomes`), where('isRecurring', '==', true));
  }, [firestore, user]);

  const { data: incomeData, isLoading: isIncomesLoading } = useCollection<Recurrence>(recurringIncomesQuery);

  const freelancerIncomes = useMemo(() => {
    return (incomeData || []).filter(income => 
        freelancerKeywords.some(keyword => 
          income.category.toLowerCase().includes(keyword) || 
          income.description.toLowerCase().includes(keyword)
        )
    );
  }, [incomeData]);

  // Estatísticas calculadas
  const stats = useMemo(() => {
    const totalMonthly = freelancerIncomes.reduce((sum, income) => sum + income.amount, 0);
    const activeProjects = freelancerIncomes.length;
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
      <AddTransactionSheet
        isOpen={isAddSheetOpen}
        onClose={handleCloseSheet}
        transactionType="income"
        categories={incomeCategories}
      />

      {/* Cards de Estatísticas */}
      {freelancerIncomes.length > 0 && (
        <div className="mt-2 grid gap-4 md:grid-cols-3 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Renda Mensal Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalMonthly)}</div>
              <p className="text-xs text-muted-foreground">
                Soma de todos os projetos ativos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Projetos Ativos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeProjects}</div>
              <p className="text-xs text-muted-foreground">
                Clientes/projetos recorrentes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Média por Projeto</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.averagePerProject)}</div>
              <p className="text-xs text-muted-foreground">
                Valor médio mensal
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
                Suas rendas recorrentes de trabalhos freelancer organizadas por cliente ou projeto
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {freelancerIncomes.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                <span>{freelancerIncomes.length} item(s) encontrado(s)</span>
                <span>Próximo vencimento →</span>
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
      {freelancerIncomes.length === 0 && (
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
                  Marque suas rendas de clientes como "recorrentes" e inclua palavras como "freelance", 
                  "projeto" ou "cliente" na descrição para que apareçam automaticamente aqui.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}