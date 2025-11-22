'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { BookOpen, Check, Trophy, Loader2 } from 'lucide-react';
import { educationTracks, calculateScore } from '@/lib/education-data';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { Transaction, Debt, Goal } from '@/lib/types';
import { useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { EducationTrackCard } from '@/components/education/EducationTrackCard';
import { Badge } from '@/components/ui/badge';

const healthLevels = [
  { level: 'Iniciante', color: 'bg-red-500' },
  { level: 'Razoável', color: 'bg-orange-500' },
  { level: 'Estável', color: 'bg-yellow-500' },
  { level: 'Forte', color: 'bg-sky-500' },
  { level: 'Saudável', color: 'bg-emerald-500' },
];

export default function EducationPage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  
  const incomesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, `users/${user.uid}/incomes`));
  }, [firestore, user]);

  const expensesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, `users/${user.uid}/expenses`));
  }, [firestore, user]);

  const debtsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, `users/${user.uid}/debts`));
  }, [firestore, user]);

  const goalsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, `users/${user.uid}/goals`));
  }, [firestore, user]);

  const { data: allIncomeData, isLoading: isIncomeLoading } = useCollection<Transaction>(incomesQuery);
  const { data: allExpenseData, isLoading: isExpensesLoading } = useCollection<Transaction>(expensesQuery);
  const { data: debtData, isLoading: isDebtsLoading } = useCollection<Debt>(debtsQuery);
  const { data: goalData, isLoading: isGoalsLoading } = useCollection<Goal>(goalsQuery);

  const { totalIncome, totalExpenses } = useMemo(() => {
    const totalIncome = allIncomeData?.reduce((sum, t) => sum + t.amount, 0) || 0;
    const totalExpenses = allExpenseData?.reduce((sum, t) => sum + t.amount, 0) || 0;
    return { totalIncome, totalExpenses };
  }, [allIncomeData, allExpenseData]);

  const { score } = useMemo(() => {
    if(!allExpenseData || !allIncomeData || !debtData || !goalData) return { score: 0, missions: [] };
     return calculateScore(totalIncome, totalExpenses, debtData, goalData, allExpenseData);
  }, [totalIncome, totalExpenses, debtData, goalData, allExpenseData]);

  const currentLevelIndex = useMemo(() => {
    if (score <= 20) return 0;
    if (score <= 40) return 1;
    if (score <= 60) return 2;
    if (score <= 80) return 3;
    return 4;
  }, [score]);
  
  const completedTracks = useMemo(() => new Set(user?.completedTracks || []), [user?.completedTracks]);
  
  const upcomingTracks = useMemo(() => educationTracks.filter(track => !completedTracks.has(track.slug)), [completedTracks]);
  const finishedTracks = useMemo(() => educationTracks.filter(track => completedTracks.has(track.slug)), [completedTracks]);
  
  const isLoading = isUserLoading || isIncomeLoading || isExpensesLoading || isDebtsLoading || isGoalsLoading;
  
  if (isLoading) {
    return (
        <div className="space-y-8">
            <PageHeader
                title="Jornada da Saúde Financeira"
                description="Aprenda a lidar com suas finanças de forma leve, intuitiva e conquiste a tranquilidade."
            />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-64 w-full" />
        </div>
    )
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Jornada da Saúde Financeira"
        description="Aprenda a lidar com suas finanças de forma leve, intuitiva e conquiste a tranquilidade."
      />

      <Card className="overflow-hidden">
        <CardHeader className="bg-muted/30">
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Trophy className="h-7 w-7" />
            </div>
            <div>
              <CardTitle>Sua Jornada de Evolução</CardTitle>
              <CardDescription>
                A saúde financeira é um caminho. Veja seu progresso e o que falta para o próximo nível.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Seu nível atual</span>
            <Badge variant="secondary" className={cn('font-semibold', healthLevels[currentLevelIndex].color, 'text-white')}>
              {healthLevels[currentLevelIndex].level}
            </Badge>
          </div>
          <Progress value={(currentLevelIndex + 1) * 20} className="mt-3 h-3" />
          <div className="mt-2 grid grid-cols-5 gap-1 text-center text-xs text-muted-foreground">
            {healthLevels.map((item, index) => (
              <div key={item.level} className={cn(index <= currentLevelIndex ? 'font-semibold text-primary' : '')}>
                {item.level}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Seção de Próximas Missões */}
      {upcomingTracks.length > 0 && (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <div>
                <h2 className="text-xl font-semibold tracking-tight">Próximas Missões</h2>
                <p className="text-sm text-muted-foreground">
                Continue sua jornada com estas trilhas de conhecimento.
                </p>
            </div>
            </div>
            <Separator />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {upcomingTracks.map((track) => (
                <EducationTrackCard key={track.slug} track={track} isCompleted={false} />
              ))}
            </div>
        </div>
      )}

      {/* Seção de Conquistas */}
      {finishedTracks.length > 0 && (
          <div className="space-y-4">
              <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                  <Check className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                  <h2 className="text-xl font-semibold tracking-tight">Conquistas</h2>
                  <p className="text-sm text-muted-foreground">
                  Parabéns! Você já concluiu estas trilhas e ganhou conhecimento.
                  </p>
              </div>
              </div>
              <Separator />
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {finishedTracks.map((track) => (
                  <EducationTrackCard key={track.slug} track={track} isCompleted={true} />
                ))}
              </div>
          </div>
      )}

    </div>
  );
}
