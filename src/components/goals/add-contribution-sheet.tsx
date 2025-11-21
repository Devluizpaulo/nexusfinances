'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { doc } from 'firebase/firestore';
import { useFirestore, useUser, updateDocumentNonBlocking } from '@/firebase';
import type { Goal } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

const formSchema = z.object({
  amount: z.coerce.number().positive('O valor do aporte deve ser positivo.'),
});

type ContributionFormValues = z.infer<typeof formSchema>;

type AddContributionSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  goal: Goal | null;
};

export function AddContributionSheet({ isOpen, onClose, goal }: AddContributionSheetProps) {
  const form = useForm<ContributionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 0,
    },
  });

  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  
  useEffect(() => {
    if (!isOpen) {
        form.reset();
    }
  }, [isOpen, form]);


  const onSubmit = async (values: ContributionFormValues) => {
    if (!user || !firestore || !goal) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível registrar o aporte. Tente novamente.',
      });
      return;
    }

    try {
      const goalRef = doc(firestore, `users/${user.uid}/goals`, goal.id);
      
      const newCurrentAmount = goal.currentAmount + values.amount;

      updateDocumentNonBlocking(goalRef, { currentAmount: newCurrentAmount });

      toast({
        title: 'Aporte adicionado!',
        description: `R$ ${values.amount.toFixed(2)} adicionados à sua meta "${goal.name}".`,
      });

      onClose();

    } catch (error) {
      console.error("Error adding contribution: ", error);
      toast({
        variant: 'destructive',
        title: 'Oh, não! Algo deu errado.',
        description: 'Não foi possível adicionar o aporte. Por favor, tente novamente.',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Aporte para "{goal?.name}"</DialogTitle>
          <DialogDescription>
            Registre um novo valor para se aproximar da sua meta.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 space-y-6">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor do Aporte (R$)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="100,00" {...field} step="0.01" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              disabled={form.formState.isSubmitting || !user}
              className="w-full"
            >
              {form.formState.isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Salvar Aporte
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
