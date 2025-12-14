
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

const setupSchema = z.object({
  startDate: z.date({ required_error: 'A data de início é obrigatória.' }),
  initialAmount: z.coerce.number().min(0.01, 'O valor inicial deve ser maior que zero.'),
  incrementAmount: z.coerce.number().min(0.01, 'O valor de incremento deve ser maior que zero.'),
});

type SetupFormValues = z.infer<typeof setupSchema>;

export function SetupChallenge() {
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<SetupFormValues>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      startDate: new Date(),
      initialAmount: 1,
      incrementAmount: 1,
    },
  });

  const onSubmit = async (values: SetupFormValues) => {
    if (!user || !firestore) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Você precisa estar logado.' });
      return;
    }
    setIsSaving(true);
    
    try {
      const batch = writeBatch(firestore);
      const challengeRef = doc(collection(firestore, `users/${user.uid}/challenges52weeks`));
      
      const challengeData = {
        id: challengeRef.id,
        userId: user.uid,
        startDate: formatISO(values.startDate),
        initialAmount: values.initialAmount,
        incrementAmount: values.incrementAmount,
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
          expectedAmount: values.initialAmount + (i * values.incrementAmount),
          dueDate: formatISO(add(values.startDate, { weeks: i })),
          status: 'pending' as const,
        };
        batch.set(depositRef, depositData);
      }

      await batch.commit();
      toast({
        title: 'Desafio Iniciado!',
        description: 'Seu Desafio das 52 Semanas foi criado. Boa sorte!',
      });
    } catch (error) {
      console.error('Error starting challenge:', error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível iniciar o desafio.' });
    } finally {
      setIsSaving(false);
    }
  };

  const { initialAmount, incrementAmount } = form.watch();
  const finalAmount = Array.from({ length: 52 }).reduce((sum, _, i) => {
    return sum + (initialAmount + (i * incrementAmount));
  }, 0);

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Trophy className="h-7 w-7 text-primary" />
          </div>
          <div>
            <CardTitle>Comece seu Desafio das 52 Semanas</CardTitle>
            <CardDescription>
              Defina as regras do seu desafio e comece a poupar hoje mesmo.
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="incrementAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Incremento Semanal (R$)</FormLabel>
                    <FormControl>
                      <CurrencyInput value={field.value} onValueChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
             <div className="rounded-lg border-2 border-dashed bg-muted/30 p-4 text-center">
                <p className="text-sm text-muted-foreground">Ao final do desafio, você terá poupado</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(finalAmount)}</p>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Começar o Desafio
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
