
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
                                                {selectedTransaction.paymentMethod === 'creditCard' ? 'Cartão de Crédito' :
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

    <div className="card-premium h-full flex flex-col justify-between hover:shadow-lg transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/5 bg-slate-900/50 text-cyan-400">
            <ListChecks className="h-4.5 w-4.5" />
          </div>
          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{title}</h3>
            <p className="text-xs text-slate-500">{description}</p>
          </div>
        </div>
      </div>
      
      <div className="flex-1 pt-2">
        <AnimatePresence>
          {recent.length > 0 ? (
            <motion.div 
              key="transactions"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-2.5"
            >
              {recent.map((t, index) => {
                const isIncome = t.type === 'income';
                return (
                  <motion.div 
                    key={t.id} 
                    onClick={() => handleTransactionClick(t)}
                    className="flex items-center justify-between p-2 rounded-lg border border-transparent hover:border-white/5 hover:bg-slate-800/20 transition-all duration-200 cursor-pointer group/item"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ x: 4 }}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div 
                        className={cn(
                          "flex h-7.5 w-7.5 items-center justify-center rounded-lg shrink-0 border transition-all",
                          isIncome 
                            ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400' 
                            : 'border-rose-500/20 bg-rose-500/5 text-rose-400'
                        )}
                      >
                        {isIncome ? <ArrowUpCircle size={15} /> : <ArrowDownCircle size={15} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-xs text-slate-200 truncate group-hover/item:text-slate-100">{t.description}</p>
                        <p className="text-[10px] text-slate-500 truncate">{t.category} &bull; {format(parseISO(t.date), "dd/MM/yy", { locale: ptBR })}</p>
                      </div>
                    </div>
                    <p 
                      className={cn(
                        "font-bold text-xs ml-2 shrink-0",
                        isIncome ? 'text-emerald-400' : 'text-rose-400'
                      )}
                    >
                      {isIncome ? '+' : '-'} {formatCurrency(t.amount)}
                    </p>
                  </motion.div>
                )
              })}
            </motion.div>
          ) : (
            <div className="relative flex flex-col items-center justify-center h-52 text-center overflow-hidden">
              {/* Fake background watermark list */}
              <div className="absolute inset-0 flex flex-col gap-2 opacity-5 pointer-events-none blur-[0.5px] scale-95 origin-center">
                {[
                  { desc: 'Mercado Mensal', cat: 'Alimentação', amt: -342.90, isInc: false },
                  { desc: 'Salário Principal', cat: 'Trabalho', amt: 4500.00, isInc: true },
                  { desc: 'Mensalidade Netflix', cat: 'Lazer', amt: -55.90, isInc: false },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 border border-slate-700/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-slate-800" />
                      <div className="text-left">
                        <div className="h-3 w-24 bg-slate-700 rounded mb-1" />
                        <div className="h-2 w-16 bg-slate-800 rounded" />
                      </div>
                    </div>
                    <div className="h-3 w-12 bg-slate-700 rounded" />
                  </div>
                ))}
              </div>

              {/* Onboarding text and CTA */}
              <div className="relative z-10 p-4 flex flex-col items-center">
                <div className="h-10 w-10 rounded-full bg-slate-900/80 border border-white/5 flex items-center justify-center mb-3">
                  <Wallet className="h-5 w-5 text-slate-500" />
                </div>
                <p className="font-semibold text-xs text-slate-300 mb-1">Organize a bagunça</p>
                <p className="text-[11px] text-slate-500 mb-4 max-w-[200px]">Adicione seu primeiro lançamento para ver os dados ganharem vida.</p>
                {onAddTransaction && (
                  <Button 
                    size="sm" 
                    onClick={handleAddClick}
                    className="h-8 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold text-xs rounded-lg px-4 shadow-md shadow-blue-500/10 transition-all"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Adicionar lançamento
                  </Button>
                )}
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
        </div>
    );
}
