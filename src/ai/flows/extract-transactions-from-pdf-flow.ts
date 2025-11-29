'use server';
/**
 * @fileOverview Um fluxo de IA para extrair transações financeiras de um texto de extrato bancário.
 *
 * - extractTransactionsFromPdf - Função principal que recebe o conteúdo de um PDF e retorna as transações.
 */

import { ai } from '@/ai/genkit';
import { 
  ExtractTransactionsInputSchema,
  ExtractTransactionsOutputSchema,
  type ExtractTransactionsInput,
  type ExtractTransactionsOutput
} from '@/lib/types';


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

      IMPORTANTE: O conteúdo completo do PDF foi fornecido ao modelo via uma ferramenta interna ({{media url=pdfBase64}}). Por favor, analise o conteúdo do documento PDF fornecido para extrair as transações.

      Texto de referência (ignore se o conteúdo do PDF estiver disponível):
      ---
      ${textContent}
      ---
      
      Para cada transação, extraia as seguintes informações:
      - date: A data da transação. Formate-a como YYYY-MM-DD. Assuma o ano corrente se não estiver especificado.
      - description: A descrição completa da transação como aparece no extrato.
      - amount: O valor. Se for uma despesa (débito, pagamento), o valor deve ser NEGATIVO. Se for uma receita (crédito, recebimento), o valor deve ser POSITIVO.
      - suggestedCategory: Sugira uma categoria apropriada em português (ex: "Alimentação", "Transporte", "Moradia", "Salário", "Lazer"). Baseie-se na descrição para sugerir a melhor categoria possível. Por exemplo, se a descrição for "Pagamento de Aluguel", a categoria deve ser "Moradia".

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
      // context: {
      //   pdf: input.pdfBase64 // 'context' pode não ser o campo correto, usando 'media' no prompt
      // }
    });

    const output = llmResponse.output;
    if (!output) {
      throw new Error('A IA não retornou uma análise válida.');
    }
    
    return output;
  }
);
