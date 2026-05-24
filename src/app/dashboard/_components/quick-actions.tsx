'use client';

import { useState, useEffect } from 'react';
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement as HTMLElement | null;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.isContentEditable)
      ) {
        return;
      }

      const key = e.key.toLowerCase();
      if (key === 'i') {
        e.preventDefault();
        onAddIncome();
        setIsOpen(false);
      } else if (key === 'e') {
        e.preventDefault();
        onAddExpense();
        setIsOpen(false);
      } else if (key === 'd') {
        e.preventDefault();
        onAddDebt();
        setIsOpen(false);
      } else if (key === 'g') {
        e.preventDefault();
        onAddGoal();
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onAddIncome, onAddExpense, onAddDebt, onAddGoal]);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button size="icon" className="h-10 w-10 rounded-lg border-none bg-gradient-to-br from-blue-600 to-cyan-500 shadow-md shadow-blue-500/10 hover:from-blue-500 hover:to-cyan-400 transition-all duration-300">
          <Plus className={cn('h-5 w-5 text-white transition-transform duration-300 ease-out', isOpen && 'rotate-45 scale-90')} />
          <span className="sr-only">Adicionar</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="bottom" className="mt-2 w-64 border border-white/5 bg-slate-950/95 shadow-xl backdrop-blur-md" style={{ willChange: 'transform, opacity' }}>
        <DropdownMenuLabel className="text-slate-200 text-xs font-semibold px-3 py-2 flex items-center justify-between">
          <span>Criar novo</span>
          <span className="text-[10px] text-slate-500 font-normal">Atalhos de teclado ⌨️</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/5" />
        <DropdownMenuItem onClick={onAddIncome} className="flex items-center justify-between py-2 px-3 hover:bg-slate-900/60 cursor-pointer focus:bg-slate-900/60 group">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md border border-emerald-500/20 bg-emerald-500/10 transition-colors group-hover:bg-emerald-500/20">
              <Landmark className="h-4.5 w-4.5 text-emerald-400" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-xs text-slate-200">Adicionar renda</span>
              <span className="text-[10px] text-slate-400">Salário, freela...</span>
            </div>
          </div>
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-white/10 bg-slate-900/80 px-1.5 font-mono text-[9px] font-medium text-slate-400 opacity-100">
            I
          </kbd>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onAddExpense} className="flex items-center justify-between py-2 px-3 hover:bg-slate-900/60 cursor-pointer focus:bg-slate-900/60 group">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md border border-rose-500/20 bg-rose-500/10 transition-colors group-hover:bg-rose-500/20">
              <CreditCard className="h-4.5 w-4.5 text-rose-400" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-xs text-slate-200">Adicionar despesa</span>
              <span className="text-[10px] text-slate-400">Contas, compras...</span>
            </div>
          </div>
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-white/10 bg-slate-900/80 px-1.5 font-mono text-[9px] font-medium text-slate-400 opacity-100">
            E
          </kbd>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onAddDebt} className="flex items-center justify-between py-2 px-3 hover:bg-slate-900/60 cursor-pointer focus:bg-slate-900/60 group">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md border border-amber-500/20 bg-amber-500/10 transition-colors group-hover:bg-amber-500/20">
              <Banknote className="h-4.5 w-4.5 text-amber-400" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-xs text-slate-200">Adicionar dívida</span>
              <span className="text-[10px] text-slate-400">Empréstimos...</span>
            </div>
          </div>
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-white/10 bg-slate-900/80 px-1.5 font-mono text-[9px] font-medium text-slate-400 opacity-100">
            D
          </kbd>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onAddGoal} className="flex items-center justify-between py-2 px-3 hover:bg-slate-900/60 cursor-pointer focus:bg-slate-900/60 group">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md border border-sky-500/20 bg-sky-500/10 transition-colors group-hover:bg-sky-500/20">
              <PiggyBank className="h-4.5 w-4.5 text-sky-400" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-xs text-slate-200">Nova reserva</span>
              <span className="text-[10px] text-slate-400">Metas de economia</span>
            </div>
          </div>
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-white/10 bg-slate-900/80 px-1.5 font-mono text-[9px] font-medium text-slate-400 opacity-100">
            G
          </kbd>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
