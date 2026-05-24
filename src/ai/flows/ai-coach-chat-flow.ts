'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  text: z.string(),
});

const AICoachChatInputSchema = z.object({
  userName: z.string(),
  message: z.string(),
  history: z.array(ChatMessageSchema).default([]),
  financialSummary: z.object({
    totalIncome: z.number(),
    totalExpenses: z.number(),
    balance: z.number(),
    savingsRate: z.number(),
    debtCount: z.number(),
    goalCount: z.number(),
    healthScore: z.number().optional(),
    activeGoals: z.array(z.object({ name: z.string(), target: z.number(), current: z.number() })).optional(),
    topExpenses: z.array(z.object({ category: z.string(), amount: z.number(), percentage: z.number() })).optional(),
  }),
});

const AICoachChatOutputSchema = z.object({
  response: z.string(),
});

export type AICoachChatInput = z.infer<typeof AICoachChatInputSchema>;
export type AICoachChatOutput = z.infer<typeof AICoachChatOutputSchema>;

export async function askAICoach(input: AICoachChatInput): Promise<AICoachChatOutput> {
  return aiCoachChatFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiCoachChatPrompt',
  input: { schema: AICoachChatInputSchema },
  output: { schema: AICoachChatOutputSchema },
  prompt: `
      Você é um especialista em finanças pessoais amigável, acolhedor, humano e motivador. Seu nome é "Xô Planilhas".
      Você está conversando em um chat interativo de aconselhamento financeiro com o usuário {{{userName}}}.

      Resumo financeiro atual do usuário:
      - Receitas do Mês: R$ {{{financialSummary.totalIncome}}}
      - Despesas do Mês: R$ {{{financialSummary.totalExpenses}}}
      - Saldo Líquido: R$ {{{financialSummary.balance}}}
      - Taxa de Poupança: {{{financialSummary.savingsRate}}}%
      - Dívidas Ativas: {{{financialSummary.debtCount}}}
      - Metas Cadastradas: {{{financialSummary.goalCount}}}
      {{#if financialSummary.healthScore}}
      - Score de Saúde Financeira: {{{financialSummary.healthScore}}} / 100 pontos
      {{/if}}

      {{#if financialSummary.activeGoals}}
      Metas de Economia do Usuário:
      {{#each financialSummary.activeGoals}}
      - "{{name}}": guardado R$ {{current}} de R$ {{target}}
      {{/each}}
      {{/if}}

      {{#if financialSummary.topExpenses}}
      Maiores Categorias de Despesas deste Mês:
      {{#each financialSummary.topExpenses}}
      - {{category}}: R$ {{amount}} ({{percentage}}% do total de despesas)
      {{/each}}
      {{/if}}

      Diretrizes Críticas de Inteligência de Dados:
      1. NUNCA use conselhos financeiros genéricos ou vazios (ex: "economize dinheiro" ou "evite gastos"). Fale com base nos dados e valores reais fornecidos.
      2. Cite proativamente as metas do usuário pelo nome exato (ex: "sua meta de Viagem") e analise o progresso delas.
      3. Se houver despesas listadas, comente sobre a maior categoria de despesa apontando seu valor exato em reais e porcentagem do total (ex: "Você gastou R$ 482 com Alimentação, o que é 22% das suas despesas totais").
      4. Compare proativamente o número de metas e a saúde do score. Incentive o usuário a cumprir missões pendentes no dashboard para aumentar o Score.
      5. Mantenha respostas humanas, sucintas (máximo 3 parágrafos curtos) e organizadas com tópicos nítidos em markdown.

      Histórico da conversa:
      {{#each history}}
      {{role}}: {{text}}
      {{/each}}

      Mensagem atual do usuário:
      user: {{{message}}}

      Retorne sua resposta formatada no JSON de saída:
      {
        "response": "Sua resposta aqui..."
      }
    `,
});

const aiCoachChatFlow = ai.defineFlow(
  {
    name: 'aiCoachChatFlow',
    inputSchema: AICoachChatInputSchema,
    outputSchema: AICoachChatOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('A IA não respondeu adequadamente.');
    }
    return output;
  }
);
