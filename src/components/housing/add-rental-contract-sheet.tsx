

'use client';

import { useForm } from 'react-hook-form';
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
import { Loader2, Home, Calendar, CreditCard, Info, DollarSign, FileText } from 'lucide-react';
import { CurrencyInput } from '../ui/currency-input';
import { Separator } from '../ui/separator';
import type { RentalContract } from '@/lib/types';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { useRentalContractForm, type RentalFormValues } from '@/hooks/use-rental-contract-form';
import { DatePicker } from '../ui/date-picker';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';

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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-full sm:max-w-2xl lg:max-w-4xl max-h-[95vh] h-full sm:h-auto overflow-hidden p-0">
        <div className="flex flex-col h-full">
          {/* Header com gradiente */}
          <div className="relative bg-gradient-to-r from-primary/10 via-primary/5 to-background border-b px-6 py-6">
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
                <Badge variant="secondary" className="w-fit">
                  <Calendar className="h-3 w-3 mr-1" />
                  Recorrência automática
                </Badge>
              )}
            </DialogHeader>
          </div>

          {/* Conteúdo scrollável */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
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
