
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
import { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface FinancialInsightsCardProps {
  financialData: GetFinancialInsightsInput;
}

export function FinancialInsightsCard({ financialData }: FinancialInsightsCardProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [analysis, setAnalysis] = React.useState<GetFinancialInsightsOutput | null>(null);
  const { toast } = useToast();
  const { user } = useUser();

  const handleGenerateAnalysis = useCallback(async () => {
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
  }, [financialData, user?.firstName, toast]);

  return (
    <Card className="rounded-2xl border border-slate-900/60 bg-slate-950/70 p-4 sm:p-5 shadow-[0_18px_45px_-30px_rgba(15,23,42,1)]">
        <AnimatePresence mode="wait">
            {isLoading ? (
                <motion.div
                    key="loading"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex flex-col items-center justify-center text-center p-4 space-y-3"
                >
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Analisando seus dados...</p>
                </motion.div>
            ) : analysis ? (
                <motion.div
                    key="analysis"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 w-full"
                >
                    <div className="flex items-center gap-3 flex-1">
                        <Sparkles className="h-5 w-5 text-primary shrink-0" />
                        <p className="text-sm font-medium">{analysis.summary}</p>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                        <TooltipProvider>
                            <div className="flex items-center gap-2">
                                {analysis.actionPoints.map((point, index) => (
                                    <Tooltip key={index}>
                                        <TooltipTrigger asChild>
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/10 hover:bg-amber-500/20 cursor-pointer">
                                                <Lightbulb className="h-4 w-4 text-amber-400" />
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{point}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                ))}
                            </div>
                        </TooltipProvider>

                         <Button size="sm" onClick={handleGenerateAnalysis} disabled={isLoading}>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Nova Análise
                        </Button>
                    </div>
                </motion.div>
            ) : (
                 <motion.div
                    key="initial"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col md:flex-row items-center justify-between gap-4"
                >
                    <div className="flex items-center gap-3">
                         <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <Sparkles className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-base text-slate-200">Análise Rápida com IA</CardTitle>
                            <CardDescription className="text-xs">
                            Receba um resumo inteligente e dicas para o seu mês.
                            </CardDescription>
                        </div>
                    </div>
                    <Button onClick={handleGenerateAnalysis} disabled={isLoading} className="w-full md:w-auto">
                        <Sparkles className="mr-2 h-4 w-4" />
                        Gerar Análise
                    </Button>
                </motion.div>
            )}
        </AnimatePresence>
    </Card>
  );
}
