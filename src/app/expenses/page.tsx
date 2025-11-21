import { mockTransactions } from "@/lib/data"
import { DataTable } from "@/components/data-table/data-table"
import { columns } from "./columns"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"

export default function ExpensesPage() {
  const expenseData = mockTransactions.filter((t) => t.type === 'expense')

  return (
    <>
      <PageHeader 
        title="Expenses"
        description="Track and manage all your expenses."
      >
        <Button>
            <PlusCircle className="mr-2 h-4 w-4"/>
            Add Expense
        </Button>
      </PageHeader>
      <DataTable columns={columns} data={expenseData} />
    </>
  )
}
