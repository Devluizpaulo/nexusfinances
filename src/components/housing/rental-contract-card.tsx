'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { FileText, MoreVertical, Pencil, Trash2, Calendar, History, Loader2, Banknote, CreditCard, Copy } from 'lucide-react';
import type { RentalContract, Recurrence } from '@/lib/types';
import { useFirestore, useUser, deleteDocumentNonBlocking } from '@/firebase';
import { doc, writeBatch, getDocs, collection, query, where } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
};

interface RentalContractCardProps {
  contract: RentalContract;
  expenses: Recurrence[];
  onEdit: (contract: RentalContract) => void;
}

export function RentalContractCard({ contract, expenses, onEdit }: RentalContractCardProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState<Recurrence[]>([]);

  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const handleDeleteContract = async () => {
    if (!user) return;
    try {
      const batch = writeBatch(firestore);
      
      // Delete the contract
      const contractRef = doc(firestore, `users/${user.uid}/rentalContracts`, contract.id);
      batch.delete(contractRef);

      // Find and delete the associated recurring expense
      const expensesQuery = query(
        collection(firestore, `users/${user.uid}/expenses`),
        where('recurringSourceId', '==', contract.id)
      );
      const expensesSnapshot = await getDocs(expensesQuery);
      expensesSnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();

      toast({
        title: 'Contrato Excluído',
        description: `O contrato com ${contract.landlordName} e sua despesa recorrente foram removidos.`,
      });
    } catch (error) {
       toast({
        variant: "destructive",
        title: 'Erro ao excluir',
        description: 'Não foi possível remover o contrato. Tente novamente.',
      });
    } finally {
        setIsDeleteDialogOpen(false);
    }
  };

  const fetchHistory = async () => {
    if (!user) return;
    setIsHistoryLoading(true);
    const associatedExpenses = expenses.filter(exp => exp.recurringSourceId === contract.id);
    setPaymentHistory(associatedExpenses.sort((a,b) => parseISO(b.date).getTime() - parseISO(a.date).getTime()));
    setIsHistoryLoading(false);
  };
  
  const handleOpenHistory = () => {
    fetchHistory();
    setIsHistoryOpen(true);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado!", description: "Informação copiada para a área de transferência." });
  };


  return (
    <>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Contrato?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o contrato com "{contract.landlordName}"? A despesa recorrente associada também será removida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteContract} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent>
            <DialogHeader>
              <DialogTitle>Histórico de Pagamentos</DialogTitle>
              <DialogDescription>
                Histórico de pagamentos de aluguel para o contrato com {contract.landlordName}.
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto">
              {isHistoryLoading ? (
                <div className="flex justify-center items-center h-24"><Loader2 className="h-6 w-6 animate-spin" /></div>
              ) : (
                 <Table>
                  <TableHeader><TableRow><TableHead>Data de Vencimento</TableHead><TableHead className="text-right">Valor</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {paymentHistory.length > 0 ? (
                      paymentHistory.map(item => (
                        <TableRow key={item.id}>
                          <TableCell>{format(parseISO(item.date), 'PPP', { locale: ptBR })}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow><TableCell colSpan={2} className="text-center">Nenhum pagamento registrado.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </div>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>{contract.landlordName}</CardTitle>
                <CardDescription>Contrato de Aluguel</CardDescription>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(contract)}><Pencil className="mr-2 h-4 w-4" />Editar Contrato</DropdownMenuItem>
                <DropdownMenuItem onClick={handleOpenHistory}><History className="mr-2 h-4 w-4" />Ver Histórico</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Excluir Contrato</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                    <p className="text-muted-foreground text-xs">Valor Mensal</p>
                    <p className="font-semibold">{formatCurrency(contract.rentAmount)}</p>
                </div>
                 <div>
                    <p className="text-muted-foreground text-xs">Vencimento</p>
                    <p className="font-semibold">Todo dia {contract.dueDate}</p>
                </div>
                <div>
                    <p className="text-muted-foreground text-xs">Início do Contrato</p>
                    <p className="font-semibold">{format(parseISO(contract.startDate), 'dd/MM/yyyy')}</p>
                </div>
            </div>
        </CardContent>
        {contract.paymentMethod && contract.paymentMethod.method !== 'boleto' && (
             <CardFooter>
                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="payment" className="border-b-0">
                        <AccordionTrigger className="text-sm">Ver detalhes do pagamento</AccordionTrigger>
                        <AccordionContent className="space-y-2 text-sm pt-2">
                            {contract.paymentMethod.method === 'pix' && (
                                <div className="flex items-center justify-between rounded-md border p-2">
                                    <div>
                                        <p className="font-medium">PIX - {contract.paymentMethod.pixKeyType}</p>
                                        <p className="text-muted-foreground break-all">{contract.paymentMethod.pixKey}</p>
                                    </div>
                                    <Button size="sm" variant="ghost" onClick={() => handleCopy(contract.paymentMethod?.pixKey || '')}><Copy className="h-4 w-4" /></Button>
                                </div>
                            )}
                            {contract.paymentMethod.method === 'bankTransfer' && (
                                <div className="rounded-md border p-2">
                                     <p className="font-medium">Transferência Bancária</p>
                                     <div className="grid grid-cols-3 gap-2 mt-1 text-xs">
                                        <p><strong>Banco:</strong> {contract.paymentMethod.bankName}</p>
                                        <p><strong>Agência:</strong> {contract.paymentMethod.agency}</p>
                                        <p><strong>Conta:</strong> {contract.paymentMethod.account}</p>
                                     </div>
                                </div>
                            )}
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
             </CardFooter>
        )}
      </Card>
    </>
  );
}
