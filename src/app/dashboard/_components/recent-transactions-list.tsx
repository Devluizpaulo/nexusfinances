'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { type Transaction } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { ArrowUpCircle, ArrowDownCircle, Wallet } from "lucide-react";
import { format, parseISO } from 'date-fns';
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface RecentTransactionsListProps {
    transactions: Transaction[];
}

export function RecentTransactionsList({ transactions }: RecentTransactionsListProps) {
    
    const recent = transactions.slice(0, 5);

    return (
        <Card className="h-full rounded-2xl border border-slate-900/60 bg-slate-950/70 p-4 sm:p-5 shadow-[0_18px_45px_-30px_rgba(15,23,42,1)]">
            <CardHeader className="p-0">
                <CardTitle className="text-base text-slate-200">Últimos Lançamentos</CardTitle>
                <CardDescription className="mt-1 text-xs">Suas movimentações mais recentes.</CardDescription>
            </CardHeader>
            <CardContent className="p-0 mt-4">
                {recent.length > 0 ? (
                    <div className="space-y-4">
                        {recent.map(t => {
                            const isIncome = t.type === 'income';
                            return (
                                <div key={t.id} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "flex h-10 w-10 items-center justify-center rounded-lg",
                                            isIncome ? 'bg-emerald-100 dark:bg-emerald-900/50 text-success' : 'bg-red-100 dark:bg-red-900/50 text-destructive'
                                        )}>
                                            {isIncome ? <ArrowUpCircle size={22} /> : <ArrowDownCircle size={22} />}
                                        </div>
                                        <div>
                                            <p className="font-medium">{t.description}</p>
                                            <p className="text-sm text-muted-foreground">{t.category} &bull; {format(parseISO(t.date), "dd 'de' MMM", { locale: ptBR })}</p>
                                        </div>
                                    </div>
                                    <p className={cn(
                                        "font-semibold text-base",
                                        isIncome ? 'text-success' : 'text-foreground'
                                    )}>
                                        {isIncome ? '+' : '-'} {formatCurrency(t.amount)}
                                    </p>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground">
                        <Wallet className="h-10 w-10 mb-2" />
                        <p className="font-medium">Nenhuma transação ainda</p>
                        <p className="text-sm">Suas últimas movimentações aparecerão aqui.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
