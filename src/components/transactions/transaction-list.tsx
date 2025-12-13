'use client';

import { Transaction } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn, formatCurrency } from '@/lib/utils';
import { MoreVertical } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/transactions/status-badge';
import { AnimatePresence, motion } from 'framer-motion';

interface TransactionListProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onStatusChange: (transaction: Transaction) => Promise<void>;
  transactionType: 'income' | 'expense';
}

export function TransactionList({
  transactions,
  onEdit,
  onStatusChange,
  transactionType,
}: TransactionListProps) {
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
      <AnimatePresence initial={false}>
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
                  <AnimatePresence initial={false}>
                    {monthTransactions.map((t) => (
                      <motion.div
                        key={t.id}
                        layout
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.16, ease: 'easeOut' }}
                        whileHover={{ backgroundColor: 'rgba(51, 65, 85, 0.4)', scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className="flex items-center p-3 border-b border-slate-800/60 last:border-b-0"
                      >
                        <div className="flex-1 space-y-1">
                          <p className="font-medium text-slate-100">{t.description}</p>
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <span>{format(parseISO(t.date), 'dd/MM')}</span>
                            <span>•</span>
                            <span>{t.category}</span>
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
