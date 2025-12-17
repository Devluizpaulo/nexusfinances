
"use client"

import { useMemo } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { Transaction } from "@/lib/types"
import { ArrowUpDown, Lightbulb, Droplet, Flame, Wifi, Phone, Tv, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import { TransactionActions } from "@/components/transactions/actions"
import { StatusBadge } from "@/components/transactions/status-badge"

type ColumnsProps = {
  onEdit: (transaction: Transaction) => void;
  onStatusChange: (transaction: Transaction) => Promise<void>;
}

// Get icon for subcategory
const getSubcategoryIcon = (subcategory?: string) => {
  switch (subcategory) {
    case 'Luz': return <Lightbulb className="h-3 w-3" />;
    case 'Água': return <Droplet className="h-3 w-3" />;
    case 'Gás': return <Flame className="h-3 w-3" />;
    case 'Internet': return <Wifi className="h-3 w-3" />;
    case 'Celular':
    case 'Telefone Fixo': return <Phone className="h-3 w-3" />;
    case 'TV por Assinatura': return <Tv className="h-3 w-3" />;
    default: return <Zap className="h-3 w-3" />;
  }
};

export const useExpenseColumns = ({ onEdit, onStatusChange }: ColumnsProps) => {
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
        cell: ({ row }) => {
          const transaction = row.original;
          return (
            <div className="flex items-center gap-2">
              {transaction.category === 'Contas de Consumo' && getSubcategoryIcon(transaction.subcategory)}
              <span>{row.getValue("description")}</span>
            </div>
          );
        }
      },
      {
        accessorKey: "category",
        header: "Categoria",
        cell: ({ row }) => {
          const transaction = row.original;
          if (transaction.category === 'Contas de Consumo' && transaction.subcategory) {
            return (
              <div className="flex items-center gap-1">
                <Badge variant="outline" className="flex items-center gap-1">
                  {getSubcategoryIcon(transaction.subcategory)}
                  {transaction.subcategory}
                </Badge>
              </div>
            );
          }
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
        cell: ({ row }) => <TransactionActions row={row} onEdit={onEdit} transactionType="expense" />,
      },
    ], [onEdit, onStatusChange]);

    return columns;
};
