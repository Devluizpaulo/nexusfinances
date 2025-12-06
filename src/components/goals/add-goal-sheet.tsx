
'use client';

import { useForm } from 'react-hook-form';
import { useEffect, useState } from 'react';
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
import { addMonths, format, formatISO, parseISO } from 'date-fns';
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
  goal?: Goal | null;
};

export function AddGoalSheet({ isOpen, onClose, goal }: AddGoalSheetProps) {
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
  const watchedTargetDate = form.watch('targetDate');
  const [isTargetDateOpen, setIsTargetDateOpen] = useState(false);

  const remainingAmount = Math.max(targetAmount - currentAmount, 0);
  const estimatedMonths = monthlyContribution > 0 ? Math.ceil(remainingAmount / monthlyContribution) : null;
  const estimatedDate = estimatedMonths && estimatedMonths > 0 ? addMonths(new Date(), estimatedMonths) : null;

  useEffect(() => {
    if (goal && isOpen) {
      form.reset({
        name: goal.name,
        category: goal.category,
        description: goal.description || '',
        targetAmount: goal.targetAmount,
        currentAmount: goal.currentAmount,
        monthlyContribution: goal.monthlyContribution || 0,
        targetDate: goal.targetDate ? parseISO(goal.targetDate) : undefined,
      });
    } else {
       form.reset({
        name: '',
        category: '',
        targetAmount: 0,
        currentAmount: 0,
        monthlyContribution: 0,
        description: '',
        targetDate: undefined,
      });
    }
  }, [goal, isOpen, form]);

  const onSubmit = async (values: GoalFormValues) => {
    if (!user || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Faça login para continuar',
        description: 'Entre na sua conta para criar ou editar uma meta.',
      });
      return;
    }

    try {
      const goalsColRef = collection(firestore, `users/${user.uid}/goals`);
      
      const goalData = {
          ...values,
          targetDate: values.targetDate ? formatISO(values.targetDate) : undefined,
          userId: user.uid,
          monthlyContribution: values.monthlyContribution || 0,
      };

      if(goal) {
        // Editing an existing goal
        const goalRef = doc(firestore, `users/${user.uid}/goals`, goal.id);
        setDocumentNonBlocking(goalRef, goalData, { merge: true });
        toast({
            title: 'Meta atualizada',
            description: `"${values.name}" foi atualizada.`,
        });

      } else {
        // Creating a new goal
        const hasInitialAmount = values.currentAmount > 0;
        const initialContribution = hasInitialAmount
          ? [{
              id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
              amount: values.currentAmount,
              date: new Date().toISOString(),
            }]
          : [];

        const newGoalData = {
          ...goalData,
          contributions: initialContribution,
        };

        addDocumentNonBlocking(goalsColRef, newGoalData);

        const progress = values.targetAmount > 0 ? (values.currentAmount / values.targetAmount) * 100 : 0;

        toast({
          title: 'Meta criada',
          description: `"${values.name}" foi criada. Você já está em ${Math.min(
            100,
            Math.max(0, Math.round(progress)),
          )}% do caminho.`,
        });
      }

      onClose();

    } catch (error) {
      console.error("Error saving goal: ", error);
      toast({
        variant: 'destructive',
        title: 'Não deu para salvar a meta',
        description: 'Tente novamente em alguns segundos.',
      });
    }
  };

  const isEditing = !!goal;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Objetivo' : 'Adicionar Nova Reserva/Investimento'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Atualize os detalhes do seu objetivo.' : 'Defina um objetivo e acompanhe seu progresso.'}
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
                          Investir: '📈',
                          'Quitar Dívidas': '📉',
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
                      Quanto você deseja acumular no total.
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
                      <CurrencyInput value={field.value} onValueChange={field.onChange} disabled={isEditing} />
                    </FormControl>
                    <FormDescription className="text-[11px]">
                      {isEditing ? 'O valor atual é gerenciado pelos aportes.' : 'O que você já tem guardado.'}
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
                    Usado para estimar a data de conclusão.
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
                  <FormLabel>Data Alvo (Opcional)</FormLabel>

                  <Popover open={isTargetDateOpen} onOpenChange={setIsTargetDateOpen}>
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
                        onSelect={(date) => {
                          field.onChange(date);
                          if (date) setIsTargetDateOpen(false);
                        }}
                        initialFocus
                        locale={ptBR}
                        captionLayout="dropdown-nav"
                        fromYear={new Date().getFullYear() - 10}
                        toYear={new Date().getFullYear() + 10}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription className="text-[11px] space-y-0.5">
                    {estimatedDate && !watchedTargetDate && (
                      <span className="block text-[11px] text-emerald-700">
                        Estimativa com aporte mensal:{' '}
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
                {isEditing ? 'Salvar Alterações' : 'Salvar Objetivo'}
              </Button>
            </DialogFooter>

          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
