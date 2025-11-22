'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Separator } from '@/components/ui/separator';

const schema = z.object({
  amount: z.coerce.number().positive('O valor deve ser positivo'),
  interestRate: z.coerce.number().positive('A taxa de juros deve ser positiva'),
  months: z.coerce.number().int().positive('O número de meses deve ser positivo'),
});

type FormValues = z.infer<typeof schema>;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export function InterestCalculator() {
  const [result, setResult] = useState<{ totalPaid: number; totalInterest: number } | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: 1000,
      interestRate: 14,
      months: 12,
    },
  });

  const onSubmit = (data: FormValues) => {
    // Simple interest calculation for this example
    const monthlyRate = data.interestRate / 100;
    const monthlyPayment = (data.amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -data.months));
    const totalPaid = monthlyPayment * data.months;
    const totalInterest = totalPaid - data.amount;

    setResult({ totalPaid, totalInterest });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calculadora de Juros Compostos</CardTitle>
        <CardDescription>
          Entenda o custo real de um empréstimo ou do rotativo do cartão de crédito.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor da Dívida (R$)</FormLabel>
                  <FormControl>
                    <CurrencyInput value={field.value} onValueChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="interestRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Taxa de Juros Mensal (%)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="months"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Período (meses)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex-col items-stretch gap-4">
            <Button type="submit">Calcular</Button>
            {result && (
              <div className="rounded-lg border bg-muted p-4 space-y-2 text-sm">
                <p className="font-semibold">Resultado da Simulação:</p>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valor total pago:</span>
                  <span className="font-bold text-destructive">{formatCurrency(result.totalPaid)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total de juros:</span>
                  <span className="font-bold">{formatCurrency(result.totalInterest)}</span>
                </div>
              </div>
            )}
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
