'use client';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

export default function GoalsPage() {
  return (
    <>
      <PageHeader title="Metas Financeiras" description="Defina e acompanhe sua reserva de emergência e metas de investimento.">
        <Button disabled>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Meta
        </Button>
      </PageHeader>
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-transparent p-8 text-center" style={{ minHeight: '400px' }}>
          <h3 className="text-xl font-semibold tracking-tight">Em breve!</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            A funcionalidade de metas e investimentos está em desenvolvimento.
          </p>
      </div>
    </>
  );
}
