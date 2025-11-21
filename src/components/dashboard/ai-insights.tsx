'use client';

import { useState } from 'react';
import { Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { generateFinancialInsights, type FinancialInsightsInput, type FinancialInsightsOutput } from '@/ai/flows/financial-insights-generator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

export function AiInsights({ financialData }: { financialData: FinancialInsightsInput }) {
  const [insights, setInsights] = useState<FinancialInsightsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateInsights = async () => {
    setIsLoading(true);
    setError(null);
    setInsights(null);
    try {
      const result = await generateFinancialInsights(financialData);
      setInsights(result);
    } catch (e) {
      setError('Falha ao gerar insights. Por favor, tente novamente.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Wand2 className="h-6 w-6 text-primary" />
            </div>
            <div>
                <CardTitle>Insights Financeiros Educacionais</CardTitle>
                <CardDescription>Obtenha insights e recomendações com tecnologia de IA com base em seus dados financeiros.</CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent className="min-h-[200px]">
        {isLoading ? (
          <div className="space-y-4 p-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-full" />
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : insights ? (
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-semibold text-base">Resumo</h3>
              <p className="text-muted-foreground">{insights.summary}</p>
            </div>
            <div>
              <h3 className="font-semibold text-base">Insights e Recomendações</h3>
              <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
                {insights.insights.map((insight, index) => (
                  <li key={index}>{insight}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-4 rounded-lg border-2 border-dashed border-border bg-transparent p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Clique no botão para gerar seu relatório financeiro personalizado.
            </p>
            <Button onClick={handleGenerateInsights} disabled={isLoading}>
              <Wand2 className="mr-2" />
              Gerar Insights
            </Button>
          </div>
        )}
      </CardContent>
      {!isLoading && (insights || error) && (
        <CardFooter>
            <Button onClick={handleGenerateInsights} variant="outline" size="sm">
                <Wand2 className="mr-2 h-4 w-4"/>
                Gerar Novamente
            </Button>
        </CardFooter>
      )}
    </Card>
  );
}
