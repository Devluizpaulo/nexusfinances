'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { ArrowUpCircle, ArrowDownCircle, LineChart, Scale } from "lucide-react";

interface BalanceCardProps {
    balance: number;
    income: number;
    expenses: number;
}

export function BalanceCard({ balance, income, expenses }: BalanceCardProps) {
    return (
        <Card className="shadow-lg">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle className="text-base font-semibold text-muted-foreground">Balanço do mês</CardTitle>
                        <CardDescription className="mt-1 text-3xl font-bold tracking-tight text-foreground">
                            {formatCurrency(balance)}
                        </CardDescription>
                    </div>
                     <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Scale className="h-6 w-6" />
                    </div>
                </div>
            </CardHeader>

            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/15">
                        <ArrowUpCircle className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Entradas
                        </p>
                        <p className="text-sm font-semibold text-foreground">
                            {formatCurrency(income)}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
                     <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/10">
                        <ArrowDownCircle className="h-5 w-5 text-red-400" />
                    </div>
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Despesas
                        </p>
                        <p className="text-sm font-semibold text-foreground">
                            {formatCurrency(expenses)}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}