
"use client"

import { useMemo, useCallback } from 'react';
import { ColumnDef, Row } from "@tanstack/react-table"
import { Transaction } from "@/lib/types"
import { ArrowUpDown, Repeat, Pen, Trash2, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { format, parseISO } from "date-fns"
import { ptBR } from 'date-fns/locale';
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/transactions/status-badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ActionsProps {
  row: Row<Transaction>;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
}

function FreelancerActions({ row, onEdit, onDelete }: ActionsProps) {
  const transaction = row.original;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-8 w-8 p-0 data-[state=open]:bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Abrir menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        <DropdownMenuItem onClick={() => onEdit(transaction)}>
          <Pen className="mr-2 h-3.5 w-3.5" />
          Editar
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onDelete(transaction)} className="text-red-600">
          <Trash2 className="mr-2 h-3.5 w-3.5" />
          Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


type ColumnsProps = {
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
  onStatusChange: (transaction: Transaction) => Promise<void>;
}

export const useFreelancerColumns = ({ onEdit, onDelete, onStatusChange }: ColumnsProps) => {
    const columns = useMemo((): ColumnDef<Transaction>[] => [
      {
        accessorKey: "date",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Data
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
        cell: ({ row }) => {
            const date = parseISO(row.getValue("date"))
            return <div className="pl-4">{format(date, "PPP", { locale: ptBR })}</div>
        }
      },
      {
        accessorKey: "description",
        header: "Descrição",
      },
      {
        accessorKey: "isRecurring",
        header: "Recorrência",
        cell: ({ row }) => {
          const isRecurring = row.getValue("isRecurring");
          return isRecurring ? (
            <Badge variant="secondary" className="flex items-center gap-1.5">
                <Repeat className="h-3 w-3"/>
                Recorrente
            </Badge>
          ) : <Badge variant="outline">Único</Badge>;
        }
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const transaction = row.original;
          return <StatusBadge status={transaction.status} type="income" onClick={() => onStatusChange(transaction)} />
        }
      },
      {
        accessorKey: "amount",
        header: () => <div className="text-right">Valor</div>,
        cell: ({ row }) => {
          const amount = parseFloat(row.getValue("amount"))
          const formatted = new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(amount)

          return <div className="text-right font-medium text-emerald-600">{formatted}</div>
        },
      },
      {
        id: "actions",
        cell: ({ row }) => <FreelancerActions row={row} onEdit={onEdit} onDelete={onDelete} />,
      },
    ], [onEdit, onDelete, onStatusChange]);

    return columns;
}
