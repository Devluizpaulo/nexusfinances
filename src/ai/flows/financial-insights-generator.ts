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
  income: z.number().describe('Total income for the period.'),
  expenses: z.number().describe('Total expenses for the period.'),
  debts: z.number().describe('Total outstanding debt.'),
  savings: z.number().describe('Total savings.'),
  spendingByCategory: z
    .record(z.string(), z.number())
    .describe('Spending by category (e.g., {Groceries: 500, Entertainment: 200}).'),
  savingsGoals: z
    .record(z.string(), z.number())
    .describe('User-defined savings goals (e.g., {Vacation: 5000, DownPayment: 20000}).'),
});
export type FinancialInsightsInput = z.infer<typeof FinancialInsightsInputSchema>;

const FinancialInsightsOutputSchema = z.object({
  summary: z.string().describe('A summary of the user financial situation.'),
  insights: z.array(z.string()).describe('A list of personalized financial insights and recommendations.'),
});
export type FinancialInsightsOutput = z.infer<typeof FinancialInsightsOutputSchema>;

export async function generateFinancialInsights(input: FinancialInsightsInput): Promise<FinancialInsightsOutput> {
  return financialInsightsGeneratorFlow(input);
}

const financialInsightsPrompt = ai.definePrompt({
  name: 'financialInsightsPrompt',
  input: {schema: FinancialInsightsInputSchema},
  output: {schema: FinancialInsightsOutputSchema},
  prompt: `You are a financial advisor providing personalized insights and recommendations based on the user's financial data.

  Analyze the following financial data:
  Income: {{income}}
  Expenses: {{expenses}}
  Debts: {{debts}}
  Savings: {{savings}}
  Spending by Category: {{#each spendingByCategory}}{{@key}}: {{this}} {{/each}}
  Savings Goals: {{#each savingsGoals}}{{@key}}: {{this}} {{/each}}

  Provide a summary of the user's financial situation, highlighting key trends and areas of concern.
  Generate a list of personalized financial insights and recommendations to help the user better understand their spending habits, savings progress, and potential areas for improvement.
  Consider the user's savings goals when generating recommendations.
  Decide when to include educational recommendations in your analysis and reporting.
  Be non-intrusive.

  Summary:
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
