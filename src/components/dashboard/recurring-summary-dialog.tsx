
'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Check, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import type { Transaction } from '@/lib/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RecurringSummaryDialogProps {
  transactions: Transaction[];
  onClose: () => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
};

export function RecurringSummaryDialog({ transactions, onClose }: RecurringSummaryDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (transactions.length > 0) {
      setIsOpen(true);
    }
  }, [transactions]);

  const handleClose = () => {
    setIsOpen(false);
    onClose();
  };

  const incomes = transactions.filter(t => t.type === 'income');
  const expenses = transactions.filter(t => t.type === 'expense');

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resumo de Recorrências do Mês</DialogTitle>
          <DialogDescription>
            As seguintes transações recorrentes foram criadas automaticamente para{' '}
            {format(new Date(), 'MMMM', { locale: ptBR })}. Todas estão com status "pendente".
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-2">
          {incomes.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-emerald-600">Rendas Recorrentes</h3>
              <div className="space-y-2 rounded-md border p-3">
                {incomes.map(t => (
                  <div key={t.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                        <ArrowUpCircle className="h-4 w-4 text-emerald-500" />
                        <span>{t.description || t.category}</span>
                    </div>
                    <span className="font-medium">{formatCurrency(t.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {expenses.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-red-600">Despesas Recorrentes</h3>
              <div className="space-y-2 rounded-md border p-3">
                {expenses.map(t => (
                  <div key={t.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                        <ArrowDownCircle className="h-4 w-4 text-red-500" />
                         <span>{t.description || t.category}</span>
                    </div>
                    <span className="font-medium">{formatCurrency(t.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={handleClose} className="w-full">
            <Check className="mr-2 h-4 w-4" />
            Ok, entendi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
