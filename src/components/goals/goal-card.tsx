'use client';

import { useState, useMemo } from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Progress } from '@/components/ui/progress';
import { useFirestore, useUser, updateDocumentNonBlocking } from '@/firebase';

import type { Goal, GoalCategory } from '@/lib/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { Button } from '../ui/button';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Trash2, Calendar, History, MoreVertical, Pencil, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { doc, deleteDoc } from 'firebase/firestore';

import { format, parseISO, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Separator } from '../ui/separator';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
};

interface GoalCardProps {
  goal: Goal;
  onAddContribution: (goal: Goal) => void;
  onEdit: (goal: Goal) => void;
}

type GoalContribution = {
  id: string;
  amount: number;
  date: string;
};

const goalIcons: Record<GoalCategory, string> = {
    'Reserva de Emergência': '🆘',
    Viagem: '✈️',
    Carro: '🚗',
    Casa: '🏠',
    Eletrônicos: '💻',
    Educação: '🎓',
    Aposentadoria: '💼',
    Investir: '📈',
    'Quitar Dívidas': '💸',
    Outros: '✨',
};

export function GoalCard({ goal, onAddContribution, onEdit }: GoalCardProps) {

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedHorizon, setSelectedHorizon] = useState<6 | 12 | 24>(12);

  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const contributions = ((goal as any).contributions || []) as GoalContribution[];

  const sortedContributions = useMemo(
    () => [...contributions].sort((a, b) => (a.date < b.date ? 1 : -1)),
    [contributions],
  );

  const handleDeleteContribution = async (contributionId: string) => {
    if (!user || !firestore) return;

    const goalRef = doc(firestore, `users/${user.uid}/goals`, goal.id);

    const remaining = contributions.filter((c) => c.id !== contributionId);
    const newCurrentAmount = remaining.reduce((sum, c) => sum + c.amount, 0);

    try {
      await updateDocumentNonBlocking(goalRef, {
        contributions: remaining,
        currentAmount: newCurrentAmount,
      });

      toast({
        title: 'Aporte removido',
        description: 'O aporte foi excluído do histórico desta reserva.',
      });
    } catch (error) {
      console.error('Erro ao remover aporte:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao remover aporte',
        description: 'Não foi possível atualizar o histórico. Tente novamente.',
      });
    }
  };

  const handleDeleteGoal = async () => {
    if (!user || !firestore) {
      toast({ variant: "destructive", title: "Erro", description: "Você não está autenticado." });
      return;
    }
    const goalRef = doc(firestore, `users/${user.uid}/goals`, goal.id);
    try {
      await deleteDoc(goalRef);
      toast({
        title: 'Item Excluído',
        description: `O item "${goal.name}" foi removido.`,
      });
    } catch(error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Erro ao excluir",
        description: "Não foi possível remover o item.",
      });
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 100;
  const isCompleted = goal.currentAmount >= goal.targetAmount;
  const icon = goalIcons[goal.category as GoalCategory] || '🎯';

  const { remainingAmount, estimatedMonths, estimatedDate } = useMemo(() => {
    const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);

    if (!goal.monthlyContribution || goal.monthlyContribution <= 0 || remaining === 0) {
      return {
        remainingAmount: remaining,
        estimatedMonths: null as number | null,
        estimatedDate: null as Date | null,
      };
    }

    const months = Math.ceil(remaining / goal.monthlyContribution);
    const date = addMonths(new Date(), months);

    return { remainingAmount: remaining, estimatedMonths: months, estimatedDate: date };
  }, [goal.targetAmount, goal.currentAmount, goal.monthlyContribution]);

  const suggestedMonthlyByHorizon = useMemo(() => {
    if (remainingAmount <= 0) return null;
    return {
      6: Math.ceil(remainingAmount / 6),
      12: Math.ceil(remainingAmount / 12),
      24: Math.ceil(remainingAmount / 24),
    } as Record<6 | 12 | 24, number>;
  }, [remainingAmount]);

  const timelineData = useMemo(() => {
    const baseContributions = ((goal as any).contributions || []) as GoalContribution[];
    if (!baseContributions.length) return [] as { date: string; total: number }[];

    const ascending = [...baseContributions].sort((a, b) => (a.date < b.date ? -1 : 1));
    let total = 0;

    return ascending.map((c) => {
      total += c.amount;
      return {
        date: format(parseISO(c.date), 'dd/MM', { locale: ptBR }),
        total,
      };
    });
  }, [goal]);

  return (
    <>
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Histórico de aportes - {goal.name}</DialogTitle>
            <DialogDescription>
              Consulte todos os aportes já realizados nesta reserva e gerencie o histórico.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-3 max-h-80 space-y-2 overflow-y-auto pr-2 text-sm">
            {sortedContributions.length === 0 && (
              <p className="text-center text-muted-foreground">Nenhum aporte registrado ainda.</p>
            )}
            {sortedContributions.map((c, index) => (
              <div
                key={c.id || `${c.date}-${index}`}
                className="flex items-center justify-between gap-2 rounded-md border p-2"
              >
                <div className="flex flex-col">
                   <span className="font-medium">{formatCurrency(c.amount)}</span>
                  <span className="text-xs text-muted-foreground">
                    {format(parseISO(c.date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDeleteContribution(c.id)}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Remover aporte</span>
                </Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <span className="text-2xl">{icon}</span>
              {goal.name}
            </DialogTitle>
            {goal.description && <DialogDescription>{goal.description}</DialogDescription>}
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="rounded-lg border p-4">
              <div className="space-y-1">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-muted-foreground">Alcançado</span>
                  <span className="text-sm text-muted-foreground">Objetivo</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(goal.currentAmount)}
                  </p>
                  <p className="text-sm font-medium text-muted-foreground">
                    {formatCurrency(goal.targetAmount)}
                  </p>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-3">
                <Progress value={progress} className="h-3 bg-primary/20" indicatorClassName="bg-primary" />
                <span className="text-sm font-semibold text-primary">{Math.min(100, progress).toFixed(0)}%</span>
              </div>
            </div>

            {timelineData.length > 0 && (
              <div className="rounded-lg border p-4">
                <p className="mb-2 text-sm font-semibold text-muted-foreground">Evolução da reserva</p>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={timelineData} margin={{ left: -20, right: 4, top: 4, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                      <YAxis
                        tick={{ fontSize: 10 }}
                        tickFormatter={(value) => `${(value as number) / 1000}k`}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        formatter={(value) => formatCurrency(value as number)}
                        labelFormatter={(label) => `Data: ${label}`}
                      />
                      <Line type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4 text-sm">
                {goal.targetDate && (
                    <div className="space-y-1">
                        <p className="text-muted-foreground">Data Limite</p>
                        <p className="font-medium">{format(parseISO(goal.targetDate), 'dd/MM/yyyy', { locale: ptBR })}</p>
                    </div>
                )}
                {goal.monthlyContribution && goal.monthlyContribution > 0 && (
                    <div className="space-y-1">
                        <p className="text-muted-foreground">Aporte Mensal Planejado</p>
                        <p className="font-medium">{formatCurrency(goal.monthlyContribution)}</p>
                    </div>
                )}
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Histórico de Aportes</h3>
              <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border p-2">
                {sortedContributions.length > 0 ? sortedContributions.map((c) => (
                  <div key={c.id} className="flex justify-between items-center text-xs">
                     <span className="text-muted-foreground">{format(parseISO(c.date), 'dd/MM/yyyy HH:mm')}</span>
                     <Badge variant="secondary" className="font-mono text-emerald-700">+ {formatCurrency(c.amount)}</Badge>
                  </div>
                )) : <p className="text-center text-xs text-muted-foreground">Nenhum aporte registrado.</p>}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o item <strong>{goal.name}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteGoal} className="bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card className={cn("flex flex-col", isCompleted ? 'border-green-300 bg-green-50/50 dark:border-green-800 dark:bg-green-900/20' : '')}>
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{icon}</span>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">{goal.name}</CardTitle>
                  {isCompleted && (
                    <Badge variant="secondary" className="text-[10px] font-semibold text-emerald-700">
                      Meta batida
                    </Badge>
                  )}
                  {!isCompleted && progress >= 80 && (
                    <Badge variant="outline" className="text-[10px] font-semibold text-amber-700 border-amber-300">
                      Quase lá
                    </Badge>
                  )}
                </div>
                {goal.targetDate && (
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    <Calendar className="mr-1.5 h-3 w-3" />
                    <span>{`Data limite: ${format(parseISO(goal.targetDate), 'dd/MM/yyyy', { locale: ptBR })}`}</span>
                  </div>
                )}
              </div>
            </div>
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Opções</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsDetailsOpen(true)}>
                  <Eye className="mr-2 h-4 w-4" />
                  <span>Ver Detalhes</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(goal)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  <span>Editar</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Excluir</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="flex-grow space-y-4">
          <Separator/>
          <div className="space-y-1">
             <div className="flex items-baseline justify-between">
                <span className="text-sm text-muted-foreground">Alcançado</span>
                 <p className="text-sm font-medium text-muted-foreground">
                    {formatCurrency(goal.targetAmount)}
                </p>
             </div>
             <div className="flex items-baseline justify-between">
                <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(goal.currentAmount)}
                </p>
                <span className="text-sm text-muted-foreground">Objetivo</span>
             </div>
          </div>
          <div className="flex items-center gap-3">
            <Progress value={progress} className="h-3 bg-primary/20" indicatorClassName="bg-primary" />
            <span className="text-sm font-semibold text-primary">{Math.min(100, progress).toFixed(0)}%</span>
          </div>
          {!isCompleted && estimatedDate && estimatedMonths !== null && remainingAmount > 0 && (
            <p className="mt-1 text-xs text-muted-foreground">
              Faltam {formatCurrency(remainingAmount)} para bater a meta. No ritmo atual você deve alcançar em
              {' '}
              <span className="font-medium">
                {format(estimatedDate, "MMMM 'de' yyyy", { locale: ptBR })}
              </span>
              {' '}(~{estimatedMonths} {estimatedMonths === 1 ? 'mês' : 'meses'}).
            </p>
          )}
          {!isCompleted && remainingAmount > 0 && suggestedMonthlyByHorizon && (
            <div className="mt-1 space-y-1 text-[11px] text-muted-foreground">
              <div className="flex items-center gap-1">
                <span className="text-[10px]">Simular prazo:</span>
                {[6, 12, 24].map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setSelectedHorizon(h as 6 | 12 | 24)}
                    className={cn(
                      'rounded-full border px-2 py-0.5 text-[10px]',
                      selectedHorizon === h
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-background hover:border-primary/40'
                    )}
                  >
                    {h}m
                  </button>
                ))}
              </div>
              <p>
                Para concluir em{' '}
                <span className="font-medium">{selectedHorizon} meses</span>, o aporte ideal seria de{' '}
                <span className="font-medium">
                  {formatCurrency(suggestedMonthlyByHorizon[selectedHorizon])}
                </span>{' '}
                por mês
                {goal.monthlyContribution && goal.monthlyContribution > 0 && (
                  <>
                    {' '}({goal.monthlyContribution < suggestedMonthlyByHorizon[selectedHorizon]
                      ? `+${formatCurrency(suggestedMonthlyByHorizon[selectedHorizon] - goal.monthlyContribution)} em relação ao aporte atual`
                      : 'igual ou abaixo do que você já planejou'})
                    .
                  </>
                )}
                .
              </p>
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-[11px]"
                  onClick={() => onEdit(goal)}
                >
                  Ajustar aporte mensal
                </Button>
              </div>
            </div>
          )}
           {sortedContributions.length > 0 && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-muted-foreground">
                    Últimos aportes:
                  </p>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded-full border border-transparent px-2 py-0.5 text-[11px] font-medium text-primary hover:border-primary/40 hover:bg-primary/5"
                      onClick={() => setIsHistoryOpen(true)}
                    >
                      <History className="h-3 w-3" />
                      Ver todos
                    </button>
                </div>
                <div className="space-y-1.5 text-sm">
                  {sortedContributions.slice(0, 3).map((c, index) => (
                    <div key={c.id || `${c.date}-${index}`} className="flex items-center justify-between gap-2 text-xs">
                       <span className="text-muted-foreground">{format(parseISO(c.date), 'dd/MM/yyyy', { locale: ptBR })}</span>
                       <Badge variant="secondary" className="font-mono">+ {formatCurrency(c.amount)}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </CardContent>
        <CardFooter>
          <Button
            className="w-full"
            onClick={() => onAddContribution(goal)}
            disabled={isCompleted}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar novo aporte
          </Button>
        </CardFooter>
      </Card>
    </>
  );
}
