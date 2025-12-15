
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Loader2, Sparkles, Trophy } from 'lucide-react';
import { useUser, useFirestore } from '@/firebase';
import { collection, doc, writeBatch } from 'firebase/firestore';
import { add, formatISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';
import { ChallengeSelector } from './challenge-selector';

const setupSchema = z.object({
  startDate: z.date({ required_error: 'A data de início é obrigatória.' }),
  initialAmount: z.coerce.number().min(1, 'O valor inicial deve ser pelo menos R$1.'),
});

type SetupFormValues = z.infer<typeof setupSchema>;

interface ChallengeType {
  id: string;
  name: string;
  description: string;
  initialAmount: number;
  totalAmount: number;
  difficulty: 'easy' | 'medium' | 'expert';
  icon: React.ReactNode;
  color: string;
}

export function SetupChallenge() {
  const [isSaving, setIsSaving] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<ChallengeType | null>(null);
  const [showForm, setShowForm] = useState(false);
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<SetupFormValues>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      startDate: new Date(),
      initialAmount: 1,
    },
  });

  const handleChallengeSelect = (challenge: ChallengeType) => {
    setSelectedChallenge(challenge);
    form.setValue('initialAmount', challenge.initialAmount);
    setShowForm(true);
  };

  const onSubmit = async (values: SetupFormValues) => {
    if (!user || !firestore || !selectedChallenge) return;
    
    setIsSaving(true);
    
    try {
      const batch = writeBatch(firestore);
      const challengeRef = doc(collection(firestore, `users/${user.uid}/challenges52weeks`));
      
      // Calcular incremento baseado no tipo de desafio
      const incrementAmount = selectedChallenge.initialAmount;
      
      const challengeData = {
        id: challengeRef.id,
        userId: user.uid,
        startDate: formatISO(values.startDate),
        initialAmount: values.initialAmount,
        incrementAmount: incrementAmount,
        challengeType: selectedChallenge.id,
        totalDeposited: 0,
        status: 'active' as const,
      };
      batch.set(challengeRef, challengeData);

      const depositsColRef = collection(challengeRef, 'deposits');
      for (let i = 0; i < 52; i++) {
        const depositRef = doc(depositsColRef);
        const depositData = {
          id: depositRef.id,
          challengeId: challengeRef.id,
          weekNumber: i + 1,
          expectedAmount: values.initialAmount + (i * incrementAmount),
          dueDate: formatISO(add(values.startDate, { weeks: i })),
          status: 'pending' as const,
        };
        batch.set(depositRef, depositData);
      }

      await batch.commit();
      toast({
        title: `${selectedChallenge.name} Iniciado!`,
        description: `Seu desafio de 52 semanas começou. Boa sorte!`,
      });
    } catch (error) {
      console.error('Error starting challenge:', error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível iniciar o desafio.' });
    } finally {
      setIsSaving(false);
    }
  };

  const { initialAmount } = form.watch();
  const incrementAmount = selectedChallenge?.initialAmount || 1;
  const finalAmount = Array.from({ length: 52 }).reduce((sum: number, _, i) => {
    return sum + ((initialAmount as number) + (i * incrementAmount));
  }, 0);

  if (!showForm) {
    return <ChallengeSelector onChallengeSelect={handleChallengeSelect} />;
  }

  if (!selectedChallenge) {
    return null;
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className={`flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br ${selectedChallenge?.color}`}>
            {selectedChallenge?.icon}
          </div>
          <div>
            <CardTitle>Configurar {selectedChallenge?.name}</CardTitle>
            <CardDescription>
              {selectedChallenge?.description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Início</FormLabel>
                    <FormControl>
                      <DatePicker value={field.value} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="space-y-3">
              <FormField
                control={form.control}
                name="initialAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Inicial (R$)</FormLabel>
                    <FormControl>
                      <CurrencyInput value={field.value} onValueChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-muted-foreground mt-1">
                      A cada semana o valor aumentará R${incrementAmount}. Ex: R${initialAmount}, R${initialAmount + incrementAmount}, R${initialAmount + (incrementAmount * 2)}...
                    </p>
                  </FormItem>
                )}
              />
            </div>
            
            <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4 text-center">
                <p className="text-sm text-muted-foreground mb-2">Resumo do Desafio</p>
                <p className="text-xs text-muted-foreground mb-3">
                  Semana 1: R${initialAmount}, Semana 2: R${initialAmount + incrementAmount}, Semana 3: R${initialAmount + (incrementAmount * 2)}...
                </p>
                <p className="text-sm text-muted-foreground">Ao final do desafio, você terá poupado</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(finalAmount)}</p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setShowForm(false)}
              disabled={isSaving}
            >
              Voltar
            </Button>
            <Button type="submit" className="flex-1" disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Começar o Desafio
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
