
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
    <div className="card-premium hover:shadow-lg transition-all duration-300">
        <AnimatePresence mode="wait">
            {isLoading ? (
                <motion.div
                    key="loading"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex flex-col items-center justify-center text-center p-4 space-y-2"
                >
                    <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
                    <p className="text-xs text-slate-400">Analisando seus dados reais...</p>
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
                        <Sparkles className="h-4.5 w-4.5 text-cyan-400 shrink-0 animate-pulse" />
                        <p className="text-xs font-semibold text-slate-200">{analysis.summary}</p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                        <TooltipProvider>
                            <div className="flex items-center gap-1.5">
                                {analysis.actionPoints.map((point, index) => (
                                    <Tooltip key={index}>
                                        <TooltipTrigger asChild>
                                            <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 cursor-pointer transition-colors">
                                                <Lightbulb className="h-4 w-4 text-amber-400" />
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent className="border border-white/5 bg-slate-950/95 backdrop-blur-md text-xs shadow-xl text-slate-200">
                                            <p className="max-w-xs">{point}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                ))}
                            </div>
                        </TooltipProvider>

                         <Button size="sm" onClick={handleGenerateAnalysis} disabled={isLoading} className="h-8 text-xs bg-slate-900/50 hover:bg-slate-800 border border-white/5 text-slate-200">
                            <Sparkles className="mr-1.5 h-3.5 w-3.5 text-cyan-400" />
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
                         <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/5 bg-slate-900/50 text-cyan-400">
                            <Sparkles className="h-4.5 w-4.5" />
                        </div>
                        <div>
                            <h3 className="text-xs font-bold text-slate-200">Análise de IA</h3>
                            <p className="text-[11px] text-slate-400">Receba insights contextuais baseados na sua receita, despesa e metas.</p>
                        </div>
                    </div>
                    <Button onClick={handleGenerateAnalysis} disabled={isLoading} className="w-full md:w-auto h-8 text-xs bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold shadow-md shadow-blue-500/10 transition-all border-none">
                        <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                        Análise de IA
                    </Button>
                </motion.div>
            )}
        </AnimatePresence>
    </div>
  );
}
