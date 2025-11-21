'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2 } from 'lucide-react';
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
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { Debt } from '@/lib/types';


const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
};

export default function DebtsPage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const debtsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, `users/${user.uid}/debts`));
  }, [firestore, user]);

  const { data: debtData, isLoading: isDebtsLoading } = useCollection<Debt>(debtsQuery);
  
  const isLoading = isUserLoading || isDebtsLoading;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <PageHeader title="Dívidas" description="Gerencie seus empréstimos e parcelamentos.">
        <Button disabled>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Dívida
        </Button>
      </PageHeader>
      <div className="grid gap-6 md:grid-cols-2">
        {(debtData || []).map((debt) => {
          const paidAmount = debt.paidAmount || 0;
          const progress = (paidAmount / debt.totalAmount) * 100;
          return (
            <Card key={debt.id}>
              <CardHeader>
                <CardTitle>{debt.name}</CardTitle>
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
                    {progress.toFixed(0)}% pago
                  </p>
                </div>
              </CardContent>
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
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(debt.installments || []).map((installment) => (
                            <TableRow key={installment.id}>
                              <TableCell>
                                {installment.installmentNumber}
                              </TableCell>
                              <TableCell>
                                {format(new Date(installment.dueDate), 'PPP', { locale: ptBR })}
                              </TableCell>
                              <TableCell>
                                {formatCurrency(installment.amount)}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    installment.status === 'paid'
                                      ? 'secondary'
                                      : 'default'
                                  }
                                  className={installment.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                                >
                                  {installment.status === 'paid' ? 'pago' : 'não pago'}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </>
  );
}
