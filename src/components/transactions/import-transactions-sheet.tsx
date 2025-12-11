

'use client';

import { useState, useCallback, useMemo, useReducer } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, FileCheck2, Wallet, CreditCard, UploadCloud, FileText } from 'lucide-react';
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
import { collection, writeBatch, doc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';

// Types
type WorkflowStep = 'upload' | 'analyzing' | 'review' | 'saving';
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

// State
type AppState = {
  file: File | null;
  pdfDataUri: string | null;
  currentStep: WorkflowStep;
  reviewTransactions: ReviewTransaction[];
  documentType: DocumentType;
  isProcessing: boolean;
};
type AppAction =
  | { type: 'SET_FILE'; payload: { file: File, pdfDataUri: string } }
  | { type: 'SET_CURRENT_STEP'; payload: WorkflowStep }
  | { type: 'SET_REVIEW_TRANSACTIONS'; payload: ReviewTransaction[] }
  | { type: 'SET_DOCUMENT_TYPE'; payload: DocumentType }
  | { type: 'TOGGLE_TRANSACTION_SELECTION'; payload: string }
  | { type: 'TOGGLE_ALL_TRANSACTIONS'; payload: boolean }
  | { type: 'UPDATE_TRANSACTION_CATEGORY'; payload: { id: string; category: string } }
  | { type: 'UPDATE_TRANSACTION_TYPE'; payload: { id: string; type: 'income' | 'expense' } }
  | { type: 'RESET' };

const initialState: AppState = {
  file: null,
  pdfDataUri: null,
  currentStep: 'upload',
  reviewTransactions: [],
  documentType: 'bankStatement',
  isProcessing: false,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_FILE':
      return { ...state, file: action.payload.file, pdfDataUri: action.payload.pdfDataUri, reviewTransactions: [] };
    case 'SET_CURRENT_STEP':
      return { ...state, currentStep: action.payload, isProcessing: ['analyzing', 'saving'].includes(action.payload) };
    case 'SET_REVIEW_TRANSACTIONS':
      return { ...state, reviewTransactions: action.payload };
    case 'SET_DOCUMENT_TYPE':
      return { ...state, documentType: action.payload };
    case 'TOGGLE_TRANSACTION_SELECTION':
      return {
        ...state,
        reviewTransactions: state.reviewTransactions.map(t =>
          t.id === action.payload ? { ...t, selected: !t.selected } : t
        ),
      };
    case 'TOGGLE_ALL_TRANSACTIONS':
        return {
            ...state,
            reviewTransactions: state.reviewTransactions.map(t => ({...t, selected: action.payload}))
        }
    case 'UPDATE_TRANSACTION_CATEGORY':
      return {
        ...state,
        reviewTransactions: state.reviewTransactions.map(t =>
          t.id === action.payload.id ? { ...t, category: action.payload.category } : t
        ),
      };
    case 'UPDATE_TRANSACTION_TYPE':
      return {
        ...state,
        reviewTransactions: state.reviewTransactions.map(t =>
          t.id === action.payload.id ? { ...t, type: action.payload.type } : t
        ),
      };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

// Hook
function useFileProcessor() {
  const readFileAsDataURL = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }, []);
  return { readFileAsDataURL };
}

type ImportTransactionsSheetProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function ImportTransactionsSheet({ isOpen, onClose }: ImportTransactionsSheetProps) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const { file, pdfDataUri, currentStep, reviewTransactions, documentType, isProcessing } = state;
  
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  const { readFileAsDataURL } = useFileProcessor();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
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
      try {
        const dataUri = await readFileAsDataURL(selectedFile);
        dispatch({ type: 'SET_FILE', payload: { file: selectedFile, pdfDataUri: dataUri } });
      } catch (error) {
        toast({ variant: 'destructive', title: 'Erro ao ler arquivo', description: 'Não foi possível carregar o arquivo.' });
      }
    }
  }, [readFileAsDataURL, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: { 'application/pdf': ['.pdf'] },
  });
  
  const handleReset = () => {
    dispatch({ type: 'RESET' });
    onClose();
  }
  
  const handleModalOpenChange = (open: boolean) => {
      if(!open && currentStep !== 'saving') {
          handleReset();
      }
  }

  const handleImport = async () => {
    if (!file || !pdfDataUri) return;

    if (documentType !== 'bankStatement') {
      toast({
        title: 'Em breve!',
        description: `A importação de ${documentTypes[documentType].label} ainda está em desenvolvimento.`,
      });
      return;
    }

    dispatch({ type: 'SET_CURRENT_STEP', payload: 'analyzing' });
    
    try {
        const result = await extractTransactionsFromPdf({ pdfBase64: pdfDataUri });

        const transactionsToReview: ReviewTransaction[] = (result.transactions || []).map((t) => ({
          ...t,
          id: crypto.randomUUID(),
          type: t.amount > 0 ? 'income' : 'expense',
          category: t.suggestedCategory || 'Outros',
          selected: true,
        }));
        
        dispatch({ type: 'SET_REVIEW_TRANSACTIONS', payload: transactionsToReview });
        dispatch({ type: 'SET_CURRENT_STEP', payload: 'review' });
        
        toast({
          title: 'Extração concluída!',
          description: `${transactionsToReview.length} transações encontradas. Por favor, revise-as abaixo.`
        });

    } catch (error) {
        console.error("Error processing PDF:", error);
        toast({
            variant: 'destructive',
            title: 'Erro ao processar PDF',
            description: 'Não foi possível extrair as transações. Tente um arquivo diferente ou com um layout mais simples.',
        });
        dispatch({ type: 'SET_CURRENT_STEP', payload: 'upload' });
    }
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

    dispatch({ type: 'SET_CURRENT_STEP', payload: 'saving' });
    
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
            date: t.date, // Assuming date is already YYYY-MM-DD
            description: t.description,
            category: t.category,
            isRecurring: false,
            status: 'paid' as const,
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
       dispatch({ type: 'SET_CURRENT_STEP', payload: 'review' });
    }
  }

  const allCategories = [...incomeCategories, ...expenseCategories, ...user?.customIncomeCategories || [], ...user?.customExpenseCategories || []];
  const uniqueCategories = Array.from(new Set(allCategories));

  return (
    <Dialog open={isOpen} onOpenChange={handleModalOpenChange}>
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
        
        <AnimatePresence mode="wait">
          {isProcessing ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex flex-col items-center justify-center w-full h-96 border-2 border-dashed rounded-lg"
            >
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="mt-4 text-sm font-medium text-muted-foreground">
                {currentStep === 'saving' ? 'Salvando transações...' : 'Analisando documento...'}
              </p>
              <p className="text-xs text-muted-foreground">Isso pode levar alguns segundos.</p>
            </motion.div>
          ) : currentStep === 'upload' ? (
            <motion.div key="upload-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label htmlFor="document-type" className="text-sm font-medium">Tipo de Documento</label>
                  <Select value={documentType} onValueChange={(value) => dispatch({ type: 'SET_DOCUMENT_TYPE', payload: value as DocumentType })}>
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
                <div
                  {...getRootProps()}
                  className={cn(
                    'flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors',
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
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <UploadCloud className="mx-auto h-12 w-12" />
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
            </motion.div>
          ) : (
            <motion.div
              key="review-view"
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
                          onCheckedChange={(checked) => dispatch({ type: 'TOGGLE_ALL_TRANSACTIONS', payload: Boolean(checked) })}
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
                          <Checkbox checked={t.selected} onCheckedChange={() => dispatch({ type: 'TOGGLE_TRANSACTION_SELECTION', payload: t.id })} />
                        </TableCell>
                        <TableCell>{t.date}</TableCell>
                        <TableCell>{t.description}</TableCell>
                        <TableCell>
                          <Select value={t.type} onValueChange={(value: 'income' | 'expense') => dispatch({ type: 'UPDATE_TRANSACTION_TYPE', payload: { id: t.id, type: value } })}>
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
                          <Select value={t.category} onValueChange={(value) => dispatch({ type: 'UPDATE_TRANSACTION_CATEGORY', payload: { id: t.id, category: value } })}>
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
                  Salvar Transações ({reviewTransactions.filter(t => t.selected).length})
                </Button>
              </DialogFooter>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
