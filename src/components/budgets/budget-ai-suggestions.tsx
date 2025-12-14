
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Loader2, PlusCircle, Sparkles } from 'lucide-react';
import { type SuggestedBudget } from '@/ai/flows/suggest-budgets-flow';
import { formatCurrency } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';

interface BudgetAISuggestionsProps {
  suggestions: SuggestedBudget[] | null;
  isLoading: boolean;
  onCreateBudget: (category: string, amount: number) => void;
}

export function BudgetAISuggestions({ suggestions, isLoading, onCreateBudget }: BudgetAISuggestionsProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border bg-background/50 p-6 text-center w-full max-w-md">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Analisando suas despesas para criar sugestões...</p>
      </div>
    );
  }

  if (suggestions && suggestions.length > 0) {
    return (
      <Card className="w-full max-w-md bg-background/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Sugestões com IA</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Com base em seus gastos, sugerimos os seguintes limites:
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <AnimatePresence>
            {suggestions.map((suggestion, index) => (
              <motion.div
                key={suggestion.category}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <div className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <p className="font-semibold">{suggestion.category}</p>
                    <p className="text-xs text-muted-foreground">{suggestion.justification}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg text-primary">{formatCurrency(suggestion.amount)}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onCreateBudget(suggestion.category, suggestion.amount)}
                    >
                      <PlusCircle className="h-4 w-4 mr-1.5" />
                      Criar
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </CardContent>
      </Card>
    );
  }

  if (suggestions && suggestions.length === 0) {
     return (
        <p className="text-center text-sm text-muted-foreground py-4">
            A IA não encontrou padrões suficientes para criar sugestões. Continue registrando suas despesas!
        </p>
     )
  }

  // Se suggestions for null, ainda não foi carregado. Não mostra nada.
  return null;
}
