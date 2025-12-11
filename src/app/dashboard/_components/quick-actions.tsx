'use client';

import { Button } from "@/components/ui/button";
import { Landmark, CreditCard, Banknote, Target, Plus } from "lucide-react";

type QuickActionsProps = {
  onAddIncome: () => void;
  onAddExpense: () => void;
  onAddDebt: () => void;
  onAddGoal: () => void;
};

const actions = [
    { label: 'Renda', icon: Landmark, key: 'income' as const },
    { label: 'Despesa', icon: CreditCard, key: 'expense' as const },
    { label: 'Dívida', icon: Banknote, key: 'debt' as const },
    { label: 'Meta', icon: Target, key: 'goal' as const },
];

export function QuickActions({ onAddIncome, onAddExpense, onAddDebt, onAddGoal }: QuickActionsProps) {
    const handlers = {
        income: onAddIncome,
        expense: onAddExpense,
        debt: onAddDebt,
        goal: onAddGoal,
    };
  
    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {actions.map(action => {
                const Icon = action.icon;
                return (
                    <Button 
                        key={action.key} 
                        variant="outline" 
                        className="flex-col h-20 gap-1"
                        onClick={handlers[action.key]}
                    >
                       <Icon className="h-6 w-6 text-primary" />
                       <span className="text-xs font-medium">{action.label}</span>
                    </Button>
                )
            })}
        </div>
    );
}
