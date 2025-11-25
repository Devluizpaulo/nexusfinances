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
import { getDocument } from 'pdf-lib';

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
    
    const pdfDoc = await getDocument(input.pdfBase64).catch(e => {
        console.error("Failed to load PDF", e);
        throw new Error("Invalid PDF file provided.");
    });
    const textContent = (await pdfDoc.getPages().then(pages => Promise.all(pages.map(p => p.getTextContent())))).map(c => c.items.map(i => i.str).join(' ')).join('\n');


    const prompt = `
      Você é um especialista em análise de extratos bancários em PDF. Sua tarefa é extrair todas as transações de um texto de extrato e retorná-las em um formato JSON.

      Analise o seguinte texto:
      ---
      ${textContent}
      ---

      Para cada transação, extraia as seguintes informações:
      - date: A data da transação. Formate-a como YYYY-MM-DD. O ano é o atual.
      - description: A descrição completa da transação.
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
    });

    const output = llmResponse.output();
    if (!output) {
      throw new Error('A IA não retornou uma análise válida.');
    }
    
    return output;
  }
);
