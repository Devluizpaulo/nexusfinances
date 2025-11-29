'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, FileUp, FileCheck2, Wallet, Check, ChevronsUpDown, FileText, UploadCloud, Banknote } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDropzone } from 'react-dropzone';
import { cn } from '@/lib/utils';
import { extractPayslipData } from '@/ai/flows/extract-payslip-data-flow';
import type { ExtractPayslipOutput } from '@/lib/types';
import { useFirestore, useUser, addDocumentNonBlocking } from '@/firebase';
import { collection } from 'firebase/firestore';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Separator } from '../ui/separator';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
};

export function ImportPayslipCard() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ExtractPayslipOutput | null>(null);
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      if (selectedFile.type !== 'application/pdf') {
        toast({ variant: 'destructive', title: 'Arquivo inválido', description: 'Por favor, selecione apenas arquivos PDF.' });
        return;
      }
      setFile(selectedFile);
      setResult(null);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: { 'application/pdf': ['.pdf'] },
  });

  const handleExtract = async () => {
    if (!file) return;
    setIsProcessing(true);
    setResult(null);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64File = (reader.result as string).split(',')[1];
        const extractedData = await extractPayslipData({ pdfBase64: base64File });
        
        if (!extractedData || !extractedData.netAmount) {
            toast({
                variant: 'destructive',
                title: 'Análise Falhou',
                description: 'A IA não conseguiu extrair os dados. O documento pode ser muito complexo ou não ser um holerite/NF. Por favor, preencha manualmente.',
            });
            setResult(null);
        } else {
            setResult(extractedData);
            toast({ title: 'Análise Concluída!', description: 'Confira os dados extraídos abaixo e confirme.' });
        }
      };
    } catch (error) {
      console.error("Error processing payslip:", error);
      toast({ variant: 'destructive', title: 'Erro na Análise', description: 'Não foi possível extrair os dados. Tente um arquivo mais simples.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirm = async () => {
    if (!result || !user || !firestore) return;
    setIsProcessing(true);
    try {
      const incomesColRef = collection(firestore, `users/${user.uid}/incomes`);
      const incomeData = {
        amount: result.netAmount,
        category: 'Salário',
        date: result.issueDate || new Date().toISOString().split('T')[0],
        description: result.description || `Salário de ${file?.name || 'documento importado'}`,
        isRecurring: false, // Imported transactions are one-offs
        status: 'paid' as const,
        userId: user.uid,
        type: 'income' as const,
        grossAmount: result.grossAmount,
        totalDeductions: result.totalDeductions,
        deductions: result.deductions || [],
        fgtsAmount: result.fgtsAmount,
      };
      await addDocumentNonBlocking(incomesColRef, incomeData);
      toast({ title: 'Renda Adicionada!', description: `A renda de ${formatCurrency(result.netAmount)} foi registrada com sucesso.` });
      handleReset();
    } catch (error) {
      console.error("Error saving income:", error);
      toast({ variant: 'destructive', title: 'Erro ao Salvar', description: 'Não foi possível registrar a renda.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setIsProcessing(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <UploadCloud className="h-6 w-6 text-primary" />
          <div>
            <CardTitle>Importar Holerite ou Nota Fiscal</CardTitle>
            <CardDescription>Envie seu documento PDF para extrair os valores automaticamente.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!result ? (
          <div
            {...getRootProps()}
            className={cn(
              'flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer transition-colors',
              isDragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
            )}
          >
            <input {...getInputProps()} />
            {file ? (
              <div className="text-center text-emerald-600">
                <FileCheck2 className="mx-auto h-10 w-10" />
                <p className="mt-2 font-semibold">Arquivo selecionado!</p>
                <p className="text-xs">{file.name}</p>
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                <FileUp className="mx-auto h-10 w-10" />
                <p className="mt-2">Arraste e solte o arquivo PDF aqui, ou clique para selecionar</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 rounded-lg border bg-muted/50 p-4">
             <h4 className="text-sm font-semibold">Dados Extraídos</h4>
            
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Valor Bruto</p>
                    <p className="font-medium">{result.grossAmount ? formatCurrency(result.grossAmount) : 'N/A'}</p>
                </div>
                 <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Total de Descontos</p>
                    <p className="font-medium text-red-500">{result.totalDeductions ? formatCurrency(result.totalDeductions) : 'N/A'}</p>
                </div>
            </div>

            {result.deductions && result.deductions.length > 0 && (
                <div className="space-y-2 text-xs">
                    <p className="font-medium text-muted-foreground">Detalhe dos descontos:</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        {result.deductions.map((d, i) => (
                            <div key={i} className="flex justify-between">
                                <span>{d.name}</span>
                                <span className="font-mono">{formatCurrency(d.amount)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
             <Separator />

             <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                 <div className="space-y-1 rounded-md bg-background p-2">
                    <p className="text-xs text-muted-foreground">Valor Líquido a Registrar</p>
                    <p className="text-lg font-bold text-emerald-600">{formatCurrency(result.netAmount)}</p>
                </div>
                 {result.fgtsAmount && (
                    <div className="space-y-1 rounded-md bg-background p-2">
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Banknote className="h-3 w-3"/> FGTS do Mês</p>
                        <p className="text-lg font-bold">{formatCurrency(result.fgtsAmount)}</p>
                    </div>
                )}
            </div>

             <div className="space-y-1 text-sm">
                <p className="text-xs text-muted-foreground">Data de Competência</p>
                <p className="font-medium">{result.issueDate ? format(parseISO(result.issueDate), 'PPP', { locale: ptBR }) : 'Não encontrada'}</p>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        {result && <Button variant="outline" onClick={handleReset}>Cancelar</Button>}
        {result ? (
          <Button onClick={handleConfirm} disabled={isProcessing}>
            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar e Salvar Renda
          </Button>
        ) : (
          <Button onClick={handleExtract} disabled={!file || isProcessing}>
            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
            Analisar Documento
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
