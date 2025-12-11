'use client';

import { Button } from "@/components/ui/button";
import { Landmark, CreditCard, Banknote, Target, Plus, Files, X } from "lucide-react";
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
  onAddBudget: () => void;
};

export function QuickActions({
  onAddIncome,
  onAddExpense,
  onAddDebt,
  onAddGoal,
  onAddBudget,
}: QuickActionsProps) {
    const [isOpen, setIsOpen] = useState(false);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button size="lg" className="h-16 w-16 rounded-full shadow-lg">
           <Plus className={cn("h-7 w-7 transition-transform duration-300", isOpen && "rotate-45 scale-75")} />
          <span className="sr-only">Adicionar</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="top" className="w-64 mb-2">
        <DropdownMenuLabel>Criar novo...</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onAddIncome} className="flex items-center gap-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-100 dark:bg-emerald-900/50">
            <Landmark className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium">Adicionar renda</span>
            <span className="text-xs text-muted-foreground">Salário, freelance, etc.</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onAddExpense} className="flex items-center gap-3 py-2">
           <div className="flex h-8 w-8 items-center justify-center rounded-md bg-red-100 dark:bg-red-900/50">
            <CreditCard className="h-5 w-5 text-red-600" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium">Adicionar despesa</span>
            <span className="text-xs text-muted-foreground">Contas, compras, etc.</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onAddDebt} className="flex items-center gap-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-100 dark:bg-amber-900/50">
            <Banknote className="h-5 w-5 text-amber-600" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium">Adicionar dívida</span>
            <span className="text-xs text-muted-foreground">Empréstimos, parcelas</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onAddGoal} className="flex items-center gap-3 py-2">
           <div className="flex h-8 w-8 items-center justify-center rounded-md bg-sky-100 dark:bg-sky-900/50">
            <Target className="h-5 w-5 text-sky-600" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium">Nova reserva</span>
            <span className="text-xs text-muted-foreground">Metas de economia</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onAddBudget} className="flex items-center gap-3 py-2">
           <div className="flex h-8 w-8 items-center justify-center rounded-md bg-violet-100 dark:bg-violet-900/50">
            <Files className="h-5 w-5 text-violet-600" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium">Criar limite</span>
            <span className="text-xs text-muted-foreground">Limite de gastos</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}