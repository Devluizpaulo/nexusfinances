'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { ArrowUpCircle, ArrowDownCircle, LineChart } from "lucide-react";

interface BalanceCardProps {
    balance: number;
    income: number;
    expenses: number;
}

export function BalanceCard({ balance, income, expenses }: BalanceCardProps) {
    return (
        <Card className="relative overflow-hidden rounded-2xl border border-slate-800/60 bg-gradient-to-br from-orange-500/90 via-rose-500/90 to-purple-600/80 text-slate-50 shadow-xl">
            <div className="pointer-events-none absolute inset-0 opacity-40 mix-blend-screen">
                <div className="absolute -left-24 top-0 h-40 w-40 rounded-full bg-white/15 blur-3xl" />
                <div className="absolute -right-10 bottom-0 h-40 w-40 rounded-full bg-slate-900/40 blur-3xl" />
            </div>

            <CardHeader className="relative z-10 pb-4">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <CardTitle className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
                            Balanço do mês
                        </CardTitle>
                        <CardDescription className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight text-white">
                            {formatCurrency(balance)}
                        </CardDescription>
                        <p className="mt-1 text-xs text-white/70">
                            Resumo entre suas entradas e despesas do período selecionado.
                        </p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 shadow-inner">
                        <LineChart className="h-7 w-7 text-white" />
                    </div>
                </div>
            </CardHeader>

            <CardContent className="relative z-10 grid grid-cols-2 gap-4 pt-2 text-xs sm:text-sm">
                <div className="flex items-center gap-3 rounded-xl bg-black/15 px-3 py-2.5 backdrop-blur-sm">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-300/40">
                        <ArrowUpCircle className="h-5 w-5 text-emerald-100" />
                    </div>
                    <div>
                        <p className="text-[11px] font-medium uppercase tracking-wide text-emerald-100/80">
                            Entradas
                        </p>
                        <p className="text-sm font-semibold text-emerald-50">
                            {formatCurrency(income)}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl bg-black/15 px-3 py-2.5 backdrop-blur-sm">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-500/10 ring-1 ring-red-300/50">
                        <ArrowDownCircle className="h-5 w-5 text-red-50" />
                    </div>
                    <div>
                        <p className="text-[11px] font-medium uppercase tracking-wide text-red-100/80">
                            Despesas
                        </p>
                        <p className="text-sm font-semibold text-red-50">
                            {formatCurrency(expenses)}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
