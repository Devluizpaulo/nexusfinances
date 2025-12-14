'use server';
/**
 * @fileOverview Um fluxo de IA para sugerir limites de gastos (orçamentos).
 *
 * - suggestBudgets - Função que recebe transações e retorna sugestões de orçamento.
 * - SuggestBudgetsInput - O tipo de entrada para a função.
 * - SuggestBudgetsOutput - O tipo de retorno para a função.
 */

import { ai } from '@/ai/genkit';
import { 
  AITransactionSchema,
  SuggestBudgetsInputSchema, 
  SuggestBudgetsOutputSchema,
  type SuggestBudgetsInput,
  type SuggestBudgetsOutput
} from '@/lib/types';
import { z } from 'zod';

export type { SuggestBudgetsInput, SuggestBudgetsOutput };

export async function suggestBudgets(input: SuggestBudgetsInput): Promise<SuggestBudgetsOutput | null> {
  // Retorna null se não houver transações para analisar
  if (!input.transactions || input.transactions.length < 5) {
    return null;
  }
  return suggestBudgetsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestBudgetsPrompt',
  input: { schema: SuggestBudgetsInputSchema },
  output: { schema: SuggestBudgetsOutputSchema },
  prompt: `
    Você é um consultor financeiro especialista em criação de orçamentos.
    Sua tarefa é analisar a lista de despesas de um usuário dos últimos 3 meses e sugerir 2 ou 3 limites de gastos (orçamentos) mensais realistas.

    Dados de despesas do usuário:
    {{{json transactions}}}

    Seu objetivo é:
    1.  Identificar as 2 ou 3 categorias com os maiores gastos médios mensais, que sejam adequadas para um orçamento (ex: "Alimentação", "Lazer", "Transporte"). Ignore categorias como "Moradia" ou "Educação" se parecerem aluguéis ou mensalidades fixas.
    2.  Calcular um valor de limite mensal sugerido para cada uma dessas categorias. O valor deve ser um pouco abaixo da média de gastos atual para incentivar a economia, mas não tão baixo a ponto de ser irrealista. Arredonde o valor para um número "redondo" (ex: 450, 500, 800).
    3.  Para cada sugestão, criar uma 'justification' (justificativa) curta e motivadora. Exemplo: "Você gastou em média R$550 com lazer, que tal tentar um limite de R$500?".

    Retorne apenas o objeto JSON com a chave "suggestions".
  `,
});

const suggestBudgetsFlow = ai.defineFlow(
  {
    name: 'suggestBudgetsFlow',
    inputSchema: SuggestBudgetsInputSchema,
    outputSchema: SuggestBudgetsOutputSchema.nullable(),
  },
  async (input) => {
    try {
      const { output } = await prompt(input);
      if (!output || !output.suggestions || output.suggestions.length === 0) {
        return null;
      }
      return output;
    } catch (error) {
      console.error("Error in suggestBudgetsFlow:", error);
      // Retorna null em caso de erro na execução da IA para não quebrar a UI
      return null;
    }
  }
);
