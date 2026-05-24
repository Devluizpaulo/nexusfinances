'use client';

import { useEffect } from 'react';
import { format, addMonths, subMonths, isSameMonth, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as LucideIcons from 'lucide-react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useUser } from '@/firebase';
import { useDashboardDate } from '@/context/dashboard-date-context';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { QuickActions } from './quick-actions';

type DashboardHeaderProps = {
  onAddIncome: () => void;
  onAddExpense: () => void;
  onAddDebt: () => void;
  onAddGoal: () => void;
  subtitle?: React.ReactNode;
};

export function DashboardHeader({ onAddIncome, onAddExpense, onAddDebt, onAddGoal, subtitle }: DashboardHeaderProps) {
  const { user } = useUser();
  const { selectedDate, setSelectedDate } = useDashboardDate();

  const firstName = user?.displayName?.split(' ')[0];
  const Icon = user?.avatar?.icon ? (LucideIcons as any)[user.avatar.icon] || LucideIcons.User : LucideIcons.User;
  const isCurrentMonth = isSameMonth(selectedDate, new Date());
  const canGoNext = !isSameMonth(selectedDate, addMonths(new Date(), 1));

  const handlePreviousMonth = () => setSelectedDate(subMonths(selectedDate, 1));
  const handleNextMonth = () => {
    if (canGoNext) setSelectedDate(addMonths(selectedDate, 1));
  };
  const handleToday = () => setSelectedDate(startOfMonth(new Date()));

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePreviousMonth();
      } else if (e.key === 'ArrowRight' && canGoNext) {
        e.preventDefault();
        handleNextMonth();
      } else if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        handleToday();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedDate, canGoNext]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) {
      return { text: firstName ? `Bom dia, ${firstName}!` : 'Bom dia!', icon: '🌅' };
    } else if (hour >= 12 && hour < 18) {
      return { text: firstName ? `Boa tarde, ${firstName}!` : 'Boa tarde!', icon: '☀️' };
    } else {
      return { text: firstName ? `Boa noite, ${firstName}!` : 'Boa noite!', icon: '🌙' };
    }
  };
  const greeting = getGreeting();

  return (
    <div className="flex flex-col gap-4 pb-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <Avatar className="h-12 w-12 border border-slate-800/80 ring-2 ring-slate-900/50">
          {user?.photoURL ? (
            <AvatarImage src={user.photoURL} alt="Avatar do usuário" />
          ) : user?.avatar ? (
            <div className={cn('flex h-full w-full items-center justify-center rounded-full text-white', user.avatar.bgColor)}>
              <Icon className="h-6 w-6" />
            </div>
          ) : (
            <AvatarFallback className="bg-primary text-primary-foreground">
              {user?.displayName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
            </AvatarFallback>
          )}
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold tracking-normal text-slate-100 md:text-3xl flex items-center gap-2">
            <span>{greeting.text}</span>
            <span className="text-xl sm:text-2xl animate-pulse">{greeting.icon}</span>
          </h1>
          <div className="mt-1 text-sm text-slate-400">{subtitle || 'Resumo financeiro do período selecionado'}</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-end">
        <div className="flex w-full items-center justify-center gap-1 rounded-lg border border-white/5 bg-slate-900/40 p-1 backdrop-blur-md sm:w-auto sm:justify-start">
          <Button
            size="icon"
            variant="ghost"
            className="h-9 w-9 rounded-lg text-slate-300 transition-all duration-200 hover:bg-slate-800/40 hover:text-slate-100"
            onClick={handlePreviousMonth}
            title="Mês anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <button
            type="button"
            className="min-w-[130px] rounded-md px-2 py-1 text-center transition-colors hover:bg-slate-800/20"
            onClick={handleToday}
            title="Voltar para o mês atual"
          >
            <span className="block text-sm font-bold capitalize text-slate-200">
              {format(selectedDate, 'MMMM', { locale: ptBR })}
            </span>
            <span className="block text-xs text-slate-400">{format(selectedDate, 'yyyy', { locale: ptBR })}</span>
            {!isCurrentMonth && <Calendar className="mx-auto mt-1 h-3.5 w-3.5 text-cyan-400" />}
          </button>
          <Button
            size="icon"
            variant="ghost"
            className={cn(
              'h-9 w-9 rounded-lg text-slate-300 transition-all duration-200 hover:bg-slate-800/40 hover:text-slate-100',
              !canGoNext && 'cursor-not-allowed opacity-50',
            )}
            onClick={handleNextMonth}
            disabled={!canGoNext}
            title={canGoNext ? 'Próximo mês' : 'Você já está no mês mais recente'}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <QuickActions onAddIncome={onAddIncome} onAddExpense={onAddExpense} onAddDebt={onAddDebt} onAddGoal={onAddGoal} />
      </div>
    </div>
  );
}
