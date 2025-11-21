"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import { DataTableRowActions } from "./actions"
import type { AppUser } from "@/firebase"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export const columns: ColumnDef<AppUser>[] = [
  {
    accessorKey: "displayName",
    header: "Nome",
    cell: ({ row }) => {
        const user = row.original;
        return (
            <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                    <AvatarImage src={user.photoURL || undefined} />
                    <AvatarFallback>{user.displayName?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                </Avatar>
                <span className="font-medium">{user.displayName}</span>
            </div>
        )
    }
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "role",
    header: "Função",
    cell: ({ row }) => {
      const role = row.getValue("role") as string;
      const variant = role === 'superadmin' ? 'default' : 'secondary';
      return <Badge variant={variant}>{role}</Badge>
    }
  },
  {
    accessorKey: "registrationDate",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Data de Cadastro
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
        const registrationDate = row.original.registrationDate;
        if (!registrationDate) return "N/A";
        
        // Firestore Timestamps can be objects with toDate(), or ISO strings
        const date = (registrationDate as any).toDate ? (registrationDate as any).toDate() : new Date(registrationDate as string);

        return <div className="pl-4">{format(date, "PPP", { locale: ptBR })}</div>
    }
  },
  {
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
]
