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
      <div className="flex h-40 flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center">
        <h3 className="font-semibold">Nenhuma transação encontrada</h3>
        <p className="mt-1 text-sm text-muted-foreground">
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
      {Object.entries(groupedByMonth).map(([month, monthTransactions]) => (
        <div key={month}>
          <h2 className="mb-2 text-sm font-semibold capitalize text-muted-foreground">
            {month}
          </h2>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {monthTransactions.map((t) => (
                  <div key={t.id} className="flex items-center p-3">
                    <div className="flex-1 space-y-1">
                      <p className="font-medium">{t.description}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{format(parseISO(t.date), 'dd/MM')}</span>
                        <span>•</span>
                        <span>{t.category}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="flex flex-col items-end">
                            <p className={cn(
                                'font-semibold',
                                transactionType === 'income' ? 'text-emerald-600' : 'text-foreground'
                            )}>
                                {transactionType === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
                            </p>
                            <StatusBadge status={t.status} type={transactionType} onClick={() => onStatusChange(t)} />
                       </div>
                       <DropdownMenu>
                         <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                         </DropdownMenuTrigger>
                         <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(t)}>Editar</DropdownMenuItem>
                            {t.status === 'pending' && (
                                <DropdownMenuItem onClick={() => onStatusChange(t)}>Marcar como {transactionType === 'income' ? 'Recebido' : 'Pago'}</DropdownMenuItem>
                            )}
                         </DropdownMenuContent>
                       </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}
