
'use client';

import { useMemo, useCallback, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { format, isSameMonth, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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
  { threshold: 0, label: 'Sem despesas', class: 'bg-slate-100 text-slate-600 border border-slate-200' },
  { threshold: 25, label: 'Baixo', class: 'bg-rose-100 text-rose-700 border border-rose-200' },
  { threshold: 50, label: 'Médio', class: 'bg-rose-200 text-rose-800 border border-rose-300' },
  { threshold: 75, label: 'Alto', class: 'bg-rose-300 text-rose-900 border border-rose-400' },
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
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle className="text-base">Calendário de Despesas</CardTitle>
            <CardDescription className="text-xs">
              Passe o mouse ou clique em um dia para ver os detalhes.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
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
        </div>
        <div className="mt-2 p-2 bg-slate-50 rounded-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="text-xs">
              <span className="font-medium">Total do mês: </span>
              <span className="font-bold text-rose-600">{formatCurrency(monthlySummary.total)}</span>
              <span className="text-muted-foreground ml-2">({monthlySummary.count} transações)</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <TooltipProvider delayDuration={100}>
            <Calendar
            mode="single"
            month={selectedDate}
            onMonthChange={setSelectedDate}
            onDayClick={handleDayClick}
            className="w-full"
            locale={ptBR}
            classNames={{
                day: "h-10 w-10 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
                day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                day_today: "bg-slate-900 text-white font-bold",
            }}
            components={{
                DayContent: ({ date }) => {
                    const dayStr = format(date, 'yyyy-MM-dd');
                    const dayData = expensesByDay[dayStr];
                    const isCurrentDay = isToday(date);

                    if (dayData && dayData.total > 0) {
                        return (
                             <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className={cn(
                                        "relative flex h-full w-full flex-col items-center justify-center rounded-md transition-colors hover:scale-105 cursor-pointer",
                                        getIntensityClass(dayData.total),
                                        isCurrentDay && "ring-2 ring-slate-400 ring-offset-1"
                                    )}>
                                        <span className="text-xs font-medium">{date.getDate()}</span>
                                        {dayData.count > 1 && (
                                          <Badge variant="secondary" className="absolute -top-1 -right-1 h-4 w-4 p-0 text-[10px]">
                                            {dayData.count}
                                          </Badge>
                                        )}
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <div className="space-y-1">
                                    <p className="font-semibold text-rose-600">{formatCurrency(dayData.total)}</p>
                                    <p className="text-xs text-muted-foreground">{dayData.count} transação(ões)</p>
                                    <div className="space-y-1">
                                      {Object.entries(dayData.categories).slice(0, 3).map(([cat, amount]) => (
                                        <div key={cat} className="flex justify-between text-xs">
                                          <span>{cat}:</span>
                                          <span>{formatCurrency(amount)}</span>
                                        </div>
                                      ))}
                                      {Object.keys(dayData.categories).length > 3 && (
                                        <p className="text-xs text-muted-foreground italic">
                                          +{Object.keys(dayData.categories).length - 3} outras...
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </TooltipContent>
                            </Tooltip>
                        );
                    }
                    return (
                      <div className={cn(
                        "flex h-full w-full items-center justify-center rounded-md",
                        isCurrentDay && "bg-slate-900 text-white font-bold"
                      )}>
                        {date.getDate()}
                      </div>
                    );
                },
            }}
            />
        </TooltipProvider>
        
        {/* Legenda */}
        <div className="px-3 pb-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium">Intensidade de gastos:</span>
            <div className="flex items-center gap-2">
              {intensityLevels.map((level, index) => (
                <div key={index} className="flex items-center gap-1">
                  <div className={cn("w-3 h-3 rounded-sm border", level.class)} />
                  <span className="hidden sm:inline">{level.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
