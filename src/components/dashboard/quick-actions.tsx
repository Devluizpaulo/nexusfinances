'use client';

import { Button } from "@/components/ui/button";
import { Landmark, CreditCard, Banknote, Target, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" className="inline-flex items-center gap-2 shadow-sm">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Adicionar</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Ações rápidas</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onAddIncome} className="flex items-center gap-2">
          <Landmark className="h-4 w-4 text-emerald-600" />
          <div className="flex flex-col">
            <span className="text-xs font-medium">Adicionar renda</span>
            <span className="text-[11px] text-muted-foreground">Salário, freelance, outros ganhos</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onAddExpense} className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-red-600" />
          <div className="flex flex-col">
            <span className="text-xs font-medium">Adicionar despesa</span>
            <span className="text-[11px] text-muted-foreground">Contas, compras, assinaturas</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onAddDebt} className="flex items-center gap-2">
          <Banknote className="h-4 w-4 text-amber-600" />
          <div className="flex flex-col">
            <span className="text-xs font-medium">Adicionar dívida</span>
            <span className="text-[11px] text-muted-foreground">Empréstimos, cartões, financiamentos</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onAddGoal} className="flex items-center gap-2">
          <Target className="h-4 w-4 text-sky-600" />
          <div className="flex flex-col">
            <span className="text-xs font-medium">Nova reserva</span>
            <span className="text-[11px] text-muted-foreground">Metas de reserva ou investimento</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
