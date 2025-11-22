'use client';

import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2 } from 'lucide-react';
import { collection, query } from 'firebase/firestore';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import type { Goal } from '@/lib/types';
import { AddGoalSheet } from '@/components/goals/add-goal-sheet';
import { GoalCard } from '@/components/goals/goal-card';
import { AddContributionSheet } from '@/components/goals/add-contribution-sheet';

export default function GoalsPage() {
  const [isAddGoalSheetOpen, setIsAddGoalSheetOpen] = useState(false);
  const [isAddContributionSheetOpen, setIsAddContributionSheetOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [selectedGoalForContribution, setSelectedGoalForContribution] = useState<Goal | null>(null);

  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const goalsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, `users/${user.uid}/goals`));
  }, [firestore, user]);

  const { data: goalData, isLoading: isGoalsLoading } = useCollection<Goal>(goalsQuery);

  const orderedGoals = useMemo(() => {
    const list = [...(goalData || [])];

    return list.sort((a, b) => {
      const aTarget = a.targetAmount || 0;
      const bTarget = b.targetAmount || 0;
      const aProgress = aTarget > 0 ? (a.currentAmount || 0) / aTarget : 1;
      const bProgress = bTarget > 0 ? (b.currentAmount || 0) / bTarget : 1;

      const aCompleted = aProgress >= 1;
      const bCompleted = bProgress >= 1;

      if (aCompleted !== bCompleted) return aCompleted ? 1 : -1;

      const aAlmost = !aCompleted && aProgress >= 0.8;
      const bAlmost = !bCompleted && bProgress >= 0.8;
      if (aAlmost !== bAlmost) return aAlmost ? -1 : 1;

      const aDate = a.targetDate ? new Date(a.targetDate).getTime() : Infinity;
      const bDate = b.targetDate ? new Date(b.targetDate).getTime() : Infinity;
      if (aDate !== bDate) return aDate - bDate;

      const aRemaining = Math.max(aTarget - (a.currentAmount || 0), 0);
      const bRemaining = Math.max(bTarget - (b.currentAmount || 0), 0);
      return aRemaining - bRemaining;
    });
  }, [goalData]);
  
  const handleOpenContributionSheet = (goal: Goal) => {
    setSelectedGoalForContribution(goal);
    setIsAddContributionSheetOpen(true);
  };
  
  const handleOpenEditSheet = (goal: Goal) => {
    setEditingGoal(goal);
    setIsAddGoalSheetOpen(true);
  }

  const handleCloseGoalSheet = () => {
    setIsAddGoalSheetOpen(false);
    setEditingGoal(null);
  }

  const isLoading = isUserLoading || isGoalsLoading;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <>
      <AddGoalSheet 
        isOpen={isAddGoalSheetOpen} 
        onClose={handleCloseGoalSheet} 
        goal={editingGoal} 
      />
      {selectedGoalForContribution && (
          <AddContributionSheet 
            isOpen={isAddContributionSheetOpen} 
            onClose={() => setIsAddContributionSheetOpen(false)} 
            goal={selectedGoalForContribution} 
          />
      )}
      <PageHeader title="Metas & Reservas" description="Crie metas simples de reserva e investimento e veja quanto falta para chegar lá.">
        <Button onClick={() => setIsAddGoalSheetOpen(true)} disabled={!user}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Reserva/Investimento
        </Button>
      </PageHeader>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {orderedGoals.map((goal) => (
          <GoalCard key={goal.id} goal={goal} onAddContribution={handleOpenContributionSheet} onEdit={handleOpenEditSheet} />
        ))}
      </div>
       {(!goalData || goalData.length === 0) && !isLoading && (
        <div className="col-span-full mt-10 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-transparent p-8 text-center" style={{minHeight: '300px'}}>
            <h3 className="text-xl font-semibold tracking-tight">Nenhuma meta cadastrada ainda</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Cadastre sua primeira reserva para o xô planilhas mostrar o quanto você já avançou.
            </p>
            <Button className="mt-4" onClick={() => setIsAddGoalSheetOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Reserva/Investimento
            </Button>
        </div>
      )}
    </>
  );
}
    
