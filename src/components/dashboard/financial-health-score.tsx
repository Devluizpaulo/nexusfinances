
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

interface FinancialHealthScoreProps {
  income: number;
  expenses: number;
  debts: Debt[];
  goals: Goal[];
  transactions: Transaction[];
}

interface Mission {
  id: string;
  description: string;
  isCompleted: boolean;
  points: number;
}

export function FinancialHealthScore({
  income,
  expenses,
  debts,
  goals,
  transactions
}: FinancialHealthScoreProps) {
  const [showAllMissions, setShowAllMissions] = React.useState(false);

  const calculateScore = React.useCallback(() => {
    let score = 0;
    let maxScore = 0;

    // Mission 1: Gastos vs Renda
    const expenseToIncomeRatio = income > 0 ? expenses / income : 1;
    const mission1 = {
      id: 'm1',
      description: `Manter despesas abaixo de 80% da renda (${(expenseToIncomeRatio * 100).toFixed(0)}%)`,
      isCompleted: expenseToIncomeRatio < 0.8,
      points: 30,
    };
    maxScore += mission1.points;
    if (mission1.isCompleted) score += mission1.points;

    // Mission 2: Ter metas de economia
    const mission2 = {
      id: 'm2',
      description: 'Definir pelo menos uma meta de economia',
      isCompleted: goals.length > 0,
      points: 20,
    };
    maxScore += mission2.points;
    if (mission2.isCompleted) score += mission2.points;
    
    // Mission 3: Quitar dívidas
    const totalDebtAmount = debts.reduce((sum, d) => sum + d.totalAmount, 0);
    const totalPaidAmount = debts.reduce((sum, d) => sum + (d.paidAmount || 0), 0);
    const debtProgress = totalDebtAmount > 0 ? totalPaidAmount / totalDebtAmount : 1;
    const mission3 = {
      id: 'm3',
      description: `Pagar mais de 50% do total de dívidas (${(debtProgress * 100).toFixed(0)}% pago)`,
      isCompleted: debtProgress > 0.5,
      points: 25,
    };
    maxScore += mission3.points;
    if (mission3.isCompleted) score += mission3.points;

    // Mission 4: Acompanhar os gastos
    const mission4 = {
        id: 'm4',
        description: `Registrar pelo menos 5 despesas este mês (${transactions.length} registradas)`,
        isCompleted: transactions.length >= 5,
        points: 15,
    };
    maxScore += mission4.points;
    if(mission4.isCompleted) score += mission4.points;

    // Mission 5: Economizar dinheiro
    const savings = income - expenses;
    const mission5 = {
        id: 'm5',
        description: `Ter um balanço mensal positivo (economizar dinheiro)`,
        isCompleted: savings > 0,
        points: 10,
    }
    maxScore += mission5.points;
    if(mission5.isCompleted) score += mission5.points;


    const finalScore = maxScore > 0 ? (score / maxScore) * 100 : 0;

    const missions: Mission[] = [mission1, mission2, mission3, mission4, mission5];

    return { score: finalScore, missions };
  }, [income, expenses, debts, goals, transactions]);

  const { score, missions } = calculateScore();
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
