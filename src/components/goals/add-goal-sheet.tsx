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
import { addMonths, format, formatISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Textarea } from '../ui/textarea';

const formSchema = z
  .object({
    name: z.string().min(1, 'O nome é obrigatório.'),
    category: z.string().min(1, 'A categoria é obrigatória.'),
    targetAmount: z.coerce.number().positive('O valor alvo deve ser positivo.'),
    currentAmount: z.coerce.number().min(0, 'O valor inicial não pode ser negativo.').default(0),
    monthlyContribution: z.coerce.number().min(0, 'O aporte mensal não pode ser negativo.').default(0),
    targetDate: z.date().optional(),
    description: z.string().optional(),
  })
  .refine(
    (values) => values.currentAmount <= values.targetAmount,
    {
      path: ['currentAmount'],
      message: 'O valor inicial não pode ser maior que o valor alvo.',
    },
  );

type GoalFormValues = z.infer<typeof formSchema>;

type AddGoalSheetProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function AddGoalSheet({ isOpen, onClose }: AddGoalSheetProps) {
  const form = useForm<GoalFormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      category: '',
      targetAmount: 0,
      currentAmount: 0,
      monthlyContribution: 0,
      description: '',
    },
  });

  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const targetAmount = form.watch('targetAmount');
  const currentAmount = form.watch('currentAmount');
  const monthlyContribution = form.watch('monthlyContribution');

  const remainingAmount = Math.max(targetAmount - currentAmount, 0);
  const estimatedMonths = monthlyContribution > 0 ? Math.ceil(remainingAmount / monthlyContribution) : null;
  const estimatedDate = estimatedMonths && estimatedMonths > 0 ? addMonths(new Date(), estimatedMonths) : null;

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

      const hasInitialAmount = values.currentAmount > 0;
      const initialContribution = hasInitialAmount
        ? [{
            id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
            amount: values.currentAmount,
            date: new Date().toISOString(),
          }]
        : [];

      const goalData = {
        ...values,
        targetDate: values.targetDate ? formatISO(values.targetDate) : undefined,
        userId: user.uid,
        contributions: initialContribution,
        monthlyContribution: values.monthlyContribution || 0,
      };

      addDocumentNonBlocking(goalsColRef, goalData);

      const progress = values.targetAmount > 0 ? (values.currentAmount / values.targetAmount) * 100 : 0;

      toast({
        title: ' Objetivo criado com sucesso!',
        description: `"${values.name}" foi adicionado. Você já está em ${Math.min(
          100,
          Math.max(0, Math.round(progress)),
        )}% do caminho.`,
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
                  <FormDescription className="text-[11px]">
                    Ex.: Emergência financeira, Comprar um carro, Viagem para o Japão, Aposentadoria, Reserva de
                    oportunidade.
                  </FormDescription>
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
                      {goalCategories.map((category) => {
                        const iconMap: Record<string, string> = {
                          'Reserva de Emergência': '🆘',
                          Viagem: '✈️',
                          Carro: '🚗',
                          Casa: '🏠',
                          Eletrônicos: '💻',
                          Educação: '🎓',
                          Aposentadoria: '💼',
                          Outros: '✨',
                        };
                        const icon = iconMap[category] || '🎯';
                        return (
                          <SelectItem key={category} value={category}>
                            <span className="mr-2 inline-block w-4 text-center">{icon}</span>
                            {category}
                          </SelectItem>
                        );
                      })}
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
                  <FormLabel>Por que este objetivo é importante para você? (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ex.: Quero ter uma reserva para emergências e não depender de crédito quando algo inesperado acontecer."
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-[11px]">
                    Registrar o motivo aumenta o compromisso e ajuda você a manter o foco no longo prazo.
                  </FormDescription>
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
                      <CurrencyInput value={field.value} onValueChange={field.onChange} />
                    </FormControl>
                    <FormDescription className="text-[11px]">
                      Quanto você deseja acumular no total para esta reserva/investimento.
                    </FormDescription>
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
                      <CurrencyInput value={field.value} onValueChange={field.onChange} />
                    </FormControl>
                    <FormDescription className="text-[11px]">
                      O valor que você já tem disponível para esta reserva/investimento.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="monthlyContribution"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Aporte mensal planejado (R$) (Opcional)</FormLabel>
                  <FormControl>
                    <CurrencyInput
                      value={Number(field.value) || 0}
                      onValueChange={(val) => field.onChange(val ?? 0)}
                    />
                  </FormControl>
                  <FormDescription className="text-[11px]">
                    Quanto você pretende investir por mês neste objetivo. Usamos esse valor para estimar uma possível
                    data de conclusão.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="targetDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Quando você planeja alcançar este objetivo? (Data Alvo opcional)</FormLabel>

                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground',
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
                  <FormDescription className="text-[11px] space-y-0.5">
                    {estimatedDate && (
                      <span className="block text-[11px] text-emerald-700">
                        Com o aporte mensal informado, você pode alcançar este objetivo em torno de{' '}
                        <span className="font-semibold">
                          {format(estimatedDate, 'MM/yyyy', { locale: ptBR })}
                        </span>
                        .
                      </span>
                    )}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting || !user || !form.formState.isValid}
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