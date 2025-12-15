
'use client';

import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc, writeBatch, increment } from 'firebase/firestore';
import type { Challenge52Weeks, Challenge52WeeksDeposit } from '@/lib/types';
import { format, parseISO, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Check, Loader2, Trophy, AlertCircle, Sparkles, Undo2, Calendar, Clock, DollarSign, Target, TrendingUp, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { SuccessModal } from './success-modal';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
  } from "@/components/ui/alert-dialog"
import { Badge } from '../ui/badge';

interface ChallengeProgressProps {
  challenge: Challenge52Weeks;
}

const successToasts = [
  { title: "Mais um passo!", description: (week: number) => `Depósito da semana ${week} confirmado. Continue assim!` },
  { title: "Incrível!", description: (week: number) => `Você está cada vez mais perto do seu objetivo. Semana ${week} concluída!` },
  { title: "Mandou bem!", description: (week: number) => `Constância é a chave. Depósito da semana ${week} registrado.` },
];


export function ChallengeProgress({ challenge }: ChallengeProgressProps) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCancelConfirmationOpen, setIsCancelConfirmationOpen] = useState(false);
  const [depositToConfirm, setDepositToConfirm] = useState<Challenge52WeeksDeposit | null>(null);
  const [successModal, setSuccessModal] = useState<{ isOpen: boolean; title: string; message: string; week?: number }>({
    isOpen: false,
    title: '',
    message: '',
    week: undefined
  });

  const depositsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, `users/${user.uid}/challenges52weeks/${challenge.id}/deposits`),
      orderBy('weekNumber', 'asc')
    );
  }, [user, firestore, challenge.id]);

  const { data: deposits, isLoading: isDepositsLoading } = useCollection<Challenge52WeeksDeposit>(depositsQuery);

  const processedDeposits = useMemo(() => {
    return (deposits || []).map(d => {
      // Só calcular acumulado se a semana foi depositada
      if (d.status === 'deposited') {
        // Calcular acumulado apenas com semanas anteriores que foram depositadas
        const previousDeposits = (deposits || []).filter(
          prev => prev.weekNumber <= d.weekNumber && prev.status === 'deposited'
        );
        const accumulated = previousDeposits.reduce((sum, deposit) => sum + deposit.expectedAmount, 0);
        return { ...d, accumulatedAmount: accumulated };
      } else {
        // Para semanas não depositadas, não mostrar acumulado
        return { ...d, accumulatedAmount: null };
      }
    });
  }, [deposits]) as (Challenge52WeeksDeposit & { accumulatedAmount: number | null })[];

  const totalExpected = (deposits || []).reduce((sum, d) => sum + d.expectedAmount, 0);
  const progress = totalExpected > 0 ? (challenge.totalDeposited / totalExpected) * 100 : 0;
  
  const allDeposits = processedDeposits;

  const handleConfirmDeposit = async () => {
    if (!user || !firestore || !depositToConfirm) return;
    setIsUpdating(true);
    
    const depositRef = doc(firestore, `users/${user.uid}/challenges52weeks/${challenge.id}/deposits`, depositToConfirm.id);
    const challengeRef = doc(firestore, `users/${user.uid}/challenges52weeks`, challenge.id);

    try {
        const batch = writeBatch(firestore);
        batch.update(depositRef, { status: 'deposited', depositDate: new Date().toISOString() });
        batch.update(challengeRef, { totalDeposited: increment(depositToConfirm.expectedAmount) });
        await batch.commit();
        
        const randomToast = successToasts[Math.floor(Math.random() * successToasts.length)];
        setSuccessModal({
          isOpen: true,
          title: randomToast.title,
          message: randomToast.description(depositToConfirm.weekNumber),
          week: depositToConfirm.weekNumber
        });
        
        // Manter o toast para acessibilidade
        toast({
          title: randomToast.title,
          description: randomToast.description(depositToConfirm.weekNumber),
        });

    } catch (error) {
        console.error("Error saving deposit:", error);
        toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível registrar o depósito.' });
    } finally {
        setIsUpdating(false);
        setDepositToConfirm(null);
    }
  };

  const handleUndoDeposit = async (deposit: Challenge52WeeksDeposit) => {
    if (!user || !firestore || deposit.status !== 'deposited') return;
    setIsUpdating(true);

    const depositRef = doc(firestore, `users/${user.uid}/challenges52weeks/${challenge.id}/deposits`, deposit.id);
    const challengeRef = doc(firestore, `users/${user.uid}/challenges52weeks`, challenge.id);

    try {
      const batch = writeBatch(firestore);
      batch.update(depositRef, { status: 'pending', depositDate: null });
      batch.update(challengeRef, { totalDeposited: increment(-deposit.expectedAmount) });
      await batch.commit();
      
      toast({
        title: 'Depósito desfeito',
        description: `O registro da semana ${deposit.weekNumber} foi revertido.`,
      });

    } catch (error) {
        console.error("Error undoing deposit:", error);
        toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível desfazer o depósito.' });
    } finally {
        setIsUpdating(false);
    }
  };

  const handleCancelChallenge = async () => {
    if (!user || !firestore) return;
    setIsUpdating(true);

    const challengeRef = doc(firestore, `users/${user.uid}/challenges52weeks`, challenge.id);
    try {
        await updateDoc(challengeRef, { status: 'cancelled' });
        toast({
            title: 'Desafio Cancelado',
            description: 'Você pode começar um novo desafio quando quiser.',
            variant: 'destructive',
        });
    } catch (error) {
        toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível cancelar o desafio.' });
    } finally {
        setIsUpdating(false);
        setIsCancelConfirmationOpen(false);
    }
  };

  if (isUserLoading || isDepositsLoading) {
    return (
      <motion.div 
        className="flex justify-center items-center h-64"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="text-center space-y-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Loader2 className="h-8 w-8 mx-auto text-primary" />
          </motion.div>
          <p className="text-muted-foreground text-sm">Carregando seu progresso...</p>
        </div>
      </motion.div>
    );
  }
  
  const renderTable = (depositsData: (Challenge52WeeksDeposit & { accumulatedAmount: number | null; })[]) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="rounded-lg border bg-gradient-to-br from-muted/10 to-muted/20 overflow-hidden">
        <div className="max-h-[70vh] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-background border-b z-10">
              <TableRow className="border-b-2">
                <TableHead className="w-16 text-center font-bold text-foreground">Semana</TableHead>
                <TableHead className="min-w-[100px] font-bold text-foreground">Vencimento</TableHead>
                <TableHead className="min-w-[120px] font-bold text-foreground">Valor</TableHead>
                <TableHead className="min-w-[120px] font-bold text-foreground">Acumulado</TableHead>
                <TableHead className="min-w-[140px] font-bold text-foreground">Data Depósito</TableHead>
                <TableHead className="w-24 text-center font-bold text-foreground">Status</TableHead>
                <TableHead className="w-28 text-right font-bold text-foreground">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {depositsData.map((deposit, index) => {
                  const dueDate = parseISO(deposit.dueDate);
                  const isOverdue = isPast(dueDate) && deposit.status === 'pending';
                  
                  let statusBadge;
                  let statusIcon;
                  let rowClass = '';
                  
                  if (deposit.status === 'deposited') {
                    statusBadge = (
                      <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: index * 0.02 }}
                      >
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Concluído
                        </Badge>
                      </motion.div>
                    );
                    statusIcon = <CheckCircle2 className="h-5 w-5 text-green-400" />;
                    rowClass = 'bg-green-500/10 dark:bg-green-950/30 border-l-4 border-l-green-500';
                  } else if (isOverdue) {
                    statusBadge = (
                      <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: index * 0.02 }}
                      >
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Vencido
                        </Badge>
                      </motion.div>
                    );
                    statusIcon = <XCircle className="h-5 w-5 text-red-400" />;
                    rowClass = 'bg-red-500/10 dark:bg-red-950/30 border-l-4 border-l-red-500';
                  } else {
                    statusBadge = (
                      <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: index * 0.02 }}
                      >
                        <Badge variant="outline" className="gap-1">
                          <Clock className="h-3 w-3" />
                          Pendente
                        </Badge>
                      </motion.div>
                    );
                    statusIcon = <Clock className="h-4 w-4 text-gray-400" />;
                  }

                  return (
                    <motion.tr
                      key={deposit.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.02 }}
                      className={cn(
                        rowClass,
                        'hover:bg-muted/30 transition-all duration-200 border-b border-border/30'
                      )}
                    >
                      <TableCell className="font-medium text-center">
                        <div className="flex items-center justify-center gap-2">
                          {statusIcon}
                          <span className="font-bold text-lg">{deposit.weekNumber}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-foreground/80" />
                          <span className="text-foreground font-medium">{format(dueDate, 'dd/MM/yy')}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-bold">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-blue-500" />
                          <span className="text-blue-400 font-bold text-lg">{formatCurrency(deposit.expectedAmount)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-bold">
                        {deposit.accumulatedAmount !== null ? (
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-green-400" />
                            <span className="text-green-300 font-bold text-lg">{formatCurrency(deposit.accumulatedAmount)}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground/60">—</span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {deposit.depositDate ? (
                          <div className="flex items-center gap-2 text-sm">
                            <Check className="h-4 w-4 text-green-400" />
                            <span className="text-foreground/90 font-medium">{format(parseISO(deposit.depositDate), 'dd/MM/yy HH:mm')}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground/60 flex items-center gap-2">
                            <Clock className="h-3 w-3" />
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">{statusBadge}</TableCell>
                      <TableCell className="text-right">
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="inline-block"
                        >
                          {deposit.status === 'pending' ? (
                            <Button 
                              size="sm" 
                              onClick={() => setDepositToConfirm(deposit)} 
                              disabled={isUpdating}
                              className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                              <Check className="h-4 w-4" />
                              Confirmar
                            </Button>
                          ) : (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleUndoDeposit(deposit)} 
                              disabled={isUpdating}
                              className="gap-1 hover:bg-red-50 hover:border-red-200 hover:text-red-700"
                            >
                              <Undo2 className="h-4 w-4" />
                              Desfazer
                            </Button>
                          )}
                        </motion.div>
                      </TableCell>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </TableBody>
          </Table>
        </div>
      </div>
    </motion.div>
  );

  return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <AlertDialog open={!!depositToConfirm} onOpenChange={() => setDepositToConfirm(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Depósito</AlertDialogTitle>
              <AlertDialogDescription>
                Você confirma o depósito de <strong className="text-foreground">{formatCurrency(depositToConfirm?.expectedAmount || 0)}</strong> para a <strong className="text-foreground">semana {depositToConfirm?.weekNumber}</strong>?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDeposit} disabled={isUpdating}>
                {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={isCancelConfirmationOpen} onOpenChange={setIsCancelConfirmationOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancelar Desafio?</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja cancelar este desafio? Todo o seu progresso será perdido.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Voltar</AlertDialogCancel>
              <AlertDialogAction onClick={handleCancelChallenge} className="bg-destructive hover:bg-destructive/90">
                Sim, cancelar desafio
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
            <motion.div 
              className="flex items-center justify-between"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center gap-3">
                <motion.div 
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Trophy className="h-6 w-6 text-primary" />
                </motion.div>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Seu Progresso no Desafio
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    >
                      <Sparkles className="h-4 w-4 text-yellow-500" />
                    </motion.div>
                  </CardTitle>
                  <CardDescription>
                    Parabéns por continuar! Veja seu progresso até agora.
                  </CardDescription>
                </div>
              </div>
            </motion.div>
            <motion.div 
              className="mt-8 rounded-lg border bg-muted/30 p-4 space-y-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex justify-between items-baseline">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  Total Poupado
                </span>
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  Objetivo Final
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <motion.p 
                  className="text-2xl font-bold text-primary"
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  {formatCurrency(challenge.totalDeposited)}
                </motion.p>
                <p className="font-semibold">{formatCurrency(totalExpected)}</p>
              </div>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ delay: 0.4 }}
              >
                <Progress value={progress} className="h-3" />
              </motion.div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{progress.toFixed(1)}% completado</span>
                <span>{deposits?.filter(d => d.status === 'deposited').length || 0} de {deposits?.length || 0} semanas</span>
              </div>
            </motion.div>
          </CardHeader>
          <CardContent className="p-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Todas as Semanas do Desafio
                </h3>
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    {deposits?.filter(d => d.status === 'deposited').length || 0} concluídas
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-gray-400" />
                    {deposits?.filter(d => d.status === 'pending').length || 0} pendentes
                  </span>
                </div>
              </div>
              
              {/* Tabela Desktop */}
              <div className="hidden lg:block">
                {renderTable(allDeposits)}
              </div>
              
              {/* Cards Mobile */}
              <div className="lg:hidden space-y-3 max-h-[70vh] overflow-y-auto pr-2">
                <AnimatePresence>
                  {allDeposits.map((deposit, index) => {
                    const dueDate = parseISO(deposit.dueDate);
                    const isOverdue = isPast(dueDate) && deposit.status === 'pending';
                    
                    let statusBadge;
                    let statusIcon;
                    let cardClass = '';
                    
                    if (deposit.status === 'deposited') {
                      statusBadge = (
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Concluído
                        </Badge>
                      );
                      statusIcon = <CheckCircle2 className="h-6 w-6 text-green-400" />;
                      cardClass = 'bg-green-500/10 dark:bg-green-950/30 border-green-400/50 border-l-4 border-l-green-500';
                    } else if (isOverdue) {
                      statusBadge = (
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Vencido
                        </Badge>
                      );
                      statusIcon = <XCircle className="h-6 w-6 text-red-400" />;
                      cardClass = 'bg-red-500/10 dark:bg-red-950/30 border-red-400/50 border-l-4 border-l-red-500';
                    } else {
                      statusBadge = (
                        <Badge variant="outline" className="gap-1">
                          <Clock className="h-3 w-3" />
                          Pendente
                        </Badge>
                      );
                      statusIcon = <Clock className="h-5 w-5 text-gray-400" />;
                    }

                    return (
                      <motion.div
                        key={deposit.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.02 }}
                        className={cn(
                          'rounded-lg border p-4 space-y-3',
                          cardClass,
                          'hover:shadow-lg transition-all duration-200 hover:scale-[1.02]'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {statusIcon}
                            <span className="font-bold text-lg">Semana {deposit.weekNumber}</span>
                          </div>
                          {statusBadge}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-muted-foreground/80">
                              <Calendar className="h-3 w-3" />
                              <span className="text-xs font-medium">Vencimento</span>
                            </div>
                            <span className="font-bold text-foreground">{format(dueDate, 'dd/MM/yy')}</span>
                          </div>
                          
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-muted-foreground/80">
                              <DollarSign className="h-3 w-3 text-blue-500" />
                              <span className="text-xs font-medium">Valor</span>
                            </div>
                            <span className="font-bold text-blue-400 text-lg">{formatCurrency(deposit.expectedAmount)}</span>
                          </div>
                          
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-muted-foreground/80">
                              <TrendingUp className="h-3 w-3 text-green-400" />
                              <span className="text-xs font-medium">Acumulado</span>
                            </div>
                            {deposit.accumulatedAmount !== null ? (
                              <span className="font-bold text-green-300 text-lg">{formatCurrency(deposit.accumulatedAmount)}</span>
                            ) : (
                              <span className="text-muted-foreground/60 font-medium">—</span>
                            )}
                          </div>
                          
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-muted-foreground/80">
                              <Check className="h-3 w-3 text-green-400" />
                              <span className="text-xs font-medium">Depósito</span>
                            </div>
                            {deposit.depositDate ? (
                              <span className="text-sm font-medium text-foreground/90">{format(parseISO(deposit.depositDate), 'dd/MM/yy')}</span>
                            ) : (
                              <span className="text-muted-foreground/60 font-medium">—</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex justify-end">
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            {deposit.status === 'pending' ? (
                              <Button 
                                size="sm" 
                                onClick={() => setDepositToConfirm(deposit)} 
                                disabled={isUpdating}
                                className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                              >
                                <Check className="h-4 w-4" />
                                Confirmar
                              </Button>
                            ) : (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => handleUndoDeposit(deposit)} 
                                disabled={isUpdating}
                                className="gap-1 hover:bg-red-50 hover:border-red-200 hover:text-red-700"
                              >
                                <Undo2 className="h-4 w-4" />
                                Desfazer
                              </Button>
                            )}
                          </motion.div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </motion.div>
          </CardContent>
          <CardFooter className="justify-end p-6 bg-muted/30">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={() => setIsCancelConfirmationOpen(true)} 
                disabled={isUpdating}
                className="gap-2"
              >
                <AlertCircle className="h-4 w-4" />
                Cancelar Desafio
              </Button>
            </motion.div>
          </CardFooter>
        </Card>
        
        {/* Success Modal */}
        <SuccessModal
          isOpen={successModal.isOpen}
          onClose={() => setSuccessModal({ isOpen: false, title: '', message: '', week: undefined })}
          title={successModal.title}
          message={successModal.message}
          week={successModal.week}
        />
      </motion.div>
  );
}
