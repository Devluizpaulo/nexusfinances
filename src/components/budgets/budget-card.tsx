
'use client';

import { useState, useEffect, useRef } from 'react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useFirestore, useUser } from '@/firebase';
import type { Budget } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Pencil, Trash2, MoreVertical } from 'lucide-react';
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
import { doc, deleteDoc, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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

  const notificationSentRef = useRef<{ '80': boolean; '100': boolean }>({ '80': false, '100': false });


  const spent = budget.spentAmount || 0;
  const total = budget.amount;
  const remaining = total - spent;
  const progress = total > 0 ? (spent / total) * 100 : 0;
  const isOverBudget = progress > 100;
  const isApproachingBudget = progress >= 80 && progress <= 100;

  useEffect(() => {
    if (!user || !firestore) return;

    const checkAndSendNotification = async (threshold: 80 | 100, message: string) => {
      if (notificationSentRef.current[threshold]) return;

      const notificationsColRef = collection(firestore, `users/${user.uid}/notifications`);
      const notificationQuery = query(
        notificationsColRef,
        where('entityId', '==', budget.id),
        where('message', '==', message)
      );

      const existingNotifications = await getDocs(notificationQuery);
      if (existingNotifications.empty) {
        const newNotification = {
          userId: user.uid,
          type: 'budget_warning' as const,
          message,
          isRead: false,
          link: '/budgets',
          timestamp: new Date().toISOString(),
          entityId: budget.id,
        };
        await addDoc(notificationsColRef, newNotification);
        notificationSentRef.current[threshold] = true;
      } else {
        notificationSentRef.current[threshold] = true;
      }
    };

    if (progress >= 80 && progress < 100) {
      const message = `Atenção: Você já utilizou ${progress.toFixed(0)}% do seu limite de gastos para "${budget.category}".`;
      checkAndSendNotification(80, message);
    }
    if (progress >= 100) {
      const message = `Alerta: Você atingiu 100% do seu limite de gastos para "${budget.category}".`;
      checkAndSendNotification(100, message);
    }
  }, [progress, budget, user, firestore]);

  const handleDelete = async () => {
    if (!user) return;
    const budgetRef = doc(firestore, `users/${user.uid}/budgets`, budget.id);
    await deleteDoc(budgetRef);
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

  const progressColor = useMemo(() => {
    if (progress >= 90) return 'bg-destructive';
    if (progress >= 70) return 'bg-amber-500';
    return 'bg-primary';
  }, [progress]);

  return (
    <>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita e excluirá permanentemente o limite de gasto &quot;{budget.name}&quot;.
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
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(budget)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        </div>
        
        <div>
            <Progress 
                value={Math.min(100, progress)} 
                className="h-2"
                indicatorClassName={progressColor}
            />
            <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                <span>{formatCurrency(spent)}</span>
                <span>{formatCurrency(total)}</span>
            </div>
        </div>

        <div className="flex items-end justify-between">
            <div>
                 <p className={cn("text-sm text-muted-foreground", isOverBudget && "text-destructive font-medium")}>
                    {isOverBudget ? 'Estourado:' : 'Restante:'} <span className="font-medium text-foreground">{formatCurrency(remaining)}</span>
                </p>
            </div>
             <div
              className={cn(
                "text-right text-sm font-medium",
                progress >= 90 && 'text-destructive',
                progress >= 70 && progress < 90 && 'text-amber-500'
              )}
            >
              {progress.toFixed(0)}%
            </div>
        </div>

      </div>
    </>
  );
}
