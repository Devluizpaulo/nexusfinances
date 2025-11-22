'use client';

import { Button } from "@/components/ui/button";
import { Landmark, CreditCard, Banknote, Target } from "lucide-react";

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
        <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4">
             <Button 
                variant="outline" 
                size="sm"
                onClick={onAddIncome}
             >
                <Landmark className="mr-2 h-4 w-4" />
                Adicionar Renda
            </Button>
            <Button 
                variant="outline" 
                size="sm"
                onClick={onAddExpense}
            >
                <CreditCard className="mr-2 h-4 w-4" />
                Adicionar Despesa
            </Button>
             <Button 
                variant="outline" 
                size="sm"
                onClick={onAddDebt}
             >
                <Banknote className="mr-2 h-4 w-4" />
                Adicionar Dívida
            </Button>
             <Button 
                variant="outline" 
                size="sm"
                onClick={onAddGoal}
             >
                <Target className="mr-2 h-4 w-4" />
                Nova Reserva
            </Button>
        </div>
    );
}
