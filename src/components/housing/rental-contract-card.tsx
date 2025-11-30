
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { FileText, MoreVertical, Pencil, Trash2, History, Loader2, Copy, AlertTriangle, CalendarClock } from 'lucide-react';
import type { RentalContract, Recurrence } from '@/lib/types';
import { useFirestore, useUser, deleteDocumentNonBlocking } from '@/firebase';
import { doc, writeBatch, getDocs, collection, query, where } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format, parseISO, differenceInDays, isPast } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { cn, formatCurrency } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface RentalContractCardProps {
  contract: RentalContract;
  onEdit: (contract: RentalContract, isRenewal?: boolean) => void;
}

export function RentalContractCard({ contract, onEdit }: RentalContractCardProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  
  const isInactive = contract.status === 'inactive';
  
  const contractStatus = (() => {
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
  })();

  const cardBorderClass = 
      contractStatus?.variant === 'destructive' ? 'border-destructive/80'
    : contractStatus?.variant === 'secondary' ? 'border-amber-500/80'
    : isInactive ? 'border-dashed'
    : 'border-border';

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

      <Card className={cn("transition-all", isInactive && "bg-muted/50", cardBorderClass)}>
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
