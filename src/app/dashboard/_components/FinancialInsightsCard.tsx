'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, Lightbulb, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getFinancialInsights, type GetFinancialInsightsInput, type GetFinancialInsightsOutput } from '@/ai/flows/financial-insights-flow';
import { useUser } from '@/firebase';

interface FinancialInsightsCardProps {
  financialData: GetFinancialInsightsInput;
}

export function FinancialInsightsCard({ financialData }: FinancialInsightsCardProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [analysis, setAnalysis] = React.useState<GetFinancialInsightsOutput | null>(null);
  const { toast } = useToast();
  const { user } = useUser();

  const handleGenerateAnalysis = async () => {
    setIsLoading(true);
    setAnalysis(null);
    try {
      const result = await getFinancialInsights({
        ...financialData,
        userName: user?.firstName || 'Usuário',
      });
      if (!result || !result.summary) {
        throw new Error("A análise retornou vazia.");
      }
      setAnalysis(result);
    } catch (error) {
      console.error("Error generating financial analysis:", error);
      toast({
        variant: "destructive",
        title: "Erro ao gerar análise",
        description: "Não foi possível obter os insights da IA. Tente novamente mais tarde.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-primary" />
          <div>
            <CardTitle className="text-base">Análise com IA</CardTitle>
            <CardDescription className="text-xs">
              Receba um resumo inteligente e dicas para o seu mês.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col items-center justify-center text-center">
        {isLoading ? (
          <div className="space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-sm text-muted-foreground">Analisando seus dados...</p>
          </div>
        ) : analysis ? (
          <div className="space-y-4 text-left w-full">
            <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium">{analysis.summary}</p>
            </div>
            <div className="space-y-2">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-amber-400"/>
                    Pontos de Ação
                </h4>
                <ul className="space-y-2">
                {analysis.actionPoints.map((point, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                        <span>{point}</span>
                    </li>
                ))}
                </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mx-auto">
                <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <p className="text-sm font-medium text-foreground">Pronto para otimizar suas finanças?</p>
            <p className="text-xs text-muted-foreground">Clique abaixo para receber uma análise personalizada do seu mês.</p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleGenerateAnalysis} disabled={isLoading} className="w-full">
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          {analysis ? 'Gerar Nova Análise' : 'Gerar Análise com IA'}
        </Button>
      </CardFooter>
    </Card>
  );
}
