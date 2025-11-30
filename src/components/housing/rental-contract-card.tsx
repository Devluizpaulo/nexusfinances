
'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { FileText, MoreVertical, Pencil, Trash2, History, Loader2, Copy, ChevronsRight } from 'lucide-react';
import type { RentalContract, Recurrence } from '@/lib/types';
import { useFirestore, useUser, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { doc, writeBatch, getDocs, collection, query, where } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format, parseISO, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { cn, formatCurrency } from '@/lib/utils';


interface RentalContractCardProps {
  contract: RentalContract;
  onEdit: (contract: RentalContract) => void;
}

export function RentalContractCard({ contract, onEdit }: RentalContractCardProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState<Recurrence[]>([]);

  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  
  const isInactive = contract.status === 'inactive';

  const handleDeleteContract = async () => {
    if (!user) return;
    try {
      const batch = writeBatch(firestore);
      const contractRef = doc(firestore, `users/${user.uid}/rentalContracts`, contract.id);
      batch.delete(contractRef);

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

  const handleToggleStatus = () => {
    if (!user) return;
    const newStatus = contract.status === 'active' ? 'inactive' : 'active';
    const contractRef = doc(firestore, `users/${user.uid}/rentalContracts`, contract.id);
    updateDocumentNonBlocking(contractRef, { status: newStatus });
    toast({
        title: `Contrato ${newStatus === 'active' ? 'Reativado' : 'Encerrado'}`,
        description: `O status do contrato foi alterado.`
    });
  }

  const handleCopy = (text?: string) => {
    if(!text) return;
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

      <Card className={cn(isInactive && "bg-muted/50 border-dashed")}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>{contract.landlordName}</CardTitle>
                <CardDescription>{contract.type}</CardDescription>
              </div>
            </div>
             {isInactive && <Badge variant="outline">Encerrado</Badge>}
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(contract)}><Pencil className="mr-2 h-4 w-4" />Editar Contrato</DropdownMenuItem>
                <DropdownMenuItem onClick={handleToggleStatus}>
                    <ChevronsRight className="mr-2 h-4 w-4" />
                    {isInactive ? 'Reativar Contrato' : 'Encerrar Contrato'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Excluir Contrato</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                    <p className="text-muted-foreground text-xs">Valor Total</p>
                    <p className="font-semibold">{formatCurrency(contract.totalAmount)}</p>
                </div>
                {contract.type.includes('Aluguel') && contract.rentAmount && (
                     <div>
                        <p className="text-muted-foreground text-xs">Aluguel</p>
                        <p className="font-semibold">{formatCurrency(contract.rentAmount)}</p>
                    </div>
                )}
                {contract.type.includes('Condomínio') && contract.condoFee && (
                     <div>
                        <p className="text-muted-foreground text-xs">Condomínio</p>
                        <p className="font-semibold">{formatCurrency(contract.condoFee)}</p>
                    </div>
                )}
                 <div>
                    <p className="text-muted-foreground text-xs">Vencimento</p>
                    <p className="font-semibold">Todo dia {contract.dueDate}</p>
                </div>
                <div>
                    <p className="text-muted-foreground text-xs">Início do Contrato</p>
                    <p className="font-semibold">{format(parseISO(contract.startDate), 'dd/MM/yyyy')}</p>
                </div>
                {contract.endDate && (
                    <div>
                        <p className="text-muted-foreground text-xs">Fim do Contrato</p>
                        <p className="font-semibold">{format(parseISO(contract.endDate), 'dd/MM/yyyy')}</p>
                    </div>
                )}
            </div>
            {contract.propertyAddress && (
                 <div>
                    <p className="text-muted-foreground text-xs">Endereço do Imóvel</p>
                    <p className="text-sm">{contract.propertyAddress}</p>
                </div>
            )}
        </CardContent>
        {contract.paymentMethod && (
             <CardFooter>
                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="payment" className="border-b-0">
                        <AccordionTrigger className="text-sm">Ver detalhes do pagamento</AccordionTrigger>
                        <AccordionContent className="space-y-2 text-sm pt-2">
                            <div className="flex justify-between items-center rounded-md border p-2">
                                <div>
                                    <p className="font-medium">{contract.paymentMethod.method}</p>
                                    <p className="text-muted-foreground break-all">{contract.paymentMethod.identifier}</p>
                                </div>
                                <Button size="sm" variant="ghost" onClick={() => handleCopy(contract.paymentMethod?.identifier || '')}><Copy className="h-4 w-4" /></Button>
                            </div>
                            {contract.paymentMethod.instructions && (
                                 <p className="text-xs text-muted-foreground px-1">{contract.paymentMethod.instructions}</p>
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
