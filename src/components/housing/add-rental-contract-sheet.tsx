'use client';

import { useForm } from 'react-hook-form';
import { useMemo } from 'react';
import { addMonths, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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
import { Loader2, Home, Calendar, CreditCard, Info, DollarSign, FileText, CalendarCheck } from 'lucide-react';
import { CurrencyInput } from '../ui/currency-input';
import { Separator } from '../ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { RentalContract } from '@/lib/types';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { useRentalContractForm, type RentalFormValues } from '@/hooks/use-rental-contract-form';
import { DatePicker } from '../ui/date-picker';

type AddRentalContractSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  contract?: RentalContract | null;
};

export function AddRentalContractSheet({ isOpen, onClose, contract }: AddRentalContractSheetProps) {
  
  const {
    form,
    user,
    onSubmit,
    contractType,
    paymentMethod,
  } = useRentalContractForm({ contract, onClose });

  const isEditing = !!contract;
  
  // Watch form values para preview
  const totalAmount = form.watch('totalAmount');
  const dueDate = form.watch('dueDate');
  const startDate = form.watch('startDate');

  // Calcular próximas 3 mensalidades
  const upcomingPayments = useMemo(() => {
    if (!totalAmount || !dueDate || !startDate) return [];
    
    const payments = [];
    for (let i = 0; i < 3; i++) {
      const paymentDate = addMonths(new Date(startDate), i);
      paymentDate.setDate(dueDate);
      payments.push({
        month: format(paymentDate, 'MMMM/yyyy', { locale: ptBR }),
        date: format(paymentDate, 'dd/MM/yyyy'),
        amount: totalAmount,
      });
    }
    return payments;
  }, [totalAmount, dueDate, startDate]);

  const handleOpenChange = (open: boolean) => {
    if (!open && !form.formState.isSubmitting) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-full sm:max-w-2xl lg:max-w-4xl max-h-[95vh] overflow-hidden p-0">
        <div className="flex flex-col max-h-[95vh]">
          {/* Header com gradiente */}
          <div className="relative bg-gradient-to-r from-primary/10 via-primary/5 to-background border-b px-6 py-6 flex-shrink-0">
            <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(white,transparent_85%)]" />
            <DialogHeader className="relative space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                  <Home className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-2xl">{isEditing ? 'Editar Contrato de Moradia' : 'Cadastrar Contrato de Moradia'}</DialogTitle>
                  <DialogDescription className="text-sm mt-1">
                    {isEditing ? 'Atualize os detalhes do seu contrato.' : 'Insira os detalhes do seu contrato. Uma despesa recorrente será criada automaticamente.'}
                  </DialogDescription>
                </div>
              </div>
              {!isEditing && (
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="w-fit">
                    <Calendar className="h-3 w-3 mr-1" />
                    Recorrência automática
                  </Badge>
                  <Badge variant="outline" className="w-fit bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">
                    🤖 Mensalidades criadas automaticamente
                  </Badge>
                </div>
              )}
            </DialogHeader>
          </div>

          {/* Banner informativo */}
          {!isEditing && (
            <div className="mx-6 mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg flex-shrink-0">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                    💡 Como funciona a automação?
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
                    Ao salvar este contrato, uma <strong>despesa recorrente automática</strong> será criada. 
                    Todo mês, no dia do vencimento escolhido, o sistema criará automaticamente a cobrança na aba de Moradia. 
                    Você só precisa cadastrar uma vez! 🎉
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Conteúdo scrollável */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-6" style={{ maxHeight: 'calc(95vh - 280px)' }}>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" id="rental-contract-form">
                
                {/* Seção 1: Informações Básicas */}
                <Card className="border-2 hover:border-primary/20 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <CardTitle className="text-lg">Informações do Contrato</CardTitle>
                    </div>
                    <CardDescription>Detalhes principais do contrato de locação</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="landlordName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Proprietário / Imobiliária</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Imobiliária X Ltda" {...field} className="h-11" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Contrato</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-11">
                                <SelectValue/>
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Aluguel">Aluguel</SelectItem>
                              <SelectItem value="Condomínio">Condomínio</SelectItem>
                              <SelectItem value="Aluguel + Condomínio">Aluguel + Condomínio</SelectItem>
                              <SelectItem value="Outros">Outros</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Seção 2: Valores */}
                <Card className="border-2 hover:border-primary/20 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-primary" />
                      <CardTitle className="text-lg">Valores</CardTitle>
                    </div>
                    <CardDescription>Defina os valores cobrados mensalmente</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(contractType === 'Aluguel' || contractType === 'Aluguel + Condomínio') && (
                        <FormField
                          control={form.control}
                          name="rentAmount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Valor do Aluguel (R$)</FormLabel>
                              <FormControl>
                                <CurrencyInput
                                  value={field.value || 0}
                                  onValueChange={(value) => field.onChange(value)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                      {(contractType === 'Condomínio' || contractType === 'Aluguel + Condomínio') && (
                        <FormField
                          control={form.control}
                          name="condoFee"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Valor do Condomínio (R$)</FormLabel>
                              <FormControl>
                                <CurrencyInput
                                  value={field.value || 0}
                                  onValueChange={(value) => field.onChange(value)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>

                    <FormField
                      control={form.control}
                      name="totalAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor Total da Cobrança (R$)</FormLabel>
                          <FormControl>
                            <CurrencyInput
                              value={field.value}
                              onValueChange={field.onChange}
                              disabled={contractType !== 'Outros'}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="dueDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Dia do Vencimento</FormLabel>
                            <FormControl>
                              <Input type="number" min={1} max={31} {...field} className="h-11" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="paymentPeriodicity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Periodicidade</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-11">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Mensal">Mensal</SelectItem>
                                <SelectItem value="Bimestral">Bimestral</SelectItem>
                                <SelectItem value="Trimestral">Trimestral</SelectItem>
                                <SelectItem value="Anual">Anual</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Seção 3: Vigência */}
                <Card className="border-2 hover:border-primary/20 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      <CardTitle className="text-lg">Vigência do Contrato</CardTitle>
                    </div>
                    <CardDescription>Período de validade do contrato</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Início do Contrato</FormLabel>
                            <FormControl>
                              <DatePicker
                                value={field.value}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="endDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Fim do Contrato (Opcional)</FormLabel>
                            <FormControl>
                              <DatePicker
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="Sem data final"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="isAutoRenew"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border-2 p-4 bg-muted/30 hover:bg-muted/50 transition-colors">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Renovação Automática</FormLabel>
                            <FormDescription>O contrato será renovado automaticamente no vencimento</FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>


                {/* Seção 4: Meio de Pagamento */}
                <Card className="border-2 hover:border-primary/20 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-primary" />
                      <CardTitle className="text-lg">Meio de Pagamento</CardTitle>
                    </div>
                    <CardDescription>Configure como você realiza o pagamento</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="paymentMethod"
                      render={() => (
                        <div className="space-y-4">
                          <FormItem>
                            <FormLabel>Forma principal de pagamento</FormLabel>
                            <FormControl>
                              <Select
                                onValueChange={(value) =>
                                  form.setValue('paymentMethod', {
                                    ...(paymentMethod || {}),
                                    method: value as any,
                                  })
                                }
                                value={paymentMethod?.method || 'boleto'}
                              >
                                <SelectTrigger className="h-11">
                                  <SelectValue placeholder="Selecione o meio de pagamento" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pix">PIX</SelectItem>
                                  <SelectItem value="bankTransfer">Transferência Bancária</SelectItem>
                                  <SelectItem value="boleto">Boleto</SelectItem>
                                  <SelectItem value="creditCard">Cartão de Crédito</SelectItem>
                                  <SelectItem value="debit">Cartão de Débito</SelectItem>
                                  <SelectItem value="cash">Dinheiro</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormDescription>
                              Essas informações ajudam você a lembrar como realizar o pagamento todo mês.
                            </FormDescription>
                          </FormItem>

                          {paymentMethod?.method === 'pix' && (
                            <div className="space-y-3 p-4 rounded-lg bg-muted/30 border">
                              <FormItem>
                                <FormLabel>Chave PIX</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="E-mail, CPF, CNPJ, telefone ou chave aleatória"
                                    value={paymentMethod.identifier || ''}
                                    onChange={(e) =>
                                      form.setValue('paymentMethod', {
                                        ...paymentMethod,
                                        method: 'pix',
                                        identifier: e.target.value,
                                      })
                                    }
                                    className="h-11"
                                  />
                                </FormControl>
                              </FormItem>
                              <FormItem>
                                <FormLabel>Detalhes adicionais (opcional)</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Ex.: Chave em nome de João Silva, CPF 000.000.000-00"
                                    value={paymentMethod.instructions || ''}
                                    onChange={(e) =>
                                      form.setValue('paymentMethod', {
                                        ...paymentMethod,
                                        method: 'pix',
                                        instructions: e.target.value,
                                      })
                                    }
                                    className="min-h-[80px]"
                                  />
                                </FormControl>
                              </FormItem>
                            </div>
                          )}

                          {paymentMethod?.method === 'bankTransfer' && (
                            <div className="space-y-3 p-4 rounded-lg bg-muted/30 border">
                              <FormItem>
                                <FormLabel>Dados bancários</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Banco, agência, conta, tipo de conta, titular, CPF/CNPJ..."
                                    value={paymentMethod.instructions || ''}
                                    onChange={(e) => {
                                      const full = e.target.value;
                                      form.setValue('paymentMethod', {
                                        ...paymentMethod,
                                        method: 'bankTransfer',
                                        instructions: full,
                                        identifier: paymentMethod?.identifier || (full ? full.split('\n')[0]?.slice(0, 80) : ''),
                                      });
                                    }}
                                    className="min-h-[100px]"
                                  />
                                </FormControl>
                                <FormDescription>
                                  Detalhe aqui tudo o que você precisa para fazer a transferência.
                                </FormDescription>
                              </FormItem>
                            </div>
                          )}

                          {paymentMethod?.method === 'boleto' && (
                            <div className="space-y-3 p-4 rounded-lg bg-muted/30 border">
                              <FormItem>
                                <FormLabel>Como você recebe o boleto?</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Ex.: Recebo o boleto por e-mail da imobiliária..."
                                    value={paymentMethod.instructions || ''}
                                    onChange={(e) =>
                                      form.setValue('paymentMethod', {
                                        ...paymentMethod,
                                        method: 'boleto',
                                        instructions: e.target.value,
                                      })
                                    }
                                    className="min-h-[80px]"
                                  />
                                </FormControl>
                              </FormItem>
                              <FormItem>
                                <FormLabel>Identificador (opcional)</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Ex.: E-mail da imobiliária, portal..."
                                    value={paymentMethod.identifier || ''}
                                    onChange={(e) =>
                                      form.setValue('paymentMethod', {
                                        ...paymentMethod,
                                        method: 'boleto',
                                        identifier: e.target.value,
                                      })
                                    }
                                    className="h-11"
                                  />
                                </FormControl>
                              </FormItem>
                            </div>
                          )}

                          {paymentMethod?.method && !['pix', 'bankTransfer', 'boleto'].includes(paymentMethod.method) && (
                            <div className="p-4 rounded-lg bg-muted/30 border">
                              <FormItem>
                                <FormLabel>Detalhes do pagamento (opcional)</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Anote qualquer informação útil para lembrar como você paga."
                                    value={paymentMethod.instructions || ''}
                                    onChange={(e) =>
                                      form.setValue('paymentMethod', {
                                        ...paymentMethod,
                                        instructions: e.target.value,
                                      })
                                    }
                                    className="min-h-[80px]"
                                  />
                                </FormControl>
                              </FormItem>
                            </div>
                          )}
                        </div>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Seção 5: Informações Adicionais */}
                <Card className="border-2 hover:border-primary/20 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-primary" />
                      <CardTitle className="text-lg">Informações Adicionais</CardTitle>
                    </div>
                    <CardDescription>Dados complementares (opcional)</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="propertyAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Endereço do Imóvel</FormLabel>
                          <FormControl>
                            <Input placeholder="Rua, número, bairro..." {...field} className="h-11" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Observações Gerais</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Detalhes importantes, contatos, etc." 
                              {...field} 
                              className="min-h-[100px]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Preview das próximas mensalidades (apenas para novos contratos) */}
                {!isEditing && totalAmount > 0 && upcomingPayments.length > 0 && (
                  <Card className="border-2 border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50/50 to-emerald-50/30 dark:from-green-950/20 dark:to-emerald-950/10">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <CalendarCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <CardTitle className="text-lg text-green-900 dark:text-green-100">
                          Próximas Mensalidades Automáticas
                        </CardTitle>
                      </div>
                      <CardDescription className="text-green-700 dark:text-green-300">
                        Estas cobranças serão criadas automaticamente nos próximos meses
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {upcomingPayments.map((payment, index) => (
                          <div 
                            key={index}
                            className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-lg border border-green-200 dark:border-green-800 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 font-semibold">
                                {index + 1}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 dark:text-gray-100 capitalize">
                                  {payment.month}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  Vencimento: {payment.date}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-green-600 dark:text-green-400">
                                {new Intl.NumberFormat('pt-BR', { 
                                  style: 'currency', 
                                  currency: 'BRL' 
                                }).format(payment.amount)}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {index === 0 ? 'Próximo' : `Daqui a ${index + 1} meses`}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 p-3 bg-green-100 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <p className="text-sm text-green-800 dark:text-green-200 flex items-center gap-2">
                          <span className="text-lg">🤖</span>
                          <span>
                            <strong>Automático:</strong> Você não precisa fazer nada! 
                            O sistema criará essas cobranças automaticamente a cada mês.
                          </span>
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

              </form>
            </Form>
          </div>

          {/* Footer fixo */}
          <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 py-4">
            <DialogFooter>
              <Button
                type="submit"
                form="rental-contract-form"
                disabled={form.formState.isSubmitting || !user}
                className="w-full h-11 text-base font-medium shadow-lg hover:shadow-xl transition-all"
                size="lg"
              >
                {form.formState.isSubmitting && (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                )}
                {isEditing ? 'Salvar Alterações' : 'Salvar Contrato'}
              </Button>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
