'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AlertTriangle, Info, Loader2 } from 'lucide-react';
import { useFirestore, useUser } from '@/firebase';
import { collection, query, where, getDocs, collectionGroup } from 'firebase/firestore';
import type { Debt, Installment } from '@/lib/types';
import { format, isPast, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface OverdueDebtsCardProps {
  debts: Debt[];
}

interface OverdueInstallment extends Installment {
  debtName: string;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
};

export function OverdueDebtsCard({ debts }: OverdueDebtsCardProps) {
  const firestore = useFirestore();
  const { user } = useUser();
  
  const [overdueInstallments, setOverdueInstallments] = useState<OverdueInstallment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || !firestore) {
        setIsLoading(false);
        return;
    }

    const fetchOverdueInstallments = async () => {
        setIsLoading(true);
        const allOverdue: OverdueInstallment[] = [];

        try {
            for (const debt of debts) {
                const installmentsQuery = query(
                    collection(firestore, `users/${user.uid}/debts/${debt.id}/installments`),
                    where('status', '==', 'unpaid')
                );
                
                const querySnapshot = await getDocs(installmentsQuery);
                querySnapshot.forEach(doc => {
                    const installment = doc.data() as Installment;
                    if (isPast(parseISO(installment.dueDate))) {
                        allOverdue.push({ ...installment, debtName: debt.name });
                    }
                });
            }

            allOverdue.sort((a, b) => parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime());
            setOverdueInstallments(allOverdue);
        } catch (error) {
            console.error("Error fetching overdue installments:", error);
        } finally {
            setIsLoading(false);
        }
    };
    
    fetchOverdueInstallments();

  }, [debts, user, firestore]);

  if (isLoading) {
    return (
        <Card className="rounded-2xl border border-rose-900/60 bg-rose-950/70 p-4 sm:p-5 shadow-[0_18px_45px_-30px_rgba(15,23,42,1)]">
            <CardHeader className="flex flex-row items-center gap-4">
                <Loader2 className="h-6 w-6 animate-spin text-rose-400" />
                <div>
                    <CardTitle className="text-rose-100">Verificando pendências...</CardTitle>
                    <CardDescription className="text-rose-300">
                        Estamos buscando por parcelas vencidas.
                    </CardDescription>
                </div>
            </CardHeader>
        </Card>
    );
  }

  if (overdueInstallments.length === 0) {
    return null;
  }

  return (
    <Card className="rounded-2xl border border-rose-900/60 bg-rose-950/70 p-4 sm:p-5 shadow-[0_18px_45px_-30px_rgba(15,23,42,1)]">
      <CardHeader>
        <div className="flex flex-row items-center gap-4">
            <AlertTriangle className="h-6 w-6 text-rose-400" />
            <div>
                <CardTitle className="text-rose-100">Atenção! Você possui pendências.</CardTitle>
                <CardDescription className="text-rose-300">
                    As seguintes parcelas estão vencidas e requerem sua atenção.
                </CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-rose-900/30">
              <TableHead className="text-rose-300">Dívida</TableHead>
              <TableHead className="text-rose-300">Nº da Parcela</TableHead>
              <TableHead className="text-rose-300">Vencimento</TableHead>
              <TableHead className="text-right text-rose-300">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {overdueInstallments.map(installment => (
              <TableRow key={installment.id} className="border-rose-800/60 hover:bg-rose-900/30">
                <TableCell className="font-medium text-rose-100">{installment.debtName}</TableCell>
                <TableCell className="text-rose-100">{installment.installmentNumber}</TableCell>
                <TableCell className="text-rose-100">{format(parseISO(installment.dueDate), 'PPP', { locale: ptBR })}</TableCell>
                <TableCell className="text-right text-rose-100 font-bold">{formatCurrency(installment.amount)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
