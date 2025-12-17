
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
    const balanceColor = isPositive ? 'text-emerald-400' : 'text-rose-400';
    
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
        >
            <Card className="shadow-lg rounded-xl p-4 sm:p-5 h-full">
                <CardHeader className="p-0">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <CardTitle className="text-sm font-semibold text-slate-400 transition-colors">Resumo do Período</CardTitle>
                             <motion.div
                                key={balance}
                                initial={{ scale: 1.1, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.3 }}
                            >
                                <CardDescription className={cn("mt-1 text-2xl font-bold tracking-tight", balanceColor)}>
                                    {formatCurrency(balance)}
                                </CardDescription>
                            </motion.div>
                        </div>
                         <motion.div 
                            className="flex h-10 w-10 items-center justify-center rounded-lg bg-card text-primary"
                            whileHover={{ rotate: [0, -5, 5, -5, 0] }}
                            transition={{ duration: 0.5 }}
                        >
                            <Scale className="h-6 w-6" />
                        </motion.div>
                    </div>
                </CardHeader>

                <CardContent className="space-y-2 mt-4 p-0">
                     <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Entradas</span>
                        <span className="font-semibold text-emerald-400">{formatCurrency(income)}</span>
                    </div>
                     <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Saídas</span>
                        <span className="font-semibold text-rose-400">{formatCurrency(expenses)}</span>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
