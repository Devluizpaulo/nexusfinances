'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, formatISO, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { collection, setDoc, doc } from 'firebase/firestore';
import { useFirestore, useUser, addDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { cn } from '@/lib/utils';
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Loader2, Film, Music, Gamepad2, Cloud, Cpu, BookOpen, Dumbbell, CreditCard, Wallet } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import type { Transaction } from '@/lib/types';
import { subscriptionCategoriesConfig } from '@/app/expenses/subscriptions/page';
import { useEffect } from 'react';


const billingCycles = [
  { value: 'monthly', label: 'Mensal' },
  { value: 'quarterly', label: 'Trimestral' },
  { value: 'semiannual', label: 'Semestral' },
  { value: 'annual', label: 'Anual' },
];

const formSchema = z.object({
  serviceName: z.string().min(1, 'O nome do serviço é obrigatório.'),
  category: z.string().min(1, 'Selecione uma categoria.'),
  amount: z.coerce.number().positive('O valor deve ser positivo.'),
  billingCycle: z.string().default('monthly'),
  billingDay: z.coerce.number().int().min(1).max(31, 'O dia deve ser entre 1 e 31.'),
  startDate: z.date({ required_error: 'A data de início é obrigatória.' }),
  paymentMethod: z.enum(['credit_card', 'debit', 'pix', 'boleto']),
  creditCardName: z.string().optional(),
  isShared: z.boolean().default(false),
  sharedWith: z.string().optional(),
  notes: z.string().optional(),
});

type SubscriptionFormValues = z.infer<typeof formSchema>;

type AddSubscriptionSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  transaction?: Transaction | null;
};

