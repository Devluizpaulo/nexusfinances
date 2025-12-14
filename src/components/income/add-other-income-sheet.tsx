

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { formatISO, parseISO } from 'date-fns';
import { collection, doc, arrayUnion, updateDoc, addDoc, setDoc } from 'firebase/firestore';
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, PlusCircle } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import type { Transaction } from '@/lib/types';
import { Textarea } from '@/components/ui/textarea';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { incomeCategories } from '@/lib/types';
import { DatePicker } from '../ui/date-picker';
import { Label } from '../ui/label';

const otherIncomeCategories = incomeCategories.filter(
  c => c !== 'Salário' && c !== 'Freelance'
);

const formSchema = z.object({
  amount: z.coerce.number().positive('Use um valor maior que zero.'),
  date: z.date({
    required_error: 'Escolha uma data.',
  }),
  description: z.string().min(1, 'A descrição é obrigatória.'),
  category: z.string().min(1, 'A categoria é obrigatória.'),
  isRecurring: z.boolean().default(false),
  status: z.enum(['paid', 'pending']).default('paid'),
});

type OtherIncomeFormValues = z.infer<typeof formSchema>;

type AddOtherIncomeSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  transaction?: Transaction | null;
};

export function AddOtherIncomeSheet({
  isOpen,
  onClose,
  transaction,
}: AddOtherIncomeSheetProps) {
  const form = useForm<OtherIncomeFormValues>({
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
    const customCategories = user?.customIncomeCategories || [];
    const combined = new Set([...otherIncomeCategories, ...customCategories]);
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
  
  const onSubmit = async (values: OtherIncomeFormValues) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Faça login para continuar' });
      return;
    }
    
    const collectionPath = `users/${user.uid}/incomes`;
    
    const dataToSave: any = {
      ...values,
      date: formatISO(values.date),
      userId: user.uid,
      type: 'income',
    };

    try {
      if (transaction) {
        const docRef = doc(firestore, collectionPath, transaction.id);
        await setDoc(docRef, dataToSave, { merge: true });
        toast({ title: 'Renda atualizada' });
      } else {
        await addDoc(collection(firestore, collectionPath), dataToSave);
        toast({ title: 'Renda salva' });
      }
      onClose();
    } catch (error) {
      console.error("Error saving income:", error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: "Não foi possível salvar a transação. Tente novamente."
      });
    }
  };
  
  const handleAddCategory = async () => {
    if (!user || !firestore || !newCategoryName.trim()) return;

    const userDocRef = doc(firestore, 'users', user.uid);

    try {
      await updateDoc(userDocRef, {
        customIncomeCategories: arrayUnion(newCategoryName.trim())
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

  const title = transaction ? 'Editar Renda' : 'Adicionar Outra Renda';
  const descriptionText = transaction ? 'Modifique os detalhes da sua renda.' : 'Registre um gasto avulso.';

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
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
                      <FormLabel>Recebido</FormLabel>
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
