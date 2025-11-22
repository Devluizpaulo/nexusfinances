
'use server';
/**
 * @fileOverview Um fluxo de IA para analisar dados financeiros e gerar insights.
 *
 * - getFinancialInsights - Função principal que recebe dados financeiros e retorna uma análise.
 * - GetFinancialInsightsInput - O tipo de entrada para a função getFinancialInsights.
 * - GetFinancialInsightsOutput - O tipo de retorno para a função getFinancialInsights.
 */

import { ai } from '@/ai/genkit';
import { 
  GetFinancialInsightsInputSchema, 
  GetFinancialInsightsOutputSchema,
  type GetFinancialInsightsInput,
  type GetFinancialInsightsOutput
} from '@/lib/types';

export async function getFinancialInsights(input: GetFinancialInsightsInput): Promise<GetFinancialInsightsOutput> {
  return getFinancialInsightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'financialInsightsPrompt',
  input: { schema: GetFinancialInsightsInputSchema },
  output: { schema: GetFinancialInsightsOutputSchema },
  prompt: `
      Você é um especialista em finanças pessoais amigável e motivador. Seu nome é "xô planilhas".
      Analise os dados financeiros do usuário para o mês atual e forneça um resumo rápido e 2-3 dicas práticas.
      Seja positivo e encorajador, mesmo que a situação seja desafiadora. Use o nome do usuário para tornar a comunicação pessoal.
      
      Dados do usuário:
      - Nome: {{{userName}}}
      - Rendas do mês: {{{json incomes}}}
      - Despesas do mês: {{{json expenses}}}
      - Dívidas totais: {{{json debts}}}
      - Metas de economia: {{{json goals}}}

      Seu objetivo é:
      1. Escrever um parágrafo de 'summary' (2-3 frases no máximo) que dê ao usuário uma visão geral clara do mês. Comece com "Olá, {{{userName}}}!". Mencione o balanço (renda - despesa) e o principal ponto de destaque (ex: maior gasto, bom progresso em uma meta, etc.).
      2. Criar uma lista de 2 a 3 'actionPoints' (pontos de ação). Cada ponto deve ser uma sugestão curta, clara e acionável que o usuário pode aplicar imediatamente para melhorar.
      
      Exemplo de resposta:
      {
        "summary": "Olá, João! Este mês você teve um bom balanço positivo. Seu maior gasto foi com alimentação, mas você está fazendo um ótimo progresso na sua meta de viagem!",
        "actionPoints": [
          "Tente reduzir em 10% os gastos com restaurantes na próxima semana.",
          "Continue aportando na sua meta de viagem; você está quase lá!",
          "Revise suas assinaturas para ver se há algo que não usa mais."
        ]
      }
    `,
});

const getFinancialInsightsFlow = ai.defineFlow(
  {
    name: 'getFinancialInsightsFlow',
    inputSchema: GetFinancialInsightsInputSchema,
    outputSchema: GetFinancialInsightsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('A IA não retornou uma análise válida.');
    }
    return output;
  }
);
