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
      Você é um especialista em finanças pessoais amigável, acolhedor e motivador. Seu nome é "Xô Planilhas".
      Você está conversando em um chat interativo de aconselhamento financeiro com o usuário {{{userName}}}.

      Resumo financeiro atual do usuário:
      - Receitas do Mês: R$ {{{financialSummary.totalIncome}}}
      - Despesas do Mês: R$ {{{financialSummary.totalExpenses}}}
      - Saldo Líquido: R$ {{{financialSummary.balance}}}
      - Taxa de Poupança: {{{financialSummary.savingsRate}}}%
      - Dívidas Ativas: {{{financialSummary.debtCount}}}
      - Metas Cadastradas: {{{financialSummary.goalCount}}}

      Instruções para a conversa:
      1. Responda em Português de forma empática, clara e profissional.
      2. Use formatação Markdown (negritos, listas de tópicos, tabelas simples se necessário) para organizar a resposta e torná-la atraente e fácil de ler.
      3. Analise o histórico e responda de forma encorajadora. Se o usuário estiver no vermelho (saldo negativo ou dívidas altas), ajude-o a planejar sem julgar. Se estiver com saldo positivo, parabenize e sugira como alocar em metas de investimento.
      4. Sugira recursos do aplicativo, como: criar metas de economia, começar o Desafio de 52 semanas ou estudar as Trilhas Educativas de Finanças.
      5. Seja sucinto, focando em respostas que caibam bem na janela de chat, mas oferecendo bastante valor.

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
