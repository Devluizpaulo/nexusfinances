
'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { type Transaction } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { ArrowUpCircle, ArrowDownCircle, Wallet, Plus, ListChecks, Calendar as CalendarIcon, DollarSign, Tag, CreditCard, FileText } from "lucide-react";
import { format, parseISO } from 'date-fns';
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useMemo, useState, useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';

interface RecentTransactionsListProps {
    transactions: Transaction[];
    onAddTransaction?: () => void;
    title?: string;
    description?: string;
}

export function RecentTransactionsList({ transactions, onAddTransaction, title = "Últimos Lançamentos", description = "Suas movimentações mais recentes." }: RecentTransactionsListProps) {
    const router = useRouter();
    const recent = useMemo(() => transactions.slice(0, 5), [transactions]);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    const handleAddClick = () => {
        if (onAddTransaction) {
            onAddTransaction();
        } else {
            router.push('/expenses');
        }
    };

    const handleTransactionClick = useCallback((transaction: Transaction) => {
        setSelectedTransaction(transaction);
        setIsDetailOpen(true);
    }, []);

    const handleCloseDetail = useCallback(() => {
        setIsDetailOpen(false);
        setTimeout(() => setSelectedTransaction(null), 300);
    }, []);

    return (
        <div className="space-y-4">
            {/* Transaction Detail Sheet */}
            <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <SheetContent className="w-full sm:max-w-lg bg-gradient-to-br from-slate-950/95 to-slate-900/95 border-blue-500/30 backdrop-blur-xl">
                    <SheetHeader className="border-b border-blue-500/20 pb-4">
                        <SheetTitle className="text-2xl font-bold bg-gradient-to-r from-blue-200 to-cyan-200 bg-clip-text text-transparent">
                            Detalhes da Transação
                        </SheetTitle>
                        <SheetDescription className="text-slate-400">
                            Informações completas da movimentação
                        </SheetDescription>
                    </SheetHeader>

                    {selectedTransaction && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-6 space-y-6"
                        >
                            {/* Status Badge */}
                            <div className="flex items-center justify-between">
                                <Badge 
                                    className={cn(
                                        "px-4 py-2 text-sm font-semibold",
                                        selectedTransaction.type === 'income'
                                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50"
                                            : selectedTransaction.status === 'paid'
                                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50"
                                            : "bg-amber-500/20 text-amber-300 border-amber-500/50"
                                    )}
                                >
                                    {selectedTransaction.type === 'income' ? '📈 Receita' : 
                                     selectedTransaction.status === 'paid' ? '✓ Pago' : '⏳ Pendente'}
                                </Badge>
                                
                                <motion.div 
                                    className={cn(
                                        "text-3xl font-bold bg-gradient-to-r bg-clip-text text-transparent",
                                        selectedTransaction.type === 'income' 
                                            ? "from-emerald-400 to-emerald-300"
                                            : "from-rose-400 to-rose-300"
                                    )}
                                    animate={{
                                        scale: [1, 1.05, 1],
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                    }}
                                >
                                    {selectedTransaction.type === 'income' ? '+' : '-'} {formatCurrency(selectedTransaction.amount)}
                                </motion.div>
                            </div>

                            {/* Description */}
                            <motion.div 
                                className="p-4 bg-gradient-to-br from-slate-900/60 to-slate-800/40 rounded-xl border border-blue-500/20"
                                whileHover={{ scale: 1.02 }}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="p-2 rounded-lg bg-blue-500/20">
                                        <FileText className="h-5 w-5 text-blue-400" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-slate-400 mb-1">Descrição</p>
                                        <p className="text-base font-semibold text-slate-200">{selectedTransaction.description}</p>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Category */}
                            <motion.div 
                                className="p-4 bg-gradient-to-br from-slate-900/60 to-slate-800/40 rounded-xl border border-blue-500/20"
                                whileHover={{ scale: 1.02 }}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="p-2 rounded-lg bg-cyan-500/20">
                                        <Tag className="h-5 w-5 text-cyan-400" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-slate-400 mb-1">Categoria</p>
                                        <p className="text-base font-semibold text-slate-200">{selectedTransaction.category}</p>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Date */}
                            <motion.div 
                                className="p-4 bg-gradient-to-br from-slate-900/60 to-slate-800/40 rounded-xl border border-blue-500/20"
                                whileHover={{ scale: 1.02 }}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="p-2 rounded-lg bg-purple-500/20">
                                        <CalendarIcon className="h-5 w-5 text-purple-400" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-slate-400 mb-1">Data</p>
                                        <p className="text-base font-semibold text-slate-200">
                                            {format(parseISO(selectedTransaction.date), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1">
                                            {format(parseISO(selectedTransaction.date), "HH:mm", { locale: ptBR })}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Payment Method */}
                            {selectedTransaction.paymentMethod && (
                                <motion.div 
                                    className="p-4 bg-gradient-to-br from-slate-900/60 to-slate-800/40 rounded-xl border border-blue-500/20"
                                    whileHover={{ scale: 1.02 }}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 rounded-lg bg-emerald-500/20">
                                            <CreditCard className="h-5 w-5 text-emerald-400" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs text-slate-400 mb-1">Método de Pagamento</p>
                                            <p className="text-base font-semibold text-slate-200 capitalize">
                                                {selectedTransaction.paymentMethod === 'credit_card' ? 'Cartão de Crédito' :
                                                 selectedTransaction.paymentMethod === 'debit_card' ? 'Cartão de Débito' :
                                                 selectedTransaction.paymentMethod === 'pix' ? 'PIX' :
                                                 selectedTransaction.paymentMethod === 'cash' ? 'Dinheiro' :
                                                 selectedTransaction.paymentMethod === 'bank_transfer' ? 'Transferência Bancária' :
                                                 selectedTransaction.paymentMethod}
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Additional Info */}
                            <motion.div 
                                className="p-4 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 rounded-xl border border-blue-500/20"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                            >
                                <div className="grid grid-cols-2 gap-4 text-center">
                                    <div>
                                        <p className="text-xs text-slate-400 mb-1">Tipo</p>
                                        <p className="text-sm font-bold text-slate-200">
                                            {selectedTransaction.type === 'income' ? 'Receita' : 'Despesa'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400 mb-1">ID</p>
                                        <p className="text-xs font-mono text-slate-400">{selectedTransaction.id.slice(0, 8)}...</p>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Action Buttons */}
                            <div className="space-y-3">
                                <motion.button
                                    onClick={() => {
                                        handleCloseDetail();
                                        router.push(`/${selectedTransaction.type === 'income' ? 'income' : 'expenses'}?id=${selectedTransaction.id}`);
                                    }}
                                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold hover:from-blue-500 hover:to-cyan-400 transition-all shadow-lg shadow-blue-500/20"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    Ver Transação Completa →
                                </motion.button>

                                <motion.button
                                    onClick={handleCloseDetail}
                                    className="w-full py-3 px-4 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-300 font-semibold hover:bg-slate-700/50 hover:border-slate-600/50 transition-all"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    Fechar
                                </motion.button>
                            </div>
                        </motion.div>
                    )}
                </SheetContent>
            </Sheet>

            <Card className="h-full rounded-xl">
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <ListChecks className="h-5 w-5 text-primary" />
                    {title}
                </CardTitle>
                <CardDescription className="mt-1 text-xs">{description}</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <AnimatePresence>
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
                                        onClick={() => handleTransactionClick(t)}
                                        className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group/item"
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        whileHover={{ x: 4 }}
                                    >
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <motion.div 
                                                className={cn(
                                                    "flex h-8 w-8 items-center justify-center rounded-lg shrink-0 transition-all",
                                                    isIncome 
                                                        ? 'bg-emerald-100/80 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 group-hover/item:bg-emerald-200/80 dark:group-hover/item:bg-emerald-900/70' 
                                                        : 'bg-red-100/80 dark:bg-red-900/50 text-red-600 dark:text-red-400 group-hover/item:bg-red-200/80 dark:group-hover/item:bg-red-900/70'
                                                )}
                                                whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
                                                transition={{ duration: 0.3 }}
                                            >
                                                {isIncome ? <ArrowUpCircle size={18} /> : <ArrowDownCircle size={18} />}
                                            </motion.div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm truncate">{t.description}</p>
                                                <p className="text-xs text-muted-foreground truncate">{t.category} &bull; {format(parseISO(t.date), "dd/MM/yy", { locale: ptBR })}</p>
                                            </div>
                                        </div>
                                        <motion.p 
                                            className={cn(
                                                "font-semibold text-sm ml-2 shrink-0",
                                                isIncome ? 'text-emerald-400' : 'text-rose-400'
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
                            <p className="font-medium text-slate-300 mb-1">Nenhum lançamento encontrado</p>
                            <p className="text-sm text-slate-500 mb-4">Suas movimentações aparecerão aqui.</p>
                            {onAddTransaction && (
                                <Button 
                                    size="sm" 
                                    onClick={handleAddClick}
                                    className="bg-primary/20 hover:bg-primary/30 border-primary/30 text-primary"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Adicionar transação
                                </Button>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </CardContent>
        </Card>
        </div>
    );
}
