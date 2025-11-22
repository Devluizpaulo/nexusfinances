
import { Banknote, BookOpen, Calculator, FileText, Goal, HeartHandshake, Landmark, PiggyBank, Receipt, Sparkles as SparklesIcon, Zap, type LucideIcon, Award, Activity, BrainCircuit, Rocket, Gem } from 'lucide-react';
import { PayoffSimulator } from '@/components/education/PayoffSimulator';
import { InterestCalculator } from '@/components/education/InterestCalculator';
import type { Debt, Goal as GoalType, Transaction, EducationTrack, Mission } from './types';


export const journeyLevels = [
  { level: 'Iniciante', icon: SparklesIcon, colorClass: 'text-red-500' },
  { level: 'Curioso(a)', icon: Activity, colorClass: 'text-orange-500' },
  { level: 'Estudioso(a)', icon: BrainCircuit, colorClass: 'text-yellow-500' },
  { level: 'Entendido(a)', icon: Rocket, colorClass: 'text-sky-500' },
  { level: 'Expert', icon: Gem, colorClass: 'text-emerald-500' },
];

export const calculateScore = (income: number, expenses: number, debts: Debt[], goals: GoalType[], transactions: Transaction[]) => {
    let score = 0;
    let maxScore = 0;

    const expenseToIncomeRatio = income > 0 ? expenses / income : 1;
    const mission1 = {
      id: 'm1',
      description: `Manter despesas abaixo de 80% da renda (${(expenseToIncomeRatio * 100).toFixed(0)}%)`,
      isCompleted: expenseToIncomeRatio < 0.8,
      points: 30,
    };
    maxScore += mission1.points;
    if (mission1.isCompleted) score += mission1.points;

    const mission2 = {
      id: 'm2',
      description: 'Definir pelo menos uma meta de economia',
      isCompleted: goals.length > 0,
      points: 15,
    };
    maxScore += mission2.points;
    if (mission2.isCompleted) score += mission2.points;

    const hasGoalWithProgress = goals.some((goal) => {
      const target = goal.targetAmount || 0;
      if (target <= 0) return false;
      const current = goal.currentAmount || 0;
      return current / target >= 0.5;
    });
    const mission2b = {
      id: 'm2b',
      description: 'Ter pelo menos uma meta com mais de 50% de progresso',
      isCompleted: hasGoalWithProgress,
      points: 10,
    };
    maxScore += mission2b.points;
    if (mission2b.isCompleted) score += mission2b.points;
    
    const totalDebtAmount = debts.reduce((sum, d) => sum + d.totalAmount, 0);
    const totalPaidAmount = debts.reduce((sum, d) => sum + (d.paidAmount || 0), 0);
    
    const mission3 = {
      id: 'm3',
      description: `Pagar mais de 50% do total de dívidas`,
      isCompleted: totalDebtAmount > 0 && (totalPaidAmount / totalDebtAmount) > 0.5,
      points: 25,
    };
     if (totalDebtAmount > 0) {
        maxScore += mission3.points;
        if (mission3.isCompleted) score += mission3.points;
    }


    const mission4 = {
        id: 'm4',
        description: `Registrar pelo menos 5 despesas este mês (${transactions.length} registradas)`,
        isCompleted: transactions.length >= 5,
        points: 15,
    };
    maxScore += mission4.points;
    if(mission4.isCompleted) score += mission4.points;

    const savings = income - expenses;
    const mission5 = {
        id: 'm5',
        description: `Ter um balanço mensal positivo (economizar dinheiro)`,
        isCompleted: savings > 0,
        points: 10,
    }
    maxScore += mission5.points;
    if(mission5.isCompleted) score += mission5.points;

    const hasContributions = goals.some((goal) => Array.isArray((goal as any).contributions) && (goal as any).contributions.length > 0);
    const mission6 = {
      id: 'm6',
      description: 'Registrar pelo menos um aporte em alguma meta',
      isCompleted: hasContributions,
      points: 10,
    };
    if (goals.length > 0) {
      maxScore += mission6.points;
      if (mission6.isCompleted) score += mission6.points;
    }


    const finalScore = maxScore > 0 ? (score / maxScore) * 100 : 0;
    const missions: Mission[] = [mission1, mission2, mission2b, mission3, mission4, mission5, mission6].filter(m => {
        if (m.id === 'm3' && totalDebtAmount === 0) return false;
        if (m.id === 'm6' && goals.length === 0) return false;
        return true;
    });


    return { score: finalScore, missions };
};
