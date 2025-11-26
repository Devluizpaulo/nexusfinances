'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2 } from 'lucide-react';
import { collection, query, where } from 'firebase/firestore';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import type { Budget, Transaction } from '@/lib/types';
import { AddBudgetSheet } from '@/components/budgets/add-budget-sheet';
import { BudgetCard } from '@/components/budgets/budget-card';
import { startOfMonth, endOfMonth, parseISO } from 'date-fns';

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
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center">
              <h3 className="font-semibold">Nenhum limite de gasto definido</h3>
              <p className="mt-1 text-sm text-muted-foreground">Crie limites para controlar seus gastos mensais.</p>
               <Button className="mt-4" onClick={() => setIsSheetOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Criar Primeiro Limite
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
