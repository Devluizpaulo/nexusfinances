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
import { useFirestore, useUser, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';

import type { Goal } from '@/lib/types';

import { Button } from '../ui/button';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Trash2, Calendar, Tag, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import { doc } from 'firebase/firestore';

import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
};

interface GoalCardProps {
  goal: Goal;
  onAddContribution: (goal: Goal) => void;
}

type GoalContribution = {
  id: string;
  amount: number;
  date: string;
};

export function GoalCard({ goal, onAddContribution }: GoalCardProps) {

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const contributions = ((goal as any).contributions || []) as GoalContribution[];

  const sortedContributions = useMemo(
    () => [...contributions].sort((a, b) => (a.date < b.date ? 1 : -1)),
    [contributions],
  );

  const recentContributions = sortedContributions.slice(0, 3);

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

    deleteDocumentNonBlocking(goalRef);

    toast({
      title: 'Item Excluído',
      description: `O item "${goal.name}" foi removido.`,
    });

    setIsDeleteDialogOpen(false);
  };

  const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 100;
  const isCompleted = goal.currentAmount >= goal.targetAmount;

  return (
    <>
      {/* Modal de histórico completo de aportes */}
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Histórico de aportes - {goal.name}</DialogTitle>
            <DialogDescription>
              Consulte todos os aportes já realizados nesta reserva e gerencie o histórico.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-3 max-h-80 space-y-2 overflow-y-auto text-xs">
            {sortedContributions.length === 0 && (
              <p className="text-muted-foreground">Nenhum aporte registrado ainda.</p>
            )}
            {sortedContributions.map((c, index) => (
              <div
                key={c.id || `${c.date}-${index}`}
                className="flex items-center justify-between gap-2 rounded-md border px-2 py-1"
              >
                <div className="flex flex-col">
                  <span className="text-[11px] text-muted-foreground">
                    {format(parseISO(c.date), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </span>
                  <span className="font-medium">{formatCurrency(c.amount)}</span>
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
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>{goal.name}</CardTitle>
              {isCompleted ? (
                <CardDescription className="font-semibold text-green-600 dark:text-green-400">Objetivo Atingido!</CardDescription>
              ) : goal.targetDate ? (
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <Calendar className="mr-1.5 h-3 w-3" />
                  <span>{`Até ${format(parseISO(goal.targetDate), 'PPP', { locale: ptBR })}`}</span>
                </div>
              ) : null}
            </div>
            <div className="flex items-center gap-1">
              {goal.category && <Badge variant="secondary">{goal.category}</Badge>}
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsDeleteDialogOpen(true)}>
                <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                <span className="sr-only">Excluir Item</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-grow">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Alcançado</span>
              <span className="font-semibold">{formatCurrency(goal.currentAmount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Objetivo</span>
              <span>{formatCurrency(goal.targetAmount)}</span>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-right text-xs text-muted-foreground">
              {progress > 100 ? 100 : progress.toFixed(0)}%
            </p>
            {recentContributions.length > 0 && (
              <div className="mt-3 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-muted-foreground">
                    Histórico de aportes recentes
                  </p>
                  {sortedContributions.length > 0 && (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded-full border border-transparent px-2 py-0.5 text-[11px] font-medium text-primary hover:border-primary/40 hover:bg-primary/5"
                      onClick={() => setIsHistoryOpen(true)}
                    >
                      <History className="h-3 w-3" />
                      Ver histórico
                    </button>
                  )}
                </div>
                <div className="max-h-24 space-y-1 overflow-y-auto pr-1 text-xs">
                  {recentContributions.map((c, index) => (
                    <div
                      key={c.id || `${c.date}-${index}`}
                      className="flex items-center justify-between gap-2"
                    >
                      <span className="text-muted-foreground">
                        {format(parseISO(c.date), 'dd/MM/yyyy', { locale: ptBR })}
                      </span>
                      <span className="font-medium">{formatCurrency(c.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => onAddContribution(goal)}
            disabled={isCompleted}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Aporte
          </Button>
        </CardFooter>
      </Card>
    </>
  );
}