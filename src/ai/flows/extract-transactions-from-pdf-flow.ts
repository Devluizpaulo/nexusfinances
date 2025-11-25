'use server';
/**
 * @fileOverview Um fluxo de IA para extrair transações financeiras de um texto de extrato bancário.
 *
 * - extractTransactionsFromPdf - Função principal que recebe o conteúdo de um PDF e retorna as transações.
 * - ExtractTransactionsInput - O tipo de entrada para a função.
 * - ExtractTransactionsOutput - O tipo de retorno para a função.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { PDFDocument } from 'pdf-lib';

export const ExtractedTransactionSchema = z.object({
  date: z.string().describe('A data da transação no formato YYYY-MM-DD.'),
  description: z.string().describe('A descrição completa da transação como aparece no extrato.'),
  amount: z.number().describe('O valor da transação. Deve ser negativo para despesas e positivo para receitas.'),
  suggestedCategory: z.string().describe('Uma categoria sugerida para a transação (ex: "Alimentação", "Transporte", "Salário").'),
});
export type ExtractedTransaction = z.infer<typeof ExtractedTransactionSchema>;

export const ExtractTransactionsInputSchema = z.object({
  pdfBase64: z.string().describe("O conteúdo do arquivo PDF codificado em Base64."),
});
export type ExtractTransactionsInput = z.infer<typeof ExtractTransactionsInputSchema>;

export const ExtractTransactionsOutputSchema = z.object({
  transactions: z.array(ExtractedTransactionSchema),
});
export type ExtractTransactionsOutput = z.infer<typeof ExtractTransactionsOutputSchema>;

export async function extractTransactionsFromPdf(input: ExtractTransactionsInput): Promise<ExtractTransactionsOutput> {
  return extractTransactionsFlow(input);
}

const extractTransactionsFlow = ai.defineFlow(
  {
    name: 'extractTransactionsFlow',
    inputSchema: ExtractTransactionsInputSchema,
    outputSchema: ExtractTransactionsOutputSchema,
  },
  async (input) => {
    
    // Simplificação: A biblioteca pdf-lib não extrai texto de forma robusta.
    // Vamos confiar na capacidade da IA de interpretar o conteúdo bruto do PDF.
    // Em um cenário real, uma biblioteca OCR ou de extração de texto seria mais adequada.
    const textContent = `[PDF Content Provided]`;

    const prompt = `
      Você é um especialista em análise de extratos bancários em PDF. Sua tarefa é extrair todas as transações de um texto de extrato e retorná-las em um formato JSON.

      IMPORTANTE: O conteúdo completo do PDF foi fornecido ao modelo via uma ferramenta interna, não pelo texto abaixo. Por favor, analise o conteúdo do documento PDF fornecido para extrair as transações.

      Texto de referência (ignore se o conteúdo do PDF estiver disponível):
      ---
      ${textContent}
      ---
      
      Para cada transação, extraia as seguintes informações:
      - date: A data da transação. Formate-a como YYYY-MM-DD. Assuma o ano corrente se não estiver especificado.
      - description: A descrição completa da transação como aparece no extrato.
      - amount: O valor. Se for uma despesa (débito), o valor deve ser NEGATIVO. Se for uma receita (crédito), o valor deve ser POSITIVO.
      - suggestedCategory: Sugira uma categoria apropriada em português (ex: "Alimentação", "Transporte", "Moradia", "Salário", "Lazer").

      Ignore cabeçalhos, rodapés, saldos e qualquer texto que não seja uma transação real.
      Retorne APENAS o objeto JSON com uma chave "transactions" contendo um array das transações encontradas.
    `;

    const llmResponse = await ai.generate({
      prompt: prompt,
      model: 'googleai/gemini-1.5-flash',
      output: {
        format: 'json',
        schema: ExtractTransactionsOutputSchema,
      },
       context: {
        pdf: input.pdfBase64
      }
    });

    const output = llmResponse.output;
    if (!output) {
      throw new Error('A IA não retornou uma análise válida.');
    }
    
    return output;
  }
);
