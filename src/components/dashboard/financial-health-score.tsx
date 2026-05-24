
'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  ChartContainer,
} from '@/components/ui/chart';
import { CheckCircle2, Shield, Trophy, XCircle } from 'lucide-react';
import type { Debt, Goal, Transaction } from '@/lib/types';
import { PolarAngleAxis, RadialBar, RadialBarChart } from 'recharts';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { calculateScore, type Mission } from '@/lib/education-data';
import Link from 'next/link';
import { useCountUp } from '@/hooks/use-count-up';

interface FinancialHealthScoreProps {
  income: number;
  expenses: number;
  debts: Debt[];
  goals: Goal[];
  transactions: Transaction[];
}

export function FinancialHealthScore({
  income,
  expenses,
  debts,
  goals,
  transactions
}: FinancialHealthScoreProps) {
  const [showAllMissions, setShowAllMissions] = React.useState(false);

  const { score, missions } = calculateScore(income, expenses, debts, goals, transactions);
  const scoreColor = score < 40 ? 'hsl(var(--destructive))' : score < 80 ? 'hsl(var(--chart-4))' : 'hsl(var(--chart-1))';

  const visibleMissions = showAllMissions ? missions : missions.slice(0, 3);

  const completedMissions = missions.filter((mission) => mission.isCompleted).length;
  const totalMissions = missions.length;

  const scoreLabel = score === 0
    ? 'Comece completando suas primeiras missões.'
    : score < 40
      ? 'Sua saúde financeira ainda está frágil. Foque em completar as próximas missões.'
      : score < 80
        ? 'Bom caminho! Continue acompanhando e cumprindo as missões.'
        : 'Excelente! Mantenha seus hábitos e revise suas metas periodicamente.';
  
  const getLinkForMission = (id: string): string | undefined => {
    switch (id) {
      case 'm2':
      case 'm2b':
      case 'm6':
        return '/goals';
      case 'm3':
        return '/debts';
      case 'm4':
        return '/expenses';
      default:
        return undefined;
    }
  }

  const MissionWrapper = ({ mission, children }: { mission: Mission; children: React.ReactNode }) => {
    const href = getLinkForMission(mission.id);
    if (!mission.isCompleted && href) {
      return <Link href={href}>{children}</Link>;
    }
    return <>{children}</>;
  };

  const getBadgeDetails = (scoreVal: number) => {
    if (scoreVal < 40) return { name: 'Bronze', emoji: '🥉', color: 'text-amber-500 border-amber-500/20 bg-amber-500/5' };
    if (scoreVal < 80) return { name: 'Prata', emoji: '🥈', color: 'text-slate-300 border-slate-500/20 bg-slate-500/5' };
    return { name: 'Ouro', emoji: '🥇', color: 'text-yellow-400 border-yellow-500/20 bg-yellow-500/5' };
  };
  const badge = getBadgeDetails(score);

  // Points gained from completed missions this month
  const monthlyPointsGained = missions
    .filter((m) => m.isCompleted)
    .reduce((sum, m) => sum + m.points, 0);

  // Check if they have unpaid overdue debt
  const streakText = debts.length > 0 ? 'Dívidas sob controle 🔥' : 'Carteira limpa! 🕊️';

  // CountUp animation
  const animatedScore = useCountUp({ end: score });

  return (
    <div className="card-premium flex flex-col h-full hover:shadow-lg transition-all duration-300">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/5 bg-slate-900/50 text-cyan-400">
            <Trophy className="h-4.5 w-4.5" />
          </div>
          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Saúde Financeira</h3>
            <p className="text-xs text-slate-500">Aumente seus pontos completando missões.</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 justify-end">
          {monthlyPointsGained > 0 && (
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold border border-emerald-500/25 bg-emerald-500/10 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.05)]">
              +{monthlyPointsGained} pontos este mês
            </span>
          )}
          <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold border", badge.color)}>
            <span>{badge.emoji}</span>
            <span>{badge.name}</span>
          </span>
          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold border border-white/5 bg-slate-900/50 text-slate-400">
            {streakText}
          </span>
        </div>
      </div>

      <div className="flex-1 grid gap-4 md:grid-cols-2 pt-2">
        <div className="flex flex-col items-center justify-center space-y-1 text-center">
            <ChartContainer
                config={{
                    score: {
                        label: "Score",
                        color: scoreColor,
                    },
                }}
                className="mx-auto aspect-square h-full max-h-[140px] w-full"
            >
                <RadialBarChart
                    startAngle={-90}
                    endAngle={270}
                    innerRadius="80%"
                    outerRadius="100%"
                    barSize={8}
                    data={[{ name: 'score', value: animatedScore, fill: scoreColor }]}
                >
                    <PolarAngleAxis type="number" domain={[0, 100]} dataKey="value" tick={false} />
                    <RadialBar dataKey="value" background={{ fill: 'rgba(255,255,255,0.03)' }} cornerRadius={5} />
                </RadialBarChart>
            </ChartContainer>
            <span className="text-4xl font-bold tracking-tight font-mono" style={{ color: scoreColor }}>
                {animatedScore.toFixed(0)}
            </span>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pontos de Saúde</p>
        </div>

        <div className="flex flex-col justify-center space-y-3">
            <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-2">
              <h3 className="text-xs font-semibold text-slate-300">Missões do Mês</h3>
              <span className="text-xs font-bold text-slate-400">
                {completedMissions}/{totalMissions}
              </span>
            </div>
             <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                {visibleMissions.map((mission) => (
                  <MissionWrapper key={mission.id} mission={mission}>
                    <div
                      className={cn(
                        'flex items-start gap-2 rounded-lg border p-2.5 text-xs transition-colors duration-150',
                        mission.isCompleted
                          ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400'
                          : 'border-white/5 bg-slate-900/20 text-slate-300',
                        !mission.isCompleted && getLinkForMission(mission.id) && 'cursor-pointer hover:border-cyan-500/20 hover:bg-slate-900/40'
                      )}
                    >
                        {mission.isCompleted ? (
                            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                        ) : (
                            <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-600" />
                        )}
                        <span className="text-[11px] leading-tight">
                            {mission.description}
                        </span>
                    </div>
                  </MissionWrapper>
              ))}
             </div>
        </div>
      </div >
      
      {missions.length > 3 && (
        <div className="flex justify-center mt-3 pt-2 border-t border-white/5">
          <Button variant="link" size="sm" onClick={() => setShowAllMissions(!showAllMissions)} className="text-xs text-slate-400 hover:text-slate-200 p-0 h-auto">
            {showAllMissions ? 'Mostrar menos' : 'Mostrar todas'}
          </Button>
        </div>
      )}
    </div>
  );
}
