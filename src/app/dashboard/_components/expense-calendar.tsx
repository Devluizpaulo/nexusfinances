
'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
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

interface ExpenseCalendarProps {
  expenses: Transaction[];
}

export function ExpenseCalendar({ expenses }: ExpenseCalendarProps) {
  const { selectedDate, setSelectedDate } = useDashboardDate();
  const router = useRouter();

  const expensesByDay = useMemo(() => {
    return expenses.reduce((acc, expense) => {
      const day = format(new Date(expense.date), 'yyyy-MM-dd');
      if (!acc[day]) {
        acc[day] = 0;
      }
      acc[day] += expense.amount;
      return acc;
    }, {} as Record<string, number>);
  }, [expenses]);
  
  const maxExpense = useMemo(() => Math.max(0, ...Object.values(expensesByDay)), [expensesByDay]);

  const handleDayClick = (day: Date) => {
    const formattedDate = format(day, 'yyyy-MM-dd');
    if (expensesByDay[formattedDate]) {
      router.push(`/expenses?date=${formattedDate}`);
    }
  };
  
  const getIntensityClass = (total: number) => {
    if (total === 0 || maxExpense === 0) return '';
    const percentage = (total / maxExpense) * 100;
    
    if (percentage > 75) return 'bg-rose-900/80 text-rose-100';
    if (percentage > 50) return 'bg-rose-900/60 text-rose-200';
    if (percentage > 25) return 'bg-rose-900/40';
    return 'bg-rose-900/20';
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Calendário de Despesas</CardTitle>
        <CardDescription className="text-xs">
          Passe o mouse ou clique em um dia para ver os detalhes.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <TooltipProvider delayDuration={100}>
            <Calendar
            mode="single"
            month={selectedDate}
            onMonthChange={setSelectedDate}
            onDayClick={handleDayClick}
            className="w-full"
            classNames={{
                day: "h-10 w-10 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
                day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
            }}
            components={{
                DayContent: ({ date }) => {
                    const dayStr = format(date, 'yyyy-MM-dd');
                    const total = expensesByDay[dayStr];

                    if (total > 0) {
                        return (
                             <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className={cn(
                                        "relative flex h-full w-full flex-col items-center justify-center rounded-md transition-colors hover:bg-rose-900/90",
                                        getIntensityClass(total)
                                    )}>
                                        {date.getDate()}
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="font-semibold text-destructive">Gasto: {formatCurrency(total)}</p>
                                </TooltipContent>
                            </Tooltip>
                        );
                    }
                    return <span>{date.getDate()}</span>;
                },
            }}
            />
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
