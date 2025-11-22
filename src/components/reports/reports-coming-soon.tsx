"use client";

import { Calendar, Filter, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ReportsComingSoon() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Em Breve: Central de Relatórios</CardTitle>
        <CardDescription>
          Esta área está sendo desenvolvida para oferecer uma visão poderosa e personalizável das suas finanças.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm max-w-full text-foreground/80">
          <p>
            Imagine ter o poder de gerar relatórios detalhados com apenas alguns cliques. Esta seção se tornará o seu
            centro de comando para análises financeiras. Aqui estão algumas das funcionalidades que planejamos
            implementar:
          </p>

          <div className="mt-6 grid gap-6 md:grid-cols-3">
            <div className="flex flex-col items-center rounded-lg border p-4 text-center">
              <Calendar className="mb-3 h-8 w-8 text-primary" />
              <h3 className="font-semibold">Filtros por Período</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Visualize suas transações por semana, mês, ano ou um intervalo de datas personalizado.
              </p>
            </div>
            <div className="flex flex-col items-center rounded-lg border p-4 text-center">
              <Filter className="mb-3 h-8 w-8 text-primary" />
              <h3 className="font-semibold">Filtros Avançados</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Filtre por múltiplas categorias, tipos de transação (renda/despesa) e status (pago/pendente).
              </p>
            </div>
            <div className="flex flex-col items-center rounded-lg border p-4 text-center">
              <FileText className="mb-3 h-8 w-8 text-primary" />
              <h3 className="font-semibold">Exportação de Dados</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Exporte seus relatórios filtrados para formatos como CSV ou PDF para sua contabilidade pessoal ou para
                compartilhar.
              </p>
            </div>
          </div>

          <h4 className="mt-8 font-semibold">Próximos Passos</h4>
          <p>
            Com a base agora estabelecida, o próximo passo lógico será implementar a interface de filtros e a lógica
            para buscar e exibir os dados de acordo com os critérios selecionados.
          </p>
          <p>
            Fique de olho! Esta seção será uma ferramenta poderosa para o seu planejamento financeiro.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
