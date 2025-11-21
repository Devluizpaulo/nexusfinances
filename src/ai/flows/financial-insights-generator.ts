'use server';

/**
 * @fileOverview An AI agent that generates financial insights and recommendations based on user financial data.
 *
 * - generateFinancialInsights - A function that generates financial insights.
 * - FinancialInsightsInput - The input type for the generateFinancialInsights function.
 * - FinancialInsightsOutput - The return type for the generateFinancialInsights function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FinancialInsightsInputSchema = z.object({
  income: z.number().describe('Renda total do período.'),
  expenses: z.number().describe('Despesas totais do período.'),
  debts: z.number().describe('Dívida total pendente.'),
  savings: z.number().describe('Economias totais.'),
  spendingByCategory: z
    .record(z.string(), z.number())
    .describe('Gastos por categoria (ex: {Mercado: 500, Lazer: 200}).'),
  savingsGoals: z
    .record(z.string(), z.number())
    .describe('Metas de economia definidas pelo usuário (ex: {Férias: 5000, Entrada: 20000}).'),
});
export type FinancialInsightsInput = z.infer<typeof FinancialInsightsInputSchema>;

const FinancialInsightsOutputSchema = z.object({
  summary: z.string().describe('Um resumo da situação financeira do usuário.'),
  insights: z.array(z.string()).describe('Uma lista de insights e recomendações financeiras personalizadas.'),
});
export type FinancialInsightsOutput = z.infer<typeof FinancialInsightsOutputSchema>;

export async function generateFinancialInsights(input: FinancialInsightsInput): Promise<FinancialInsightsOutput> {
  return financialInsightsGeneratorFlow(input);
}

const financialInsightsPrompt = ai.definePrompt({
  name: 'financialInsightsPrompt',
  input: {schema: FinancialInsightsInputSchema},
  output: {schema: FinancialInsightsOutputSchema},
  prompt: `Você é um consultor financeiro que fornece insights e recomendações personalizadas com base nos dados financeiros do usuário. A resposta deve ser em português do Brasil.

  Analise os seguintes dados financeiros:
  Renda: {{income}}
  Despesas: {{expenses}}
  Dívidas: {{debts}}
  Economias: {{savings}}
  Gastos por Categoria: {{#each spendingByCategory}}{{@key}}: {{this}} {{/each}}
  Metas de Economia: {{#each savingsGoals}}{{@key}}: {{this}} {{/each}}

  Forneça um resumo da situação financeira do usuário, destacando as principais tendências e áreas de preocupação.
  Gere uma lista de insights e recomendações financeiras personalizadas para ajudar o usuário a entender melhor seus hábitos de consumo, progresso de economia e áreas potenciais para melhoria.
  Considere as metas de economia do usuário ao gerar recomendações.
  Decida quando incluir recomendações educacionais em sua análise e relatório.
  Seja não intrusivo.

  Resumo:
  Insights:`,
});

const financialInsightsGeneratorFlow = ai.defineFlow(
  {
    name: 'financialInsightsGeneratorFlow',
    inputSchema: FinancialInsightsInputSchema,
    outputSchema: FinancialInsightsOutputSchema,
  },
  async input => {
    const {output} = await financialInsightsPrompt(input);
    return output!;
  }
);
