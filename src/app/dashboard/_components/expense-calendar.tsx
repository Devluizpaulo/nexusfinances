
'use client';

import * as React from 'react';
import { useMemo, useCallback, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { format, isSameDay, isSameMonth, isToday } from 'date-fns';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { expenseCategories } from '@/lib/types';
import { Calendar } from '@/components/ui/calendar';
import type { DayProps } from 'react-day-picker';

interface ExpenseCalendarProps {
  expenses: Transaction[];
}

interface DayData {
  paid: { total: number; count: number; categories: Record<string, number> };
  pending: { total: number; count: number; categories: Record<string, number> };
}

function DayComponent({ date, displayMonth }: DayProps) {
    const { selectedDate, setSelectedDate } = useDashboardDate();
    const router = useRouter();

    const expensesByDay = useMemo(() => {
        // This is not ideal as it recalculates for every day. 
        // For this specific component structure, it's a necessary trade-off.
        // A better approach would be to provide this via context from the parent.
        const expenses: Transaction[] = (window as any).__expenseCalendarData || [];
        return expenses.reduce((acc, expense) => {
            const day = format(new Date(expense.date), 'yyyy-MM-dd');
            if (!acc[day]) {
                acc[day] = {
                    paid: { total: 0, count: 0, categories: {} },
                    pending: { total: 0, count: 0, categories: {} }
                };
            }

            const type = expense.status === 'paid' ? 'paid' : 'pending';
            acc[day][type].total += expense.amount;
            acc[day][type].count += 1;
            acc[day][type].categories[expense.category] = (acc[day][type].categories[expense.category] || 0) + expense.amount;

            return acc;
        }, {} as Record<string, DayData>);
    }, [selectedDate]); // Re-calculate when month changes

    const handleDayClick = useCallback((day: Date) => {
        const formattedDate = format(day, 'yyyy-MM-dd');
        const dayData = expensesByDay[formattedDate];
        if (dayData) {
            router.push(`/expenses?date=${formattedDate}`);
        }
    }, [expensesByDay, router]);

    const formattedDate = format(date, 'yyyy-MM-dd');
    const dayData = expensesByDay[formattedDate];
    const hasPaid = dayData?.paid.count > 0;
    const hasPending = dayData?.pending.count > 0;
    
    const dayContent = (
      <div
        onClick={() => handleDayClick(date)}
        className={cn(
          'relative flex h-full w-full flex-col items-center justify-center rounded-md p-1 transition-all duration-150',
          !isSameMonth(date, selectedDate) && 'text-slate-600',
          (hasPaid || hasPending) && isSameMonth(date, selectedDate) && 'cursor-pointer hover:bg-slate-800',
          isToday(date) && 'bg-primary/10 text-primary ring-1 ring-primary/80',
        )}
      >
        <span className="text-sm">{format(date, 'd')}</span>
        <div className="absolute bottom-1.5 flex gap-1">
          {hasPaid && <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
          {hasPending && <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
        </div>
      </div>
    );

    if (dayData && (hasPaid || hasPending)) {
      return (
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>{dayContent}</TooltipTrigger>
            <TooltipContent className="pointer-events-none w-48">
              <p className="font-bold">{format(date, "PPP", { locale: ptBR })}</p>
              <div className="mt-2 space-y-2">
                {hasPaid && (
                  <div>
                    <p className="text-xs font-semibold text-emerald-400">Pago: {formatCurrency(dayData.paid.total)}</p>
                    <ul className="pl-2">
                      {Object.entries(dayData.paid.categories).map(([cat, amount]) => (
                        <li key={cat} className="flex justify-between text-xs text-muted-foreground">
                          <span>{cat}</span><span>{formatCurrency(amount)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {hasPending && (
                  <div>
                    <p className="text-xs font-semibold text-amber-400">Pendente: {formatCurrency(dayData.pending.total)}</p>
                    <ul className="pl-2">
                      {Object.entries(dayData.pending.categories).map(([cat, amount]) => (
                        <li key={cat} className="flex justify-between text-xs text-muted-foreground">
                          <span>{cat}</span><span>{formatCurrency(amount)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return dayContent;
}


export function ExpenseCalendar({ expenses }: ExpenseCalendarProps) {
  const { selectedDate, setSelectedDate } = useDashboardDate();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredExpenses = useMemo(() => {
    if (selectedCategory === 'all') return expenses;
    return expenses.filter(expense => expense.category === selectedCategory);
  }, [expenses, selectedCategory]);

  // Pass filtered expenses to a global scope for the DayComponent to access
  // This is a workaround for the limitations of react-day-picker's `components` API
  if (typeof window !== 'undefined') {
    (window as any).__expenseCalendarData = filteredExpenses;
  }
  
  const monthlySummary = useMemo(() => {
    const monthExpenses = expenses.filter(expense => 
      isSameMonth(new Date(expense.date), selectedDate)
    );
    return {
      paid: monthExpenses.filter(e => e.status === 'paid').reduce((sum, exp) => sum + exp.amount, 0),
      pending: monthExpenses.filter(e => e.status === 'pending').reduce((sum, exp) => sum + exp.amount, 0),
      count: monthExpenses.length,
    };
  }, [expenses, selectedDate]);


  return (
    <Card className="h-full rounded-2xl border border-slate-900/60 bg-slate-950/70 p-4 sm:p-5 shadow-[0_18px_45px_-30px_rgba(15,23,42,1)]">
      <CardHeader className="p-0">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <CardTitle className="text-base text-slate-200">Calendário de Despesas</CardTitle>
            <CardDescription className="mt-1 text-xs">
              Visualize seus gastos previstos e consolidados.
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
        <div className="mt-4 p-3 bg-slate-900/80 rounded-lg space-y-2">
            <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-300">Total de despesas no mês:</span>
                <span className="font-bold text-rose-300">{formatCurrency(monthlySummary.paid + monthlySummary.pending)}</span>
            </div>
             <div className="flex justify-end gap-4 text-xs">
                <div className="flex items-center gap-1.5 text-emerald-400">
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span>Pago: {formatCurrency(monthlySummary.paid)}</span>
                </div>
                 <div className="flex items-center gap-1.5 text-amber-400">
                    <div className="h-2 w-2 rounded-full bg-amber-500" />
                    <span>Pendente: {formatCurrency(monthlySummary.pending)}</span>
                </div>
            </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 mt-4">
        <Calendar
            month={selectedDate}
            onMonthChange={setSelectedDate}
            components={{ Day: DayComponent }}
            className="w-full"
            classNames={{
              table: 'w-full border-separate space-y-1',
              head_cell: 'w-full text-xs text-muted-foreground font-medium',
              row: 'flex mt-1',
              cell: 'flex-1 p-0 m-px h-12',
            }}
        />
      </CardContent>
    </Card>
  );
}
