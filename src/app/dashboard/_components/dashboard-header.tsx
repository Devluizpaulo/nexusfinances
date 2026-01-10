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
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 relative"
        >
            {/* Glow background effect */}
            <motion.div
              className="absolute -inset-4 bg-gradient-to-r from-blue-600/10 via-cyan-500/10 to-blue-600/10 rounded-2xl blur-3xl -z-10 opacity-0"
              animate={{
                opacity: [0, 0.4, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
              }}
            />

            <div className="flex items-center gap-4">
                 <motion.div
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative group"
                 >
                    {/* Avatar glow */}
                    <motion.div
                      className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full blur-md opacity-0 group-hover:opacity-70"
                      animate={{
                        scale: [1, 1.1, 1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                      }}
                    />
                    <Avatar className="relative h-14 w-14 ring-2 ring-blue-500/40 shadow-lg transition-all duration-300 hover:ring-cyan-400/70 border border-blue-500/30">
                        {user?.photoURL ? (
                            <AvatarImage src={user.photoURL} alt="Avatar do usuário"/>
                        ) : user?.avatar ? (
                            <div className={cn("flex h-full w-full items-center justify-center rounded-full text-white backdrop-blur-sm", user.avatar.bgColor)}>
                                <Icon className="h-6 w-6" />
                            </div>
                        ) : (
                            <AvatarFallback className="bg-gradient-to-br from-blue-600 to-cyan-600">{user?.displayName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
                        )}
                    </Avatar>
                 </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-200 via-cyan-200 to-blue-300 bg-clip-text text-transparent">{getFirstName(user?.displayName)}</h1>
                    <p className="text-sm text-slate-400 mt-1">Seu resumo financeiro em tempo real</p>
                </motion.div>
            </div>
            
            <div className="flex items-center gap-3 flex-wrap justify-center sm:justify-end">
                 {/* Date Navigation with Glassmorphism */}
                 <motion.div 
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: 0.15 }}
                   className="flex items-center gap-1 rounded-xl border border-blue-500/30 bg-gradient-to-r from-slate-900/40 to-slate-800/40 p-1 shadow-lg backdrop-blur-xl w-full sm:w-auto justify-center sm:justify-start hover:border-cyan-400/50 transition-colors"
                 >
                    <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-9 w-9 rounded-lg text-slate-300 hover:text-slate-100 hover:bg-blue-500/20 transition-all duration-200 active:scale-95" 
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
                            className="min-w-[130px] text-center cursor-pointer group px-2"
                            onClick={handleToday}
                            title="Voltar para o mês atual (T)"
                        >
                            <span className="text-sm font-bold bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent capitalize group-hover:from-blue-200 group-hover:to-cyan-200 transition-colors">
                                {format(selectedDate, "MMMM", { locale: ptBR })}
                            </span>
                            <div className="text-xs text-slate-400 group-hover:text-slate-200 transition-colors mt-0.5">
                                {format(selectedDate, "yyyy", { locale: ptBR })}
                            </div>
                            {!isCurrentMonth && (
                                <motion.div 
                                  className="flex items-center justify-center mt-1.5"
                                  animate={{ scale: [1, 1.2, 1] }}
                                  transition={{ duration: 2, repeat: Infinity }}
                                >
                                    <Calendar className="h-3.5 w-3.5 text-cyan-400" />
                                </motion.div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                    <Button 
                        size="icon" 
                        variant="ghost" 
                        className={cn(
                            "h-9 w-9 rounded-lg text-slate-300 hover:text-slate-100 hover:bg-blue-500/20 transition-all duration-200 active:scale-95",
                            !canGoNext && "opacity-50 cursor-not-allowed"
                        )}
                        onClick={handleNextMonth}
                        disabled={!canGoNext}
                        title={canGoNext ? "Próximo mês (→)" : "Você já está no mês mais recente"}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </motion.div>
                 <motion.div
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: 0.2 }}
                 >
                   <QuickActions
                      onAddIncome={onAddIncome}
                      onAddExpense={onAddExpense}
                      onAddDebt={onAddDebt}
                      onAddGoal={onAddGoal}
                   />
                 </motion.div>
            </div>
        </motion.div>
    );
}
