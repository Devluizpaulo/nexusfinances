
'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc, writeBatch, increment } from 'firebase/firestore';
import type { Challenge52Weeks, Challenge52WeeksDeposit } from '@/lib/types';
import { format, parseISO, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Check, Loader2, Trophy, AlertCircle, Sparkles } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
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

  const depositsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, `users/${user.uid}/challenges52weeks/${challenge.id}/deposits`),
      orderBy('weekNumber', 'asc')
    );
  }, [user, firestore, challenge.id]);

  const { data: deposits, isLoading: isDepositsLoading } = useCollection<Challenge52WeeksDeposit>(depositsQuery);

  const totalExpected = (deposits || []).reduce((sum, d) => sum + d.expectedAmount, 0);
  const progress = totalExpected > 0 ? (challenge.totalDeposited / totalExpected) * 100 : 0;

  const handleDeposit = async (deposit: Challenge52WeeksDeposit) => {
    if (!user || !firestore || deposit.status === 'deposited') return;
    setIsUpdating(true);
    
    const depositRef = doc(firestore, `users/${user.uid}/challenges52weeks/${challenge.id}/deposits`, deposit.id);
    const challengeRef = doc(firestore, `users/${user.uid}/challenges52weeks`, challenge.id);

    try {
        const batch = writeBatch(firestore);
        batch.update(depositRef, { status: 'deposited', depositDate: new Date().toISOString() });
        batch.update(challengeRef, { totalDeposited: increment(deposit.expectedAmount) });
        await batch.commit();
        
        const randomToast = successToasts[Math.floor(Math.random() * successToasts.length)];
        toast({
            title: randomToast.title,
            description: randomToast.description(deposit.weekNumber),
        });

    } catch (error) {
        console.error("Error saving deposit:", error);
        toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível registrar o depósito.' });
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
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
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

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Trophy className="h-7 w-7 text-primary" />
            </div>
            <div>
              <CardTitle>Seu Progresso no Desafio</CardTitle>
              <CardDescription>
                Parabéns por continuar! Veja seu progresso até agora.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
            <div className="flex justify-between items-baseline">
              <span className="text-sm text-muted-foreground">Total Poupado</span>
              <span className="text-sm text-muted-foreground">Objetivo Final</span>
            </div>
            <div className="flex justify-between items-baseline">
              <p className="text-2xl font-bold text-primary">{formatCurrency(challenge.totalDeposited)}</p>
              <p className="font-semibold">{formatCurrency(totalExpected)}</p>
            </div>
            <Progress value={progress} className="h-3" />
          </div>
          <div className="max-h-80 overflow-y-auto pr-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Semana</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(deposits || []).map(deposit => {
                  const dueDate = parseISO(deposit.dueDate);
                  const isOverdue = isPast(dueDate) && deposit.status === 'pending';
                  return (
                    <TableRow key={deposit.id} className={cn(
                        deposit.status === 'deposited' && 'bg-green-500/10 hover:bg-green-500/15',
                        isOverdue && 'bg-yellow-500/10 hover:bg-yellow-500/15'
                    )}>
                      <TableCell className="font-medium">{deposit.weekNumber}</TableCell>
                      <TableCell>{format(dueDate, 'dd/MM/yyyy')}</TableCell>
                      <TableCell>{formatCurrency(deposit.expectedAmount)}</TableCell>
                      <TableCell className="text-right">
                        {deposit.status === 'pending' ? (
                          <Button size="sm" onClick={() => handleDeposit(deposit)} disabled={isUpdating}>
                            <Check className="h-4 w-4 mr-1" />
                            Depositar
                          </Button>
                        ) : (
                          <span className="text-xs text-green-600 font-semibold flex items-center justify-end gap-1">
                            <Check className="h-4 w-4" /> Depositado
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter>
            <Button variant="destructive" onClick={() => setIsCancelConfirmationOpen(true)} disabled={isUpdating}>
                Cancelar Desafio
            </Button>
        </CardFooter>
      </Card>
    </>
  );
}
