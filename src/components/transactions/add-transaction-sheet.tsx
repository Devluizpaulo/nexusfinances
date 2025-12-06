
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { formatISO, format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { collection, doc, arrayUnion, updateDoc } from 'firebase/firestore';
import { useFirestore, useUser, addDocumentNonBlocking, setDocumentNonBlocking, useCollection, useMemoFirebase } from '@/firebase';
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
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
import { CalendarIcon, Loader2, PlusCircle } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import type { Transaction, CreditCard } from '@/lib/types';
import { Textarea } from '../ui/textarea';
import { CurrencyInput } from '../ui/currency-input';
import { Separator } from '../ui/separator';
import { Label } from '@/components/ui/label';
import { AddCreditCardSheet } from '../credit-cards/add-credit-card-sheet';

const formSchema = z.object({
  category: z.string().min(1, 'Escolha uma categoria.'),
  amount: z.coerce.number().positive('Use um valor maior que zero.'),
  date: z.date({
    required_error: 'Escolha uma data.',
  }),
  description: z.string().optional(),
  vendor: z.string().optional(),
  isRecurring: z.boolean().default(false),
  status: z.enum(['paid', 'pending']).default('paid'),
  paymentMethod: z.enum(['cash', 'creditCard']).default('cash'),
  creditCardId: z.string().optional(),
}).refine(data => {
    if (data.paymentMethod === 'creditCard') {
        return !!data.creditCardId;
    }
    return true;
}, {
    message: "Selecione um cartão de crédito.",
    path: ["creditCardId"],
});


type TransactionFormValues = z.infer<typeof formSchema>;

type AddTransactionSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  transactionType: 'income' | 'expense';
  categories: readonly string[];
  transaction?: Transaction | null;
};

