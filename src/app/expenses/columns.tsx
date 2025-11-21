"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Transaction } from "@/lib/types"
import { ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export const columns: ColumnDef<Transaction>[] = [
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
]
