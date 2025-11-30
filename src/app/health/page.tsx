'use client';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle, Building, User } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function HealthPage() {
  // A lógica para buscar e exibir os dados será adicionada nos próximos passos.
  // Por enquanto, esta é a estrutura visual da página.

  return (
    <div className="space-y-6">
      <PageHeader
        title="Saúde e Contatos"
        description="Gerencie sua agenda de contatos de saúde, incluindo empresas e profissionais."
      >
        <div className="flex gap-2">
          <Button variant="outline">
            <Building className="mr-2 h-4 w-4" />
            Adicionar Empresa
          </Button>
          <Button>
            <User className="mr-2 h-4 w-4" />
            Adicionar Profissional
          </Button>
        </div>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>Sua Agenda de Saúde</CardTitle>
          <CardDescription>
            Aqui ficará a lista de empresas e profissionais cadastrados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed text-center">
            <h3 className="text-lg font-semibold">Ainda em construção</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Os próximos passos são criar os formulários de cadastro e a lista para exibir os contatos aqui.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
