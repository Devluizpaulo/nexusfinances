
'use client';

import { useState, useMemo, memo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from '../ui/button';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import type { RentalContract, Transaction } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { FileText, MoreVertical, Pencil, Trash2, History, AlertTriangle, CalendarClock, Info } from 'lucide-react';
import { doc, writeBatch, getDocs, collection, query, where, orderBy, deleteDoc } from 'firebase/firestore';
import { format, parseISO, differenceInDays, isPast } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { cn, formatCurrency } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { RegisterHousingPaymentDialog } from '@/components/housing/register-housing-payment-dialog';
import { Separator } from '../ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface RentalContractCardProps {
  contract: RentalContract;
  onEdit: (contract: RentalContract, isRenewal?: boolean) => void;
}

function RentalContractCardComponent({ contract, onEdit }: RentalContractCardProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const isInactive = contract.status === 'inactive';

  const paymentHistoryQuery = useMemoFirebase(() => {
    if (!user || !contract.id) return null;
    return query(
      collection(firestore, `users/${user.uid}/expenses`),
      where('recurringSourceId', '==', contract.id),
      orderBy('date', 'desc')
    );
  }, [user, firestore, contract.id]);

  const { data: paymentHistory } = useCollection<Transaction>(paymentHistoryQuery);

  const contractStatus = useMemo(() => {
    if (isInactive) return { variant: 'outline' as const, text: 'Encerrado' };

    if (contract.endDate) {
      const endDate = parseISO(contract.endDate);
      const daysUntilEnd = differenceInDays(endDate, new Date());

      if (isPast(endDate)) {
        return { variant: 'destructive' as const, text: 'Expirado', icon: AlertTriangle };
      }
      if (daysUntilEnd <= 30) {
        return { variant: 'secondary' as const, text: 'Vence em breve', icon: CalendarClock };
      }
    }
    return null;
  }, [contract.endDate, isInactive]);

  const handleDeleteContract = async () => {
    if (!user || !firestore) return;
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
        description: `O contrato com ${contract.landlordName} e suas despesas recorrentes foram removidos.`,
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

  return (
    <>
      <RegisterHousingPaymentDialog
        isOpen={isPaymentDialogOpen}
        onClose={() => setIsPaymentDialogOpen(false)}
        contract={contract}
      />
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Contrato?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o contrato com &quot;{contract.landlordName}&quot;? A despesa recorrente associada também será removida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteContract} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
               <FileText className="h-5 w-5" />
              Detalhes do Contrato
            </DialogTitle>
            <DialogDescription>
              Todas as informações sobre seu contrato com {contract.landlordName}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-4">
             <div className="rounded-lg border p-4 space-y-2">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Proprietário/Imobiliária</p>
                    <p className="font-semibold">{contract.landlordName}</p>
                  </div>
                   <div>
                    <p className="text-muted-foreground text-xs">Tipo</p>
                    <p className="font-semibold">{contract.type}</p>
                  </div>
                </div>
                 {contract.propertyAddress && (
                     <div>
                        <p className="text-muted-foreground text-xs">Endereço do Imóvel</p>
                        <p className="text-sm">{contract.propertyAddress}</p>
                    </div>
                )}
            </div>

            <div className="rounded-lg border p-4 space-y-4">
                <p className="font-semibold text-sm">Valores</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                   <div>
                        <p className="text-muted-foreground text-xs">Valor Total</p>
                        <p className="font-semibold">{formatCurrency(contract.totalAmount || 0)}</p>
                    </div>
                    {contract.type && contract.type.includes('Aluguel') && contract.rentAmount ? (
                        <div>
                            <p className="text-muted-foreground text-xs">Aluguel</p>
                            <p className="font-semibold">{formatCurrency(contract.rentAmount)}</p>
                        </div>
                    ) : null}
                    {contract.type && contract.type.includes('Condomínio') && contract.condoFee ? (
                        <div>
                            <p className="text-muted-foreground text-xs">Condomínio</p>
                            <p className="font-semibold">{formatCurrency(contract.condoFee)}</p>
                        </div>
                    ) : null}
                     <div>
                        <p className="text-muted-foreground text-xs">Vencimento</p>
                        <p className="font-semibold">Todo dia {contract.dueDate}</p>
                    </div>
                </div>
            </div>
             <div className="rounded-lg border p-4 space-y-4">
                <p className="font-semibold text-sm">Vigência</p>
                 <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">Início do Contrato</p>
                        <p className="font-semibold">
                          {contract.startDate ? format(parseISO(contract.startDate), 'dd/MM/yyyy') : 'N/A'}
                        </p>
                    </div>
                    {contract.endDate && (
                        <div>
                            <p className="text-muted-foreground text-xs">Fim do Contrato</p>
                            <p className="font-semibold">{format(parseISO(contract.endDate), 'dd/MM/yyyy')}</p>
                        </div>
                    )}
                 </div>
             </div>

            {contract.paymentMethod?.method && (
               <div className="rounded-lg border p-4 space-y-2">
                    <p className="font-semibold text-sm">Detalhes do Pagamento</p>
                    <p className="text-xs text-muted-foreground">Método: <Badge variant="secondary">{contract.paymentMethod.method}</Badge></p>
                    {contract.paymentMethod.identifier && <p className="text-xs text-muted-foreground">Identificador: {contract.paymentMethod.identifier}</p>}
                    {contract.paymentMethod.instructions && <p className="text-xs text-muted-foreground">Instruções: {contract.paymentMethod.instructions}</p>}
               </div>
            )}
             
            {paymentHistory && paymentHistory.length > 0 && (
                 <div className="rounded-lg border p-4 space-y-2">
                    <p className="font-semibold text-sm">Histórico de Pagamentos ({paymentHistory.length})</p>
                    <Table>
                        <TableHeader><TableRow><TableHead>Data</TableHead><TableHead className="text-right">Valor</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {paymentHistory.map(p => (
                                <TableRow key={p.id}>
                                    <TableCell>{format(parseISO(p.date), 'dd/MM/yyyy')}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(p.amount)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                 </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Card className={cn("transition-all flex flex-col h-full", isInactive && "bg-muted/50", cardBorderClass)}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">{contract.landlordName}</CardTitle>
                <CardDescription>{contract.type || 'Contrato'}</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
                {contractStatus && (
                     <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                               <Badge variant={contractStatus.variant}>
                                {contractStatus.icon && <contractStatus.icon className="h-3.5 w-3.5 mr-1" />}
                                {contractStatus.text}
                                </Badge>
                            </TooltipTrigger>
                             <TooltipContent>
                                {contractStatus.text === 'Expirado' && <p>O contrato venceu. Considere encerrá-lo ou renová-lo.</p>}
                                {contractStatus.text === 'Vence em breve' && <p>Este contrato está prestes a vencer. Planeje a renovação.</p>}
                             </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(contract)}><Pencil className="mr-2 h-4 w-4" />Editar Contrato</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(contract, true)}><History className="mr-2 h-4 w-4" />Renovar/Reajustar</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Excluir Contrato</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-grow space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                    <p className="text-muted-foreground text-xs">Valor Total</p>
                    <p className="font-semibold text-lg">{formatCurrency(contract.totalAmount || 0)}</p>
                </div>
                 <div>
                    <p className="text-muted-foreground text-xs">Vencimento</p>
                    <p className="font-semibold text-lg">Todo dia {contract.dueDate}</p>
                </div>
            </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 items-stretch">
          <Button variant="outline" size="sm" onClick={() => setIsDetailsOpen(true)}>
             <Info className="mr-2 h-4 w-4" />
             Ver Detalhes
          </Button>
          {!isInactive && (
            <Button
              type="button"
              variant="default"
              className="w-full justify-center gap-2"
              onClick={(e) => {
                e.stopPropagation();
                setIsPaymentDialogOpen(true);
              }}
            >
              Registrar Pagamento
            </Button>
          )}
        </CardFooter>
      </Card>
    </>
  );
}

export const RentalContractCardMemo = memo(RentalContractCardComponent);
