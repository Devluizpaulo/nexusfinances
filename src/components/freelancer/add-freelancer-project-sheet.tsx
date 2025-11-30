'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, formatISO, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { collection } from 'firebase/firestore';
import { useFirestore, useUser, addDocumentNonBlocking } from '@/firebase';
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
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Loader2, Briefcase, User, Code, Palette, PenTool, Camera, BarChart, Megaphone } from 'lucide-react';
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

const serviceTypes = [
  { value: 'desenvolvimento', label: 'Desenvolvimento de Software', icon: Code },
  { value: 'design', label: 'Design Gráfico/UI/UX', icon: Palette },
  { value: 'redacao', label: 'Redação/Copywriting', icon: PenTool },
  { value: 'fotografia', label: 'Fotografia/Vídeo', icon: Camera },
  { value: 'consultoria', label: 'Consultoria', icon: BarChart },
  { value: 'marketing', label: 'Marketing Digital', icon: Megaphone },
  { value: 'outro', label: 'Outro Serviço', icon: Briefcase },
];

const formSchema = z.object({
  clientName: z.string().min(1, 'O nome do cliente é obrigatório.'),
  projectName: z.string().optional(),
  serviceType: z.string().min(1, 'Selecione o tipo de serviço.'),
  amount: z.coerce.number().positive('O valor deve ser positivo.'),
  paymentDay: z.coerce.number().int().min(1).max(31, 'O dia deve ser entre 1 e 31.'),
  isRecurring: z.boolean().default(true),
  startDate: z.date({ required_error: 'A data de início é obrigatória.' }),
  endDate: z.date().optional(),
  notes: z.string().optional(),
});

type FreelancerFormValues = z.infer<typeof formSchema>;

type AddFreelancerProjectSheetProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function AddFreelancerProjectSheet({ isOpen, onClose }: AddFreelancerProjectSheetProps) {
  const form = useForm<FreelancerFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientName: '',
      projectName: '',
      serviceType: '',
      amount: 0,
      paymentDay: 5,
      isRecurring: true,
      startDate: new Date(),
      notes: '',
    },
  });

  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const startDate = form.watch('startDate');
  const isRecurring = form.watch('isRecurring');

  // Auto-sugerir data de término (6 meses após início)
  useEffect(() => {
    if (startDate && isRecurring) {
      const suggestedEndDate = addMonths(startDate, 6);
      form.setValue('endDate', suggestedEndDate);
    }
  }, [startDate, isRecurring, form]);

  const onSubmit = async (values: FreelancerFormValues) => {
    if (!user || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Faça login para continuar',
      });
      return;
    }

    try {
      const incomesColRef = collection(firestore, `users/${user.uid}/incomes`);

      const serviceLabel = serviceTypes.find(s => s.value === values.serviceType)?.label || values.serviceType;
      const description = values.projectName 
        ? `${values.projectName} - ${values.clientName}` 
        : `Freelance ${serviceLabel} - ${values.clientName}`;

      const incomeData: any = {
        userId: user.uid,
        amount: values.amount,
        category: 'Freelance',
        description,
        date: formatISO(values.startDate),
        isRecurring: values.isRecurring,
        type: 'income',
        status: 'pending',
        // Metadata extra para freelance
        metadata: {
          clientName: values.clientName,
          projectName: values.projectName || null,
          serviceType: values.serviceType,
          paymentDay: values.paymentDay,
          startDate: formatISO(values.startDate),
          endDate: values.endDate ? formatISO(values.endDate) : null,
          notes: values.notes || null,
        }
      };

      addDocumentNonBlocking(incomesColRef, incomeData);

      toast({
        title: 'Projeto Freelance Adicionado!',
        description: `${description} foi cadastrado com sucesso.`,
      });

      form.reset();
      onClose();

    } catch (error) {
      console.error("Error adding freelancer project: ", error);
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar projeto',
        description: 'Tente novamente em alguns segundos.',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Briefcase className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Novo Projeto Freelance</DialogTitle>
              <DialogDescription>
                Cadastre um novo cliente ou projeto para acompanhar seus ganhos.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Informações do Cliente */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <User className="h-4 w-4" />
                <span>Informações do Cliente</span>
              </div>
              
              <FormField
                control={form.control}
                name="clientName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Cliente / Empresa</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Empresa XYZ Ltda" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="projectName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Projeto (Opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Desenvolvimento do App Mobile" {...field} />
                    </FormControl>
                    <FormDescription>
                      Se tiver um nome específico para o projeto
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Tipo de Serviço */}
            <FormField
              control={form.control}
              name="serviceType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Serviço</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo de serviço" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {serviceTypes.map((service) => (
                        <SelectItem key={service.value} value={service.value}>
                          <div className="flex items-center gap-2">
                            <service.icon className="h-4 w-4" />
                            <span>{service.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Valor e Pagamento */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Mensal (R$)</FormLabel>
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
                name="paymentDay"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dia do Pagamento</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} max={31} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Recorrência */}
            <FormField
              control={form.control}
              name="isRecurring"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Contrato Recorrente</FormLabel>
                    <FormDescription>
                      Pagamento mensal contínuo (retainer)
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

            <Separator />

            {/* Datas */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Início do Contrato</FormLabel>
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

              {isRecurring && (
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Término Previsto</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={'outline'}
                              className={cn('pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}
                            >
                              {field.value ? format(field.value, 'dd/MM/yyyy', { locale: ptBR }) : <span>Opcional</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={field.value} onSelect={field.onChange} locale={ptBR} />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Observações */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Detalhes do contrato, escopo do trabalho, etc."
                      className="resize-none"
                      rows={2}
                      {...field} 
                    />
                  </FormControl>
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
                <Briefcase className="mr-2 h-4 w-4" />
                Salvar Projeto
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
