"use client";

import { useMemo } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, PiggyBank, Target, Flame, Brain, ShieldCheck, Star, Sparkles, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { Transaction, Debt, Goal } from '@/lib/types';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: any;
  colorClass: string;
  bgGradient: string;
  isUnlocked: boolean;
  progressVal?: number;
  progressMax?: number;
}

export function GlobalAchievements() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  // Queries for dynamic evaluation
  const incomesQuery = useMemoFirebase(() => user && firestore ? query(collection(firestore, `users/${user.uid}/incomes`)) : null, [user, firestore]);
  const expensesQuery = useMemoFirebase(() => user && firestore ? query(collection(firestore, `users/${user.uid}/expenses`)) : null, [user, firestore]);
  const debtsQuery = useMemoFirebase(() => user && firestore ? query(collection(firestore, `users/${user.uid}/debts`)) : null, [user, firestore]);
  const goalsQuery = useMemoFirebase(() => user && firestore ? query(collection(firestore, `users/${user.uid}/goals`)) : null, [user, firestore]);
  const challengesQuery = useMemoFirebase(() => user && firestore ? query(collection(firestore, `users/${user.uid}/challenges52weeks`)) : null, [user, firestore]);

  const { data: incomes, isLoading: isIncomesLoading } = useCollection<Transaction>(incomesQuery);
  const { data: expenses, isLoading: isExpensesLoading } = useCollection<Transaction>(expensesQuery);
  const { data: debts, isLoading: isDebtsLoading } = useCollection<Debt>(debtsQuery);
  const { data: goals, isLoading: isGoalsLoading } = useCollection<Goal>(goalsQuery);
  const { data: challenges, isLoading: isChallengesLoading } = useCollection<any>(challengesQuery);

  const isLoading = isUserLoading || isIncomesLoading || isExpensesLoading || isDebtsLoading || isGoalsLoading || isChallengesLoading;

  const achievementsList = useMemo((): Achievement[] => {
    if (!user) return [];

    // 1. Poupador Consciente (Incomes & Expenses analysis)
    const totalInc = incomes?.reduce((sum, t) => sum + t.amount, 0) || 0;
    const totalExp = expenses?.reduce((sum, t) => sum + t.amount, 0) || 0;
    const savingsRate = totalInc > 0 ? ((totalInc - totalExp) / totalInc) * 100 : 0;
    const isPoupador = savingsRate >= 15;

    // 2. Foco no Futuro (Goals count)
    const goalsCount = goals?.length || 0;
    const isGoalsAdded = goalsCount >= 1;

    // 3. Sob Controle (Debts count)
    const debtsCount = debts?.length || 0;
    const isDebtsAdded = debtsCount >= 1;

    // 4. Desafiante (Challenges count)
    const challengesCount = challenges?.length || 0;
    const isChallengeStarted = challengesCount >= 1;

    // 5. Mestre do Conhecimento (Completed Tracks)
    const completedTracksCount = user.completedTracks?.length || 0;
    const isTrackCompleted = completedTracksCount >= 1;

    // 6. Investidor Diamante (Goals achieved)
    const achievedGoalsCount = goals?.filter(g => g.currentAmount >= g.targetAmount).length || 0;
    const isGoalAchieved = achievedGoalsCount >= 1;

    return [
      {
        id: 'poupador_consciente',
        title: 'Poupador Consciente',
        description: 'Mantenha sua taxa de poupança acima de 15% das suas receitas.',
        icon: PiggyBank,
        colorClass: 'text-emerald-500 border-emerald-500/20',
        bgGradient: 'from-emerald-500/10 to-teal-500/5',
        isUnlocked: isPoupador,
        progressVal: Math.min(Math.max(Math.round(savingsRate), 0), 100),
        progressMax: 15,
      },
      {
        id: 'foco_futuro',
        title: 'Foco no Futuro',
        description: 'Cadastre pelo menos 1 meta de economia para realizar seus sonhos.',
        icon: Target,
        colorClass: 'text-blue-500 border-blue-500/20',
        bgGradient: 'from-blue-500/10 to-cyan-500/5',
        isUnlocked: isGoalsAdded,
        progressVal: goalsCount,
        progressMax: 1,
      },
      {
        id: 'sob_controle',
        title: 'Vida Sob Controle',
        description: 'Cadastre suas dívidas ou parcelamentos para ter o controle do seu nome.',
        icon: ShieldCheck,
        colorClass: 'text-amber-500 border-amber-500/20',
        bgGradient: 'from-amber-500/10 to-yellow-500/5',
        isUnlocked: isDebtsAdded,
        progressVal: debtsCount,
        progressMax: 1,
      },
      {
        id: 'desafiante',
        title: 'Desafiante Financeiro',
        description: 'Inicie um Desafio das 52 Semanas para juntar dinheiro sorrindo.',
        icon: Flame,
        colorClass: 'text-orange-500 border-orange-500/20',
        bgGradient: 'from-orange-500/10 to-red-500/5',
        isUnlocked: isChallengeStarted,
        progressVal: challengesCount,
        progressMax: 1,
      },
      {
        id: 'mestre_conhecimento',
        title: 'Mestre do Aprendizado',
        description: 'Conclua a sua primeira trilha educacional na Jornada Financeira.',
        icon: Brain,
        colorClass: 'text-purple-500 border-purple-500/20',
        bgGradient: 'from-purple-500/10 to-indigo-500/5',
        isUnlocked: isTrackCompleted,
        progressVal: completedTracksCount,
        progressMax: 1,
      },
      {
        id: 'investidor_diamante',
        title: 'Investidor Diamante',
        description: 'Complete 100% de progresso em pelo menos uma meta financeira.',
        icon: Star,
        colorClass: 'text-yellow-500 border-yellow-500/20',
        bgGradient: 'from-yellow-500/10 to-amber-500/5',
        isUnlocked: isGoalAchieved,
        progressVal: achievedGoalsCount,
        progressMax: 1,
      },
    ];
  }, [user, incomes, expenses, debts, goals, challenges]);

  const unlockedCount = useMemo(() => achievementsList.filter(a => a.isUnlocked).length, [achievementsList]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-28 w-full rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-44 w-full rounded-xl" />
          <Skeleton className="h-44 w-full rounded-xl" />
          <Skeleton className="h-44 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  const completionPercentage = Math.round((unlockedCount / achievementsList.length) * 100);

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <Card className="relative overflow-hidden border-blue-500/25 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white backdrop-blur-xl">
        <motion.div
          className="absolute -right-10 -top-10 bg-blue-500/10 rounded-full h-40 w-40 blur-3xl"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <CardContent className="p-6 flex flex-col md:flex-row items-center gap-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 border border-blue-500/35 text-blue-400 shrink-0">
            <Trophy className="h-10 w-10" />
          </div>
          <div className="flex-1 space-y-2 text-center md:text-left">
            <h3 className="text-xl font-bold flex items-center justify-center md:justify-start gap-2">
              Progresso das Conquistas
              <Badge className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white border-none">
                {unlockedCount} / {achievementsList.length} Desbloqueadas
              </Badge>
            </h3>
            <p className="text-sm text-slate-300">
              Complete ações financeiras reais, como investir, economizar ou ler trilhas de educação financeira, para desbloquear insígnias exclusivas!
            </p>
            <div className="flex items-center gap-3">
              <Progress value={completionPercentage} className="h-2 flex-1 bg-slate-700" />
              <span className="text-xs font-bold text-slate-300 shrink-0">{completionPercentage}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid of Badges */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {achievementsList.map((ach, idx) => {
          const Icon = ach.icon;
          return (
            <motion.div
              key={ach.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card
                className={cn(
                  "relative h-full overflow-hidden transition-all duration-300 border-2 bg-gradient-to-br",
                  ach.isUnlocked
                    ? cn("border-slate-800/80 hover:shadow-lg dark:hover:shadow-slate-900/50 hover:-translate-y-1 bg-slate-950/40", ach.bgGradient)
                    : "border-slate-800/40 bg-slate-900/20 opacity-60"
                )}
              >
                {/* Glow for Unlocked Cards */}
                {ach.isUnlocked && (
                  <div className="absolute -right-4 -bottom-4 h-12 w-12 rounded-full bg-blue-500/10 blur-xl" />
                )}

                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start gap-4">
                    <div
                      className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-xl border-2 transition-all shrink-0",
                        ach.isUnlocked
                          ? cn("bg-background shadow-md", ach.colorClass)
                          : "bg-muted border-slate-700/50 text-slate-600"
                      )}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    {ach.isUnlocked ? (
                      <Badge className="bg-emerald-500/25 border-emerald-500/30 text-emerald-400 font-semibold flex items-center gap-1">
                        <Sparkles className="h-3 w-3 animate-pulse" />
                        Desbloqueada
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-slate-700 text-slate-400 font-normal">
                        Bloqueada
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-base font-bold mt-3 text-slate-100">{ach.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CardDescription className="text-slate-300 text-sm leading-relaxed">
                    {ach.description}
                  </CardDescription>

                  {/* Progress Indicator inside Badge */}
                  {ach.progressVal !== undefined && ach.progressMax !== undefined && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-medium text-slate-400">
                        <span>Progresso</span>
                        <span>
                          {ach.progressVal} / {ach.progressMax}
                          {ach.id === 'poupador_consciente' && '%'}
                        </span>
                      </div>
                      <Progress
                        value={Math.min((ach.progressVal / ach.progressMax) * 100, 100)}
                        className={cn(
                          "h-1.5",
                          ach.isUnlocked ? "bg-slate-800" : "bg-slate-900/60"
                        )}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
