
'use client';

import { useMemo, useCallback, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { format, isSameMonth, isToday } from 'date-fns';
import type { Transaction } from '@/lib/types';
import { formatCurrency, cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useDashboardDate } from '@/context/dashboard-date-context';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { expenseCategories } from '@/lib/types';

interface ExpenseCalendarProps {
  expenses: Transaction[];
}

interface DayData {
  total: number;
  count: number;
  categories: Record<string, number>;
}

const intensityLevels = [
  { threshold: 0, label: 'Sem despesas', class: 'bg-slate-800/20 text-slate-400 border border-transparent' },
  { threshold: 1, label: 'Baixo', class: 'bg-rose-900/40 text-rose-100 border-rose-800/50' },
  { threshold: 40, label: 'Médio', class: 'bg-rose-800/60 text-rose-50 border-rose-700/80' },
  { threshold: 75, label: 'Alto', class: 'bg-rose-600/80 text-white border-rose-500' },
];

export function ExpenseCalendar({ expenses }: ExpenseCalendarProps) {
  const { selectedDate, setSelectedDate } = useDashboardDate();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredExpenses = useMemo(() => {
    if (selectedCategory === 'all') return expenses;
    return expenses.filter(expense => expense.category === selectedCategory);
  }, [expenses, selectedCategory]);

  const expensesByDay = useMemo(() => {
    return filteredExpenses.reduce((acc, expense) => {
      const day = format(new Date(expense.date), 'yyyy-MM-dd');
      if (!acc[day]) {
        acc[day] = { total: 0, count: 0, categories: {} };
      }
      acc[day].total += expense.amount;
      acc[day].count += 1;
      acc[day].categories[expense.category] = (acc[day].categories[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, DayData>);
  }, [filteredExpenses]);
  
  const maxExpense = useMemo(() => Math.max(0, ...Object.values(expensesByDay).map(d => d.total)), [expensesByDay]);

  const monthlySummary = useMemo(() => {
    const monthExpenses = expenses.filter(expense => 
      isSameMonth(new Date(expense.date), selectedDate)
    );
    return {
      total: monthExpenses.reduce((sum, exp) => sum + exp.amount, 0),
      count: monthExpenses.length,
      categories: monthExpenses.reduce((acc, exp) => {
        acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
        return acc;
      }, {} as Record<string, number>)
    };
  }, [expenses, selectedDate]);

  const handleDayClick = useCallback((day: Date) => {
    const formattedDate = format(day, 'yyyy-MM-dd');
    const dayData = expensesByDay[formattedDate];
    if (dayData && dayData.total > 0) {
      router.push(`/expenses?date=${formattedDate}`);
    }
  }, [expensesByDay, router]);
  
  const getIntensityClass = (total: number) => {
    if (total === 0 || maxExpense === 0) return intensityLevels[0].class;
    const percentage = (total / maxExpense) * 100;
    
    for (let i = intensityLevels.length - 1; i > 0; i--) {
      if (percentage >= intensityLevels[i].threshold) {
        return intensityLevels[i].class;
      }
    }
    return intensityLevels[1].class;
  };

  return (
    <Card className="h-full rounded-2xl border border-slate-900/60 bg-slate-950/70 p-4 sm:p-5 shadow-[0_18px_45px_-30px_rgba(15,23,42,1)]">
      <CardHeader className="p-0">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <CardTitle className="text-base text-slate-200">Calendário de Despesas</CardTitle>
            <CardDescription className="mt-1 text-xs">
              Passe o mouse ou clique em um dia para ver os detalhes.
            </CardDescription>
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-[140px] h-8 text-xs border-slate-800/80 bg-slate-950/70 hover:border-slate-700/80">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {expenseCategories.map(category => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="mt-4 p-2.5 bg-slate-900/80 rounded-lg">
            <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-300">Total de despesas no mês:</span>
                <span className="font-bold text-rose-300">{formatCurrency(monthlySummary.total)}</span>
            </div>
            <p className="text-xs text-slate-500 text-right mt-0.5">{monthlySummary.count} transação(ões)</p>
        </div>
      </CardHeader>
      <CardContent className="p-0 mt-2">
        <TooltipProvider delayDuration={100}>
            <Calendar
              mode="single"
              month={selectedDate}
              onMonthChange={setSelectedDate}
              onDayClick={handleDayClick}
              className="w-full"
              captionLayout="dropdown-buttons"
              fromYear={new Date().getFullYear() - 5}
              toYear={new Date().getFullYear() + 5}
              classNames={{
                day_today: "ring-2 ring-slate-500 ring-offset-2 ring-offset-background",
                day: "h-8 w-8 rounded-md"
              }}
              components={{
                DayContent: ({ date }) => {
                  const dayStr = format(date, 'yyyy-MM-dd');
                  const dayData = expensesByDay[dayStr];
                  
                  return (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            "relative flex h-full w-full flex-col items-center justify-center rounded-md transition-transform duration-200 ease-out hover:scale-110",
                            dayData && dayData.total > 0 ? getIntensityClass(dayData.total) : 'text-slate-400',
                          )}
                        >
                          <span className="text-xs font-medium">{date.getDate()}</span>
                           {dayData && dayData.count > 1 && (
                            <Badge variant="secondary" className="absolute -top-1 -right-1 h-3.5 min-w-[0.875rem] p-0 text-[9px] flex items-center justify-center bg-slate-900 text-slate-300 border border-slate-700">
                              {dayData.count}
                            </Badge>
                          )}
                        </div>
                      </TooltipTrigger>
                      {dayData && dayData.total > 0 && (
                        <TooltipContent>
                          <div className="space-y-1">
                            <p className="font-semibold text-rose-400">{formatCurrency(dayData.total)}</p>
                            <div className="space-y-1">
                              {Object.entries(dayData.categories).slice(0, 3).map(([cat, amount]) => (
                                <div key={cat} className="flex justify-between text-xs gap-2">
                                  <span className="text-slate-400">{cat}:</span>
                                  <span className="font-medium">{formatCurrency(amount)}</span>
                                </div>
                              ))}
                              {Object.keys(dayData.categories).length > 3 && (
                                <p className="text-xs text-slate-500 italic">
                                  +{Object.keys(dayData.categories).length - 3} outras...
                                </p>
                              )}
                            </div>
                          </div>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  );
                },
              }}
            />
        </TooltipProvider>
        
        <div className="px-1 pb-1 mt-1">
          <div className="flex items-center justify-center gap-x-2 text-[11px] text-slate-400">
            <span className="font-medium">Intensidade:</span>
              {intensityLevels.map((level, index) => (
                <div key={index} className="flex items-center gap-1">
                  <div className={cn("w-2.5 h-2.5 rounded-sm border", level.class.split(' ').filter(c => c.startsWith('bg-') || c.startsWith('border-')).join(' '))} />
                  <span>{level.label}</span>
                </div>
              ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
