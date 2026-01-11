
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { formatISO, format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { collection, doc, arrayUnion, updateDoc, addDoc, setDoc } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
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
import { CalendarIcon, Loader2, PlusCircle, ShoppingBag, DollarSign, Calendar as CalendarIco, FileText, Receipt } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { DatePicker } from '@/components/ui/date-picker';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import type { Transaction } from '@/lib/types';
import { Textarea } from '../ui/textarea';
import { CurrencyInput } from '../ui/currency-input';
import { expenseCategories, specificExpenseCategories } from '@/lib/types';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';

const otherExpenseCategories = expenseCategories.filter(
  (c) => !(specificExpenseCategories as unknown as string[]).includes(c)
);

const formSchema = z.object({
  category: z.string().min(1, 'Escolha uma categoria.'),
  amount: z.coerce.number().positive('Use um valor maior que zero.'),
  date: z.date({ required_error: 'Escolha uma data.' }),
  description: z.string().optional(),
  isRecurring: z.boolean().default(false),
  status: z.enum(['paid', 'pending']).default('paid'),
});

type OtherExpenseFormValues = z.infer<typeof formSchema>;

type AddOtherExpenseSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  transaction?: Transaction | null;
};

export function AddOtherExpenseSheet({
  isOpen,
  onClose,
  transaction,
}: AddOtherExpenseSheetProps) {
  const form = useForm<OtherExpenseFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: '',
      amount: 0,
      category: '',
      date: new Date(),
      isRecurring: false,
      status: 'paid',
    },
  });

  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  
  const [isAddCategoryDialogOpen, setIsAddCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const allCategories = useMemo(() => {
    const customCategories = user?.customExpenseCategories || [];
    const combined = new Set([...otherExpenseCategories, ...customCategories]);
    return Array.from(combined);
  }, [user]);

  useEffect(() => {
    if (isOpen && transaction) {
      form.reset({
        ...transaction,
        description: transaction.description || '',
        date: parseISO(transaction.date),
        status: transaction.status || 'paid',
      });
    } else if (isOpen) {
      form.reset({
        description: '',
        amount: 0,
        category: '',
        date: new Date(),
        isRecurring: false,
        status: 'paid',
      });
    }
  }, [isOpen, transaction, form]);
  
  const onSubmit = async (values: OtherExpenseFormValues) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Faça login para continuar' });
      return;
    }
    
    const collectionPath = `users/${user.uid}/expenses`;
    
    const dataToSave: any = {
      ...values,
      date: formatISO(values.date),
      userId: user.uid,
      type: 'expense',
    };

    if (transaction) {
      const docRef = doc(firestore, collectionPath, transaction.id);
      await setDoc(docRef, dataToSave, { merge: true });
      toast({ title: 'Despesa atualizada' });
    } else {
      await addDoc(collection(firestore, collectionPath), dataToSave);
      toast({ title: 'Despesa salva' });
    }
    
    onClose();
  };
  
  const handleAddCategory = async () => {
    if (!user || !firestore || !newCategoryName.trim()) return;

    const userDocRef = doc(firestore, 'users', user.uid);

    try {
      await updateDoc(userDocRef, {
        customExpenseCategories: arrayUnion(newCategoryName.trim())
      });
      toast({ title: 'Categoria adicionada' });
      form.setValue('category', newCategoryName.trim());
      setNewCategoryName('');
      setIsAddCategoryDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Não deu para salvar a categoria" });
    }
  };

  const title = transaction ? 'Editar Despesa' : 'Adicionar Outra Despesa';
  const descriptionText = transaction ? 'Modifique os detalhes da sua despesa.' : 'Registre um gasto avulso.';

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
        <DialogContent className="max-w-full sm:max-w-2xl lg:max-w-3xl max-h-[95vh] overflow-hidden p-0">
          <div className="flex flex-col max-h-[95vh]">
            {/* Header com gradiente */}
            <div className="relative bg-gradient-to-r from-orange-500/10 via-primary/5 to-background border-b px-6 py-6 flex-shrink-0">
              <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(white,transparent_85%)]" />
              <DialogHeader className="relative space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20 backdrop-blur-sm">
                    <ShoppingBag className="h-5 w-5 text-orange-500" />
                  </div>
                  <div>
                    <DialogTitle className="text-2xl">{title}</DialogTitle>
                    <DialogDescription className="text-sm mt-1">{descriptionText}</DialogDescription>
                  </div>
                </div>
                {!transaction && (
                  <Badge variant="secondary" className="w-fit">
                    <Receipt className="h-3 w-3 mr-1" />
                    Nova despesa
                  </Badge>
                )}
              </DialogHeader>
            </div>

            {/* Conteúdo scrollável */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-6" style={{ maxHeight: 'calc(95vh - 180px)' }}>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" id="expense-form">
                  
                  {/* Seção 1: Categoria */}
                  <Card className="border-2 hover:border-primary/20 transition-colors">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <CardTitle className="text-lg">Categoria</CardTitle>
                      </div>
                      <CardDescription>Classifique sua despesa</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo de Despesa</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-11">
                                  <SelectValue placeholder="Selecione uma categoria" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {allCategories.map((category) => (
                                  <SelectItem key={category} value={category}>
                                    {category}
                                  </SelectItem>
                                ))}
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
                    </CardContent>
                  </Card>

                  {/* Seção 2: Detalhes */}
                  <Card className="border-2 hover:border-primary/20 transition-colors">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <Receipt className="h-4 w-4 text-primary" />
                        <CardTitle className="text-lg">Detalhes</CardTitle>
                      </div>
                      <CardDescription>Informações sobre a despesa</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Descrição (Opcional)</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Ex: Almoço com amigos, Camiseta nova..." 
                                {...field}
                                className="min-h-[80px]"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  {/* Seção 3: Valor e Data */}
                  <Card className="border-2 hover:border-primary/20 transition-colors">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-primary" />
                        <CardTitle className="text-lg">Valor e Data</CardTitle>
                      </div>
                      <CardDescription>Quanto e quando foi a despesa</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            <FormItem>
                              <FormLabel>Data</FormLabel>
                              <FormControl>
                                <DatePicker
                                  value={field.value}
                                  onChange={field.onChange}
                                  placeholder="Escolha uma data"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Seção 4: Configurações */}
                  <Card className="border-2 hover:border-primary/20 transition-colors">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <CalendarIco className="h-4 w-4 text-primary" />
                        <CardTitle className="text-lg">Configurações</CardTitle>
                      </div>
                      <CardDescription>Recorrência e status de pagamento</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="isRecurring"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border-2 p-4 bg-muted/30 hover:bg-muted/50 transition-colors">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Recorrente</FormLabel>
                              <FormDescription className="text-xs">
                                Esta despesa se repetirá automaticamente
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
                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border-2 p-4 bg-muted/30 hover:bg-muted/50 transition-colors">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Pago</FormLabel>
                              <FormDescription className="text-xs">
                                Marque se esta despesa já foi paga
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value === 'paid'}
                                onCheckedChange={(checked) => field.onChange(checked ? 'paid' : 'pending')}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                </form>
              </Form>
            </div>

            {/* Footer fixo */}
            <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 py-4 flex-shrink-0">
              <DialogFooter>
                <Button
                  type="submit"
                  form="expense-form"
                  disabled={form.formState.isSubmitting || !user}
                  className="w-full h-11 text-base font-medium shadow-lg hover:shadow-xl transition-all"
                  size="lg"
                >
                  {form.formState.isSubmitting && (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  )}
                  {transaction ? 'Salvar Alterações' : 'Salvar Despesa'}
                </Button>
              </DialogFooter>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
       <Dialog open={isAddCategoryDialogOpen} onOpenChange={setIsAddCategoryDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Criar Nova Categoria</DialogTitle>
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
