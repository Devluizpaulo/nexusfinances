'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Separator } from '@/components/ui/separator';

const schema = z.object({
  totalAmount: z.coerce.number().positive('O valor deve ser positivo'),
  monthlyPayment: z.coerce.number().positive('A parcela deve ser positiva'),
  interestRate: z.coerce.number().min(0, 'A taxa de juros não pode ser negativa'),
  extraPayment: z.coerce.number().min(0, 'O valor extra não pode ser negativo').default(0),
});

type FormValues = z.infer<typeof schema>;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export function PayoffSimulator() {
  const [result, setResult] = useState<{
    originalMonths: number;
    newMonths: number;
    interestSaved: number;
    timeSaved: number;
  } | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      totalAmount: 10000,
      monthlyPayment: 500,
      interestRate: 2,
      extraPayment: 100,
    },
  });

  const calculateMonths = (principal: number, payment: number, rate: number) => {
    if (payment <= principal * rate) return Infinity; // Will never be paid off
    return Math.log(payment / (payment - principal * rate)) / Math.log(1 + rate);
  };
  
  const calculateTotalInterest = (principal: number, payment: number, rate: number) => {
    const months = calculateMonths(principal, payment, rate);
    if (months === Infinity) return Infinity;
    return (payment * months) - principal;
  }

  const onSubmit = (data: FormValues) => {
    const monthlyRate = data.interestRate / 100;
    const originalMonths = calculateMonths(data.totalAmount, data.monthlyPayment, monthlyRate);
    const newMonths = calculateMonths(data.totalAmount, data.monthlyPayment + data.extraPayment, monthlyRate);

    const originalInterest = calculateTotalInterest(data.totalAmount, data.monthlyPayment, monthlyRate);
    const newInterest = calculateTotalInterest(data.totalAmount, data.monthlyPayment + data.extraPayment, monthlyRate);
    
    setResult({
      originalMonths: Math.ceil(originalMonths),
      newMonths: Math.ceil(newMonths),
      interestSaved: originalInterest - newInterest,
      timeSaved: Math.ceil(originalMonths) - Math.ceil(newMonths)
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Simulador de Quitação Antecipada</CardTitle>
        <CardDescription>
          Veja o impacto de fazer pagamentos extras em uma dívida e quanto você pode economizar.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="totalAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Saldo Devedor Atual (R$)</FormLabel>
                  <FormControl>
                    <CurrencyInput value={field.value} onValueChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="monthlyPayment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parcela Mensal (R$)</FormLabel>
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
              name="extraPayment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor Extra a Pagar por Mês (R$)</FormLabel>
                  <FormControl>
                    <CurrencyInput value={field.value} onValueChange={field.onChange} />
                  </FormControl>
                   <FormDescription>Simule pagar um valor a mais todo mês.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex-col items-stretch gap-4">
            <Button type="submit">Simular</Button>
            {result && (
              <div className="rounded-lg border bg-muted p-4 space-y-2 text-sm">
                <p className="font-semibold">Resultado da Simulação:</p>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tempo para quitar (sem extra):</span>
                  <span className="font-bold">{result.originalMonths} meses</span>
                </div>
                 <div className="flex justify-between">
                  <span className="text-muted-foreground">Tempo para quitar (com extra):</span>
                  <span className="font-bold text-emerald-600">{result.newMonths} meses</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tempo economizado:</span>
                  <span className="font-bold">{result.timeSaved} meses</span>
                </div>
                 <div className="flex justify-between">
                  <span className="text-muted-foreground">Juros economizados:</span>
                  <span className="font-bold text-emerald-600">{formatCurrency(result.interestSaved)}</span>
                </div>
              </div>
            )}
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
