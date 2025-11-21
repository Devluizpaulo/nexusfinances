'use client';

import { useState } from 'react';
import { Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { generateFinancialInsights, type FinancialInsightsInput, type FinancialInsightsOutput } from '@/ai/flows/financial-insights-generator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

export function AiInsights({ financialData }: { financialData: FinancialInsightsInput }) {
  const [insights, setInsights] = useState<FinancialInsightsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateInsights = async () => {
    setIsLoading(true);
    setError(null);
    setInsights(null);
    try {
      const result = await generateFinancialInsights(financialData);
      setInsights(result);
    } catch (e) {
      setError('Failed to generate insights. Please try again.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Wand2 className="h-6 w-6 text-primary" />
            </div>
            <div>
                <CardTitle>Educational Financial Insights</CardTitle>
                <CardDescription>Get AI-powered insights and recommendations based on your financial data.</CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent className="min-h-[200px]">
        {isLoading ? (
          <div className="space-y-4 p-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-full" />
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : insights ? (
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-semibold text-base">Summary</h3>
              <p className="text-muted-foreground">{insights.summary}</p>
            </div>
            <div>
              <h3 className="font-semibold text-base">Insights & Recommendations</h3>
              <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
                {insights.insights.map((insight, index) => (
                  <li key={index}>{insight}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-4 rounded-lg border-2 border-dashed border-border bg-transparent p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Click the button to generate your personalized financial report.
            </p>
            <Button onClick={handleGenerateInsights} disabled={isLoading}>
              <Wand2 className="mr-2" />
              Generate Insights
            </Button>
          </div>
        )}
      </CardContent>
      {!isLoading && (insights || error) && (
        <CardFooter>
            <Button onClick={handleGenerateInsights} variant="outline" size="sm">
                <Wand2 className="mr-2 h-4 w-4"/>
                Regenerate
            </Button>
        </CardFooter>
      )}
    </Card>
  );
}
