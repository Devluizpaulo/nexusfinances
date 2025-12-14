
'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2, PiggyBank, Trophy } from 'lucide-react';
import { collection, query } from 'firebase/firestore';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import type { Goal } from '@/lib/types';
import { AddGoalSheet } from '@/components/goals/add-goal-sheet';
import { GoalCard } from '@/components/goals/goal-card';
import { AddContributionSheet } from '@/components/goals/add-contribution-sheet';
import { PageHeader } from '@/components/page-header';
import Link from 'next/link';

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
      <PageHeader
        title="Metas e Reservas"
        description="Acompanhe o progresso dos seus sonhos e objetivos financeiros."
      >
        <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
                <Link href="/challenges">
                    <Trophy className="mr-2 h-4 w-4" />
                    Ver Desafios de Poupança
                </Link>
            </Button>
            <Button onClick={() => setIsAddGoalSheetOpen(true)} disabled={!user} className="bg-emerald-500/20 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/30 hover:border-emerald-500/50">
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Reserva/Investimento
            </Button>
        </div>
      </PageHeader>
      
      {(!goalData || goalData.length === 0) ? (
         <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-800/60 bg-slate-950/70 p-12 text-center shadow-[0_18px_45px_-30px_rgba(15,23,42,1)]" style={{minHeight: '400px'}}>
           <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 mb-4">
              <PiggyBank className="h-8 w-8 text-emerald-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-100">Defina seu primeiro objetivo</h3>
            <p className="mt-2 max-w-sm text-sm text-slate-400">
              Cadastre sua primeira reserva ou meta de investimento para ver seu progresso, visualizar o quanto falta e manter a motivação em alta.
            </p>
            <Button className="mt-6 bg-emerald-500/20 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/30 hover:border-emerald-500/50" onClick={() => setIsAddGoalSheetOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Primeira Meta
            </Button>
        </div>
      ) : (
         <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {orderedGoals.map((goal) => (
            <div key={goal.id} className="rounded-2xl border border-slate-900/60 bg-slate-950/70 p-4 sm:p-5 shadow-[0_18px_45px_-30px_rgba(15,23,42,1)]">
              <GoalCard goal={goal} onAddContribution={handleOpenContributionSheet} onEdit={handleOpenEditSheet} />
            </div>
          ))}
        </div>
      )}
    </>
  );
}
    
