
"use client"

import { useMemo } from 'react';
import { ColumnDef } from "@tanstack/react-table"
import { Transaction } from "@/lib/types"
import { ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { format, parseISO } from "date-fns"
import { ptBR } from 'date-fns/locale';
import { Badge } from "@/components/ui/badge";
import { DataTableRowActions } from "./actions"
import { StatusBadge } from "@/components/transactions/status-badge"

type ColumnsProps = {
  onEdit: (transaction: Transaction) => void;
  onStatusChange: (transaction: Transaction) => Promise<void>;
  optimisticDelete?: (id: string, collectionPath: string) => Promise<void>;
}


export const useIncomeColumns = ({ onEdit, onStatusChange }: ColumnsProps) => {
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
        accessorKey: "category",
        header: "Categoria",
        cell: ({ row }) => {
          return <Badge variant="outline">{row.getValue("category")}</Badge>
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
        cell: ({ row }) => <DataTableRowActions row={row} onEdit={onEdit} transactionType="income" />,
      },
    ], [onEdit, onStatusChange]);

    return columns;
};
