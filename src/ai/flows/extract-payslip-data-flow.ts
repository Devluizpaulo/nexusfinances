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


export async function extractPayslipData(input: ExtractPayslipInput): Promise<ExtractPayslipOutput | null> {
  return extractPayslipDataFlow(input);
}

const prompt = ai.definePrompt({
    name: 'payslipExtractionPrompt',
    input: { schema: ExtractPayslipInputSchema },
    output: { schema: ExtractPayslipOutputSchema },
    prompt: `
        Você é um assistente de IA especialista em análise de documentos financeiros como holerites (recibos de pagamento) e notas fiscais de serviço. Sua tarefa é extrair as seguintes informações do documento PDF fornecido.

        IMPORTANTE: O conteúdo completo do PDF foi fornecido ao modelo via uma ferramenta interna ({{media url=pdfBase64}}). Por favor, analise o CONTEÚDO VISUAL do documento PDF fornecido para extrair as transações, não apenas o texto.

        1.  **companyName (Nome da Empresa)**: O nome da empresa ou empregador que está realizando o pagamento.
        2.  **earnings (Lista de Ganhos/Proventos)**: Uma lista com cada item de ganho individualmente. Para cada item, extraia o 'name' (nome do provento, ex: "Salário Base", "Horas Extras", "Comissão") e o 'amount' (valor do ganho).
        3.  **deductions (Lista de Descontos)**: Uma lista com cada item de desconto individualmente. Para cada item, extraia o 'name' (nome do desconto, ex: "INSS", "Vale Transporte") e o 'amount' (valor do desconto).
        4.  **grossAmount (Valor Bruto)**: O valor total antes de qualquer desconto (soma de todos os 'earnings'). Procure por "Total de Proventos", "Salário Bruto", "Valor Bruto". Se não houver um total, some os itens de 'earnings'.
        5.  **totalDeductions (Total de Descontos)**: A soma de todos os descontos. Procure por "Total de Descontos". Se não houver, some os itens de 'deductions'.
        6.  **netAmount (Valor Líquido)**: O valor final que a pessoa ou empresa recebeu. Este é o campo mais importante. Procure por termos como "Líquido a Receber", "Valor Líquido", "Total Líquido".
        7.  **fgtsAmount (Valor do FGTS)**: O valor do depósito do FGTS do mês. Procure por termos como "FGTS", "Base FGTS", "FGTS do Mês". Este valor geralmente não afeta o líquido.
        8.  **issueDate (Data de Emissão/Competência)**: A data a que o pagamento se refere. Se houver múltiplas datas, prefira a data de competência ou a data de pagamento. Formate-a como YYYY-MM-DD. Se encontrar apenas mês/ano, use o dia 01.
        9.  **description (Descrição)**: Crie uma descrição curta e informativa. Ex: "Salário de Abril/2024" ou "Pagamento de serviço para [Nome da Empresa]".

        Analise o documento PDF fornecido para extrair esses dados com a maior precisão possível. Se algum campo opcional não for encontrado, omita-o da resposta JSON. O campo 'netAmount' é obrigatório.
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
      // Retorna null para ser tratado pela UI, em vez de lançar um erro.
      return null;
    }
    
    return output;
  }
);
