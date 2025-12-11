'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { ArrowUpCircle, ArrowDownCircle } from "lucide-react";

interface BalanceCardProps {
    balance: number;
    income: number;
    expenses: number;
}

export function BalanceCard({ balance, income, expenses }: BalanceCardProps) {
    return (
        <Card className="shadow-sm">
            <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Balanço do Mês</CardTitle>
                <CardDescription className="text-3xl font-bold tracking-tight">
                    {formatCurrency(balance)}
                </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
                        <ArrowUpCircle className="h-6 w-6 text-success" />
                    </div>
                    <div>
                        <p className="text-muted-foreground">Renda</p>
                        <p className="font-semibold text-success">{formatCurrency(income)}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                     <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/50">
                        <ArrowDownCircle className="h-6 w-6 text-destructive" />
                    </div>
                    <div>
                        <p className="text-muted-foreground">Despesas</p>
                        <p className="font-semibold text-destructive">{formatCurrency(expenses)}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
