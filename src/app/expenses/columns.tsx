"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Transaction } from "@/lib/types"
import { ArrowUpDown, CheckCircle, XCircle, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import { DataTableRowActions } from "./actions"
import { StatusBadge } from "@/components/transactions/status-badge"

type ColumnsProps = {
  onEdit: (transaction: Transaction) => void;
  onStatusChange: (transaction: Transaction) => void;
}

export const columns = ({ onEdit, onStatusChange }: ColumnsProps): ColumnDef<Transaction>[] => [
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
        const date = new Date(row.getValue("date"))
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
      return <StatusBadge status={transaction.status} type="expense" onClick={() => onStatusChange(transaction)} />
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

      return <div className="text-right font-medium">{formatted}</div>
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} transactionType="expense" onEdit={onEdit} />,
  },
]
