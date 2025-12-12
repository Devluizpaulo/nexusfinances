
'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import type { Recurrence, Transaction } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { History, Loader2, Tag } from 'lucide-react';
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
import { doc, collection, query, where, orderBy, updateDoc } from 'firebase/firestore';
import { format, parseISO, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '../ui/badge';
import { AddSubscriptionSheet } from '../subscriptions/add-subscription-sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../ui/table';
import { RecurrenceCardActions } from './recurrence-card-actions';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
};

interface RecurrenceCardProps {
  recurrence: Recurrence;
  onEdit: () => void;
}

export function RecurrenceCard({ recurrence, onEdit }: RecurrenceCardProps) {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const collectionName = recurrence.type === 'income' ? 'incomes' : 'expenses';

  const historyQuery = useMemoFirebase(() => {
    if (!user || !isHistoryOpen) return null;
    return query(
      collection(firestore, `users/${user.uid}/${collectionName}`),
      where('recurringSourceId', '==', recurrence.id),
      orderBy('date', 'desc')
    );
  }, [firestore, user, recurrence.id, collectionName, isHistoryOpen]);

  const { data: historyData, isLoading: isHistoryLoading } = useCollection<Transaction>(historyQuery);

  const nextDate = addMonths(parseISO(recurrence.date), 1);

  return (
    <>
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent>
            <DialogHeader>
              <DialogTitle>Histórico de Lançamentos</DialogTitle>
              <DialogDescription>
                Histórico de lançamentos para a recorrência &quot;{recurrence.description}&quot;.
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto">
              {isHistoryLoading ? (
                <div className="flex justify-center items-center h-24">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                 <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historyData && historyData.length > 0 ? (
                      historyData.map(item => (
                        <TableRow key={item.id}>
                          <TableCell>{format(parseISO(item.date), 'PPP', { locale: ptBR })}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center">Nenhum histórico encontrado.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </div>
        </DialogContent>
      </Dialog>
      
      <Card className="cursor-pointer hover:border-primary/50 transition-colors flex flex-col h-full" onClick={() => setIsHistoryOpen(true)}>
        <CardContent className="p-4 flex-grow">
          <div>
            <p className="font-semibold text-base">{recurrence.description}</p>
            <div className="flex items-center gap-2 mt-1">
              {recurrence.isRecurring && (
                <Badge variant="secondary" className="text-xs">
                  Recorrente
                </Badge>
              )}
            </div>
          </div>
          <div className="mt-3">
             <Badge variant={recurrence.type === 'income' ? 'default' : 'secondary'} className={recurrence.type === 'income' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}>
              {formatCurrency(recurrence.amount)}
            </Badge>
          </div>
        </CardContent>
        <div className="p-4 border-t flex items-center justify-between">
           <p className="text-xs text-muted-foreground">
              {recurrence.isRecurring ? `Próximo: ${format(nextDate, 'dd/MM/yy', { locale: ptBR })}` : 'Não recorrente'}
            </p>
            <RecurrenceCardActions recurrence={recurrence} onEdit={onEdit} />
        </div>
      </Card>
    </>
  );
}
