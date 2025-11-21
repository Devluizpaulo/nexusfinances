'use client';

import { useState } from 'react';
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
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);

  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const goalsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, `users/${user.uid}/goals`));
  }, [firestore, user]);

  const { data: goalData, isLoading: isGoalsLoading } = useCollection<Goal>(goalsQuery);
  
  const handleOpenContributionSheet = (goal: Goal) => {
    setSelectedGoal(goal);
    setIsAddContributionSheetOpen(true);
  };

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
      <AddGoalSheet isOpen={isAddGoalSheetOpen} onClose={() => setIsAddGoalSheetOpen(false)} />
      {selectedGoal && (
          <AddContributionSheet 
            isOpen={isAddContributionSheetOpen} 
            onClose={() => setIsAddContributionSheetOpen(false)} 
            goal={selectedGoal} 
          />
      )}
      <PageHeader title="Metas Financeiras" description="Defina e acompanhe sua reserva de emergência e metas de investimento.">
        <Button onClick={() => setIsAddGoalSheetOpen(true)} disabled={!user}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Meta
        </Button>
      </PageHeader>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {(goalData || []).map((goal) => (
          <GoalCard key={goal.id} goal={goal} onAddContribution={handleOpenContributionSheet} />
        ))}
      </div>
       {(!goalData || goalData.length === 0) && !isLoading && (
        <div className="col-span-full mt-10 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-transparent p-8 text-center" style={{minHeight: '300px'}}>
            <h3 className="text-xl font-semibold tracking-tight">Nenhuma meta encontrada</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Comece adicionando uma nova meta para ver seu progresso aqui.
            </p>
            <Button className="mt-4" onClick={() => setIsAddGoalSheetOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Primeira Meta
            </Button>
        </div>
      )}
    </>
  );
}
    