export function AddTransactionSheet({
  isOpen,
  onClose,
  transactionType,
  categories,
  transaction,
}: AddTransactionSheetProps) {
  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: '',
      vendor: '',
      amount: 0,
      category: '',
      date: new Date(),
      isRecurring: false,
      status: 'paid',
      paymentMethod: 'cash',
    },
  });

  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  
  const [isAddCategoryDialogOpen, setIsAddCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAddCardSheetOpen, setIsAddCardSheetOpen] = useState(false);

  const paymentMethod = form.watch('paymentMethod');
  
  const creditCardsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, `users/${user.uid}/creditCards`);
  }, [user, firestore]);

  const { data: creditCardsData } = useCollection<CreditCard>(creditCardsQuery);

  const allCategories = useMemo(() => {
    const customCategories = transactionType === 'income' 
      ? user?.customIncomeCategories 
      : user?.customExpenseCategories;
    
    const combined = new Set([...categories, ...(customCategories || [])]);

    return Array.from(combined);
  }, [categories, user, transactionType]);


  useEffect(() => {
    if (isOpen && transaction) {
      form.reset({
        ...transaction,
        description: transaction.description || '',
        vendor: (transaction as any).vendor || '',
        date: parseISO(transaction.date),
        status: transaction.status || 'paid',
        paymentMethod: transaction.creditCardId ? 'creditCard' : 'cash',
        creditCardId: transaction.creditCardId || undefined,
      });
    } else if (isOpen) {
      form.reset({
        description: '',
        vendor: '',
        amount: 0,
        category: '',
        date: new Date(),
        isRecurring: false,
        status: 'paid',
        paymentMethod: 'cash',
        creditCardId: undefined,
      });
    }
  }, [isOpen, transaction, form]);
  
  const onSubmit = (values: TransactionFormValues) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Faça login para continuar',
        description: 'Entre na sua conta para registrar essa movimentação.',
      });
      return;
    }
    
    const collectionName = transactionType === 'income' ? 'incomes' : 'expenses';
    const collectionPath = `users/${user.uid}/${collectionName}`;
    
    // Explicitly build the object to be saved, ensuring no undefined fields are sent.
    const dataToSave: any = {
      ...values,
      date: formatISO(values.date),
      userId: user.uid,
      type: transactionType,
    };
    
    // Only include creditCardId if the payment method is 'creditCard' and an ID is selected
    if (transactionType === 'expense' && values.paymentMethod === 'creditCard' && values.creditCardId) {
      dataToSave.creditCardId = values.creditCardId;
    } else {
      // Ensure creditCardId is not present or is null if not applicable
      delete dataToSave.creditCardId;
    }
    // Remove the temporary paymentMethod field
    delete dataToSave.paymentMethod;

    if (transaction) {
      const docRef = doc(firestore, collectionPath, transaction.id);
      setDocumentNonBlocking(docRef, dataToSave, { merge: true });
      toast({
        title: 'Movimentação atualizada',
        description: 'Seu painel já foi atualizado.',
      });
    } else {
      addDocumentNonBlocking(collection(firestore, collectionPath), dataToSave);
      toast({
        title: 'Movimentação salva',
        description: `Sua ${transactionType === 'income' ? 'renda' : 'despesa'} já entrou no painel.`,
      });
    }
    
    onClose();
  };
  
  const handleAddCategory = async () => {
    if (!user || !firestore || !newCategoryName.trim()) return;

    const fieldToUpdate = transactionType === 'income' ? 'customIncomeCategories' : 'customExpenseCategories';
    const userDocRef = doc(firestore, 'users', user.uid);

    try {
      await updateDoc(userDocRef, {
        [fieldToUpdate]: arrayUnion(newCategoryName.trim())
      });
      toast({ title: 'Categoria adicionada', description: `"${newCategoryName.trim()}" foi incluída na sua lista.` });
      
      form.setValue('category', newCategoryName.trim());
      
      setNewCategoryName('');
      setIsAddCategoryDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Não deu para salvar a categoria", description: "Tente de novo em alguns segundos." });
    }
  };

  const title = transaction ? `Editar ${transactionType === 'income' ? 'Renda' : 'Despesa'}` : `Adicionar ${transactionType === 'income' ? 'Renda' : 'Despesa'}`;
  const description = transaction ? 'Modifique os detalhes da sua transação.' : `Adicione uma nova ${transactionType === 'income' ? 'entrada de renda' : 'saída para suas despesas'}.`;

  return (
    <>
      <AddCreditCardSheet 
        isOpen={isAddCardSheetOpen}
        onClose={() => setIsAddCardSheetOpen(false)}
      />

      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                        {allCategories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                        <Separator className="my-1" />
                        <Button
                          variant="ghost"
                          className="w-full justify-start font-normal h-8 px-2"
                          onClick={(e) => {
                            e.preventDefault();
                            setIsAddCategoryDialogOpen(true);
                          }}
                        >
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Criar nova categoria...
                        </Button>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data</FormLabel>
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
                          captionLayout="dropdown"
                          fromYear={new Date().getFullYear() - 10}
                          toYear={new Date().getFullYear() + 10}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Ex: Salário da empresa, compra do mês no mercado X..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="vendor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estabelecimento (Opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Netflix, Padaria do Zé, Mercado X..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {transactionType === 'expense' && (
                <>
                  <Separator />
                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Forma de Pagamento</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="cash">À vista (dinheiro/débito)</SelectItem>
                            <SelectItem value="creditCard">Cartão de Crédito</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {paymentMethod === 'creditCard' && (
                    <FormField
                      control={form.control}
                      name="creditCardId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cartão de Crédito</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um cartão" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {creditCardsData?.map((card) => (
                                <SelectItem key={card.id} value={card.id}>
                                  {card.name} (final {card.lastFourDigits})
                                </SelectItem>
                              ))}
                              <Separator className="my-1" />
                              <Button
                                variant="ghost"
                                className="w-full justify-start font-normal h-8 px-2"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setIsAddCardSheetOpen(true);
                                }}
                              >
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Adicionar novo cartão...
                              </Button>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  <Separator />
                </>
              )}

              <FormField
                control={form.control}
                name="isRecurring"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border bg-muted p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Recorrente</FormLabel>
                      <FormDescription>
                        Esta transação se repetirá todo mês.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-slate-300"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border bg-muted p-3">
                    <div className="space-y-0.5">
                      <FormLabel>{transactionType === 'income' ? 'Recebido' : 'Pago'}</FormLabel>
                      <FormDescription>
                        Marque se esta transação já foi efetivada.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value === 'paid'}
                        onCheckedChange={(checked) => field.onChange(checked ? 'paid' : 'pending')}
                        className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-slate-300"
                      />
                    </FormControl>
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
                  {transaction ? 'Salvar Alterações' : 'Salvar Transação'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddCategoryDialogOpen} onOpenChange={setIsAddCategoryDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Criar Nova Categoria</DialogTitle>
            <DialogDescription>
              Adicione uma nova categoria de {transactionType === 'income' ? 'renda' : 'despesa'}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-category-name">Nome da Categoria</Label>
              <Input
                id="new-category-name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Ex: Educação"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddCategoryDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddCategory} disabled={!newCategoryName.trim()}>
              Salvar Categoria
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
