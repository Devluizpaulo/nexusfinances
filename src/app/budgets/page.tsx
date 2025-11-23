'use client';

import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2 } from 'lucide-react';
import { collection, query, where } from 'firebase/firestore';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import type { Budget, Transaction } from '@/lib/types';
import { AddBudgetSheet } from '@/components/budgets/add-budget-sheet';
import { BudgetCard } from '@/components/budgets/budget-card';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, parseISO } from 'date-fns';

export default function BudgetsPage() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  // 1. Fetch all budgets
  const budgetsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, `users/${user.uid}/budgets`));
  }, [firestore, user]);

  const { data: budgetsData, isLoading: isBudgetsLoading } = useCollection<Budget>(budgetsQuery);

  // 2. Fetch all expenses for relevant date ranges to calculate spent amounts
  const expensesQuery = useMemoFirebase(() => {
    if (!user) return null;
    // A broader query to get all expenses. Filtering will happen client-side.
    // This could be optimized if performance becomes an issue.
    return query(collection(firestore, `users/${user.uid}/expenses`));
  }, [firestore, user]);
  
  const { data: expensesData, isLoading: isExpensesLoading } = useCollection<Transaction>(expensesQuery);
  
  // 3. Process and combine data
  const { monthlyBudgets, weeklyBudgets } = useMemo(() => {
    if (!budgetsData || !expensesData) {
      return { monthlyBudgets: [], weeklyBudgets: [] };
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

    return {
      monthlyBudgets: processedBudgets.filter(b => b.period === 'monthly'),
      weeklyBudgets: processedBudgets.filter(b => b.period === 'weekly'),
    }

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
      <PageHeader title="Orçamentos" description="Defina limites de gastos por categoria e acompanhe seu progresso.">
        <Button onClick={() => setIsSheetOpen(true)} disabled={!user}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Criar Orçamento
        </Button>
      </PageHeader>
      
      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Orçamentos Mensais</h2>
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
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center">
              <h3 className="font-semibold">Nenhum orçamento mensal</h3>
              <p className="mt-1 text-sm text-muted-foreground">Crie orçamentos para controlar seus gastos mensais.</p>
            </div>
          )}
        </div>

        <div>
           <h2 className="text-xl font-semibold mb-4">Orçamentos Semanais</h2>
            {weeklyBudgets.length > 0 ? (
                <div className="space-y-4 rounded-lg border p-4">
                {weeklyBudgets.map((budget) => (
                    <BudgetCard key={budget.id} budget={budget} onEdit={handleEditBudget} />
                ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center">
                    <h3 className="font-semibold">Nenhum orçamento semanal</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Defina metas de gastos para períodos mais curtos.</p>
                </div>
            )}
        </div>
      </div>
    </>
  );
}
