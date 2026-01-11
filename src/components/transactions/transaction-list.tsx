'use client';

import { Transaction } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn, formatCurrency } from '@/lib/utils';
import { MoreVertical, Lightbulb, Droplet, Flame, Wifi, Phone, Tv, Zap, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/transactions/status-badge';
import { Badge } from '@/components/ui/badge';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';

interface TransactionListProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onStatusChange: (transaction: Transaction) => Promise<void>;
  onDelete?: (transaction: Transaction) => Promise<void>;
  transactionType: 'income' | 'expense';
}

// Get icon for subcategory
const getSubcategoryIcon = (subcategory?: string) => {
  switch (subcategory) {
    case 'Luz': return <Lightbulb className="h-3 w-3" />;
    case 'Água': return <Droplet className="h-3 w-3" />;
    case 'Gás': return <Flame className="h-3 w-3" />;
    case 'Internet': return <Wifi className="h-3 w-3" />;
    case 'Celular':
    case 'Telefone Fixo': return <Phone className="h-3 w-3" />;
    case 'TV por Assinatura': return <Tv className="h-3 w-3" />;
    default: return <Zap className="h-3 w-3" />;
  }
};

export function TransactionList({
  transactions,
  onEdit,
  onStatusChange,
  onDelete,
  transactionType,
}: TransactionListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = (transaction: Transaction) => {
    setTransactionToDelete(transaction);
    setDeleteDialogOpen(true);
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setTransactionToDelete(null);
    setIsDeleting(false);
  };

  const handleConfirmDelete = async () => {
    if (!transactionToDelete || !onDelete || isDeleting) return;
    
    setIsDeleting(true);
    try {
      await onDelete(transactionToDelete);
      // Pequeno delay para garantir que o Firestore processou a exclusão
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (error) {
      console.error('Error deleting transaction:', error);
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setTransactionToDelete(null);
    }
  };

  if (transactions.length === 0) {
    return (
      <div className="flex h-40 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-800/60 bg-slate-950/70 p-8 text-center shadow-[0_18px_45px_-30px_rgba(15,23,42,1)]">
        <h3 className="font-semibold text-slate-100">Nenhuma transação encontrada</h3>
        <p className="mt-1 text-sm text-slate-400">
          Adicione uma nova transação para começar.
        </p>
      </div>
    );
  }

  const groupedByMonth = transactions.reduce((acc, t) => {
    const month = format(parseISO(t.date), "MMMM 'de' yyyy", { locale: ptBR });
    if (!acc[month]) {
      acc[month] = [];
    }
    acc[month].push(t);
    return acc;
  }, {} as Record<string, Transaction[]>);

  return (
    <div className="space-y-6">
      <AlertDialog open={deleteDialogOpen} onOpenChange={(open) => {
        if (!open && !isDeleting) {
          handleCancelDelete();
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Transação?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a transação &quot;{transactionToDelete?.description}&quot;? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDelete} disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AnimatePresence initial={false} mode="popLayout">
        {Object.entries(groupedByMonth).map(([month, monthTransactions]) => (
          <motion.div
            key={month}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            <h2 className="mb-2 text-sm font-semibold capitalize text-slate-400">
              {month}
            </h2>
            <Card className="border-slate-900/60 bg-slate-950/70 shadow-[0_18px_45px_-30px_rgba(15,23,42,1)]">
              <CardContent className="p-0">
                <div className="divide-y divide-slate-800/60">
                  <AnimatePresence initial={false} mode="popLayout">
                    {monthTransactions.map((t) => (
                      <motion.div
                        key={t.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="flex items-center p-3 border-b border-slate-800/60 last:border-b-0 hover:bg-slate-700/20"
                      >
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            {t.category === 'Contas de Consumo' && getSubcategoryIcon(t.subcategory)}
                            <p className="font-medium text-slate-100">{t.description}</p>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <span>{format(parseISO(t.date), 'dd/MM')}</span>
                            <span>•</span>
                            {t.category === 'Contas de Consumo' && t.subcategory ? (
                              <Badge variant="outline" className="flex items-center gap-1 text-xs">
                                {getSubcategoryIcon(t.subcategory)}
                                {t.subcategory}
                              </Badge>
                            ) : (
                              <span>{t.category}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col items-end">
                            <p
                              className={cn(
                                'font-semibold',
                                t.type === 'income' ? 'text-emerald-300' : 'text-rose-300',
                              )}
                            >
                              {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
                            </p>
                            <StatusBadge
                              status={t.status}
                              type={t.type}
                              onClick={() => onStatusChange(t)}
                            />
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => onEdit(t)}>Editar</DropdownMenuItem>
                              {t.status === 'pending' && (
                                <DropdownMenuItem onClick={() => onStatusChange(t)}>
                                  Marcar como {t.type === 'income' ? 'Recebido' : 'Pago'}
                                </DropdownMenuItem>
                              )}
                              {onDelete && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteClick(t)}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                                    Excluir
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
