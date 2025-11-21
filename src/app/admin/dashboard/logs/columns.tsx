"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Info, AlertTriangle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import type { Log } from "@/lib/types"

const levelConfig = {
    info: { icon: Info, color: "bg-blue-100 text-blue-800" },
    warn: { icon: AlertTriangle, color: "bg-yellow-100 text-yellow-800" },
    error: { icon: XCircle, color: "bg-red-100 text-red-800" },
}

export const columns: ColumnDef<Log>[] = [
  {
    accessorKey: "timestamp",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Data e Hora
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
        const timestamp = row.original.timestamp;
        if (!timestamp) return "N/A";
        
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp as string);

        return <div className="pl-4">{format(date, "Pp", { locale: ptBR })}</div>
    }
  },
  {
    accessorKey: "level",
    header: "Nível",
    cell: ({ row }) => {
      const level = row.getValue("level") as keyof typeof levelConfig;
      const config = levelConfig[level] || levelConfig.info;
      const Icon = config.icon;
      return (
          <Badge variant="outline" className={`gap-1.5 pl-1.5 pr-2.5 ${config.color}`}>
              <Icon className="h-3.5 w-3.5" />
              {level}
        </Badge>
      )
    }
  },
  {
    accessorKey: "message",
    header: "Mensagem",
    cell: ({ row }) => {
        return <div className="max-w-xs truncate">{row.getValue("message")}</div>
    }
  },
  {
    accessorKey: "createdByName",
    header: "Autor",
  },
]
