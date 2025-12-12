'use client';

import { Button } from "@/components/ui/button";
import { Landmark, CreditCard, Banknote, PiggyBank } from "lucide-react";

type QuickActionsProps = {
  onAddIncome: () => void;
  onAddExpense: () => void;
  onAddDebt: () => void;
  onAddGoal: () => void;
};

const actions = [
    { label: 'Nova Renda', icon: Landmark, handlerKey: 'income' as const, className: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20 hover:bg-emerald-500/20' },
    { label: 'Nova Despesa', icon: CreditCard, handlerKey: 'expense' as const, className: 'bg-rose-500/10 text-rose-300 border-rose-500/20 hover:bg-rose-500/20' },
    { label: 'Nova Dívida', icon: Banknote, handlerKey: 'debt' as const, className: 'bg-amber-500/10 text-amber-300 border-amber-500/20 hover:bg-amber-500/20' },
    { label: 'Nova Meta', icon: PiggyBank, handlerKey: 'goal' as const, className: 'bg-sky-500/10 text-sky-300 border-sky-500/20 hover:bg-sky-500/20' },
];

export function QuickActions({ onAddIncome, onAddExpense, onAddDebt, onAddGoal }: QuickActionsProps) {
    const handlers = {
        income: onAddIncome,
        expense: onAddExpense,
        debt: onAddDebt,
        goal: onAddGoal,
    };
  
    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {actions.map(action => {
                const Icon = action.icon;
                return (
                    <Button 
                        key={action.handlerKey} 
                        variant="outline" 
                        className={`flex-col h-24 gap-2 text-sm font-semibold transition-transform hover:scale-105 ${action.className}`}
                        onClick={handlers[action.handlerKey]}
                    >
                       <Icon className="h-6 w-6" />
                       <span>{action.label}</span>
                    </Button>
                )
            })}
        </div>
    );
}