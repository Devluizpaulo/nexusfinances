'use client';

import { useUser } from "@/firebase";
import { useDashboardDate } from "@/context/dashboard-date-context";
import { format, addMonths, subMonths, isSameMonth, startOfMonth } from "date-fns";
import { ptBR } from 'date-fns/locale';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import * as LucideIcons from 'lucide-react';
import { QuickActions } from "./quick-actions";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

type DashboardHeaderProps = {
  onAddIncome: () => void;
  onAddExpense: () => void;
  onAddDebt: () => void;
  onAddGoal: () => void;
};


export function DashboardHeader({ onAddIncome, onAddExpense, onAddDebt, onAddGoal }: DashboardHeaderProps) {
    const { user } = useUser();
    const { selectedDate, setSelectedDate } = useDashboardDate();

    const getFirstName = (displayName: string | null | undefined) => {
        if (!displayName) return 'Olá';
        return `Olá, ${displayName.split(' ')[0]}!`;
    }

    const Icon = user?.avatar?.icon ? (LucideIcons as any)[user.avatar.icon] || LucideIcons.User : LucideIcons.User;
    
    const isCurrentMonth = isSameMonth(selectedDate, new Date());
    const canGoNext = !isSameMonth(selectedDate, addMonths(new Date(), 1));
    
    const handlePreviousMonth = () => {
        setSelectedDate(subMonths(selectedDate, 1));
    };
    
    const handleNextMonth = () => {
        if (!canGoNext) return;
        setSelectedDate(addMonths(selectedDate, 1));
    };
    
    const handleToday = () => {
        setSelectedDate(startOfMonth(new Date()));
    };

    // Atalhos de teclado para navegação
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey) return; // Ignorar quando Ctrl/Cmd está pressionado
            
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

    return (
        <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2"
        >
            <div className="flex items-center gap-4">
                 <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                 >
                    <Avatar className="h-12 w-12 ring-2 ring-slate-800/50 transition-all duration-300 hover:ring-primary/50">
                        {user?.photoURL ? (
                            <AvatarImage src={user.photoURL} alt="Avatar do usuário"/>
                        ) : user?.avatar ? (
                            <div className={cn("flex h-full w-full items-center justify-center rounded-full text-white", user.avatar.bgColor)}>
                                <Icon className="h-6 w-6" />
                            </div>
                        ) : (
                            <AvatarFallback>{user?.displayName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
                        )}
                    </Avatar>
                 </motion.div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-100">{getFirstName(user?.displayName)}</h1>
                    <p className="text-sm text-slate-400">Aqui está seu resumo financeiro.</p>
                </div>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-end">
                 <div className="flex items-center gap-1 rounded-full border border-slate-800/60 bg-slate-950/80 p-1 shadow-inner backdrop-blur-sm w-full sm:w-auto justify-center sm:justify-start">
                    <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 rounded-full text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 transition-all duration-200 active:scale-95" 
                        onClick={handlePreviousMonth}
                        title="Mês anterior (←)"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <AnimatePresence mode="wait">
                        <motion.div 
                            key={format(selectedDate, "yyyy-MM")}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            transition={{ duration: 0.2 }}
                            className="min-w-[120px] text-center cursor-pointer group"
                            onClick={handleToday}
                            title="Voltar para o mês atual (T)"
                        >
                            <span className="text-sm font-semibold text-slate-100 capitalize group-hover:text-primary transition-colors">
                                {format(selectedDate, "MMMM", { locale: ptBR })}
                            </span>
                            <div className="text-xs text-slate-500 group-hover:text-slate-400 transition-colors">
                                {format(selectedDate, "yyyy", { locale: ptBR })}
                            </div>
                            {!isCurrentMonth && (
                                <div className="flex items-center justify-center mt-1">
                                    <Calendar className="h-3 w-3 text-slate-600" />
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                    <Button 
                        size="icon" 
                        variant="ghost" 
                        className={cn(
                            "h-8 w-8 rounded-full text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 transition-all duration-200 active:scale-95",
                            !canGoNext && "opacity-50 cursor-not-allowed"
                        )}
                        onClick={handleNextMonth}
                        disabled={!canGoNext}
                        title={canGoNext ? "Próximo mês (→)" : "Você já está no mês mais recente"}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
                 <QuickActions
                    onAddIncome={onAddIncome}
                    onAddExpense={onAddExpense}
                    onAddDebt={onAddDebt}
                    onAddGoal={onAddGoal}
                 />
            </div>
        </motion.div>
    );
}
