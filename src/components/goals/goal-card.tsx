'use client';

import { useState } from 'react';
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
import { useFirestore, useUser, deleteDocumentNonBlocking } from '@/firebase';
import type { Goal } from '@/lib/types';
import { Button } from '../ui/button';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { doc } from 'firebase/firestore';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
};

interface GoalCardProps {
  goal: Goal;
}

export function GoalCard({ goal }: GoalCardProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const handleDeleteGoal = async () => {
    if (!user || !firestore) {
        toast({ variant: "destructive", title: "Erro", description: "Você não está autenticado." });
        return;
    }

    const goalRef = doc(firestore, `users/${user.uid}/goals`, goal.id);
    
    deleteDocumentNonBlocking(goalRef);

    toast({
        title: 'Meta Excluída',
        description: `A meta "${goal.name}" foi removida.`,
    });
    
    setIsDeleteDialogOpen(false);
  };


  const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 100;
  const isCompleted = goal.currentAmount >= goal.targetAmount;

  return (
    <>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente a meta <strong>{goal.name}</strong>.
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

      <Card className={cn("flex flex-col", isCompleted ? 'border-green-300 bg-green-50/50' : '')}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>{goal.name}</CardTitle>
              {isCompleted && (
                <CardDescription className="font-semibold text-green-600">Meta Atingida!</CardDescription>
              )}
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsDeleteDialogOpen(true)}>
                <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                <span className="sr-only">Excluir Meta</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-grow">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Alcançado</span>
              <span className="font-semibold">{formatCurrency(goal.currentAmount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Meta</span>
              <span>{formatCurrency(goal.targetAmount)}</span>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-right text-xs text-muted-foreground">
              {progress > 100 ? 100 : progress.toFixed(0)}%
            </p>
          </div>
        </CardContent>
        <CardFooter>
            <Button variant="outline" className="w-full" disabled>
                <PlusCircle className="mr-2 h-4 w-4" />
                Adicionar Aporte
            </Button>
        </CardFooter>
      </Card>
    </>
  );
}
    