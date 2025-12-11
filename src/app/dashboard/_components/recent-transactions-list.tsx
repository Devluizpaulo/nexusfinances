'use client';

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { type Transaction } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { ArrowUpCircle, ArrowDownCircle, Wallet } from "lucide-react";
import { format, parseISO } from 'date-fns';
import { ptBR } from "date-fns/locale";

interface RecentTransactionsListProps {
    transactions: Transaction[];
}

export function RecentTransactionsList({ transactions }: RecentTransactionsListProps) {
    
    const recent = transactions.slice(0, 5);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Últimos Lançamentos</CardTitle>
            </CardHeader>
            <CardContent>
                {recent.length > 0 ? (
                    <div className="space-y-4">
                        {recent.map(t => (
                            <div key={t.id} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-muted ${t.type === 'income' ? 'text-success' : 'text-destructive'}`}>
                                        {t.type === 'income' ? <ArrowUpCircle size={22} /> : <ArrowDownCircle size={22} />}
                                    </div>
                                    <div>
                                        <p className="font-medium">{t.description}</p>
                                        <p className="text-sm text-muted-foreground">{t.category} &bull; {format(parseISO(t.date), "dd 'de' MMM", { locale: ptBR })}</p>
                                    </div>
                                </div>
                                <p className={`font-semibold text-base ${t.type === 'income' ? 'text-success' : 'text-foreground'}`}>
                                    {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
                                </p>
                            </div>
                        ))}
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
