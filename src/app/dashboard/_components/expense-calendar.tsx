
'use client';

import * as React from 'react';
import { useMemo, useCallback, useState, memo, createContext, useContext } from 'react';
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
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, DollarSign, Tag, CreditCard, FileText, X } from 'lucide-react';

interface ExpenseCalendarProps {
  expenses: Transaction[];
}

interface DayData {
  paid: { total: number; count: number; categories: Record<string, number> };
  pending: { total: number; count: number; categories: Record<string, number> };
}

const ExpenseCalendarContext = createContext<Record<string, DayData> | null>(null);

const DayComponent: React.FC<DayProps> = memo(function DayComponent({ date, displayMonth }: DayProps) {
    const router = useRouter();
    const expensesByDay = useContext(ExpenseCalendarContext);

    const handleDayClick = useCallback((day: Date) => {
        if (!expensesByDay) return;
        const formattedDate = format(day, 'yyyy-MM-dd');
        const dayData = expensesByDay[formattedDate];
        if (dayData && (dayData.paid.count > 0 || dayData.pending.count > 0)) {
            router.push(`/expenses?date=${formattedDate}`);
        }
    }, [expensesByDay, router]);

    if (!expensesByDay) return null;

    const formattedDate = format(date, 'yyyy-MM-dd');
    const dayData = expensesByDay[formattedDate];
    const hasPaid = dayData?.paid.count > 0;
    const hasPending = dayData?.pending.count > 0;
    const hasExpenses = hasPaid || hasPending;
    
    const dayContent = (
      <motion.div
        whileHover={hasExpenses && isSameMonth(date, displayMonth) ? { scale: 1.08 } : {}}
        whileTap={hasExpenses && isSameMonth(date, displayMonth) ? { scale: 0.95 } : {}}
        onClick={() => handleDayClick(date)}
        className={cn(
          'relative flex h-full w-full flex-col items-center justify-center rounded-lg p-2 transition-all duration-200',
          !isSameMonth(date, displayMonth) && 'text-slate-600 opacity-40',
          hasExpenses && isSameMonth(date, displayMonth) && 'cursor-pointer hover:bg-gradient-to-br hover:from-slate-800/60 hover:to-slate-700/40 hover:border hover:border-blue-500/30',
          isToday(date) && 'bg-gradient-to-br from-blue-500/20 to-cyan-500/10 ring-2 ring-blue-500/60 font-bold',
        )}
      >
        {/* Glow effect for days with expenses */}
        {hasExpenses && isSameMonth(date, displayMonth) && (
          <motion.div
            className="absolute -inset-0.5 bg-gradient-to-r from-blue-600/20 via-cyan-500/20 to-blue-600/20 rounded-lg blur-sm -z-10 opacity-0 group-hover:opacity-100"
            animate={{
              opacity: [0, 0.4, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
          />
        )}
        
        <span className={cn(
          "text-sm z-10 font-medium",
          isToday(date) && "text-cyan-300"
        )}>
          {format(date, 'd')}
        </span>
        
        {/* Background indicators */}
        <div className="absolute inset-1 flex gap-0.5 rounded-md overflow-hidden opacity-30">
          {hasPaid && <div className="h-full flex-1 bg-emerald-500" />}
          {hasPending && <div className="h-full flex-1 bg-amber-500" />}
        </div>
        
        {/* Bottom dots with pulse animation */}
        {hasExpenses && (
          <motion.div 
            className="absolute bottom-2 flex gap-1 z-20"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {hasPaid && (
              <motion.div 
                className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-lg shadow-emerald-500/50"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.8, 1, 0.8],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
              />
            )}
            {hasPending && (
              <motion.div 
                className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-lg shadow-amber-500/50"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.8, 1, 0.8],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: 0.3,
                }}
              />
            )}
          </motion.div>
        )}
      </motion.div>
    );

    if (dayData && hasExpenses) {
      return (
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>{dayContent}</TooltipTrigger>
            <TooltipContent className="pointer-events-none w-64 p-4 border border-blue-500/30 bg-gradient-to-br from-slate-950/95 to-slate-900/95 shadow-2xl shadow-blue-500/20 backdrop-blur-xl rounded-xl">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <p className="font-bold text-base bg-gradient-to-r from-blue-200 to-cyan-200 bg-clip-text text-transparent">
                  {format(date, "PPP", { locale: ptBR })}
                </p>
                <div className="mt-3 space-y-3">
                  {hasPaid && (
                    <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
                      <p className="text-xs font-bold text-emerald-300 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-400" />
                        Pago: {formatCurrency(dayData.paid.total)}
                      </p>
                      <ul className="mt-2 space-y-1">
                        {Object.entries(dayData.paid.categories).map(([cat, amount]) => (
                          <li key={cat} className="flex justify-between text-xs text-slate-300 pl-4">
                            <span>{cat}</span>
                            <span className="font-mono font-semibold">{formatCurrency(amount)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {hasPending && (
                    <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/30">
                      <p className="text-xs font-bold text-amber-300 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-amber-400" />
                        Pendente: {formatCurrency(dayData.pending.total)}
                      </p>
                      <ul className="mt-2 space-y-1">
                        {Object.entries(dayData.pending.categories).map(([cat, amount]) => (
                          <li key={cat} className="flex justify-between text-xs text-slate-300 pl-4">
                            <span>{cat}</span>
                            <span className="font-mono font-semibold">{formatCurrency(amount)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </motion.div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return dayContent;
});


export function ExpenseCalendar({ expenses }: ExpenseCalendarProps) {
  const router = useRouter();
  const { selectedDate, setSelectedDate } = useDashboardDate();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedExpense, setSelectedExpense] = useState<Transaction | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const filteredExpenses = useMemo(() => {
    if (selectedCategory === 'all') return expenses;
    return expenses.filter(expense => expense.category === selectedCategory);
  }, [expenses, selectedCategory]);

  const expensesByDay = useMemo(() => {
    return filteredExpenses.reduce((acc, expense) => {
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
  }, [filteredExpenses]);
  
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

  // Get expenses for display (selected day or all month)
  const displayExpenses = useMemo(() => {
    const monthExpenses = expenses.filter(expense => 
      isSameMonth(new Date(expense.date), selectedDate)
    );
    
    if (selectedDay) {
      return monthExpenses.filter(expense => 
        isSameDay(new Date(expense.date), selectedDay)
      ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    
    return monthExpenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, selectedDate, selectedDay]);

  const handleExpenseClick = useCallback((expense: Transaction) => {
    setSelectedExpense(expense);
    setIsDetailOpen(true);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setIsDetailOpen(false);
    setTimeout(() => setSelectedExpense(null), 300);
  }, []);


  return (
    <>
      {/* Expense Detail Sheet */}
      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent className="w-full sm:max-w-lg bg-gradient-to-br from-slate-950/95 to-slate-900/95 border-blue-500/30 backdrop-blur-xl">
          <SheetHeader className="border-b border-blue-500/20 pb-4">
            <SheetTitle className="text-2xl font-bold bg-gradient-to-r from-blue-200 to-cyan-200 bg-clip-text text-transparent">
              Detalhes da Despesa
            </SheetTitle>
            <SheetDescription className="text-slate-400">
              Informações completas da transação
            </SheetDescription>
          </SheetHeader>

          {selectedExpense && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 space-y-6"
            >
              {/* Status Badge */}
              <div className="flex items-center justify-between">
                <Badge 
                  className={cn(
                    "px-4 py-2 text-sm font-semibold",
                    selectedExpense.status === 'paid'
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50"
                      : "bg-amber-500/20 text-amber-300 border-amber-500/50"
                  )}
                >
                  {selectedExpense.status === 'paid' ? '✓ Pago' : '⏳ Pendente'}
                </Badge>
                
                <motion.div 
                  className="text-3xl font-bold bg-gradient-to-r from-rose-400 to-rose-300 bg-clip-text text-transparent"
                  animate={{
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                  }}
                >
                  {formatCurrency(selectedExpense.amount)}
                </motion.div>
              </div>

              {/* Description */}
              <motion.div 
                className="p-4 bg-gradient-to-br from-slate-900/60 to-slate-800/40 rounded-xl border border-blue-500/20"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <FileText className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-400 mb-1">Descrição</p>
                    <p className="text-base font-semibold text-slate-200">{selectedExpense.description}</p>
                  </div>
                </div>
              </motion.div>

              {/* Category */}
              <motion.div 
                className="p-4 bg-gradient-to-br from-slate-900/60 to-slate-800/40 rounded-xl border border-blue-500/20"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-cyan-500/20">
                    <Tag className="h-5 w-5 text-cyan-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-400 mb-1">Categoria</p>
                    <p className="text-base font-semibold text-slate-200">{selectedExpense.category}</p>
                  </div>
                </div>
              </motion.div>

              {/* Date */}
              <motion.div 
                className="p-4 bg-gradient-to-br from-slate-900/60 to-slate-800/40 rounded-xl border border-blue-500/20"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/20">
                    <CalendarIcon className="h-5 w-5 text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-400 mb-1">Data</p>
                    <p className="text-base font-semibold text-slate-200">
                      {format(new Date(selectedExpense.date), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {format(new Date(selectedExpense.date), "HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Payment Method */}
              {selectedExpense.paymentMethod && (
                <motion.div 
                  className="p-4 bg-gradient-to-br from-slate-900/60 to-slate-800/40 rounded-xl border border-blue-500/20"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/20">
                      <CreditCard className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-slate-400 mb-1">Método de Pagamento</p>
                      <p className="text-base font-semibold text-slate-200 capitalize">
                        {selectedExpense.paymentMethod === 'creditCard' ? 'Cartão de Crédito' :
                         selectedExpense.paymentMethod === 'debit_card' ? 'Cartão de Débito' :
                         selectedExpense.paymentMethod === 'pix' ? 'PIX' :
                         selectedExpense.paymentMethod === 'cash' ? 'Dinheiro' :
                         selectedExpense.paymentMethod === 'bank_transfer' ? 'Transferência Bancária' :
                         selectedExpense.paymentMethod}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Additional Info */}
              <motion.div 
                className="p-4 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 rounded-xl border border-blue-500/20"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Tipo</p>
                    <p className="text-sm font-bold text-slate-200">Despesa</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">ID</p>
                    <p className="text-xs font-mono text-slate-400">{selectedExpense.id.slice(0, 8)}...</p>
                  </div>
                </div>
              </motion.div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <motion.button
                  onClick={() => {
                    handleCloseDetail();
                    router.push(`/expenses?id=${selectedExpense.id}`);
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold hover:from-blue-500 hover:to-cyan-400 transition-all shadow-lg shadow-blue-500/20"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Ver Despesa Completa →
                </motion.button>

                <motion.button
                  onClick={handleCloseDetail}
                  className="w-full py-3 px-4 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-300 font-semibold hover:bg-slate-700/50 hover:border-slate-600/50 transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Fechar
                </motion.button>
              </div>
            </motion.div>
          )}
        </SheetContent>
      </Sheet>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendário */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        className="relative group lg:col-span-2"
      >
        {/* Outer glow effect */}
        <motion.div
          className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 via-cyan-500/20 to-blue-600/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-60"
          animate={{
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
          }}
        />

        <Card className="relative h-full rounded-2xl border border-blue-500/30 bg-gradient-to-br from-slate-950/50 to-slate-900/30 backdrop-blur-xl p-5 shadow-lg hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300">
          {/* Shine effect */}
          <motion.div 
            className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 rounded-2xl opacity-0 group-hover:opacity-100 pointer-events-none"
            transition={{ duration: 0.5 }}
          />

          <CardHeader className="p-0 relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <CardTitle className="text-lg font-bold bg-gradient-to-r from-blue-200 to-cyan-200 bg-clip-text text-transparent">
                  Calendário de Despesas
                </CardTitle>
                <CardDescription className="mt-1.5 text-xs text-slate-400">
                  Visualize seus gastos previstos e consolidados.
                </CardDescription>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full sm:w-[180px] h-10 text-xs border-blue-500/30 bg-slate-900/50 hover:bg-slate-800/50 hover:border-cyan-400/50 transition-all">
                    <SelectValue placeholder="Filtrar categoria" />
                  </SelectTrigger>
                  <SelectContent className="border-blue-500/30 bg-slate-950/95 backdrop-blur-xl">
                    <SelectItem value="all" className="hover:bg-blue-500/20">Todas as categorias</SelectItem>
                    {expenseCategories.map(category => (
                      <SelectItem key={category} value={category} className="hover:bg-blue-500/20">
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </motion.div>
            </div>
            
            {/* Summary Cards */}
            <motion.div 
              className="mt-5 p-4 bg-gradient-to-br from-slate-900/60 to-slate-800/40 rounded-xl border border-blue-500/20 space-y-3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm bg-gradient-to-r from-slate-200 to-slate-300 bg-clip-text text-transparent">
                  Total de despesas no mês:
                </span>
                <motion.span 
                  className="font-bold text-lg bg-gradient-to-r from-rose-400 to-rose-300 bg-clip-text text-transparent"
                  animate={{
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                  }}
                >
                  {formatCurrency(monthlySummary.paid + monthlySummary.pending)}
                </motion.span>
              </div>
              
              <div className="flex justify-end gap-5 text-xs">
                <motion.div 
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30"
                  whileHover={{ scale: 1.05 }}
                >
                  <motion.div 
                    className="h-2 w-2 rounded-full bg-emerald-400 shadow-lg shadow-emerald-500/50"
                    animate={{
                      scale: [1, 1.3, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                    }}
                  />
                  <span className="font-semibold text-emerald-300">
                    Pago: {formatCurrency(monthlySummary.paid)}
                  </span>
                </motion.div>
                
                <motion.div 
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30"
                  whileHover={{ scale: 1.05 }}
                >
                  <motion.div 
                    className="h-2 w-2 rounded-full bg-amber-400 shadow-lg shadow-amber-500/50"
                    animate={{
                      scale: [1, 1.3, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: 0.3,
                    }}
                  />
                  <span className="font-semibold text-amber-300">
                    Pendente: {formatCurrency(monthlySummary.pending)}
                  </span>
                </motion.div>
              </div>
            </motion.div>
          </CardHeader>
          
          <CardContent className="p-0 mt-5 relative z-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={format(selectedDate, 'yyyy-MM')}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <ExpenseCalendarContext.Provider value={expensesByDay}>
                  <Calendar
                      month={selectedDate}
                      onMonthChange={setSelectedDate}
                      onDayClick={(day) => setSelectedDay(isSameDay(day, selectedDay || new Date('1900-01-01')) ? null : day)}
                      components={{ Day: DayComponent }}
                      className="w-full"
                      classNames={{
                        months: 'space-y-4',
                        month: 'space-y-4',
                        caption: 'flex justify-center pt-1 relative items-center',
                        caption_label: 'text-base font-bold bg-gradient-to-r from-blue-200 to-cyan-200 bg-clip-text text-transparent',
                        nav: 'space-x-1 flex items-center',
                        nav_button: 'h-8 w-8 bg-slate-900/50 hover:bg-blue-500/20 border border-blue-500/30 hover:border-cyan-400/50 rounded-lg transition-all',
                        nav_button_previous: 'absolute left-1',
                        nav_button_next: 'absolute right-1',
                        table: 'w-full border-separate border-spacing-1',
                        head_row: 'flex w-full',
                        head_cell: 'text-xs text-cyan-300 font-bold w-full flex-1 text-center py-2',
                        row: 'flex w-full mt-1',
                        cell: 'h-16 p-0 flex-1 relative group',
                      }}
                  />
                </ExpenseCalendarContext.Provider>
              </motion.div>
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>

      {/* Lista de Despesas */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="relative group"
      >
        {/* Outer glow effect */}
        <motion.div
          className="absolute -inset-1 bg-gradient-to-r from-rose-600/20 via-amber-500/20 to-rose-600/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-60"
          animate={{
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
          }}
        />

        <Card className="relative h-full rounded-2xl border border-rose-500/30 bg-gradient-to-br from-slate-950/50 to-slate-900/30 backdrop-blur-xl p-5 shadow-lg hover:shadow-2xl hover:shadow-rose-500/10 transition-all duration-300">
          {/* Shine effect */}
          <motion.div 
            className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 rounded-2xl opacity-0 group-hover:opacity-100 pointer-events-none"
            transition={{ duration: 0.5 }}
          />

          <CardHeader className="p-0 relative z-10 mb-4">
            <CardTitle className="text-lg font-bold bg-gradient-to-r from-rose-200 to-amber-200 bg-clip-text text-transparent">
              {selectedDay ? format(selectedDay, "d 'de' MMMM", { locale: ptBR }) : 'Despesas do Mês'}
            </CardTitle>
            <CardDescription className="mt-1.5 text-xs text-slate-400">
              {selectedDay ? 'Transações do dia selecionado' : `${displayExpenses.length} transações no total`}
            </CardDescription>
            {selectedDay && (
              <motion.button
                onClick={() => setSelectedDay(null)}
                className="mt-2 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                ← Voltar para o mês completo
              </motion.button>
            )}
          </CardHeader>

          <CardContent className="p-0 relative z-10 max-h-[600px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            <AnimatePresence mode="wait">
              {displayExpenses.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-12 text-center"
                >
                  <div className="h-16 w-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-4">
                    <span className="text-3xl">📅</span>
                  </div>
                  <p className="text-slate-400 text-sm">Nenhuma despesa encontrada</p>
                </motion.div>
              ) : (
                displayExpenses.map((expense, index) => (
                  <motion.div
                    key={expense.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => handleExpenseClick(expense)}
                    className={cn(
                      "p-3 rounded-lg border backdrop-blur-sm transition-all cursor-pointer",
                      expense.status === 'paid' 
                        ? "bg-emerald-500/5 border-emerald-500/30 hover:border-emerald-400/60" 
                        : "bg-amber-500/5 border-amber-500/30 hover:border-amber-400/60"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <motion.div 
                            className={cn(
                              "h-2 w-2 rounded-full shadow-lg",
                              expense.status === 'paid' 
                                ? "bg-emerald-400 shadow-emerald-500/50" 
                                : "bg-amber-400 shadow-amber-500/50"
                            )}
                            animate={{
                              scale: [1, 1.3, 1],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              delay: index * 0.1,
                            }}
                          />
                          <h4 className="font-semibold text-sm text-slate-200 truncate">
                            {expense.description}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-400 mb-1">{expense.category}</p>
                        <p className="text-xs text-slate-500">
                          {format(new Date(expense.date), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={cn(
                          "font-bold text-sm",
                          expense.status === 'paid' ? "text-emerald-300" : "text-amber-300"
                        )}>
                          {formatCurrency(expense.amount)}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {expense.status === 'paid' ? 'Pago' : 'Pendente'}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </div>
    </>
  );
}
