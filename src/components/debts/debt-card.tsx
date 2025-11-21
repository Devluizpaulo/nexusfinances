'use client';

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
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc, writeBatch } from 'firebase/firestore';
import type { Debt, Installment } from '@/lib/types';
import { Button } from '../ui/button';
import { useToast } from '@/hooks/use-toast';
import { Check } from 'lucide-react';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
};

interface DebtCardProps {
  debt: Debt;
}

export function DebtCard({ debt }: DebtCardProps) {
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

  const handlePayInstallment = async (installment: Installment) => {
    if (!user || !firestore) return;
    
    const installmentRef = doc(firestore, `users/${user.uid}/debts/${debt.id}/installments`, installment.id);
    const debtRef = doc(firestore, `users/${user.uid}/debts`, debt.id);

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
  };

  const paidAmount = debt.paidAmount || 0;
  const progress = (paidAmount / debt.totalAmount) * 100;
  const isPaid = paidAmount >= debt.totalAmount;

  return (
    <Card className={isPaid ? 'border-green-300 bg-green-50/50' : ''}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{debt.name}</CardTitle>
          {isPaid && <Badge className="bg-green-100 text-green-800">Quitada</Badge>}
        </div>
        <CardDescription>Credor: {debt.creditor}</CardDescription>
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
                    {(installmentsData || []).map((installment) => (
                      <TableRow key={installment.id}>
                        <TableCell>{installment.installmentNumber}</TableCell>
                        <TableCell>
                          {format(new Date(installment.dueDate), 'PPP', { locale: ptBR })}
                        </TableCell>
                        <TableCell>{formatCurrency(installment.amount)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={installment.status === 'paid' ? 'secondary' : 'default'}
                            className={
                              installment.status === 'paid'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }
                          >
                            {installment.status === 'paid' ? 'pago' : 'não pago'}
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
                    ))}
                  </TableBody>
                </Table>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardFooter>
      )}
    </Card>
  );
}
