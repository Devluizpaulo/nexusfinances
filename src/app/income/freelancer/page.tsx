'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { collection, query, where, or, orderBy } from 'firebase/firestore';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import type { Recurrence } from '@/lib/types';
import { 
  Loader2, 
  PenSquare, 
  PlusCircle, 
  Calendar, 
  DollarSign, 
  Users, 
  Upload,
  Filter,
  Search,
  TrendingUp,
  FileText,
  AlertCircle
} from 'lucide-react';
import { RecurrenceCard } from '@/components/recurrences/recurrence-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AddFreelancerProjectSheet } from '@/components/freelancer/add-freelancer-project-sheet';
import { formatCurrency } from '@/lib/utils';
import { ImportPayslipSheet } from '@/components/income/import-payslip-sheet';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const FREELANCER_KEYWORDS = ['freelance', 'projeto', 'consultoria', 'cliente', 'contrato', 'serviço', 'freela', 'project'];

type ViewMode = 'all' | 'recurring' | 'one-time';
type SortMode = 'date' | 'amount' | 'name';

export default function FreelancerPage() {
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [isImportSheetOpen, setIsImportSheetOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [sortMode, setSortMode] = useState<SortMode>('date');
  
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  // Query melhorada: busca por categoria E por keywords na descrição
  const freelancerIncomesQuery = useMemoFirebase(() => {
    if (!user) return null;
    
    const incomesRef = collection(firestore, `users/${user.uid}/incomes`);
    
    // Busca por categoria OU por keywords na descrição
    const categoryQuery = where('category', '==', 'Freelance');
    
    // Cria queries dinâmicas para keywords
    const keywordQueries = FREELANCER_KEYWORDS.map(keyword => 
      where('description', '>=', keyword)
    );

    // Query principal ordenada por data
    return query(
      incomesRef,
      or(
        categoryQuery,
        ...keywordQueries.slice(0, 10) // Firestore limita a 10 condições no OR
      ),
      orderBy('date', 'desc')
    );
  }, [firestore, user]);

  const { data: allFreelancerIncomes, isLoading: isIncomesLoading, error } = useCollection<Recurrence>(freelancerIncomesQuery);

  // Filtros e ordenação
  const filteredAndSortedIncomes = useMemo(() => {
    if (!allFreelancerIncomes) return [];

    let filtered = allFreelancerIncomes.filter(income => {
      // Filtro por modo de visualização
      if (viewMode === 'recurring' && !income.isRecurring) return false;
      if (viewMode === 'one-time' && income.isRecurring) return false;
      
      // Filtro por busca
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          income.description?.toLowerCase().includes(term) ||
          income.category?.toLowerCase().includes(term) ||
          income.companyName?.toLowerCase().includes(term)
        );
      }
      
      return true;
    });

    // Ordenação
    filtered.sort((a, b) => {
      switch (sortMode) {
        case 'amount':
          return (b.amount || 0) - (a.amount || 0);
        case 'name':
          return (a.description || '').localeCompare(b.description || '');
        case 'date':
        default:
          return new Date(b.date || '').getTime() - new Date(a.date || '').getTime();
      }
    });

    return filtered;
  }, [allFreelancerIncomes, viewMode, searchTerm, sortMode]);

  // Estatísticas COMPLETAS
  const stats = useMemo(() => {
    if (!allFreelancerIncomes) {
      return { 
        totalMonthly: 0, 
        activeProjects: 0, 
        averagePerProject: 0,
        totalOneTime: 0,
        oneTimeProjects: 0,
        totalAllTime: 0,
        projectCount: 0
      };
    }
    
    const recurringProjects = allFreelancerIncomes.filter(income => income.isRecurring);
    const oneTimeProjects = allFreelancerIncomes.filter(income => !income.isRecurring);
    
    const totalMonthly = recurringProjects.reduce((sum, income) => sum + (income.amount || 0), 0);
    const totalOneTime = oneTimeProjects.reduce((sum, income) => sum + (income.amount || 0), 0);
    const totalAllTime = totalMonthly + totalOneTime;
    
    const activeProjects = recurringProjects.length;
    const oneTimeCount = oneTimeProjects.length;
    const projectCount = allFreelancerIncomes.length;
    
    const averagePerProject = activeProjects > 0 ? totalMonthly / activeProjects : 0;
    const averageOneTime = oneTimeCount > 0 ? totalOneTime / oneTimeCount : 0;

    return {
      totalMonthly,
      activeProjects,
      averagePerProject,
      totalOneTime,
      oneTimeProjects: oneTimeCount,
      averageOneTime,
      totalAllTime,
      projectCount
    };
  }, [allFreelancerIncomes]);

  const isLoading = isUserLoading || isIncomesLoading;

  // Loading state melhorado
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Carregando seus projetos...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <div>
          <h3 className="font-semibold text-lg mb-2">Erro ao carregar projetos</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Não foi possível carregar seus dados. Verifique sua conexão e tente novamente.
          </p>
        </div>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Tentar Novamente
        </Button>
      </div>
    );
  }

  const hasIncomes = allFreelancerIncomes && allFreelancerIncomes.length > 0;
  const showResults = filteredAndSortedIncomes.length > 0;

  return (
    <>
      <AddFreelancerProjectSheet
        isOpen={isAddSheetOpen}
        onClose={() => setIsAddSheetOpen(false)}
      />
      
      <ImportPayslipSheet 
        isOpen={isImportSheetOpen}
        onClose={() => setIsImportSheetOpen(false)}
      />

      {/* Header com Ações */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projetos Freelancer</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie seus clientes e projetos de freelance
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  onClick={() => setIsImportSheetOpen(true)} 
                  disabled={!user}
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Importar com IA
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Importe holerites e notas fiscais automaticamente</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button onClick={() => setIsAddSheetOpen(true)} disabled={!user} className="gap-2">
            <PlusCircle className="h-4 w-4" />
            Novo Projeto
          </Button>
        </div>
      </div>

      {/* Cards de Estatísticas Expandidos */}
      {hasIncomes && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total em Projetos</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalAllTime)}</div>
              <p className="text-xs text-muted-foreground">
                Soma de todos os projetos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Renda Mensal Recorrente</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalMonthly)}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeProjects} projeto(s) ativo(s)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Projetos Únicos</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalOneTime)}</div>
              <p className="text-xs text-muted-foreground">
                {stats.oneTimeProjects} projeto(s) único(s)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Média Recorrente</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.averagePerProject)}</div>
              <p className="text-xs text-muted-foreground">
                Por projeto recorrente
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros e Busca */}
      {hasIncomes && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              {/* Busca */}
              <div className="flex-1 w-full sm:max-w-xs">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar projetos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Filtros */}
              <div className="flex flex-wrap gap-2">
                <Select value={viewMode} onValueChange={(value: ViewMode) => setViewMode(value)}>
                  <SelectTrigger className="w-[140px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filtrar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="recurring">Recorrentes</SelectItem>
                    <SelectItem value="one-time">Únicos</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortMode} onValueChange={(value: SortMode) => setSortMode(value)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Ordenar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Mais Recentes</SelectItem>
                    <SelectItem value="amount">Maior Valor</SelectItem>
                    <SelectItem value="name">Nome A-Z</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Projetos/Clientes */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <PenSquare className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Meus Projetos</CardTitle>
                <CardDescription>
                  {hasIncomes 
                    ? `${stats.projectCount} projeto(s) encontrado(s)` 
                    : 'Organize seus trabalhos freelancer'
                  }
                </CardDescription>
              </div>
            </div>

            {hasIncomes && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="outline" className="font-normal">
                  {filteredAndSortedIncomes.length} item(s)
                </Badge>
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          {showResults ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredAndSortedIncomes.map((item) => (
                <RecurrenceCard key={item.id} recurrence={item} />
              ))}
            </div>
          ) : hasIncomes ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum projeto encontrado</h3>
              <p className="text-sm text-muted-foreground max-w-sm mb-4">
                Tente ajustar os filtros ou termos de busca.
              </p>
              <Button variant="outline" onClick={() => { setSearchTerm(''); setViewMode('all'); }}>
                Limpar Filtros
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <PenSquare className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Nenhum projeto cadastrado</h3>
              <p className="text-sm text-muted-foreground max-w-sm mb-6">
                Comece adicionando seus primeiros clientes ou projetos para acompanhar seu fluxo de trabalho freelancer.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={() => setIsAddSheetOpen(true)} disabled={!user}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Adicionar Projeto Manual
                </Button>
                <Button variant="outline" onClick={() => setIsImportSheetOpen(true)} disabled={!user}>
                  <Upload className="mr-2 h-4 w-4" />
                  Importar com IA
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dicas Contextuais */}
      {!hasIncomes && (
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
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                  Use a categoria "Freelance" ou inclua palavras como "projeto", "cliente" ou "consultoria" nas descrições para organizar automaticamente seus trabalhos aqui.
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {FREELANCER_KEYWORDS.slice(0, 5).map(keyword => (
                    <Badge key={keyword} variant="secondary" className="text-xs">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}