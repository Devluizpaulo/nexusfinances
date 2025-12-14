'use server';
/**
 * @fileOverview Um fluxo de IA para gerar o conteúdo completo de uma trilha educacional.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const pointSchema = z.object({
  title: z.string().min(1),
  details: z.string().min(1),
});

const experienceSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  details: z.string().min(1),
});

const questionSchema = z.object({
  question: z.string().min(1),
  options: z.array(z.string().min(1)).min(2),
  correctAnswer: z.string().min(1),
});

const moduleSchema = z.object({
  type: z.enum([
    "psychology",
    "practicalExperiences",
    "microHabits",
    "narrative",
    "finalQuiz",
    "tool",
  ]),
  title: z.string().min(1),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  points: z.array(pointSchema).optional(),
  experiences: z.array(experienceSchema).optional(),
  habits: z.array(z.string().min(1)).optional(),
  questions: z.array(questionSchema).optional(),
  componentName: z.string().optional(),
});

const GenerateTrackInputSchema = z.object({
  topic: z.string().describe('O tema principal para a trilha educacional. Ex: "Como sair das dívidas" ou "Introdução a investimentos".'),
});
export type GenerateTrackInput = z.infer<typeof GenerateTrackInputSchema>;

const GenerateTrackOutputSchema = z.object({
  title: z.string().describe("Um título cativante para a trilha."),
  slug: z.string().describe("Um slug amigável para URL (letras minúsculas, números, hifens)."),
  description: z.string().describe("Uma descrição curta e atraente para o card da trilha."),
  icon: z.string().describe("O nome de um ícone apropriado da biblioteca lucide-react (ex: 'PiggyBank', 'TrendingUp')."),
  introduction: z.string().describe("Um parágrafo de introdução completo para a página da trilha, usando Markdown para formatação (ex: **negrito**)."),
  modules: z.array(moduleSchema).describe("Uma lista de 3 a 5 módulos educacionais variados (narrative, psychology, finalQuiz, etc.)."),
});
export type GenerateTrackOutput = z.infer<typeof GenerateTrackOutputSchema>;

export async function generateEducationTrack(input: GenerateTrackInput): Promise<GenerateTrackOutput> {
  return generateEducationTrackFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateEducationTrackPrompt',
  input: { schema: GenerateTrackInputSchema },
  output: { schema: GenerateTrackOutputSchema },
  prompt: `
      Você é um especialista em educação financeira e designer instrucional. Sua tarefa é criar o conteúdo completo para uma trilha educacional interativa sobre o tema: "{{topic}}".

      A estrutura deve ser envolvente, começando com conceitos básicos e evoluindo para ações práticas e um quiz final.

      Gere o seguinte conteúdo:
      1.  **title**: Um título curto e impactante para a trilha.
      2.  **slug**: Um slug para a URL (letras minúsculas, hifens, sem espaços).
      3.  **description**: Uma descrição curta e motivadora para exibir no card da trilha (máximo 2 frases).
      4.  **icon**: O nome de um ícone da biblioteca 'lucide-react' que represente bem o tema.
      5.  **introduction**: Um parágrafo de introdução para a trilha, explicando o que o usuário vai aprender. Use markdown para formatação.
      6.  **modules**: Crie de 3 a 5 módulos, variando os tipos. Siga esta estrutura:
          -   **Módulo 1 (Tipo 'narrative')**: Introduza o conceito. Escreva um 'description' usando markdown.
          -   **Módulo 2 (Tipo 'psychology')**: Foque nos aspectos comportamentais. Crie 2-3 'points', cada um com 'title' e 'details' (em markdown).
          -   **Módulo 3 (Tipo 'microHabits')**: Sugira 3 'habits' práticos que o usuário pode adotar.
          -   **Módulo 4 (Tipo 'finalQuiz')**: Crie um quiz com 2-3 'questions'. Cada questão deve ter 'question', um array de 'options' (pelo menos 3), e a 'correctAnswer' (o texto exato da opção correta).

      Seja criativo e didático. O conteúdo deve ser claro, acionável e relevante para um público brasileiro.
      Certifique-se de que a resposta seja um objeto JSON válido que corresponda exatamente ao schema de saída.
    `,
});


const generateEducationTrackFlow = ai.defineFlow(
  {
    name: 'generateEducationTrackFlow',
    inputSchema: GenerateTrackInputSchema,
    outputSchema: GenerateTrackOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('A IA não conseguiu gerar o conteúdo da trilha.');
    }
    return output;
  }
);
