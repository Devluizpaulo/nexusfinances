"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Transaction } from "@/lib/types"
import { ArrowUpDown, CheckCircle, XCircle, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { ptBR } from 'date-fns/locale';
import { Badge } from "@/components/ui/badge";
import { DataTableRowActions } from "./actions"

type ColumnsProps = {
  onEdit: (transaction: Transaction) => void;
}


export const columns = ({ onEdit }: ColumnsProps): ColumnDef<Transaction>[] => [
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
    accessorKey: "isRecurring",
    header: "Recorrente",
    cell: ({ row }) => {
      const isRecurring = row.getValue("isRecurring")
      const Icon = isRecurring ? CheckCircle : XCircle
      const color = isRecurring ? "text-green-500" : "text-muted-foreground"
      return <Icon className={`mx-auto h-5 w-5 ${color}`} />
    }
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status")
      if (status === 'paid') {
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100/80"><CheckCircle className="mr-1.5 h-3.5 w-3.5" /> Recebido</Badge>
      }
      return <Badge variant="secondary" className="bg-orange-100 text-orange-800 hover:bg-orange-100/80"><Clock className="mr-1.5 h-3.5 w-3.5" /> Pendente</Badge>
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
    cell: ({ row }) => <DataTableRowActions row={row} transactionType="income" onEdit={onEdit} />,
  },
]
