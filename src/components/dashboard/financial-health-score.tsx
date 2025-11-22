
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
  
  return (
    <Card className="flex flex-col h-full">
       <CardHeader>
        <div className="flex items-center gap-3">
          <Trophy className="h-5 w-5 text-primary" />
          <div>
            <CardTitle className="text-base">Sua Saúde Financeira</CardTitle>
            <CardDescription className="text-xs">
              Complete missões para aumentar sua pontuação.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 grid gap-4 md:grid-cols-2">
        <div className="flex flex-col items-center justify-center space-y-1 text-center">
            <ChartContainer
                config={{
                    score: {
                        label: "Score",
                        color: scoreColor,
                    },
                }}
                className="mx-auto aspect-square h-full max-h-[150px]"
            >
                <RadialBarChart
                    startAngle={-90}
                    endAngle={270}
                    innerRadius="80%"
                    outerRadius="100%"
                    barSize={10}
                    data={[{ name: 'score', value: score, fill: scoreColor }]}
                >
                    <PolarAngleAxis type="number" domain={[0, 100]} dataKey="value" tick={false} />
                    <RadialBar dataKey="value" background={{ fill: 'hsl(var(--muted))' }} cornerRadius={5} />
                </RadialBarChart>
            </ChartContainer>
            <span className="text-4xl font-bold" style={{ color: scoreColor }}>
                {score.toFixed(0)}
            </span>
            <p className="text-xs font-medium text-muted-foreground">Pontos de Saúde Financeira</p>
        </div>

        <div className="flex flex-col justify-center space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">Missões do Mês</h3>
              <span className="text-xs text-muted-foreground">
                {completedMissions}/{totalMissions}
              </span>
            </div>
             <div className="space-y-2">
               {visibleMissions.map((mission) => (
                  <div
                    key={mission.id}
                    className={cn(
                      'flex items-start gap-2 rounded-md border p-2 text-xs',
                      mission.isCompleted
                        ? 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/60 dark:bg-emerald-900/10'
                        : 'border-border bg-background'
                    )}
                  >
                      {mission.isCompleted ? (
                          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                      ) : (
                          <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                      )}
                      <span className={cn('text-xs', mission.isCompleted ? 'text-emerald-900 dark:text-emerald-50' : 'text-foreground')}>
                          {mission.description}
                      </span>
                  </div>
              ))}
             </div>
        </div>
      </CardContent>
       <CardFooter className="justify-center pt-4">
            {missions.length > 3 && (
                 <Button variant="link" size="sm" onClick={() => setShowAllMissions(!showAllMissions)} className="text-xs">
                    {showAllMissions ? 'Mostrar menos' : 'Mostrar todas'}
                </Button>
            )}
       </CardFooter>
    </Card>
  );
}
