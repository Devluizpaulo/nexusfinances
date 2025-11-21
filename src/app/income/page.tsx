import { mockTransactions } from "@/lib/data"
import { Transaction } from "@/lib/types"
import { DataTable } from "@/components/data-table/data-table"
import { columns } from "./columns"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"

export default function IncomePage() {
  const incomeData = mockTransactions.filter((t) => t.type === 'income')

  return (
    <>
      <PageHeader 
        title="Renda"
        description="Acompanhe e gerencie todas as suas fontes de renda."
      >
        <Button>
            <PlusCircle className="mr-2 h-4 w-4"/>
            Adicionar Renda
        </Button>
      </PageHeader>
      <DataTable columns={columns} data={incomeData} />
    </>
  )
}
