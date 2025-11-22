'use client';

import { Button } from "@/components/ui/button";
import { Landmark, CreditCard, Banknote, Target } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

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
        <Card>
            <CardContent className="p-4 flex flex-wrap items-center justify-center gap-2 md:gap-4">
                 <Button 
                    variant="outline" 
                    onClick={onAddIncome}
                    className="hover:border-primary/20 transition-colors"
                 >
                    <Landmark className="mr-2 h-4 w-4" />
                    Adicionar Renda
                </Button>
                <Button 
                    variant="outline" 
                    onClick={onAddExpense}
                    className="hover:border-primary/20 transition-colors"
                >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Adicionar Despesa
                </Button>
                 <Button 
                    variant="outline" 
                    onClick={onAddDebt}
                    className="hover:border-destructive/80 hover:text-destructive transition-colors"
                 >
                    <Banknote className="mr-2 h-4 w-4" />
                    Adicionar Dívida
                </Button>
                 <Button 
                    variant="outline" 
                    onClick={onAddGoal}
                    className="hover:border-primary/20 transition-colors"
                 >
                    <Target className="mr-2 h-4 w-4" />
                    Reservas & Investimentos
                </Button>
            </CardContent>
        </Card>
    );
}
