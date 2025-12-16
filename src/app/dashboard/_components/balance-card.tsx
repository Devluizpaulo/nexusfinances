'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { ArrowUpCircle, ArrowDownCircle, Scale } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface BalanceCardProps {
    balance: number;
    income: number;
    expenses: number;
}

export function BalanceCard({ balance, income, expenses }: BalanceCardProps) {
    const isPositive = balance >= 0;
    const balanceColor = isPositive ? 'text-emerald-400' : 'text-red-400';
    
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            <Card className="shadow-lg rounded-2xl border border-slate-900/60 bg-slate-950/70 p-4 sm:p-5 shadow-[0_18px_45px_-30px_rgba(15,23,42,1)] hover:shadow-xl transition-all duration-300 hover:border-slate-800/60 group">
                <CardHeader className="p-0">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <CardTitle className="text-base font-semibold text-slate-400 group-hover:text-slate-300 transition-colors">Balanço do mês</CardTitle>
                            <motion.div
                                key={balance}
                                initial={{ scale: 1.1, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.3 }}
                            >
                                <CardDescription className={cn("mt-1 text-3xl font-bold tracking-tight", balanceColor)}>
                                    {formatCurrency(balance)}
                                </CardDescription>
                            </motion.div>
                        </div>
                        <motion.div 
                            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors"
                            whileHover={{ rotate: [0, -5, 5, -5, 0] }}
                            transition={{ duration: 0.5 }}
                        >
                            <Scale className="h-6 w-6" />
                        </motion.div>
                    </div>
                </CardHeader>

                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <motion.div 
                        className="flex items-center gap-3 rounded-xl bg-slate-900/50 p-3 border border-slate-800/60 hover:bg-slate-900/70 hover:border-emerald-500/30 transition-all duration-200 cursor-default"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <motion.div 
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/15"
                            whileHover={{ scale: 1.1 }}
                        >
                            <ArrowUpCircle className="h-5 w-5 text-emerald-400" />
                        </motion.div>
                        <div className="flex-1">
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                Entradas
                            </p>
                            <motion.p 
                                className="text-sm font-semibold text-slate-100"
                                key={income}
                                initial={{ opacity: 0.5 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.2 }}
                            >
                                {formatCurrency(income)}
                            </motion.p>
                        </div>
                    </motion.div>

                    <motion.div 
                        className="flex items-center gap-3 rounded-xl bg-slate-900/50 p-3 border border-slate-800/60 hover:bg-slate-900/70 hover:border-red-500/30 transition-all duration-200 cursor-default"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <motion.div 
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/10"
                            whileHover={{ scale: 1.1 }}
                        >
                            <ArrowDownCircle className="h-5 w-5 text-red-400" />
                        </motion.div>
                        <div className="flex-1">
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                Despesas
                            </p>
                            <motion.p 
                                className="text-sm font-semibold text-slate-100"
                                key={expenses}
                                initial={{ opacity: 0.5 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.2 }}
                            >
                                {formatCurrency(expenses)}
                            </motion.p>
                        </div>
                    </motion.div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
