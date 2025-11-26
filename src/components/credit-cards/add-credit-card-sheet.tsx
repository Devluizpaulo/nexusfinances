'use client';

import { useForm } from 'react-hook-form';
import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { collection, doc } from 'firebase/firestore';
import { useFirestore, useUser, addDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { CurrencyInput } from '../ui/currency-input';
import type { CreditCard } from '@/lib/types';

const formSchema = z.object({
  name: z.string().min(1, 'O nome do cartão é obrigatório.'),
  lastFourDigits: z.string().length(4, 'Digite os 4 últimos dígitos do cartão.'),
  limit: z.coerce.number().min(0, 'O limite deve ser um valor positivo.'),
  dueDate: z.coerce.number().int().min(1).max(31, 'O dia do vencimento deve ser entre 1 e 31.'),
  closingDate: z.coerce.number().int().min(1).max(31, 'O dia do fechamento deve ser entre 1 e 31.'),
});

type CreditCardFormValues = z.infer<typeof formSchema>;

type AddCreditCardSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  card?: CreditCard | null;
};

export function AddCreditCardSheet({ isOpen, onClose, card }: AddCreditCardSheetProps) {
  const form = useForm<CreditCardFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      lastFourDigits: '',
      limit: 0,
      dueDate: 1,
      closingDate: 1,
    },
  });

  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  useEffect(() => {
    if (card && isOpen) {
      form.reset({
        name: card.name,
        lastFourDigits: card.lastFourDigits,
        limit: card.limit,
        dueDate: card.dueDate,
        closingDate: card.closingDate,
      });
    } else {
       form.reset({
        name: '',
        lastFourDigits: '',
        limit: 0,
        dueDate: 1,
        closingDate: 1,
      });
    }
  }, [card, isOpen, form]);
  
  const isEditing = !!card;

  const onSubmit = async (values: CreditCardFormValues) => {
    if (!user || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Faça login para continuar',
      });
      return;
    }

    try {
      const dataToSave = { ...values, userId: user.uid };

      if (isEditing) {
        const cardRef = doc(firestore, `users/${user.uid}/creditCards`, card!.id);
        setDocumentNonBlocking(cardRef, dataToSave, { merge: true });
        toast({ title: 'Cartão atualizado!', description: `O cartão "${values.name}" foi salvo.` });
      } else {
        const cardsColRef = collection(firestore, `users/${user.uid}/creditCards`);
        addDocumentNonBlocking(cardsColRef, dataToSave);
        toast({ title: 'Cartão adicionado!', description: `O cartão "${values.name}" foi criado.` });
      }
      onClose();
    } catch (error) {
      console.error("Error saving credit card: ", error);
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar o cartão. Tente novamente.',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Cartão de Crédito' : 'Adicionar Novo Cartão'}</DialogTitle>
          <DialogDescription>
            Cadastre um cartão para facilitar o controle de suas faturas e despesas.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Cartão</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Nubank Roxo, Inter Gold" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastFourDigits"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Últimos 4 dígitos</FormLabel>
                  <FormControl>
                    <Input placeholder="1234" {...field} maxLength={4} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="limit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Limite do Cartão (R$)</FormLabel>
                  <FormControl>
                    <CurrencyInput
                      value={field.value}
                      onValueChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="closingDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dia do Fechamento</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} max={31} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dia do Vencimento</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} max={31} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
                <Button
                type="submit"
                disabled={form.formState.isSubmitting || !user}
                className="w-full"
                >
                {form.formState.isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isEditing ? 'Salvar Alterações' : 'Salvar Cartão'}
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