export function AddSubscriptionSheet({ isOpen, onClose, transaction }: AddSubscriptionSheetProps) {
  const form = useForm<SubscriptionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      serviceName: '',
      category: '',
      amount: 0,
      billingCycle: 'monthly',
      billingDay: 5,
      startDate: new Date(),
      paymentMethod: 'credit_card',
      creditCardName: '',
      isShared: false,
      sharedWith: '',
      notes: '',
    },
  });

  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const isEditing = !!transaction;

  useEffect(() => {
    if (isOpen) {
      if (isEditing) {
        const metadata = (transaction as any).metadata || {};
        form.reset({
          serviceName: transaction.description,
          category: metadata.subscriptionType || '',
          amount: transaction.amount,
          billingCycle: metadata.billingCycle || 'monthly',
          billingDay: metadata.billingDay || 5,
          startDate: parseISO(transaction.date),
          paymentMethod: metadata.paymentMethod || 'credit_card',
          creditCardName: metadata.creditCardName || '',
          isShared: metadata.isShared || false,
          sharedWith: metadata.sharedWith || '',
          notes: metadata.notes || '',
        });
      } else {
        form.reset({
          serviceName: '',
          category: '',
          amount: 0,
          billingCycle: 'monthly',
          billingDay: 5,
          startDate: new Date(),
          paymentMethod: 'credit_card',
          creditCardName: '',
          isShared: false,
          sharedWith: '',
          notes: '',
        });
      }
    }
  }, [isOpen, isEditing, transaction, form]);


  const paymentMethod = form.watch('paymentMethod');
  const selectedCategory = form.watch('category');

  const onSubmit = async (values: SubscriptionFormValues) => {
    if (!user || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Faça login para continuar',
      });
      return;
    }

    try {
      const expensesColRef = collection(firestore, `users/${user.uid}/expenses`);
      
      const expenseData: any = {
        userId: user.uid,
        amount: values.amount,
        category: 'Assinaturas & Serviços',
        description: values.serviceName,
        date: formatISO(values.startDate),
        isRecurring: true,
        type: 'expense',
        status: 'pending',
        metadata: {
          subscriptionType: values.category,
          billingCycle: values.billingCycle,
          billingDay: values.billingDay,
          paymentMethod: values.paymentMethod,
          creditCardName: values.paymentMethod === 'credit_card' ? values.creditCardName : null,
          isShared: values.isShared,
          sharedWith: values.isShared ? values.sharedWith : null,
          notes: values.notes || null,
        }
      };

      if (isEditing) {
        const docRef = doc(expensesColRef, transaction.id);
        setDocumentNonBlocking(docRef, expenseData);
        toast({
          title: 'Assinatura Atualizada!',
          description: `${values.serviceName} foi atualizada com sucesso.`,
        });
      } else {
        addDocumentNonBlocking(expensesColRef, expenseData);
        toast({
          title: 'Assinatura Adicionada!',
          description: `${values.serviceName} foi cadastrada com sucesso.`,
        });
      }

      form.reset();
      onClose();

    } catch (error) {
      console.error("Error adding subscription: ", error);
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar assinatura',
        description: 'Tente novamente em alguns segundos.',
      });
    }
  };

  const categoryInfo = subscriptionCategoriesConfig.find(c => c.value === selectedCategory);
  const DialogIcon = categoryInfo ? categoryInfo.icon : Film;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <DialogIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>{isEditing ? 'Editar Assinatura' : 'Nova Assinatura'}</DialogTitle>
              <DialogDescription>
                Cadastre um serviço de streaming, software ou outra assinatura recorrente.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Nome e Categoria */}
            <FormField
              control={form.control}
              name="serviceName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Serviço</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Netflix, Spotify, ChatGPT Plus" {...field} />
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
                        <SelectValue placeholder="Selecione o tipo de serviço" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {subscriptionCategoriesConfig.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          <div className="flex items-center gap-2">
                            <cat.icon className="h-4 w-4" />
                            <span>{cat.title}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {categoryInfo && (
                    <FormDescription>
                      Ex: {categoryInfo.examples}
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            {/* Valor e Ciclo */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor (R$)</FormLabel>
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
                name="billingCycle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ciclo de Cobrança</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {billingCycles.map((cycle) => (
                          <SelectItem key={cycle.value} value={cycle.value}>
                            {cycle.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="billingDay"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dia da Cobrança</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} max={31} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Início da Assinatura</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={'outline'}
                            className={cn('pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}
                          >
                            {field.value ? format(field.value, 'dd/MM/yyyy', { locale: ptBR }) : <span>Selecione</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus locale={ptBR} />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Forma de Pagamento */}
            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Forma de Pagamento</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="grid grid-cols-2 gap-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="credit_card" id="credit_card" />
                        <Label htmlFor="credit_card" className="flex items-center gap-2 cursor-pointer">
                          <CreditCard className="h-4 w-4" />
                          Cartão de Crédito
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="debit" id="debit" />
                        <Label htmlFor="debit" className="flex items-center gap-2 cursor-pointer">
                          <Wallet className="h-4 w-4" />
                          Débito Automático
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="pix" id="pix" />
                        <Label htmlFor="pix" className="cursor-pointer">PIX</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="boleto" id="boleto" />
                        <Label htmlFor="boleto" className="cursor-pointer">Boleto</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {paymentMethod === 'credit_card' && (
              <FormField
                control={form.control}
                name="creditCardName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Cartão</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Nubank, Inter, Itaú" {...field} />
                    </FormControl>
                    <FormDescription>
                      Qual cartão é usado para esta assinatura?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <Separator />

            {/* Compartilhamento */}
            <FormField
              control={form.control}
              name="isShared"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Assinatura Compartilhada</FormLabel>
                    <FormDescription>
                      Divide com família ou amigos?
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {form.watch('isShared') && (
              <FormField
                control={form.control}
                name="sharedWith"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Compartilhado com</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Família, João, Maria" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting || !user}
                className="w-full"
              >
                {form.formState.isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                <Film className="mr-2 h-4 w-4" />
                Salvar Assinatura
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
