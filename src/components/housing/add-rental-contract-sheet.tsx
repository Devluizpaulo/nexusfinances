

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
import { Loader2 } from 'lucide-react';
import { CurrencyInput } from '../ui/currency-input';
import { Separator } from '../ui/separator';
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Contrato de Moradia' : 'Cadastrar Contrato de Moradia'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Atualize os detalhes do seu contrato.' : 'Insira os detalhes do seu contrato. Uma despesa recorrente será criada automaticamente.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground pt-2">Informações do Contrato</h3>
            <FormField
              control={form.control}
              name="landlordName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Proprietário / Imobiliária</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Imobiliária X Ltda" {...field} />
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
                    <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
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

            <div className="grid grid-cols-2 gap-4">
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

             <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dia do Vencimento</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} max={31} {...field} />
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
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
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
            
            <Separator />
            <h3 className="text-sm font-semibold text-muted-foreground">Vigência do Contrato</h3>
             <div className="grid grid-cols-2 gap-4">
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
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Renovação Automática</FormLabel>
                  </div>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
              )}
            />
            
            <Separator />
            <h3 className="text-sm font-semibold text-muted-foreground">Meio de Pagamento</h3>
            <FormField
              control={form.control}
              name="paymentMethod"
              render={() => (
                <div className="space-y-3">
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
                        <SelectTrigger>
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
                    <div className="grid gap-3">
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
                          />
                        </FormControl>
                      </FormItem>
                    </div>
                  )}

                  {paymentMethod?.method === 'bankTransfer' && (
                    <div className="grid gap-3">
                      <FormItem>
                        <FormLabel>Dados bancários</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={
                              'Banco, agência, conta, tipo de conta, titular, CPF/CNPJ...\nEx.: Banco XPTO, ag. 0000, conta 000000-0, cc, João Silva, CPF 000.000.000-00'
                            }
                            value={paymentMethod.instructions || ''}
                            onChange={(e) => {
                              const full = e.target.value;
                              form.setValue('paymentMethod', {
                                ...paymentMethod,
                                method: 'bankTransfer',
                                instructions: full,
                                // Pequeno resumo para exibição/cópia rápida
                                identifier:
                                  paymentMethod?.identifier ||
                                  (full ? full.split('\n')[0]?.slice(0, 80) : ''),
                              });
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          Detalhe aqui tudo o que você precisa para fazer a transferência.
                        </FormDescription>
                      </FormItem>
                    </div>
                  )}

                  {paymentMethod?.method === 'boleto' && (
                    <div className="grid gap-3">
                      <FormItem>
                        <FormLabel>Como você recebe o boleto?</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={
                              'Ex.: Recebo o boleto por e-mail da imobiliária, acesso o app do banco tal, ou faço download no portal X.'
                            }
                            value={paymentMethod.instructions || ''}
                            onChange={(e) =>
                              form.setValue('paymentMethod', {
                                ...paymentMethod,
                                method: 'boleto',
                                instructions: e.target.value,
                              })
                            }
                          />
                        </FormControl>
                      </FormItem>
                      <FormItem>
                        <FormLabel>Identificador (opcional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex.: E-mail da imobiliária, portal, código de cliente..."
                            value={paymentMethod.identifier || ''}
                            onChange={(e) =>
                              form.setValue('paymentMethod', {
                                ...paymentMethod,
                                method: 'boleto',
                                identifier: e.target.value,
                              })
                            }
                          />
                        </FormControl>
                      </FormItem>
                    </div>
                  )}

                  {paymentMethod?.method &&
                    !['pix', 'bankTransfer', 'boleto'].includes(paymentMethod.method) && (
                      <FormItem>
                        <FormLabel>Detalhes do pagamento (opcional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Anote aqui qualquer informação útil para lembrar como você paga este contrato."
                            value={paymentMethod.instructions || ''}
                            onChange={(e) =>
                              form.setValue('paymentMethod', {
                                ...paymentMethod,
                                instructions: e.target.value,
                              })
                            }
                          />
                        </FormControl>
                      </FormItem>
                    )}
                </div>
              )}
            />

            <Separator />
            <h3 className="text-sm font-semibold text-muted-foreground">Informações Adicionais (Opcional)</h3>
            <FormField
              control={form.control}
              name="propertyAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço do Imóvel</FormLabel>
                  <FormControl><Input placeholder="Rua, número, bairro..." {...field} /></FormControl>
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
                    <FormControl><Textarea placeholder="Detalhes importantes, contatos, etc." {...field} /></FormControl>
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
                {isEditing ? 'Salvar Alterações' : 'Salvar Contrato'}
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
