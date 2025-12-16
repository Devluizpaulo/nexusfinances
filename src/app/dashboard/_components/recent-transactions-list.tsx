'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { type Transaction } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { ArrowUpCircle, ArrowDownCircle, Wallet, Plus } from "lucide-react";
import { format, parseISO } from 'date-fns';
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface RecentTransactionsListProps {
    transactions: Transaction[];
    onAddTransaction?: () => void;
}

export function RecentTransactionsList({ transactions, onAddTransaction }: RecentTransactionsListProps) {
    const router = useRouter();
    const recent = transactions.slice(0, 5);

    const handleAddClick = () => {
        if (onAddTransaction) {
            onAddTransaction();
        } else {
            router.push('/expenses');
        }
    };

    return (
        <Card className="h-full rounded-2xl border border-slate-900/60 bg-slate-950/70 p-4 sm:p-5 shadow-[0_18px_45px_-30px_rgba(15,23,42,1)] hover:shadow-xl transition-all duration-300 hover:border-slate-800/60 group">
            <CardHeader className="p-0">
                <CardTitle className="text-base text-slate-200 group-hover:text-slate-100 transition-colors">Últimos Lançamentos</CardTitle>
                <CardDescription className="mt-1 text-xs">Suas movimentações mais recentes.</CardDescription>
            </CardHeader>
            <CardContent className="p-0 mt-4">
                <AnimatePresence mode="wait">
                    {recent.length > 0 ? (
                        <motion.div 
                            key="transactions"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-3"
                        >
                            {recent.map((t, index) => {
                                const isIncome = t.type === 'income';
                                return (
                                    <motion.div 
                                        key={t.id} 
                                        className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-900/50 transition-colors cursor-default group/item"
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        whileHover={{ x: 4 }}
                                    >
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <motion.div 
                                                className={cn(
                                                    "flex h-10 w-10 items-center justify-center rounded-lg shrink-0 transition-all",
                                                    isIncome 
                                                        ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 group-hover/item:bg-emerald-200 dark:group-hover/item:bg-emerald-900/70' 
                                                        : 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 group-hover/item:bg-red-200 dark:group-hover/item:bg-red-900/70'
                                                )}
                                                whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
                                                transition={{ duration: 0.3 }}
                                            >
                                                {isIncome ? <ArrowUpCircle size={20} /> : <ArrowDownCircle size={20} />}
                                            </motion.div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm truncate">{t.description}</p>
                                                <p className="text-xs text-muted-foreground truncate">{t.category} &bull; {format(parseISO(t.date), "dd 'de' MMM", { locale: ptBR })}</p>
                                            </div>
                                        </div>
                                        <motion.p 
                                            className={cn(
                                                "font-semibold text-sm ml-2 shrink-0",
                                                isIncome ? 'text-emerald-400' : 'text-red-400'
                                            )}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: index * 0.05 + 0.1 }}
                                        >
                                            {isIncome ? '+' : '-'} {formatCurrency(t.amount)}
                                        </motion.p>
                                    </motion.div>
                                )
                            })}
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="empty"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="flex flex-col items-center justify-center h-48 text-center"
                        >
                            <motion.div
                                animate={{ 
                                    y: [0, -5, 0],
                                }}
                                transition={{ 
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                            >
                                <Wallet className="h-12 w-12 mb-3 text-slate-600" />
                            </motion.div>
                            <p className="font-medium text-slate-300 mb-1">Nenhuma transação ainda</p>
                            <p className="text-sm text-slate-500 mb-4">Suas últimas movimentações aparecerão aqui.</p>
                            {onAddTransaction && (
                                <Button 
                                    size="sm" 
                                    onClick={handleAddClick}
                                    className="bg-primary/20 hover:bg-primary/30 border-primary/30 text-primary"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Adicionar primeira transação
                                </Button>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </CardContent>
        </Card>
    );
}
