'use client';

import { useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useFirestore, useUser, deleteDocumentNonBlocking } from '@/firebase';
import type { Budget } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Pencil, Trash2 } from 'lucide-react';
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
import { doc } from 'firebase/firestore';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
};

interface BudgetCardProps {
  budget: Budget & { spentAmount?: number };
  onEdit: (budget: Budget) => void;
}

export function BudgetCard({ budget, onEdit }: BudgetCardProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const spent = budget.spentAmount || 0;
  const total = budget.amount;
  const remaining = total - spent;
  const progress = total > 0 ? (spent / total) * 100 : 0;

  const handleDelete = () => {
    if (!user) return;
    const budgetRef = doc(firestore, `users/${user.uid}/budgets`, budget.id);
    deleteDocumentNonBlocking(budgetRef);
    toast({
        title: "Limite de gasto excluído",
        description: `O limite "${budget.name}" foi removido.`
    });
    setIsDeleteDialogOpen(false);
  };
  
  const iconMap: Record<string, string> = {
    'Lazer': '🎉',
    'Comer fora': '🍽️',
    'Combustível': '⛽',
    'Mercado': '🛒',
    'Transporte': '🚌',
    'Saúde': '💊',
    'Compras': '🛍️',
  };
  const icon = iconMap[budget.category] || '💰';

  return (
    <>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita e excluirá permanentemente o limite de gasto "{budget.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex flex-col gap-2 rounded-md border p-4">
        <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-xl">
                    {icon}
                </div>
                <div>
                    <p className="font-semibold">{budget.name}</p>
                    <p className="text-xs text-muted-foreground">
                        {format(parseISO(budget.startDate), 'dd/MM', { locale: ptBR })} - {format(parseISO(budget.endDate), 'dd/MM', { locale: ptBR })}
                    </p>
                </div>
            </div>
            <div className="text-right">
                <p className="text-sm font-medium">{progress.toFixed(0)}%</p>
            </div>
        </div>
        
        <div>
            <Progress value={progress} className="h-2" />
            <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                <span>{formatCurrency(spent)}</span>
                <span>{formatCurrency(total)}</span>
            </div>
        </div>

        <div className="flex items-end justify-between">
            <div>
                 <p className="text-sm text-muted-foreground">Valor restante: <span className="font-medium text-foreground">{formatCurrency(remaining)}</span></p>
            </div>
            <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(budget)}>
                    <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive" onClick={() => setIsDeleteDialogOpen(true)}>
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        </div>

      </div>
    </>
  );
}
