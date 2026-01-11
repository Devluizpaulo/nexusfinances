'use client';

import { useForm } from 'react-hook-form';
import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { collection, doc, addDoc, setDoc } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
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
import { Loader2, CreditCard as CreditCardIcon, DollarSign, Calendar, Hash } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CurrencyInput } from '../ui/currency-input';
import type { CreditCard } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';

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

  const handleOpenChange = (open: boolean) => {
    if (!open && !form.formState.isSubmitting) {
      onClose();
    }
  };

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
      const collectionRef = collection(firestore, `users/${user.uid}/creditCards`);

      if (isEditing) {
        const cardRef = doc(collectionRef, card!.id);
        await setDoc(cardRef, dataToSave, { merge: true });
        toast({ title: 'Cartão atualizado!', description: `O cartão "${values.name}" foi salvo.` });
      } else {
        await addDoc(collectionRef, dataToSave);
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
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-full sm:max-w-2xl lg:max-w-3xl max-h-[95vh] h-full sm:h-auto overflow-hidden p-0">
        <div className="flex flex-col h-full">
          {/* Header com gradiente */}
          <div className="relative bg-gradient-to-r from-purple-500/10 via-primary/5 to-background border-b px-6 py-6">
            <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(white,transparent_85%)]" />
            <DialogHeader className="relative space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 backdrop-blur-sm">
                  <CreditCardIcon className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <DialogTitle className="text-2xl">{isEditing ? 'Editar Cartão de Crédito' : 'Adicionar Novo Cartão'}</DialogTitle>
                  <DialogDescription className="text-sm mt-1">
                    Cadastre um cartão para facilitar o controle de suas faturas e despesas.
                  </DialogDescription>
                </div>
              </div>
              {!isEditing && (
                <Badge variant="secondary" className="w-fit">
                  <CreditCardIcon className="h-3 w-3 mr-1" />
                  Novo cartão de crédito
                </Badge>
              )}
            </DialogHeader>
          </div>

          {/* Conteúdo scrollável */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" id="credit-card-form">
                
                {/* Seção 1: Identificação */}
                <Card className="border-2 hover:border-primary/20 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-primary" />
                      <CardTitle className="text-lg">Identificação</CardTitle>
                    </div>
                    <CardDescription>Informações básicas do cartão</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome do Cartão</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Nubank Roxo, Inter Gold" {...field} className="h-11" />
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
                            <Input placeholder="1234" {...field} maxLength={4} className="h-11" />
                          </FormControl>
                          <FormDescription className="text-xs">
                            Para facilitar a identificação do cartão
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Seção 2: Limite */}
                <Card className="border-2 hover:border-primary/20 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-primary" />
                      <CardTitle className="text-lg">Limite</CardTitle>
                    </div>
                    <CardDescription>Defina o limite de crédito disponível</CardDescription>
                  </CardHeader>
                  <CardContent>
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
                  </CardContent>
                </Card>

                {/* Seção 3: Datas */}
                <Card className="border-2 hover:border-primary/20 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      <CardTitle className="text-lg">Datas Importantes</CardTitle>
                    </div>
                    <CardDescription>Fechamento e vencimento da fatura</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="closingDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Dia do Fechamento</FormLabel>
                            <FormControl>
                              <Input type="number" min={1} max={31} {...field} className="h-11" />
                            </FormControl>
                            <FormDescription className="text-xs">
                              Último dia para compras na fatura atual
                            </FormDescription>
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
                              <Input type="number" min={1} max={31} {...field} className="h-11" />
                            </FormControl>
                            <FormDescription className="text-xs">
                              Prazo para pagamento sem juros
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

              </form>
            </Form>
          </div>

          {/* Footer fixo */}
          <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 py-4">
            <DialogFooter>
              <Button
                type="submit"
                form="credit-card-form"
                disabled={form.formState.isSubmitting || !user}
                className="w-full h-11 text-base font-medium shadow-lg hover:shadow-xl transition-all"
                size="lg"
              >
                {form.formState.isSubmitting && (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                )}
                {isEditing ? 'Salvar Alterações' : 'Salvar Cartão'}
              </Button>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
