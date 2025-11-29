'use server';
/**
 * @fileOverview Um fluxo de IA para extrair dados de um holerite ou nota fiscal em PDF.
 *
 * - extractPayslipData - Função principal que recebe o conteúdo de um PDF e retorna os dados financeiros.
 */

import { ai } from '@/ai/genkit';
import { 
  ExtractPayslipInputSchema,
  ExtractPayslipOutputSchema,
  type ExtractPayslipInput,
  type ExtractPayslipOutput
} from '@/lib/types';


export async function extractPayslipData(input: ExtractPayslipInput): Promise<ExtractPayslipOutput> {
  return extractPayslipDataFlow(input);
}

const prompt = ai.definePrompt({
    name: 'payslipExtractionPrompt',
    input: { schema: ExtractPayslipInputSchema },
    output: { schema: ExtractPayslipOutputSchema },
    prompt: `
        Você é um assistente de IA especialista em análise de documentos financeiros como holerites (recibos de pagamento) e notas fiscais de serviço. Sua tarefa é extrair as seguintes informações do documento PDF fornecido:

        1.  **netAmount (Valor Líquido)**: O valor final que a pessoa ou empresa recebeu. Este é o campo mais importante. Procure por termos como "Líquido a Receber", "Valor Líquido", "Total Líquido".
        2.  **grossAmount (Valor Bruto)**: O valor total antes de qualquer desconto. Procure por "Total de Proventos", "Salário Bruto", "Valor Bruto".
        3.  **totalDeductions (Total de Descontos)**: A soma de todos os descontos. Procure por "Total de Descontos", "INSS", "IRRF", etc. Se não houver um total, some os descontos individuais.
        4.  **deductions (Lista de Descontos)**: Uma lista com cada item de desconto individualmente. Para cada item, extraia o 'name' (nome do desconto, ex: "INSS", "Vale Transporte") e o 'amount' (valor do desconto).
        5.  **fgtsAmount (Valor do FGTS)**: O valor do depósito do FGTS do mês. Procure por termos como "FGTS", "Base FGTS", "FGTS do Mês". Este valor geralmente não afeta o líquido, mas é uma informação importante.
        6.  **issueDate (Data de Emissão/Competência)**: A data a que o pagamento se refere. Formate-a como YYYY-MM-DD.
        7.  **description (Descrição)**: Crie uma descrição curta e informativa. Ex: "Salário referente a Abril/2024" ou "Pagamento de serviço para Empresa X".

        Analise o documento PDF fornecido via contexto de mídia para extrair esses dados com a maior precisão possível. Se algum campo opcional não for encontrado, omita-o da resposta JSON. O campo 'netAmount' é obrigatório.
    `,
});


const extractPayslipDataFlow = ai.defineFlow(
  {
    name: 'extractPayslipDataFlow',
    inputSchema: ExtractPayslipInputSchema,
    outputSchema: ExtractPayslipOutputSchema,
  },
  async (input) => {
    const { output } = await prompt({ pdfBase64: input.pdfBase64 });

    if (!output || !output.netAmount) {
      throw new Error('A IA não conseguiu determinar o valor líquido do documento.');
    }
    
    return output;
  }
);
