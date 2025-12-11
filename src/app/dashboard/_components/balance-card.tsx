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
                    <ArrowUpCircle className="h-5 w-5 text-success" />
                    <div>
                        <p className="text-muted-foreground">Renda</p>
                        <p className="font-semibold">{formatCurrency(income)}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                     <ArrowDownCircle className="h-5 w-5 text-destructive" />
                    <div>
                        <p className="text-muted-foreground">Despesas</p>
                        <p className="font-semibold">{formatCurrency(expenses)}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
