'use client';

import { useMemo, useState } from 'react';
import type { CreditCard, Transaction } from '@/lib/types';
import { useFirestore, useUser, deleteDocumentNonBlocking } from '@/firebase';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { doc } from 'firebase/firestore';
import { MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { getMonth, getDate, set, subMonths, startOfDay, endOfDay } from 'date-fns';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
};

interface CreditCardCardProps {
  card: CreditCard;
  expenses: Transaction[];
  onEdit: (card: CreditCard) => void;
}

export function CreditCardCard({ card, expenses, onEdit }: CreditCardCardProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const { currentBillAmount, nextBillAmount, closingDateStr, dueDateStr } = useMemo(() => {
    const now = new Date();
    const currentMonth = getMonth(now);
    const currentDay = getDate(now);

    let closingDate: Date;
    let dueDate: Date;
    let billStartDate: Date;

    if (currentDay > card.closingDate) {
      // Fatura atual já fechou, estamos no período da próxima fatura
      closingDate = set(now, { month: currentMonth + 1, date: card.closingDate });
      dueDate = set(now, { month: currentMonth + 1, date: card.dueDate });
      billStartDate = set(now, { month: currentMonth, date: card.closingDate + 1 });
    } else {
      // Fatura atual ainda está aberta
      closingDate = set(now, { month: currentMonth, date: card.closingDate });
      dueDate = set(now, { month: currentMonth, date: card.dueDate });
      billStartDate = set(now, { month: currentMonth -1, date: card.closingDate + 1 });
    }

    const currentBillExpenses = expenses.filter(expense => {
      if (expense.creditCardId !== card.id) return false;
      const expenseDate = startOfDay(new Date(expense.date));
      return expenseDate >= startOfDay(billStartDate) && expenseDate <= endOfDay(closingDate);
    });

    const billAmount = currentBillExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    
    return {
      currentBillAmount: billAmount,
      nextBillAmount: 0, // Simplified for now
      closingDateStr: closingDate.toLocaleDateString('pt-BR'),
      dueDateStr: dueDate.toLocaleDateString('pt-BR'),
    };
  }, [card, expenses]);

  const progress = card.limit > 0 ? (currentBillAmount / card.limit) * 100 : 0;
  const remainingLimit = card.limit - currentBillAmount;

  const handleDelete = () => {
    if (!user) return;
    const cardRef = doc(firestore, `users/${user.uid}/creditCards`, card.id);
    deleteDocumentNonBlocking(cardRef);
    toast({
      title: 'Cartão excluído',
      description: `O cartão "${card.name}" foi removido.`,
    });
    setIsDeleteDialogOpen(false);
  };

  return (
    <>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Cartão?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O cartão "{card.name}" será excluído.
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

      <Card className="flex flex-col">
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle>{card.name}</CardTitle>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(card)}>
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
          <CardDescription>Final •••• {card.lastFourDigits}</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow space-y-4">
          <div>
            <p className="text-sm font-medium">Fatura Atual</p>
            <p className="text-2xl font-bold">{formatCurrency(currentBillAmount)}</p>
            <p className="text-xs text-muted-foreground">Fecha em: {closingDateStr}</p>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Limite Utilizado</span>
              <span>{formatCurrency(card.limit)}</span>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-right text-xs text-muted-foreground">
              Disponível: {formatCurrency(remainingLimit)}
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between text-sm text-muted-foreground border-t pt-4">
          <span>Próximo vencimento</span>
          <span>{dueDateStr}</span>
        </CardFooter>
      </Card>
    </>
  );
}
