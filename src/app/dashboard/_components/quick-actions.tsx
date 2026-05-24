'use client';

import { useState } from 'react';
import { Banknote, CreditCard, Landmark, PiggyBank, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

type QuickActionsProps = {
  onAddIncome: () => void;
  onAddExpense: () => void;
  onAddDebt: () => void;
  onAddGoal: () => void;
};

export function QuickActions({ onAddIncome, onAddExpense, onAddDebt, onAddGoal }: QuickActionsProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button size="icon" className="h-10 w-10 rounded-lg border border-primary/20 bg-primary shadow-sm hover:bg-primary/90">
          <Plus className={cn('h-5 w-5 text-primary-foreground transition-transform duration-200', isOpen && 'rotate-45 scale-90')} />
          <span className="sr-only">Adicionar</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="bottom" className="mt-2 w-64 border border-slate-800 bg-slate-950/95 shadow-xl backdrop-blur">
        <DropdownMenuLabel className="text-slate-100">Criar novo</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onAddIncome} className="flex items-center gap-3 py-2 hover:bg-slate-800/60">
          <div className="flex h-8 w-8 items-center justify-center rounded-md border border-emerald-500/30 bg-emerald-500/20">
            <Landmark className="h-5 w-5 text-emerald-300" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-slate-100">Adicionar renda</span>
            <span className="text-xs text-slate-400">Salário, freelance, etc.</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onAddExpense} className="flex items-center gap-3 py-2 hover:bg-slate-800/60">
          <div className="flex h-8 w-8 items-center justify-center rounded-md border border-rose-500/30 bg-rose-500/20">
            <CreditCard className="h-5 w-5 text-rose-300" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-slate-100">Adicionar despesa</span>
            <span className="text-xs text-slate-400">Contas, compras, etc.</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onAddDebt} className="flex items-center gap-3 py-2 hover:bg-slate-800/60">
          <div className="flex h-8 w-8 items-center justify-center rounded-md border border-amber-500/30 bg-amber-500/20">
            <Banknote className="h-5 w-5 text-amber-300" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-slate-100">Adicionar dívida</span>
            <span className="text-xs text-slate-400">Empréstimos, parcelas</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onAddGoal} className="flex items-center gap-3 py-2 hover:bg-slate-800/60">
          <div className="flex h-8 w-8 items-center justify-center rounded-md border border-sky-500/30 bg-sky-500/20">
            <PiggyBank className="h-5 w-5 text-sky-300" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-slate-100">Nova reserva</span>
            <span className="text-xs text-slate-400">Metas de economia</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
