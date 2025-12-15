
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2, Target, PiggyBank, Sparkles } from 'lucide-react';
import { collection, query, where } from 'firebase/firestore';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import type { Budget, Transaction } from '@/lib/types';
import { AddBudgetSheet } from '@/components/budgets/add-budget-sheet';
import { BudgetCard } from '@/components/budgets/budget-card';
import { startOfMonth, endOfMonth, parseISO, isWithinInterval, subMonths } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { BudgetAISuggestions } from '@/components/budgets/budget-ai-suggestions';
import { suggestBudgets } from '@/ai/flows/suggest-budgets-flow';
import type { SuggestBudgetsOutput } from '@/lib/types';


export default function BudgetsPage() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const [aiSuggestions, setAiSuggestions] = useState<SuggestBudgetsOutput['suggestions'] | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const budgetsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, `users/${user.uid}/budgets`));
  }, [firestore, user]);

  // Query para buscar despesas dos últimos 3 meses para a IA
  const expensesForAIQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    const now = new Date();
    const threeMonthsAgo = subMonths(now, 3);
    return query(
      collection(firestore, `users/${user.uid}/expenses`),
      where('date', '>=', threeMonthsAgo.toISOString().split('T')[0])
    );
  }, [firestore, user]);

  const { data: budgetsData, isLoading: isBudgetsLoading } = useCollection<Budget>(budgetsQuery);
  const { data: expensesForAI, isLoading: isExpensesForAILoading } = useCollection<Transaction>(expensesForAIQuery);
  
  // Efeito para buscar sugestões da IA
  useEffect(() => {
    // Roda apenas se os dados carregaram, não há orçamentos e há despesas suficientes
    if (!isBudgetsLoading && !isExpensesForAILoading && budgetsData?.length === 0 && expensesForAI && expensesForAI.length >= 5 && aiSuggestions === null) {
      const getSuggestions = async () => {
        setIsAiLoading(true);
        try {
          const result = await suggestBudgets({ transactions: expensesForAI });
          setAiSuggestions(result?.suggestions || []);
        } catch (error) {
          console.error('Error getting budget suggestions:', error);
          setAiSuggestions([]); // Evita tentar buscar de novo em caso de erro
        } finally {
          setIsAiLoading(false);
        }
      };
      getSuggestions();
    }
  }, [isBudgetsLoading, isExpensesForAILoading, budgetsData, expensesForAI, aiSuggestions]);


  const budgetsWithSpent = useMemo(() => {
    if (!budgetsData) return [];
    
    // Filtra apenas as despesas do mês corrente para o cálculo do gasto
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const currentMonthExpenses = (expensesForAI || []).filter(expense => 
      isWithinInterval(parseISO(expense.date), { start: monthStart, end: monthEnd })
    );

    return budgetsData.map(budget => {
      const budgetInterval = {
        start: parseISO(budget.startDate),
        end: parseISO(budget.endDate),
      };

      const spentAmount = currentMonthExpenses
        .filter(expense => 
            expense.category === budget.category &&
            isWithinInterval(parseISO(expense.date), budgetInterval)
        )
        .reduce((sum, expense) => sum + expense.amount, 0);
      
      return { ...budget, spentAmount };
    });

  }, [budgetsData, expensesForAI]);


  const handleEditBudget = (budget: Budget) => {
    setEditingBudget(budget);
    setIsSheetOpen(true);
  };
  
  const handleCreateFromSuggestion = (category: string) => {
    setEditingBudget({
      name: `Limite para ${category}`,
      category,
      amount: 0, // Inicia zerado para o usuário definir
    } as Budget);
    setIsSheetOpen(true);
  };
  
  const handleCloseSheet = () => {
    setEditingBudget(null);
    setIsSheetOpen(false);
  }

  const isLoading = isUserLoading || isBudgetsLoading || isExpensesForAILoading;

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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
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
                </div>
                 <div className="lg:col-span-1 space-y-6">
                    <BudgetAISuggestions 
                        suggestions={aiSuggestions}
                        isLoading={isAiLoading}
                        onCreateBudget={handleCreateFromSuggestion}
                    />
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
                  Use nossas sugestões com IA ou crie um manualmente.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-6">
                  
                  <BudgetAISuggestions 
                    suggestions={aiSuggestions}
                    isLoading={isAiLoading}
                    onCreateBudget={handleCreateFromSuggestion}
                  />

                   <Button className="mt-6" onClick={() => setIsSheetOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Criar Limite Manualmente
                  </Button>
              </CardContent>
            </Card>
        )}
      </div>
    </>
  );
}
