'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format, isPast, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useFirestore, useCollection, useMemoFirebase, useUser, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, doc, writeBatch, getDocs } from 'firebase/firestore';
import { motion } from 'framer-motion';
import type { Debt, Installment } from '@/lib/types';
import { Button } from '../ui/button';
import { useToast } from '@/hooks/use-toast';
import { Check, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
};

interface DebtCardProps {
  debt: Debt;
  selectedDueDate?: string;
}

export function DebtCard({ debt, selectedDueDate }: DebtCardProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const installmentsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, `users/${user.uid}/debts/${debt.id}/installments`),
      orderBy('installmentNumber', 'asc')
    );
  }, [firestore, user, debt.id]);

  const { data: installmentsData } = useCollection<Installment>(installmentsQuery);

  const handlePayInstallment = useCallback(async (installment: Installment) => {
    if (!user || !firestore) return;
    
    const installmentRef = doc(firestore, `users/${user.uid}/debts/${debt.id}/installments`, installment.id);
    const debtRef = doc(firestore, `users/${user.uid}/debts`, debt.id);

    toast({
        title: 'Processando Pagamento...',
        description: `Marcando a parcela ${installment.installmentNumber} como paga.`,
    });

    try {
      const batch = writeBatch(firestore);
      batch.update(installmentRef, { status: 'paid' });
      const newPaidAmount = (debt.paidAmount || 0) + installment.amount;
      batch.update(debtRef, { paidAmount: newPaidAmount });
      await batch.commit();

      toast({
        title: 'Parcela Paga!',
        description: `A parcela ${installment.installmentNumber} da dívida "${debt.name}" foi marcada como paga.`,
      });
    } catch (error) {
      console.error("Error paying installment: ", error);
      toast({
        variant: 'destructive',
        title: 'Erro ao pagar parcela',
        description: 'Não foi possível atualizar o status da parcela.',
      });
    }
  }, [user, firestore, debt.id, debt.name, debt.paidAmount, toast]);

  const handleDeleteDebt = useCallback(async () => {
    if (!user || !firestore) {
        toast({ variant: "destructive", title: "Erro", description: "Você não está autenticado." });
        return;
    }

    setIsDeleteDialogOpen(false);

    toast({
      title: 'Excluindo Dívida...',
      description: `Removendo "${debt.name}" e todas as suas parcelas.`,
    });

    const debtRef = doc(firestore, `users/${user.uid}/debts`, debt.id);
    const installmentsColRef = collection(debtRef, 'installments');

    // Executa a deleção em background para não bloquear a UI
    (async () => {
      try {
          const batch = writeBatch(firestore);
          const installmentsSnapshot = await getDocs(installmentsColRef);
          installmentsSnapshot.forEach((doc) => {
              batch.delete(doc.ref);
          });
          batch.delete(debtRef);
          await batch.commit();

          toast({
              title: 'Dívida Excluída',
              description: `A dívida "${debt.name}" e todas as suas parcelas foram removidas.`,
          });
      } catch (error) {
          console.error("Error deleting debt: ", error);
          toast({
              variant: 'destructive',
              title: 'Erro ao excluir dívida',
              description: 'Não foi possível remover a dívida. Tente novamente.',
          });
      }
    })();
  }, [user, firestore, debt.id, debt.name, toast]);


  const getInstallmentStatus = (installment: Installment) => {
    if (installment.status === 'paid') {
      return { text: 'Pago', variant: 'paid' as const };
    }
    if (isPast(parseISO(installment.dueDate))) {
      return { text: 'Vencida', variant: 'overdue' as const };
    }
    return { text: 'Pendente', variant: 'unpaid' as const };
  };

  const paidAmount = debt.paidAmount || 0;
  const progress = debt.totalAmount > 0 ? (paidAmount / debt.totalAmount) * 100 : 100;
  const isPaid = paidAmount >= debt.totalAmount;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4, scale: 0.98 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.995 }}
      className="h-full"
    >
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente a dívida <strong>{debt.name}</strong> e todas as suas parcelas associadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDebt} className="bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card className={cn(isPaid ? 'border-green-300 bg-green-50/50' : '')}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>{debt.name}</CardTitle>
              <CardDescription>Credor: {debt.creditor}</CardDescription>
            </div>
             <div className="flex items-center gap-2">
               {isPaid && <Badge className="bg-green-100 text-green-800">Quitada</Badge>}
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsDeleteDialogOpen(true)}>
                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    <span className="sr-only">Excluir Dívida</span>
                </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Pago</span>
              <span>{formatCurrency(paidAmount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total</span>
              <span>{formatCurrency(debt.totalAmount)}</span>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-right text-xs text-muted-foreground">
              {progress > 100 ? 100 : progress.toFixed(0)}% pago
            </p>
          </div>
        </CardContent>
        {!isPaid && (
          <CardFooter>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="installments">
                <AccordionTrigger>Ver Parcelas</AccordionTrigger>
                <AccordionContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(installmentsData || []).map((installment) => {
                        const status = getInstallmentStatus(installment);
                        const isSelectedDate = selectedDueDate && installment.dueDate === selectedDueDate;
                        return (
                          <TableRow
                            key={installment.id}
                            className={cn({ 'bg-amber-50': isSelectedDate })}
                          >
                            <TableCell>{installment.installmentNumber}</TableCell>
                            <TableCell>
                              {format(parseISO(installment.dueDate), 'PPP', { locale: ptBR })}
                            </TableCell>
                            <TableCell>{formatCurrency(installment.amount)}</TableCell>
                            <TableCell>
                              <Badge
                                variant={status.variant === 'paid' ? 'secondary' : 'default'}
                                className={cn(
                                  {
                                    'bg-green-100 text-green-800': status.variant === 'paid',
                                    'bg-yellow-100 text-yellow-800': status.variant === 'unpaid',
                                    'bg-red-100 text-red-800 font-semibold': status.variant === 'overdue',
                                  },
                                  isSelectedDate && 'ring-1 ring-amber-500 ring-offset-1',
                                )}
                              >
                                {status.text}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {installment.status === 'unpaid' && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handlePayInstallment(installment)}
                                >
                                  <Check className="mr-2 h-4 w-4" />
                                  Pagar
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardFooter>
        )}
      </Card>
    </motion.div>
  );
}
