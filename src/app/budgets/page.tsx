'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2, Target, PiggyBank } from 'lucide-react';
import { collection, query, where } from 'firebase/firestore';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import type { Budget, Transaction } from '@/lib/types';
import { AddBudgetSheet } from '@/components/budgets/add-budget-sheet';
import { BudgetCard } from '@/components/budgets/budget-card';
import { startOfMonth, endOfMonth, parseISO, isWithinInterval } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

export default function BudgetsPage() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const budgetsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, `users/${user.uid}/budgets`));
  }, [firestore, user]);

  const expensesQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);
    return query(
      collection(firestore, `users/${user.uid}/expenses`),
      where('date', '>=', start.toISOString().split('T')[0]),
      where('date', '<=', end.toISOString().split('T')[0])
    );
  }, [firestore, user]);

  const { data: budgetsData, isLoading: isBudgetsLoading } = useCollection<Budget>(budgetsQuery);
  const { data: expensesData, isLoading: isExpensesLoading } = useCollection<Transaction>(expensesQuery);

  const budgetsWithSpent = useMemo(() => {
    if (!budgetsData) return [];

    return budgetsData.map(budget => {
      const budgetInterval = {
        start: parseISO(budget.startDate),
        end: parseISO(budget.endDate),
      };

      const spentAmount = (expensesData || [])
        .filter(expense => 
            expense.category === budget.category &&
            isWithinInterval(parseISO(expense.date), budgetInterval)
        )
        .reduce((sum, expense) => sum + expense.amount, 0);
      
      return { ...budget, spentAmount };
    });

  }, [budgetsData, expensesData]);


  const handleEditBudget = (budget: Budget) => {
    setEditingBudget(budget);
    setIsSheetOpen(true);
  };
  
  const handleCloseSheet = () => {
    setEditingBudget(null);
    setIsSheetOpen(false);
  }

  const isLoading = isUserLoading || isBudgetsLoading || isExpensesLoading;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalSpent = budgetsWithSpent.reduce((sum, b) => sum + (b.spentAmount || 0), 0);
  const totalAmount = budgetsWithSpent.reduce((sum, b) => sum + b.amount, 0);
  const totalProgress = totalAmount > 0 ? (totalSpent / totalAmount) * 100 : 0;

  return (
    <>
      <AddBudgetSheet 
        isOpen={isSheetOpen} 
        onClose={handleCloseSheet} 
        budget={editingBudget}
      />
      <div className="flex items-center justify-between mb-6">
        <div/>
        <Button onClick={() => setIsSheetOpen(true)} disabled={!user}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Criar Limite
        </Button>
      </div>
      
      <div className="space-y-8">
        {budgetsWithSpent.length > 0 ? (
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <PiggyBank className="h-6 w-6 text-primary" />
                        <div>
                            <CardTitle>Seus Limites de Gasto</CardTitle>
                            <CardDescription>Acompanhe o quanto você já gastou em relação ao que planejou para o mês.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="space-y-2">
                        <div className="flex justify-between text-sm font-medium">
                            <span>Gasto Total</span>
                            <span>{formatCurrency(totalSpent)} / {formatCurrency(totalAmount)}</span>
                        </div>
                        <Progress value={totalProgress} className="h-3" />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        {budgetsWithSpent.map((budget) => (
                            <BudgetCard key={budget.id} budget={budget} onEdit={handleEditBudget} />
                        ))}
                    </div>
                </CardContent>
            </Card>
        ) : (
            <Card className="bg-muted/30">
              <CardHeader className="items-center text-center">
                 <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mb-2">
                  <Target className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Crie seu primeiro limite de gastos</CardTitle>
                <CardDescription className="max-w-md">
                  Os limites ajudam você a não gastar mais do que o planejado em categorias específicas.
                  Assim que criar o primeiro, ele aparecerá aqui.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                  <div className="w-full max-w-sm rounded-lg border bg-background/50 p-4">
                    <p className="mb-2 text-center text-sm font-medium text-muted-foreground">Exemplos de limites:</p>
                    <ul className="space-y-1 text-center text-sm text-muted-foreground">
                      <li>"Limite de R$ 800 para Mercado"</li>
                      <li>"Até R$ 300 para Lazer e Restaurantes"</li>
                      <li>"Não ultrapassar R$ 150 em Compras"</li>
                    </ul>
                  </div>
                   <Button className="mt-6" onClick={() => setIsSheetOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Criar Primeiro Limite
                  </Button>
              </CardContent>
            </Card>
        )}
      </div>
    </>
  );
}
