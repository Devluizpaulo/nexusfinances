
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
import { AlertTriangle, ArrowRight, Loader2 } from 'lucide-react';
import { useFirestore, useUser } from '@/firebase';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import type { Debt, Installment } from '@/lib/types';
import { format, isPast, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import Link from 'next/link';

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
    if (!user || !firestore || !debts) {
        setIsLoading(false);
        return;
    }
    
    const fetchOverdueInstallments = async () => {
        setIsLoading(true);
        const allOverdue: OverdueInstallment[] = [];
        let createdNotificationsFor: string[] = [];

        try {
            const notificationsColRef = collection(firestore, `users/${user.uid}/notifications`);

            for (const debt of debts) {
                const installmentsQuery = query(
                    collection(firestore, `users/${user.uid}/debts/${debt.id}/installments`),
                    where('status', '==', 'unpaid')
                );
                
                const querySnapshot = await getDocs(installmentsQuery);
                for (const doc of querySnapshot.docs) {
                    const installment = doc.data() as Installment;
                    if (isPast(parseISO(installment.dueDate))) {
                        allOverdue.push({ ...installment, debtName: debt.name });

                        // Check if a notification for this installment already exists
                        const notificationQuery = query(notificationsColRef, where('entityId', '==', installment.id));
                        const existingNotifications = await getDocs(notificationQuery);

                        if (existingNotifications.empty && !createdNotificationsFor.includes(installment.id)) {
                           const newNotification = {
                              userId: user.uid,
                              type: 'debt_due' as const,
                              message: `A parcela ${installment.installmentNumber} da dívida "${debt.name}" está vencida.`,
                              isRead: false,
                              link: `/debts?dueDate=${installment.dueDate}`,
                              timestamp: new Date().toISOString(),
                              entityId: installment.id,
                           };
                           await addDoc(notificationsColRef, newNotification);
                           createdNotificationsFor.push(installment.id);
                        }
                    }
                }
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
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <div className="card-premium border-rose-950/40 bg-gradient-to-br from-slate-900/60 to-slate-950/80 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center gap-4">
            <Loader2 className="h-5 w-5 animate-spin text-rose-400" />
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Verificando pendências...</h3>
              <p className="text-xs text-slate-400">Estamos buscando por parcelas vencidas.</p>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  if (overdueInstallments.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="card-premium border-rose-950/40 bg-gradient-to-br from-slate-900/60 to-slate-950/80 hover:shadow-lg transition-all duration-300">
        <div className="flex flex-col gap-4">
          <div className="flex flex-row items-center justify-between gap-4 flex-wrap pb-2 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-rose-500/20 bg-rose-500/5 text-rose-400">
                <AlertTriangle className="h-4.5 w-4.5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-200">Atenção! Parcelas Vencidas</h3>
                <p className="text-xs text-slate-400">As parcelas abaixo estão vencidas e requerem atenção.</p>
              </div>
            </div>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-8 border-rose-950/60 text-rose-300 hover:border-rose-500/30 hover:bg-rose-500/10 text-xs bg-slate-900/30"
            >
              <Link href="/debts" className="inline-flex items-center gap-1.5">
                Ver todas as dívidas
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
          
          <div className="w-full overflow-x-auto pt-1">
            <Table className="min-w-[520px]">
              <TableHeader>
                <TableRow className="border-white/5 hover:bg-slate-900/20">
                  <TableHead className="text-xs text-slate-400 h-9 py-2">Dívida</TableHead>
                  <TableHead className="text-xs text-slate-400 h-9 py-2">Nº da Parcela</TableHead>
                  <TableHead className="text-xs text-slate-400 h-9 py-2">Vencimento</TableHead>
                  <TableHead className="text-right text-xs text-slate-400 h-9 py-2">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overdueInstallments.map((installment) => (
                  <TableRow
                    key={installment.id}
                    className="border-white/5 hover:bg-slate-900/30 transition-colors"
                  >
                    <TableCell className="font-semibold text-xs text-slate-200 py-3">
                      {installment.debtName}
                    </TableCell>
                    <TableCell className="text-xs text-slate-300 py-3">
                      {installment.installmentNumber}
                    </TableCell>
                    <TableCell className="text-xs text-slate-300 py-3">
                      {format(parseISO(installment.dueDate), 'PPP', { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-right text-xs text-rose-400 font-bold py-3">
                      {formatCurrency(installment.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
