'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical, Pencil, FileTerminal, Power, PowerOff } from 'lucide-react';
import type { RentalContract } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import { cn, formatCurrency } from '@/lib/utils';
import { useFirestore, useUser, updateDocumentNonBlocking } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { doc } from 'firebase/firestore';

interface ManageContractsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  contracts: RentalContract[];
  onEditContract: (contract: RentalContract) => void;
}

export function ManageContractsDialog({ isOpen, onClose, contracts, onEditContract }: ManageContractsDialogProps) {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const handleToggleStatus = (contract: RentalContract) => {
    if (!user) return;
    const newStatus = contract.status === 'active' ? 'inactive' : 'active';
    const contractRef = doc(firestore, `users/${user.uid}/rentalContracts`, contract.id);
    updateDocumentNonBlocking(contractRef, { status: newStatus });
    toast({
        title: `Contrato ${newStatus === 'active' ? 'Reativado' : 'Encerrado'}`,
        description: `O status do contrato com "${contract.landlordName}" foi alterado.`
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>Gerenciador de Contratos</DialogTitle>
          <DialogDescription>
            Visualize todos os seus contratos de moradia, ativos e inativos, em um só lugar.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto">
            {contracts.length > 0 ? (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Proprietário</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Valor</TableHead>
                            <TableHead>Vencimento</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {contracts.map(contract => (
                            <TableRow key={contract.id}>
                                <TableCell className="font-medium">{contract.landlordName}</TableCell>
                                <TableCell>{contract.type}</TableCell>
                                <TableCell>{formatCurrency(contract.totalAmount)}</TableCell>
                                <TableCell>Dia {contract.dueDate}</TableCell>
                                <TableCell>
                                    <Badge variant={contract.status === 'active' ? 'default' : 'outline'}>
                                        {contract.status === 'active' ? 'Ativo' : 'Inativo'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                     <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => onEditContract(contract)}>
                                                <Pencil className="mr-2 h-4 w-4" />
                                                Editar
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleToggleStatus(contract)}>
                                                {contract.status === 'active' ? (
                                                    <><PowerOff className="mr-2 h-4 w-4" />Encerrar</>
                                                ) : (
                                                    <><Power className="mr-2 h-4 w-4" />Reativar</>
                                                )}
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            ) : (
                <div className="flex flex-col items-center justify-center text-center text-sm text-muted-foreground p-8 h-48">
                    <FileTerminal className="h-10 w-10 mb-4" />
                    <p>Nenhum contrato cadastrado ainda.</p>
                </div>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
