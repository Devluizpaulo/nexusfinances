'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { collection } from 'firebase/firestore';
import { useFirestore, useUser, addDocumentNonBlocking } from '@/firebase';
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  name: z.string().min(1, 'O nome da meta é obrigatório.'),
  targetAmount: z.coerce.number().positive('O valor alvo deve ser positivo.'),
  currentAmount: z.coerce.number().min(0, 'O valor atual não pode ser negativo.').default(0),
});

type GoalFormValues = z.infer<typeof formSchema>;

type AddGoalSheetProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function AddGoalSheet({ isOpen, onClose }: AddGoalSheetProps) {
  const form = useForm<GoalFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      targetAmount: 0,
      currentAmount: 0,
    },
  });

  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const onSubmit = async (values: GoalFormValues) => {
    if (!user || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Erro de autenticação',
        description: 'Você precisa estar logado para adicionar uma meta.',
      });
      return;
    }

    try {
      const goalsColRef = collection(firestore, `users/${user.uid}/goals`);
      
      const goalData = {
        ...values,
        userId: user.uid,
      };

      addDocumentNonBlocking(goalsColRef, goalData);

      toast({
        title: 'Meta adicionada!',
        description: `Sua meta "${values.name}" foi adicionada com sucesso.`,
      });

      form.reset();
      onClose();

    } catch (error) {
      console.error("Error adding goal: ", error);
      toast({
        variant: 'destructive',
        title: 'Oh, não! Algo deu errado.',
        description: 'Não foi possível adicionar a meta. Por favor, tente novamente.',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Nova Meta Financeira</DialogTitle>
          <DialogDescription>
            Defina um objetivo e acompanhe seu progresso.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Meta</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Reserva de Emergência" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="targetAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor Alvo (R$)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="10000,00" {...field} step="0.01" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="currentAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor Inicial (R$)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0,00" {...field} step="0.01" />
                  </FormControl>
                  <FormDescription>
                    Quanto você já tem guardado para esta meta?
                  </FormDescription>
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
              Salvar Meta
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
