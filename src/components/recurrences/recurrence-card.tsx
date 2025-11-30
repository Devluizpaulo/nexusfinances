'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useFirestore, useUser, deleteDocumentNonBlocking, updateDocumentNonBlocking, useCollection, useMemoFirebase } from '@/firebase';
import type { Recurrence, Transaction } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Pencil, Trash2, Check, X, History, Loader2 } from 'lucide-react';
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
import { doc, collection, query, where, orderBy } from 'firebase/firestore';
import { format, parseISO, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '../ui/badge';
import { AddTransactionSheet } from '../transactions/add-transaction-sheet';
import { incomeCategories, expenseCategories } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../ui/table';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
};

interface RecurrenceCardProps {
  recurrence: Recurrence;
}

export function RecurrenceCard({ recurrence }: RecurrenceCardProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isConfirmingStop, setIsConfirmingStop] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const collectionName = recurrence.type === 'income' ? 'incomes' : 'expenses';
  const docRef = doc(firestore, `users/${user?.uid}/${collectionName}`, recurrence.id);

  const historyQuery = useMemoFirebase(() => {
    if (!user || !isHistoryOpen) return null;
    return query(
      collection(firestore, `users/${user.uid}/${collectionName}`),
      where('recurringSourceId', '==', recurrence.id),
      orderBy('date', 'desc')
    );
  }, [firestore, user, recurrence.id, collectionName, isHistoryOpen]);

  const { data: historyData, isLoading: isHistoryLoading } = useCollection<Transaction>(historyQuery);

  const handleDelete = () => {
    deleteDocumentNonBlocking(docRef);
    toast({
      title: 'Item recorrente excluído',
      description: `O modelo de recorrência "${recurrence.description}" foi removido.`,
    });
    setIsDeleteDialogOpen(false);
  };
  
  const handleStopRecurrence = () => {
      updateDocumentNonBlocking(docRef, { isRecurring: false });
      toast({
          title: 'Recorrência interrompida',
          description: `"${recurrence.description}" não será mais criada automaticamente.`,
      });
      setIsConfirmingStop(false);
  }

  const nextDate = addMonths(parseISO(recurrence.date), 1);
  const categories = recurrence.type === 'income' ? incomeCategories : expenseCategories;

  return (
    <>
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent>
            <DialogHeader>
              <DialogTitle>Histórico de Pagamentos</DialogTitle>
              <DialogDescription>
                Histórico de pagamentos para a recorrência "{recurrence.description}".
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
      
      <AddTransactionSheet 
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        transactionType={recurrence.type}
        categories={categories}
        transaction={recurrence}
      />
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir modelo de recorrência?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o modelo de recorrência para "{recurrence.description}".
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

      <AlertDialog open={isConfirmingStop} onOpenChange={setIsConfirmingStop}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Interromper recorrência?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja parar a recorrência de "{recurrence.description}"? As transações futuras não serão mais criadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleStopRecurrence}>
              Sim, interromper
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setIsHistoryOpen(true)}>
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="font-semibold">{recurrence.description}</p>
            <p className="text-sm text-muted-foreground">{recurrence.category}</p>
            <p className="text-xs text-muted-foreground">
              Próximo ciclo em: {format(nextDate, 'PPP', { locale: ptBR })}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant={recurrence.type === 'income' ? 'default' : 'secondary'} className={recurrence.type === 'income' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}>
              {formatCurrency(recurrence.amount)}
            </Badge>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); setIsHistoryOpen(true);}}>
                <History className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); setIsEditing(true);}}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-amber-600 hover:bg-amber-100 hover:text-amber-700" onClick={(e) => { e.stopPropagation(); setIsConfirmingStop(true);}}>
                <X className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={(e) => { e.stopPropagation(); setIsDeleteDialogOpen(true);}}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
