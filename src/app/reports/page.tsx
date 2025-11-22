'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Filter, Calendar } from 'lucide-react';

export default function ReportsPage() {
  return (
    <>
      <PageHeader title="Relatórios" description="Analise suas finanças com filtros e visualizações detalhadas." />
      <Card>
        <CardHeader>
          <CardTitle>Em Breve: Central de Relatórios</CardTitle>
          <CardDescription>
            Esta área está sendo desenvolvida para oferecer uma visão poderosa e personalizável das suas finanças.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <div className="prose prose-sm max-w-full text-foreground/80">
            <p>Imagine ter o poder de gerar relatórios detalhados com apenas alguns cliques. Esta seção se tornará o seu centro de comando para análises financeiras. Aqui estão algumas das funcionalidades que planejamos implementar:</p>
            
            <div className="mt-6 grid gap-6 md:grid-cols-3">
              <div className="flex flex-col items-center text-center p-4 rounded-lg border">
                <Calendar className="h-8 w-8 text-primary mb-3" />
                <h3 className="font-semibold">Filtros por Período</h3>
                <p className="text-xs text-muted-foreground mt-1">Visualize suas transações por semana, mês, ano ou um intervalo de datas personalizado.</p>
              </div>
              <div className="flex flex-col items-center text-center p-4 rounded-lg border">
                <Filter className="h-8 w-8 text-primary mb-3" />
                <h3 className="font-semibold">Filtros Avançados</h3>
                <p className="text-xs text-muted-foreground mt-1">Filtre por múltiplas categorias, tipos de transação (renda/despesa) e status (pago/pendente).</p>
              </div>
              <div className="flex flex-col items-center text-center p-4 rounded-lg border">
                <FileText className="h-8 w-8 text-primary mb-3" />
                <h3 className="font-semibold">Exportação de Dados</h3>
                <p className="text-xs text-muted-foreground mt-1">Exporte seus relatórios filtrados para formatos como CSV ou PDF para sua contabilidade pessoal ou para compartilhar.</p>
              </div>
            </div>

            <h4 className="mt-8 font-semibold">Próximos Passos</h4>
            <p>Com a base agora estabelecida, o próximo passo lógico seria implementar a interface de filtros e a lógica para buscar e exibir os dados de acordo com os critérios selecionados.</p>
            <p>Fique de olho! Esta seção será uma ferramenta poderosa para o seu planejamento financeiro.</p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
