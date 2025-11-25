'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, FileUp, FileCheck2, AlertTriangle, Wallet, Check, ChevronsUpDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDropzone } from 'react-dropzone';
import { cn } from '@/lib/utils';
import { extractTransactionsFromPdf } from '@/ai/flows/extract-transactions-from-pdf-flow';
import { expenseCategories, incomeCategories, Transaction, type ExtractedTransaction } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Checkbox } from '../ui/checkbox';


type ImportTransactionsSheetProps = {
  isOpen: boolean;
  onClose: () => void;
};

type ReviewTransaction = ExtractedTransaction & {
  id: string;
  type: 'income' | 'expense';
  category: string;
  selected: boolean;
};

export function ImportTransactionsSheet({ isOpen, onClose }: ImportTransactionsSheetProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [reviewTransactions, setReviewTransactions] = useState<ReviewTransaction[]>([]);
  const { toast } = useToast();

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      if (selectedFile.type !== 'application/pdf') {
        toast({
            variant: 'destructive',
            title: 'Arquivo inválido',
            description: 'Por favor, selecione apenas arquivos PDF.',
        });
        return;
      }
      setFile(selectedFile);
      setReviewTransactions([]);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: { 'application/pdf': ['.pdf'] },
  });
  
  const handleReset = () => {
    setFile(null);
    setReviewTransactions([]);
    setIsProcessing(false);
    onClose();
  }

  const handleImport = async () => {
    if (!file) return;

    setIsProcessing(true);
    
    try {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            const base64File = (reader.result as string).split(',')[1];
            const result = await extractTransactionsFromPdf({ pdfBase64: base64File });

            const transactionsToReview: ReviewTransaction[] = result.transactions.map((t, i) => ({
              ...t,
              id: `${Date.now()}-${i}`,
              type: t.amount > 0 ? 'income' : 'expense',
              category: t.suggestedCategory || 'Outros',
              selected: true,
            }));
            
            setReviewTransactions(transactionsToReview);
            
            toast({
              title: 'Extração concluída!',
              description: `${transactionsToReview.length} transações encontradas. Por favor, revise-as abaixo.`
            });
        };

    } catch (error) {
        console.error("Error processing PDF:", error);
        toast({
            variant: 'destructive',
            title: 'Erro ao processar PDF',
            description: 'Não foi possível extrair as transações. Tente um arquivo diferente ou com um layout mais simples.',
        });
    } finally {
        setIsProcessing(false);
    }
  };

  const handleToggleSelect = (id: string) => {
    setReviewTransactions(prev => prev.map(t => t.id === id ? { ...t, selected: !t.selected } : t));
  };
  
  const handleSelectAll = (checked: boolean) => {
    setReviewTransactions(prev => prev.map(t => ({...t, selected: checked})));
  }

  const handleCategoryChange = (id: string, category: string) => {
    setReviewTransactions(prev => prev.map(t => t.id === id ? { ...t, category } : t));
  };

  const handleTypeChange = (id: string, type: 'income' | 'expense') => {
    setReviewTransactions(prev => prev.map(t => t.id === id ? { ...t, type } : t));
  };
  
  const handleSave = () => {
    const selectedCount = reviewTransactions.filter(t => t.selected).length;
    toast({
        title: "Em desenvolvimento...",
        description: `A lógica para salvar as ${selectedCount} transações selecionadas ainda será implementada.`,
    });
  }

  const allCategories = [...incomeCategories, ...expenseCategories, 'Outros'];

  return (
    <Dialog open={isOpen} onOpenChange={handleReset}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Importar Extrato Bancário</DialogTitle>
          <DialogDescription>
            {reviewTransactions.length === 0 
                ? "Envie seu extrato em PDF para importar suas transações automaticamente."
                : "Revise as transações extraídas antes de salvá-las."
            }
          </DialogDescription>
        </DialogHeader>
        
        {reviewTransactions.length === 0 ? (
          <>
            <div className="space-y-4 py-4">
              <div
                {...getRootProps()}
                className={cn(
                  'flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-colors',
                  isDragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                )}
              >
                <input {...getInputProps()} />
                {file ? (
                    <div className="text-center text-emerald-600">
                        <FileCheck2 className="mx-auto h-12 w-12" />
                        <p className="mt-2 font-semibold">Arquivo selecionado!</p>
                        <p className="text-xs">{file.name}</p>
                    </div>
                ) : isDragActive ? (
                  <p>Solte o arquivo aqui...</p>
                ) : (
                  <div className="text-center text-muted-foreground">
                    <FileUp className="mx-auto h-12 w-12" />
                    <p className="mt-2">Arraste e solte o arquivo PDF aqui,</p>
                    <p className="text-xs">ou clique para selecionar</p>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleReset}>Cancelar</Button>
              <Button onClick={handleImport} disabled={!file || isProcessing}>
                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Extrair Transações
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="max-h-[60vh] overflow-y-auto pr-2">
               <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox 
                        checked={reviewTransactions.every(t => t.selected)}
                        onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
                      />
                    </TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reviewTransactions.map(t => (
                    <TableRow key={t.id} className={cn(!t.selected && "bg-muted/50 text-muted-foreground")}>
                      <TableCell>
                        <Checkbox checked={t.selected} onCheckedChange={() => handleToggleSelect(t.id)} />
                      </TableCell>
                      <TableCell>{t.date}</TableCell>
                      <TableCell>{t.description}</TableCell>
                       <TableCell>
                        <Select value={t.type} onValueChange={(value: 'income' | 'expense') => handleTypeChange(t.id, value)}>
                            <SelectTrigger className="h-8 w-28 text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="expense">Despesa</SelectItem>
                                <SelectItem value="income">Renda</SelectItem>
                            </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select value={t.category} onValueChange={(value) => handleCategoryChange(t.id, value)}>
                           <SelectTrigger className="h-8 w-36 text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {allCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                            </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className={cn("text-right font-medium", t.amount > 0 ? 'text-emerald-600' : 'text-red-600')}>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
               </Table>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleReset}>Cancelar</Button>
              <Button onClick={handleSave} disabled={reviewTransactions.filter(t => t.selected).length === 0}>
                Salvar Transações ({reviewTransactions.filter(t => t.selected).length})
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
