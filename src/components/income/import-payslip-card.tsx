
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, FileUp, FileCheck2, Wallet, Check, ChevronsUpDown, FileText, UploadCloud, Banknote, CalendarIcon, Pencil } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDropzone } from 'react-dropzone';
import { cn } from '@/lib/utils';
import { extractPayslipData } from '@/ai/flows/extract-payslip-data-flow';
import type { ExtractPayslipOutput } from '@/lib/types';
import { useFirestore, useUser, addDocumentNonBlocking } from '@/firebase';
import { collection } from 'firebase/firestore';
import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Separator } from '../ui/separator';
import { Input } from '../ui/input';
import { CurrencyInput } from '../ui/currency-input';
import { Textarea } from '../ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { motion } from 'framer-motion';


export function ImportPayslipCard() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [originalResult, setOriginalResult] = useState<ExtractPayslipOutput | null>(null);
  const [editableResult, setEditableResult] = useState<ExtractPayslipOutput | null>(null);
  
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  useEffect(() => {
    if (originalResult) {
      setEditableResult(JSON.parse(JSON.stringify(originalResult)));
    } else {
      setEditableResult(null);
    }
  }, [originalResult]);


  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      if (selectedFile.type !== 'application/pdf') {
        toast({ variant: 'destructive', title: 'Arquivo inválido', description: 'Por favor, selecione apenas arquivos PDF.' });
        return;
      }
      setFile(selectedFile);
      setOriginalResult(null);
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
    setOriginalResult(null);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const dataUri = reader.result as string;
        const extractedData = await extractPayslipData({ pdfBase64: dataUri });
        
        if (!extractedData || !extractedData.netAmount) {
            toast({
                variant: 'destructive',
                title: 'Análise Falhou',
                description: 'A IA não conseguiu extrair os dados. O documento pode ser muito complexo ou não ser um holerite/NF. Por favor, preencha manually.',
            });
            setOriginalResult(null);
        } else {
            setOriginalResult(extractedData);
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
  
  const handleFieldChange = (field: keyof ExtractPayslipOutput, value: any) => {
    if (!editableResult) return;
    setEditableResult(prev => ({...prev!, [field]: value}));
  };

  const handleConfirm = async () => {
    if (!editableResult || !user || !firestore) return;
    setIsProcessing(true);
    try {
      const incomesColRef = collection(firestore, `users/${user.uid}/incomes`);
      
      const notes = `Dados importados do documento: ${file?.name || 'documento'}.`;

      const incomeData = {
        amount: editableResult.netAmount,
        category: 'Salário',
        date: editableResult.issueDate || new Date().toISOString().split('T')[0],
        description: editableResult.description || `Salário de ${editableResult.companyName || 'documento importado'}`,
        isRecurring: false, 
        status: 'paid' as const,
        userId: user.uid,
        type: 'income' as const,
        grossAmount: editableResult.grossAmount ?? null,
        totalDeductions: editableResult.totalDeductions ?? null,
        earnings: editableResult.earnings || [],
        deductions: editableResult.deductions || [],
        fgtsAmount: editableResult.fgtsAmount ?? null,
        companyName: editableResult.companyName ?? null,
        notes,
      };
      await addDocumentNonBlocking(incomesColRef, incomeData);
      toast({ title: 'Renda Adicionada!', description: `A renda de ${formatCurrency(editableResult.netAmount)} foi registrada com sucesso.` });
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
    setOriginalResult(null);
    setIsProcessing(false);
  };
  
  const formatCurrency = (amount: number | undefined) => {
    if (typeof amount !== 'number') return 'N/A';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
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
        {!editableResult ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div
              {...getRootProps()}
              className={cn(
                'flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer transition-colors',
                isDragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
              )}
            >
              <input {...getInputProps()} />
              {file ? (
                <motion.div
                  className="text-center text-emerald-600"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                >
                  <FileCheck2 className="mx-auto h-10 w-10" />
                  <p className="mt-2 font-semibold">Arquivo selecionado!</p>
                  <p className="text-xs">{file.name}</p>
                </motion.div>
              ) : (
                <div className="text-center text-muted-foreground">
                  <FileUp className="mx-auto h-10 w-10" />
                  <p className="mt-2">Arraste e solte o arquivo PDF aqui, ou clique para selecionar</p>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            className="space-y-4 rounded-lg border bg-muted/50 p-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
             <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">Pagador</label>
                <Input value={editableResult.companyName || ''} onChange={(e) => handleFieldChange('companyName', e.target.value)} />
            </div>
             <Separator/>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {/* Coluna de Proventos */}
                 <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-emerald-600">Proventos (Ganhos)</h4>
                    <div className="space-y-1 text-sm">
                        {editableResult.earnings && editableResult.earnings.length > 0 ? (
                            editableResult.earnings.map((item, index) => (
                                <div key={index} className="flex justify-between items-center gap-2">
                                    <Input value={item.name} className="h-8 text-xs flex-1" onChange={e => {
                                        const newEarnings = [...editableResult.earnings!];
                                        newEarnings[index].name = e.target.value;
                                        handleFieldChange('earnings', newEarnings);
                                    }}/>
                                    <CurrencyInput value={item.amount} className="h-8 text-xs w-28" onValueChange={value => {
                                         const newEarnings = [...editableResult.earnings!];
                                         newEarnings[index].amount = value;
                                         handleFieldChange('earnings', newEarnings);
                                    }}/>
                                </div>
                            ))
                        ) : <p className="text-xs text-muted-foreground">Nenhum detalhe de ganho encontrado.</p>}
                    </div>
                     <Separator />
                    <div className="flex justify-between font-semibold">
                        <span>Total de Proventos</span>
                        <CurrencyInput value={editableResult.grossAmount || 0} className="h-8 text-sm font-semibold w-32" onValueChange={value => handleFieldChange('grossAmount', value)}/>
                    </div>
                </div>

                {/* Coluna de Descontos */}
                 <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-red-500">Descontos</h4>
                    <div className="space-y-1 text-sm">
                       {editableResult.deductions && editableResult.deductions.length > 0 ? (
                            editableResult.deductions.map((item, index) => (
                                 <div key={index} className="flex justify-between items-center gap-2">
                                     <Input value={item.name} className="h-8 text-xs flex-1" onChange={e => {
                                        const newDeductions = [...editableResult.deductions!];
                                        newDeductions[index].name = e.target.value;
                                        handleFieldChange('deductions', newDeductions);
                                    }}/>
                                    <CurrencyInput value={item.amount} className="h-8 text-xs w-28" onValueChange={value => {
                                         const newDeductions = [...editableResult.deductions!];
                                         newDeductions[index].amount = value;
                                         handleFieldChange('deductions', newDeductions);
                                    }}/>
                                </div>
                            ))
                        ) : <p className="text-xs text-muted-foreground">Nenhum desconto encontrado.</p>}
                    </div>
                     <Separator />
                     <div className="flex justify-between font-semibold">
                        <span>Total de Descontos</span>
                        <CurrencyInput value={editableResult.totalDeductions || 0} className="h-8 text-sm font-semibold w-32" onValueChange={value => handleFieldChange('totalDeductions', value)}/>
                    </div>
                </div>
            </div>

            <Separator />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 rounded-md bg-background p-3">
                    <label className="text-sm font-medium text-muted-foreground">Data de Competência</label>
                    <Popover>
                      <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal">
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {editableResult.issueDate && isValid(parseISO(editableResult.issueDate)) ? format(parseISO(editableResult.issueDate), 'PPP', { locale: ptBR }) : 'Selecione a data'}
                          </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                          <Calendar
                              mode="single"
                              selected={editableResult.issueDate ? parseISO(editableResult.issueDate) : new Date()}
                              onSelect={(date) => handleFieldChange('issueDate', date ? format(date, 'yyyy-MM-dd') : '')}
                              initialFocus
                          />
                      </PopoverContent>
                    </Popover>
                </div>
                 {editableResult.fgtsAmount !== undefined && editableResult.fgtsAmount !== null && (
                    <div className="space-y-1 rounded-md bg-background p-3">
                        <label className="text-sm font-medium text-muted-foreground flex items-center gap-1.5"><Banknote className="h-4 w-4"/> FGTS do Mês</label>
                        <CurrencyInput value={editableResult.fgtsAmount || 0} onValueChange={value => handleFieldChange('fgtsAmount', value)}/>
                    </div>
                )}
            </div>

            <div className="rounded-lg border-2 border-primary bg-primary/5 p-4 text-center">
                 <label className="text-sm font-medium text-primary">Valor Líquido a Registrar</label>
                 <CurrencyInput value={editableResult.netAmount || 0} onValueChange={value => handleFieldChange('netAmount', value)} className="w-full text-3xl font-bold text-primary bg-transparent border-0 text-center h-auto p-0 shadow-none focus-visible:ring-0"/>
            </div>

             <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">Observação</label>
                <Textarea value={editableResult.description || ''} onChange={(e) => handleFieldChange('description', e.target.value)} placeholder="Adicione uma descrição para esta renda..."/>
             </div>

          </motion.div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        {editableResult && <Button variant="outline" onClick={handleReset}>Cancelar</Button>}
        {editableResult ? (
          <Button onClick={handleConfirm} disabled={isProcessing}>
            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar e Salvar Renda
          </Button>
        ) : (
          <Button onClick={handleExtract} disabled={!file || isProcessing}>
            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
            {isProcessing ? 'Analisando...' : 'Analisar Documento'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
