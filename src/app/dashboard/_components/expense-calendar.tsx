'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Transaction } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';

interface ExpenseCalendarProps {
  expenses: Transaction[];
}

export function ExpenseCalendar({ expenses }: ExpenseCalendarProps) {
  const [month, setMonth] = useState(new Date());
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

  const handleDayClick = (day: Date) => {
    const formattedDate = format(day, 'yyyy-MM-dd');
    if (expensesByDay[formattedDate]) {
      router.push(`/expenses?date=${formattedDate}`);
    }
  };

  const DayWithExpenses = ({ date }: { date: Date }) => {
    const dayStr = format(date, 'yyyy-MM-dd');
    const total = expensesByDay[dayStr];
    if (total > 0) {
      return (
        <div className="relative flex h-full w-full flex-col items-center justify-center">
          <span>{date.getDate()}</span>
          <Badge
            variant="destructive"
            className="absolute bottom-0.5 scale-[0.6] rounded-full p-0.5 px-1 font-mono"
          >
            -{formatCurrency(total)}
          </Badge>
        </div>
      );
    }
    return <span>{date.getDate()}</span>;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Calendário de Despesas</CardTitle>
        <CardDescription className="text-xs">
          Clique em um dia para ver os detalhes.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Calendar
          mode="single"
          month={month}
          onMonthChange={setMonth}
          onDayClick={handleDayClick}
          locale={ptBR}
          className="w-full"
          classNames={{
            day_cell: 'h-10 w-10 text-center text-sm p-0 relative focus-within:relative focus-within:z-20',
          }}
          components={{
            DayContent: DayWithExpenses,
          }}
        />
      </CardContent>
    </Card>
  );
}
