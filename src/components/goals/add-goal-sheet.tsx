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
import { CalendarIcon, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CurrencyInput } from '../ui/currency-input';
import { goalCategories, type Goal } from '@/lib/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format, formatISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Textarea } from '../ui/textarea';

const formSchema = z.object({
  name: z.string().min(1, 'O nome é obrigatório.'),
  category: z.string().min(1, 'A categoria é obrigatória.'),
  targetAmount: z.coerce.number().positive('O valor alvo deve ser positivo.'),
  currentAmount: z.coerce.number().min(0, 'O valor atual não pode ser negativo.').default(0),
  targetDate: z.date().optional(),
  description: z.string().optional(),
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
      category: '',
      targetAmount: 0,
      currentAmount: 0,
      description: '',
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
        description: 'Você precisa estar logado para adicionar um item.',
      });
      return;
    }

    try {
      const goalsColRef = collection(firestore, `users/${user.uid}/goals`);
      
      const goalData = {
        ...values,
        targetDate: values.targetDate ? formatISO(values.targetDate) : undefined,
        userId: user.uid,
      };

      addDocumentNonBlocking(goalsColRef, goalData);

      toast({
        title: 'Item adicionado!',
        description: `"${values.name}" foi adicionado com sucesso.`,
      });

      form.reset();
      onClose();

    } catch (error) {
      console.error("Error adding goal: ", error);
      toast({
        variant: 'destructive',
        title: 'Oh, não! Algo deu errado.',
        description: 'Não foi possível adicionar o item. Por favor, tente novamente.',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Nova Reserva/Investimento</DialogTitle>
          <DialogDescription>
            Defina um objetivo e acompanhe seu progresso.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Objetivo</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Viagem para o Japão" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                   <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {goalCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

             <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plano/Descrição (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Descreva sua estratégia para alcançar este objetivo..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <FormField
                control={form.control}
                name="targetAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Alvo (R$)</FormLabel>
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
               <FormField
                control={form.control}
                name="currentAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Inicial (R$)</FormLabel>
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
            </div>
             <FormField
              control={form.control}
              name="targetDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data Alvo (Opcional)</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP', { locale: ptBR })
                          ) : (
                            <span>Escolha uma data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    Quando você planeja alcançar este objetivo?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
                <Button
                type="submit"
                disabled={form.formState.isSubmitting || !user}
                className="w-full"
                >
                {form.formState.isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Salvar Objetivo
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}