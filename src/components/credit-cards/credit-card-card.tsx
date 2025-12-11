
'use client';

import { useMemo, useState } from 'react';
import type { CreditCard, Transaction } from '@/lib/types';
import { useFirestore, useUser } from '@/firebase';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { doc, deleteDoc } from 'firebase/firestore';
import { MoreVertical, Pencil, Trash2, ArrowRight } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { getMonth, getDate, set, isAfter, isBefore, addMonths, subMonths, startOfDay, endOfDay, parseISO, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Separator } from '../ui/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

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

  const {
    currentBillAmount,
    currentBillTransactions,
    nextBillAmount,
    nextBillTransactions,
    dueDate,
    closingDate
  } = useMemo(() => {
    const now = new Date();
    const currentDay = getDate(now);
    const currentMonth = getMonth(now);
    const currentYear = now.getFullYear();

    // Determina o período da fatura atual
    let billClosingDate: Date;
    let billStartDate: Date;

    if (currentDay > card.closingDate) {
      // Já passamos da data de fechamento deste mês. A fatura "atual" é a que fecha no próximo mês.
      billClosingDate = set(now, { month: currentMonth + 1, date: card.closingDate });
      billStartDate = set(now, { month: currentMonth, date: card.closingDate + 1 });
    } else {
      // A fatura "atual" é a que fecha neste mês.
      billClosingDate = set(now, { month: currentMonth, date: card.closingDate });
      billStartDate = set(now, { month: currentMonth - 1, date: card.closingDate + 1 });
    }
    
    // Período da próxima fatura (a que abre após o fechamento da atual)
    const nextBillStartDate = addMonths(billStartDate, 1);
    const nextBillClosingDate = addMonths(billClosingDate, 1);

    const cardExpenses = expenses.filter(expense => expense.creditCardId === card.id);

    const currentBillTransactions = cardExpenses.filter(expense => {
      const expenseDate = parseISO(expense.date);
      return isAfter(expenseDate, startOfDay(billStartDate)) && isBefore(expenseDate, endOfDay(billClosingDate));
    });
    
    const nextBillTransactions = cardExpenses.filter(expense => {
      const expenseDate = parseISO(expense.date);
      return isAfter(expenseDate, startOfDay(nextBillStartDate)) && isBefore(expenseDate, endOfDay(nextBillClosingDate));
    });

    const currentBillAmount = currentBillTransactions.reduce((sum, exp) => sum + exp.amount, 0);
    const nextBillAmount = nextBillTransactions.reduce((sum, exp) => sum + exp.amount, 0);
    
    // A data de vencimento é sempre após a data de fechamento
    const aDueDate = set(now, { date: card.dueDate });
    const aClosingDate = set(now, { date: card.closingDate });
    let finalDueDate = aDueDate;
    if(isAfter(aClosingDate, aDueDate)) {
      finalDueDate = addMonths(aDueDate, 1);
    }
    

    return {
      currentBillAmount,
      currentBillTransactions,
      nextBillAmount,
      nextBillTransactions,
      dueDate: finalDueDate,
      closingDate: aClosingDate
    };
  }, [card, expenses]);

  const progress = card.limit > 0 ? (currentBillAmount / card.limit) * 100 : 0;
  const remainingLimit = card.limit - currentBillAmount;

  const handleDelete = async () => {
    if (!user) return;
    const cardRef = doc(firestore, `users/${user.uid}/creditCards`, card.id);
    try {
        await deleteDoc(cardRef);
        toast({
          title: 'Cartão excluído',
          description: `O cartão "${card.name}" foi removido.`,
        });
    } catch (error) {
        console.error("Error deleting card:", error);
        toast({ variant: "destructive", title: "Erro ao excluir", description: "Não foi possível remover o cartão." });
    } finally {
        setIsDeleteDialogOpen(false);
    }
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
          <Separator />
           <div className="space-y-3">
              <div className="space-y-1">
                <p className="text-sm font-medium text-primary">Fatura Atual</p>
                <p className="text-2xl font-bold">{formatCurrency(currentBillAmount)}</p>
                 <div className="flex justify-between text-xs text-muted-foreground">
                   <span>Fecha em: {format(closingDate, 'dd/MM')}</span>
                   <span>Vence em: {format(dueDate, 'dd/MM')}</span>
                 </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Próxima Fatura (parcial)</p>
                <p className="text-lg font-bold text-muted-foreground">{formatCurrency(nextBillAmount)}</p>
              </div>
          </div>
        </CardContent>
         <CardFooter>
           <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="transactions" className="border-b-0">
                <AccordionTrigger className="text-sm pt-0">
                  {currentBillTransactions.length > 0 ? `Ver ${currentBillTransactions.length} lançamentos` : 'Nenhum lançamento na fatura atual'}
                </AccordionTrigger>
                <AccordionContent>
                  <div className="max-h-40 overflow-y-auto space-y-2 pr-2 text-xs">
                    {currentBillTransactions.map(t => (
                      <div key={t.id} className="flex justify-between items-center">
                        <div>
                          <p>{t.description}</p>
                          <p className="text-muted-foreground">{t.category}</p>
                        </div>
                        <p>{formatCurrency(t.amount)}</p>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
        </CardFooter>
      </Card>
    </>
  );
}
