
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
import { DatePicker } from '@/components/ui/date-picker';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import type { Transaction } from '@/lib/types';
import { Textarea } from '../ui/textarea';
import { CurrencyInput } from '../ui/currency-input';
import { expenseCategories, specificExpenseCategories } from '@/lib/types';
import { Label } from '../ui/label';

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
        <DialogContent>
           <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{descriptionText}</DialogDescription>
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
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Ex: Almoço com amigos, Camiseta nova..." {...field} />
                    </FormControl>
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
              <FormField
                control={form.control}
                name="isRecurring"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border bg-muted p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Recorrente</FormLabel>
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
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border bg-muted p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Pago</FormLabel>
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
              <DialogFooter>
                  <Button
                  type="submit"
                  disabled={form.formState.isSubmitting || !user}
                  className="w-full"
                  >
                  {form.formState.isSubmitting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {transaction ? 'Salvar Alterações' : 'Salvar Despesa'}
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
