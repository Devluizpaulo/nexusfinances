
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
import { Loader2, FileUp, FileCheck2, AlertTriangle, Wallet, Check, ChevronsUpDown, FileText, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDropzone } from 'react-dropzone';
import { cn } from '@/lib/utils';
import { extractTransactionsFromPdf } from '@/ai/flows/extract-transactions-from-pdf-flow';
import { expenseCategories, incomeCategories, type ExtractedTransaction } from '@/lib/types';
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
import { Checkbox } from '../ui/checkbox';
import { useFirestore, useUser } from '@/firebase';
import { collection, doc, writeBatch } from 'firebase/firestore';
import { motion } from 'framer-motion';


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

type DocumentType = 'bankStatement' | 'creditCardBill' | 'taxDocument';

const documentTypes: Record<DocumentType, { label: string, icon: React.FC<any> }> = {
  bankStatement: { label: 'Extrato de Conta Corrente', icon: Wallet },
  creditCardBill: { label: 'Fatura de Cartão de Crédito', icon: CreditCard },
  taxDocument: { label: 'Comprovante de Imposto', icon: FileText },
};


export function ImportTransactionsSheet({ isOpen, onClose }: ImportTransactionsSheetProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [reviewTransactions, setReviewTransactions] = useState<ReviewTransaction[]>([]);
  const [documentType, setDocumentType] = useState<DocumentType>('bankStatement');
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

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

    if (documentType !== 'bankStatement') {
      toast({
        title: 'Em breve!',
        description: `A importação de ${documentTypes[documentType].label} ainda está em desenvolvimento.`,
      });
      return;
    }

    setIsProcessing(true);
    
    try {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            const base64File = reader.result as string; // Already a data URI
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
  
  const handleSave = async () => {
    if (!user || !firestore) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Você não está autenticado.' });
      return;
    }

    const transactionsToSave = reviewTransactions.filter(t => t.selected);
    if (transactionsToSave.length === 0) {
      toast({ variant: 'destructive', title: 'Nenhuma transação selecionada', description: 'Selecione as transações que deseja salvar.' });
      return;
    }

    setIsProcessing(true);
    
    try {
      const batch = writeBatch(firestore);

      transactionsToSave.forEach(t => {
        const collectionName = t.type === 'income' ? 'incomes' : 'expenses';
        const docRef = doc(collection(firestore, `users/${user.uid}/${collectionName}`));
        
        const newTransaction = {
            id: docRef.id,
            userId: user.uid,
            type: t.type,
            amount: Math.abs(t.amount), // Always store as positive
            date: t.date,
            description: t.description,
            category: t.category,
            isRecurring: false,
            status: 'paid' as const, // Assume imported transactions are already paid
        };

        batch.set(docRef, newTransaction);
      });

      await batch.commit();

      toast({
        title: 'Transações salvas!',
        description: `${transactionsToSave.length} transações foram importadas com sucesso.`,
      });

      handleReset();

    } catch (error) {
      console.error("Error saving transactions:", error);
       toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar as transações importadas. Tente novamente.',
      });
    } finally {
        setIsProcessing(false);
    }
  }

  const allCategories = [...incomeCategories, ...expenseCategories, ...user?.customIncomeCategories || [], ...user?.customExpenseCategories || []];
  const uniqueCategories = Array.from(new Set(allCategories));

  return (
    <Dialog open={isOpen} onOpenChange={handleReset}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Importar Documento PDF</DialogTitle>
          <DialogDescription>
            {reviewTransactions.length === 0 
                ? "Envie seu extrato, fatura ou comprovante para importar suas transações automaticamente."
                : "Revise as transações extraídas antes de salvá-las."
            }
          </DialogDescription>
        </DialogHeader>
        
        {reviewTransactions.length === 0 ? (
          <>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="document-type" className="text-sm font-medium">Tipo de Documento</label>
                 <Select value={documentType} onValueChange={(value) => setDocumentType(value as DocumentType)}>
                    <SelectTrigger id="document-type">
                      <SelectValue placeholder="Selecione o tipo de documento..." />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(documentTypes).map(([key, {label, icon: Icon}]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <span>{label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
              </div>

              <motion.div
                {...getRootProps()}
                className={cn(
                  'flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-colors',
                  isDragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                )}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <input {...getInputProps()} />
                {file ? (
                    <motion.div 
                        className="text-center text-emerald-600"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                    >
                        <FileCheck2 className="mx-auto h-12 w-12" />
                        <p className="mt-2 font-semibold">Arquivo selecionado!</p>
                        <p className="text-xs">{file.name}</p>
                    </motion.div>
                ) : isDragActive ? (
                  <p>Solte o arquivo aqui...</p>
                ) : (
                  <div className="text-center text-muted-foreground">
                    <FileUp className="mx-auto h-12 w-12" />
                    <p className="mt-2">Arraste e solte o arquivo PDF aqui,</p>
                    <p className="text-xs">ou clique para selecionar</p>
                  </div>
                )}
              </motion.div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleReset}>Cancelar</Button>
              <Button onClick={handleImport} disabled={!file || isProcessing}>
                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isProcessing ? 'Analisando...' : 'Extrair Transações'}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
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
                                {uniqueCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
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
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={handleReset}>Cancelar</Button>
              <Button onClick={handleSave} disabled={reviewTransactions.filter(t => t.selected).length === 0 || isProcessing}>
                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Transações ({reviewTransactions.filter(t => t.selected).length})
              </Button>
            </DialogFooter>
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  );
}
