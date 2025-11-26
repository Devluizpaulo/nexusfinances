'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2, Target } from 'lucide-react';
import { collection, query, where } from 'firebase/firestore';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import type { Budget, Transaction } from '@/lib/types';
import { AddBudgetSheet } from '@/components/budgets/add-budget-sheet';
import { BudgetCard } from '@/components/budgets/budget-card';
import { startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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
    return query(collection(firestore, `users/${user.uid}/expenses`));
  }, [firestore, user]);

  const { data: budgetsData, isLoading: isBudgetsLoading } = useCollection<Budget>(budgetsQuery);
  const { data: expensesData, isLoading: isExpensesLoading } = useCollection<Transaction>(expensesQuery);

  const monthlyBudgets = useMemo(() => {
    if (!budgetsData || !expensesData) {
      return [];
    }

    const processedBudgets = budgetsData.map(budget => {
      const budgetStart = parseISO(budget.startDate);
      const budgetEnd = parseISO(budget.endDate);

      const spentAmount = expensesData
        .filter(expense => 
            expense.category === budget.category &&
            parseISO(expense.date) >= budgetStart &&
            parseISO(expense.date) <= budgetEnd
        )
        .reduce((sum, expense) => sum + expense.amount, 0);
      
      return { ...budget, spentAmount };
    });
    
    // Agora todos os orçamentos são mensais
    return processedBudgets;

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

  const monthlyTotalSpent = monthlyBudgets.reduce((sum, b) => sum + (b.spentAmount || 0), 0);
  const monthlyTotalAmount = monthlyBudgets.reduce((sum, b) => sum + b.amount, 0);

  return (
    <>
      <AddBudgetSheet 
        isOpen={isSheetOpen} 
        onClose={handleCloseSheet} 
        budget={editingBudget}
      />
      <div className="flex items-center justify-between mb-6">
        <Button onClick={() => setIsSheetOpen(true)} disabled={!user}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Criar Limite
        </Button>
      </div>
      
      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Seus Limites</h2>
          {monthlyBudgets.length > 0 ? (
            <div className="space-y-4 rounded-lg border p-4">
              {monthlyBudgets.map((budget) => (
                <BudgetCard key={budget.id} budget={budget} onEdit={handleEditBudget} />
              ))}
              <div className="pt-2 text-right font-medium">
                  Total: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthlyTotalSpent)} / {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthlyTotalAmount)}
              </div>
            </div>
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
      </div>
    </>
  );
}