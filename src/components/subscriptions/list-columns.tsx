"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Transaction } from "@/lib/types"
import { ArrowUpDown, Repeat } from "lucide-react"
import { Button } from "@/components/ui/button"
import { format, parseISO, addMonths } from "date-fns"
import { ptBR } from 'date-fns/locale';
import { Badge } from "@/components/ui/badge";
import { RecurrenceCardActions } from "../recurrences/recurrence-card-actions"

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
};

type ColumnsProps = {
  onEdit: (transaction: Transaction) => void;
}


export const columns = ({ onEdit }: ColumnsProps): ColumnDef<Transaction>[] => [
  {
    accessorKey: "description",
    header: "Serviço",
    cell: ({ row }) => {
      const recurrence = row.original;
      return (
        <div className="flex flex-col">
          <span className="font-medium">{recurrence.description}</span>
           <span className="text-xs text-muted-foreground">
              Próximo: {format(addMonths(parseISO(recurrence.date), 1), 'dd/MM/yy', { locale: ptBR })}
            </span>
        </div>
      )
    }
  },
  {
    accessorKey: "amount",
    header: () => <div className="text-right">Valor</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amount"))
      return <div className="text-right font-medium">{formatCurrency(amount)}</div>
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <RecurrenceCardActions recurrence={row.original} onEdit={() => onEdit(row.original)} />,
  },
]
