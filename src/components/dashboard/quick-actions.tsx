'use client';

import { Button } from "@/components/ui/button";
import { Landmark, CreditCard, Banknote, Target, Plus, Files, X, PiggyBank } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { cn } from "@/lib/utils";

type QuickActionsProps = {
  onAddIncome: () => void;
  onAddExpense: () => void;
  onAddDebt: () => void;
  onAddGoal: () => void;
};

export function QuickActions({
  onAddIncome,
  onAddExpense,
  onAddDebt,
  onAddGoal,
}: QuickActionsProps) {
    const [isOpen, setIsOpen] = useState(false);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button size="icon" className="h-10 w-10 rounded-full shadow-lg bg-primary hover:bg-primary/90 border border-primary/20">
           <Plus className={cn("h-5 w-5 transition-transform duration-300 text-primary-foreground", isOpen && "rotate-45 scale-75")} />
          <span className="sr-only">Adicionar</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="bottom" className="w-64 mt-2 border border-slate-700/60 bg-slate-950/90 shadow-[0_18px_45px_-30px_rgba(15,23,42,1)] backdrop-blur-sm">
        <DropdownMenuLabel className="text-slate-100">Criar novo...</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onAddIncome} className="flex items-center gap-3 py-2 hover:bg-slate-800/60">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-500/20 border border-emerald-500/30">
            <Landmark className="h-5 w-5 text-emerald-300" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-slate-100">Adicionar renda</span>
            <span className="text-xs text-slate-400">Salário, freelance, etc.</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onAddExpense} className="flex items-center gap-3 py-2 hover:bg-slate-800/60">
           <div className="flex h-8 w-8 items-center justify-center rounded-md bg-rose-500/20 border border-rose-500/30">
            <CreditCard className="h-5 w-5 text-rose-300" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-slate-100">Adicionar despesa</span>
            <span className="text-xs text-slate-400">Contas, compras, etc.</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onAddDebt} className="flex items-center gap-3 py-2 hover:bg-slate-800/60">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-500/20 border border-amber-500/30">
            <Banknote className="h-5 w-5 text-amber-300" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-slate-100">Adicionar dívida</span>
            <span className="text-xs text-slate-400">Empréstimos, parcelas</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onAddGoal} className="flex items-center gap-3 py-2 hover:bg-slate-800/60">
           <div className="flex h-8 w-8 items-center justify-center rounded-md bg-sky-500/20 border border-sky-500/30">
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
