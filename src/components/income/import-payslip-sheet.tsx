'use client';

import { useState, useEffect, useCallback, useMemo, useReducer, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Loader2, FileCheck2, UploadCloud, Banknote, CalendarIcon,
  CheckCircle2, XCircle, AlertCircle, Eye, EyeOff, Plus, Trash2, Save, Sparkles, RefreshCw
} from 'lucide-react';
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
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { PDFViewer } from '@/components/income/pdf-viewer';

type ImportPayslipSheetProps = { isOpen: boolean; onClose: () => void };
type WorkflowStep = 'upload' | 'analyzing' | 'review' | 'confirm';
type AnalysisQuality = 'high' | 'medium' | 'low';

const CACHE_KEY = 'payslip_analysis_cache_v2';

// State management with reducer
type AppState = {
  file: File | null;
  pdfDataUri: string | null;
  currentStep: WorkflowStep;
  analysisProgress: number;
  originalResult: ExtractPayslipOutput | null;
  editableResult: ExtractPayslipOutput | null;
  analysisQuality: AnalysisQuality;
  showPdfPreview: boolean;
  isProcessing: boolean;
  isSaving: boolean;
};

type AppAction =
  | { type: 'SET_FILE'; payload: File | null }
  | { type: 'SET_PDF_DATA_URI'; payload: string | null }
  | { type: 'SET_CURRENT_STEP'; payload: WorkflowStep }
  | { type: 'SET_ANALYSIS_PROGRESS'; payload: number }
  | { type: 'SET_ORIGINAL_RESULT'; payload: ExtractPayslipOutput | null }
  | { type: 'SET_EDITABLE_RESULT'; payload: ExtractPayslipOutput | null }
  | { type: 'SET_ANALYSIS_QUALITY'; payload: AnalysisQuality }
  | { type: 'SET_SHOW_PDF_PREVIEW'; payload: boolean }
  | { type: 'SET_IS_PROCESSING'; payload: boolean }
  | { type: 'SET_IS_SAVING'; payload: boolean }
  | { type: 'RESET' };

const initialState: AppState = {
  file: null,
  pdfDataUri: null,
  currentStep: 'upload',
  analysisProgress: 0,
  originalResult: null,
  editableResult: null,
  analysisQuality: 'medium',
  showPdfPreview: true,
  isProcessing: false,
  isSaving: false,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_FILE':
      return { ...state, file: action.payload };
    case 'SET_PDF_DATA_URI':
      return { ...state, pdfDataUri: action.payload };
    case 'SET_CURRENT_STEP':
      return { ...state, currentStep: action.payload };
    case 'SET_ANALYSIS_PROGRESS':
      return { ...state, analysisProgress: action.payload };
    case 'SET_ORIGINAL_RESULT':
      return { ...state, originalResult: action.payload };
    case 'SET_EDITABLE_RESULT':
      return { ...state, editableResult: action.payload };
    case 'SET_ANALYSIS_QUALITY':
      return { ...state, analysisQuality: action.payload };
    case 'SET_SHOW_PDF_PREVIEW':
      return { ...state, showPdfPreview: action.payload };
    case 'SET_IS_PROCESSING':
      return { ...state, isProcessing: action.payload };
    case 'SET_IS_SAVING':
      return { ...state, isSaving: action.payload };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

// Custom hooks
function useCacheManager() {
  const getAnalysisCache = useCallback((): Record<string, { data: ExtractPayslipOutput; timestamp: number }> => {
    if (typeof window === 'undefined') return {};
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      return cached ? JSON.parse(cached) : {};
    } catch {
      return {};
    }
  }, []);

  const setAnalysisCache = useCallback((fileHash: string, data: ExtractPayslipOutput) => {
    if (typeof window === 'undefined') return;
    try {
      const cache = getAnalysisCache();
      cache[fileHash] = { data, timestamp: Date.now() };

      // Keep only last 5 entries
      const keys = Object.keys(cache);
      if (keys.length > 5) {
        const oldest = keys.sort((a, b) => cache[a].timestamp - cache[b].timestamp)[0];
        delete cache[oldest];
      }

      sessionStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
      console.warn('Failed to cache analysis result:', error);
    }
  }, [getAnalysisCache]);

  const clearCacheEntry = useCallback((fileHash: string) => {
    try {
      const cache = getAnalysisCache();
      delete cache[fileHash];
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
      console.warn('Failed to clear cache entry:', error);
    }
  }, [getAnalysisCache]);

  return {
    getAnalysisCache,
    setAnalysisCache,
    clearCacheEntry,
  };
}

function useFileProcessor() {
  const generateFileHash = useCallback(async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
  }, []);

  const readFileAsDataURL = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }, []);

  return {
    generateFileHash,
    readFileAsDataURL,
  };
}

function useAnalysisValidator() {
  const evaluateAnalysisQuality = useCallback((result: ExtractPayslipOutput): AnalysisQuality => {
    let score = 0;
    if (result.netAmount && result.netAmount > 0) score += 3;
    if (result.grossAmount && result.grossAmount > 0) score += 2;
    if (result.companyName) score += 1;
    if (result.issueDate) score += 1;
    if (result.earnings && result.earnings.length > 0) score += 2;
    if (result.deductions && result.deductions.length > 0) score += 1;
    if (score >= 8) return 'high';
    if (score >= 5) return 'medium';
    return 'low';
  }, []);

  const formatCurrency = useCallback((amount: number | undefined) => {
    if (typeof amount !== 'number') return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
  }, []);

  return {
    evaluateAnalysisQuality,
    formatCurrency,
  };
}

export function ImportPayslipSheet({ isOpen, onClose }: ImportPayslipSheetProps) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const {
    file, pdfDataUri, currentStep, analysisProgress, originalResult,
    editableResult, analysisQuality, showPdfPreview, isProcessing, isSaving
  } = state;

  const progressRef = useRef(0);

  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  const { getAnalysisCache, setAnalysisCache, clearCacheEntry } = useCacheManager();
  const { generateFileHash, readFileAsDataURL } = useFileProcessor();
  const { evaluateAnalysisQuality, formatCurrency } = useAnalysisValidator();

  // Update editable result when original result changes
  useEffect(() => {
    if (originalResult) {
      dispatch({ type: 'SET_EDITABLE_RESULT', payload: JSON.parse(JSON.stringify(originalResult)) });
      dispatch({ type: 'SET_ANALYSIS_QUALITY', payload: evaluateAnalysisQuality(originalResult) });
    } else {
      dispatch({ type: 'SET_EDITABLE_RESULT', payload: null });
    }
  }, [originalResult, evaluateAnalysisQuality]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      if (selectedFile.type !== 'application/pdf') {
        toast({
          variant: 'destructive',
          title: 'Arquivo inválido',
          description: 'Por favor, selecione apenas arquivos PDF.'
        });
        return;
      }

      if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          variant: 'destructive',
          title: 'Arquivo muito grande',
          description: 'Por favor, selecione um arquivo PDF menor que 10MB.'
        });
        return;
      }

      dispatch({ type: 'SET_FILE', payload: selectedFile });
      dispatch({ type: 'SET_ORIGINAL_RESULT', payload: null });
      dispatch({ type: 'SET_CURRENT_STEP', payload: 'upload' });

      try {
        const dataUri = await readFileAsDataURL(selectedFile);
        dispatch({ type: 'SET_PDF_DATA_URI', payload: dataUri });
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Erro ao ler arquivo',
          description: 'Não foi possível ler o arquivo PDF. Tente novamente.'
        });
      }
    }
  }, [toast, readFileAsDataURL]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const handleExtract = async () => {
    if (!file || !pdfDataUri) return;

    dispatch({ type: 'SET_CURRENT_STEP', payload: 'analyzing' });
    dispatch({ type: 'SET_IS_PROCESSING', payload: true });
    progressRef.current = 0;
    dispatch({ type: 'SET_ANALYSIS_PROGRESS', payload: 0 });

    const progressInterval = setInterval(() => {
      progressRef.current = Math.min(progressRef.current + Math.random() * 15, 90);
      dispatch({ type: 'SET_ANALYSIS_PROGRESS', payload: progressRef.current });
    }, 500);

    try {
      const fileHash = await generateFileHash(file);
      const cache = getAnalysisCache();

      // Check cache first
      if (cache[fileHash] && (Date.now() - cache[fileHash].timestamp) < 24 * 60 * 60 * 1000) { // 24h cache
        clearInterval(progressInterval);
        dispatch({ type: 'SET_ANALYSIS_PROGRESS', payload: 100 });
        dispatch({ type: 'SET_ORIGINAL_RESULT', payload: cache[fileHash].data });
        dispatch({ type: 'SET_CURRENT_STEP', payload: 'review' });

        toast({
          title: 'Análise recuperada do cache!',
          description: 'Dados da análise anterior foram carregados.'
        });

        dispatch({ type: 'SET_IS_PROCESSING', payload: false });
        return;
      }

      // Perform new analysis
      const extractedData = await extractPayslipData({ pdfBase64: pdfDataUri });
      clearInterval(progressInterval);
      dispatch({ type: 'SET_ANALYSIS_PROGRESS', payload: 100 });

      if (!extractedData || !extractedData.netAmount) {
        toast({
          variant: 'destructive',
          title: 'Análise incompleta',
          description: 'Alguns dados não foram identificados. Preencha manualmente.'
        });

        const fallbackData: ExtractPayslipOutput = {
          netAmount: 0,
          grossAmount: 0,
          totalDeductions: 0,
          earnings: [],
          deductions: [],
          companyName: '',
          issueDate: format(new Date(), 'yyyy-MM-dd'),
          description: ''
        };

        dispatch({ type: 'SET_ORIGINAL_RESULT', payload: fallbackData });
      } else {
        dispatch({ type: 'SET_ORIGINAL_RESULT', payload: extractedData });
        setAnalysisCache(fileHash, extractedData);

        toast({
          title: 'Análise concluída com sucesso!',
          description: 'Revise os dados extraídos e faça ajustes se necessário.'
        });
      }

      dispatch({ type: 'SET_CURRENT_STEP', payload: 'review' });
    } catch (error) {
      clearInterval(progressInterval);
      console.error('Erro na análise do documento:', error);

      toast({
        variant: 'destructive',
        title: 'Erro na análise',
        description: 'Não foi possível analisar o documento. Tente novamente.'
      });

      dispatch({ type: 'SET_CURRENT_STEP', payload: 'upload' });
    } finally {
      dispatch({ type: 'SET_IS_PROCESSING', payload: false });
    }
  };

  const handleReprocess = async () => {
    if (!file) return;

    try {
      const fileHash = await generateFileHash(file);
      clearCacheEntry(fileHash);
      await handleExtract();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao reanalisar',
        description: 'Não foi possível reprocessar o documento.'
      });
    }
  };

  const handleFieldChange = (field: keyof ExtractPayslipOutput, value: any) => {
    if (!editableResult) return;

    const updatedResult = { ...editableResult, [field]: value };
    dispatch({ type: 'SET_EDITABLE_RESULT', payload: updatedResult });
  };

  const handleAddEarning = () => {
    if (!editableResult) return;

    const updatedEarnings = [...(editableResult.earnings || []), { name: '', amount: 0 }];
    handleFieldChange('earnings', updatedEarnings);
  };

  const handleRemoveEarning = (index: number) => {
    if (!editableResult?.earnings) return;

    const updatedEarnings = editableResult.earnings.filter((_, i) => i !== index);
    handleFieldChange('earnings', updatedEarnings);
  };

  const handleAddDeduction = () => {
    if (!editableResult) return;

    const updatedDeductions = [...(editableResult.deductions || []), { name: '', amount: 0 }];
    handleFieldChange('deductions', updatedDeductions);
  };

  const handleRemoveDeduction = (index: number) => {
    if (!editableResult?.deductions) return;

    const updatedDeductions = editableResult.deductions.filter((_, i) => i !== index);
    handleFieldChange('deductions', updatedDeductions);
  };

  const handleConfirm = async () => {
    if (!editableResult || !user || !firestore) return;

    dispatch({ type: 'SET_CURRENT_STEP', payload: 'confirm' });
    dispatch({ type: 'SET_IS_SAVING', payload: true });

    try {
      const incomesColRef = collection(firestore, `users/${user.uid}/incomes`);
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
        notes: `Importado via IA: ${file?.name || 'documento'}.`,
        importedAt: new Date().toISOString(),
      };

      await addDocumentNonBlocking(incomesColRef, incomeData);

      toast({
        title: 'Renda registrada com sucesso!',
        description: `${formatCurrency(editableResult.netAmount)} salvo na sua conta.`
      });

      handleReset();
    } catch (error) {
      console.error('Erro ao salvar dados:', error);

      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar os dados. Tente novamente.'
      });

      dispatch({ type: 'SET_CURRENT_STEP', payload: 'review' });
    } finally {
      dispatch({ type: 'SET_IS_SAVING', payload: false });
    }
  };

  const handleReset = () => {
    dispatch({ type: 'RESET' });
    onClose();
  };

  const calculatedTotals = useMemo(() => {
    if (!editableResult) return { earnings: 0, deductions: 0, net: 0 };

    const totalEarnings = (editableResult.earnings || []).reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalDeductions = (editableResult.deductions || []).reduce((sum, d) => sum + (d.amount || 0), 0);

    return {
      earnings: totalEarnings,
      deductions: totalDeductions,
      net: totalEarnings - totalDeductions
    };
  }, [editableResult]);

  // Components
  const QualityBadge = useMemo(() => {
    const config = {
      high: {
        label: 'Alta Confiança',
        variant: 'default' as const,
        icon: CheckCircle2,
        color: 'text-emerald-500',
        bgColor: 'bg-emerald-50 border-emerald-200 text-emerald-700'
      },
      medium: {
        label: 'Média Confiança',
        variant: 'secondary' as const,
        icon: AlertCircle,
        color: 'text-amber-500',
        bgColor: 'bg-amber-50 border-amber-200 text-amber-700'
      },
      low: {
        label: 'Verificar Dados',
        variant: 'destructive' as const,
        icon: XCircle,
        color: 'text-red-500',
        bgColor: 'bg-red-50 border-red-200 text-red-700'
      }
    };

    const { label, icon: Icon, color, bgColor } = config[analysisQuality];

    return (
      <Badge variant="outline" className={cn("gap-1.5 px-3 py-1.5 border-2", bgColor)}>
        <Icon className={cn("h-3.5 w-3.5", color)} />
        {label}
      </Badge>
    );
  }, [analysisQuality]);

  const StepIndicator = useMemo(() => {
    const steps = [
      { key: 'upload' as const, label: 'Upload' },
      { key: 'analyzing' as const, label: 'Análise' },
      { key: 'review' as const, label: 'Revisão' },
      { key: 'confirm' as const, label: 'Salvar' }
    ];

    const currentIndex = steps.findIndex(s => s.key === currentStep);

    return (
      <div className="flex items-center justify-center gap-2 mb-6">
        {steps.map((step, index) => (
          <div key={step.key} className="flex items-center">
            <div className={cn(
              "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-all duration-300 border-2",
              index <= currentIndex
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted text-muted-foreground border-muted-foreground/30"
            )}>
              {index < currentIndex ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
            </div>
            <p className={cn("ml-2 text-sm", index <= currentIndex ? 'font-semibold text-primary' : 'text-muted-foreground')}>{step.label}</p>
            {index < steps.length - 1 && (
              <div className={cn(
                "w-8 h-0.5 mx-2 transition-colors duration-300",
                index < currentIndex ? "bg-primary" : "bg-muted"
              )} />
            )}
          </div>
        ))}
      </div>
    );
  }, [currentStep]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleReset()}>
      <DialogContent size="full" className="!max-w-[95vw] lg:!max-w-[80vw] h-[90vh] p-0 gap-0 overflow-hidden">
        <div className="flex flex-col h-full bg-background">
          {/* Header */}
          <div className="px-6 py-4 border-b shrink-0">
            <DialogHeader className="text-left">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl font-bold">
                      Importar Holerite com IA
                    </DialogTitle>
                    <DialogDescription className="text-sm">
                      Envie seu holerite para extrair automaticamente os valores
                    </DialogDescription>
                  </div>
                </div>
                {editableResult && (
                  <div className="flex items-center gap-2">
                    {QualityBadge}
                  </div>
                )}
              </div>
            </DialogHeader>
            {currentStep !== 'upload' && <div className="mt-4">{StepIndicator}</div>}
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-hidden">
            <AnimatePresence mode="wait">
              {currentStep === 'upload' && (
                <motion.div
                  key="upload"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="h-full flex items-center justify-center p-6"
                >
                  <div className="w-full max-w-lg">
                    <div
                      {...getRootProps()}
                      className={cn(
                        'flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors p-6',
                        isDragActive
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      <input {...getInputProps()} />
                      {file ? (
                        <div className="text-center">
                          <FileCheck2 className="mx-auto h-12 w-12 text-emerald-600" />
                          <p className="mt-2 font-semibold">Arquivo selecionado!</p>
                          <p className="text-sm text-muted-foreground truncate max-w-xs">{file.name}</p>
                        </div>
                      ) : (
                        <div className="text-center text-muted-foreground">
                          <UploadCloud className="mx-auto h-12 w-12" />
                          <p className="mt-2">Arraste e solte seu PDF aqui</p>
                          <p className="text-xs">ou clique para selecionar</p>
                        </div>
                      )}
                    </div>

                    {file && (
                      <div className="mt-6 flex justify-center">
                        <Button
                          size="lg"
                          onClick={handleExtract}
                          disabled={isProcessing}
                        >
                          <Sparkles className="mr-2 h-5 w-5" />
                          {isProcessing ? 'Analisando...' : 'Analisar com IA'}
                        </Button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {currentStep === 'analyzing' && (
                <motion.div
                  key="analyzing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full flex flex-col items-center justify-center"
                >
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <h3 className="mt-4 text-xl font-semibold">Analisando documento...</h3>
                    <p className="text-muted-foreground">Aguarde, nossa IA está trabalhando.</p>
                    <Progress value={analysisProgress} className="mt-4 w-64" />
                </motion.div>
              )}

              {currentStep === 'review' && editableResult && (
                <motion.div
                  key="review"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="h-full"
                >
                  <div className={cn(
                    "flex flex-col lg:flex-row h-full transition-all duration-300",
                    showPdfPreview ? "lg:divide-x" : ""
                  )}>
                    {showPdfPreview && (
                      <div className="lg:w-[45%] flex flex-col border-b lg:border-b-0 lg:border-r bg-muted/5 shrink-0">
                        <PDFViewer pdfDataUri={pdfDataUri} fileName={file?.name}/>
                      </div>
                    )}

                    <ScrollArea className="flex-1">
                      <div className="p-4 lg:p-6 space-y-4">
                        <Card>
                          <CardHeader className="pb-4">
                            <CardTitle className="text-base">Informações Básicas</CardTitle>
                          </CardHeader>
                          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Pagador / Empresa</label>
                              <Input
                                value={editableResult.companyName || ''}
                                onChange={(e) => handleFieldChange('companyName', e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Data de Competência</label>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {editableResult.issueDate ? format(parseISO(editableResult.issueDate), 'PPP', { locale: ptBR }) : 'Selecione'}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={editableResult.issueDate ? parseISO(editableResult.issueDate) : undefined} onSelect={(d) => handleFieldChange('issueDate', d ? format(d, 'yyyy-MM-dd') : '')} /></PopoverContent>
                              </Popover>
                            </div>
                          </CardContent>
                        </Card>

                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                          <Card>
                            <CardHeader className="pb-4 flex-row items-center justify-between">
                              <CardTitle className="text-base text-emerald-600">Proventos (Ganhos)</CardTitle>
                              <Button variant="ghost" size="sm" onClick={handleAddEarning}><Plus className="mr-1 h-4 w-4"/>Adicionar</Button>
                            </CardHeader>
                            <CardContent className="space-y-2">
                              {(editableResult.earnings || []).map((item, index) => (
                                <div key={index} className="flex items-center gap-2">
                                  <Input value={item.name} onChange={e => {/*...*/}}/>
                                  <CurrencyInput value={item.amount} onValueChange={v => {/*...*/}} />
                                  <Button variant="ghost" size="icon" onClick={() => handleRemoveEarning(index)}><Trash2 className="h-4 w-4"/></Button>
                                </div>
                              ))}
                              <Separator/>
                              <div className="flex justify-between items-center font-semibold"><span>Total</span><span>{formatCurrency(calculatedTotals.earnings)}</span></div>
                            </CardContent>
                          </Card>

                          <Card>
                             <CardHeader className="pb-4 flex-row items-center justify-between">
                              <CardTitle className="text-base text-red-600">Descontos</CardTitle>
                              <Button variant="ghost" size="sm" onClick={handleAddDeduction}><Plus className="mr-1 h-4 w-4"/>Adicionar</Button>
                            </CardHeader>
                            <CardContent className="space-y-2">
                              {(editableResult.deductions || []).map((item, index) => (
                                <div key={index} className="flex items-center gap-2">
                                  <Input value={item.name} onChange={e => {/*...*/}}/>
                                  <CurrencyInput value={item.amount} onValueChange={v => {/*...*/}} />
                                  <Button variant="ghost" size="icon" onClick={() => handleRemoveDeduction(index)}><Trash2 className="h-4 w-4"/></Button>
                                </div>
                              ))}
                              <Separator/>
                              <div className="flex justify-between items-center font-semibold"><span>Total</span><span>{formatCurrency(calculatedTotals.deductions)}</span></div>
                            </CardContent>
                          </Card>
                        </div>
                        
                        <Card>
                          <CardContent className="pt-6">
                            <label className="text-sm font-medium">Observações</label>
                            <Textarea value={editableResult.description || ''} onChange={e => handleFieldChange('description', e.target.value)} />
                          </CardContent>
                        </Card>
                        
                        <Card className="border-primary bg-primary/5">
                          <CardHeader className="text-center pb-2">
                            <CardTitle>Valor Líquido a Receber</CardTitle>
                          </CardHeader>
                           <CardContent className="text-center">
                            <CurrencyInput value={editableResult.netAmount} onValueChange={v => handleFieldChange('netAmount', v)} className="text-3xl font-bold border-0 text-center h-auto p-0"/>
                            {calculatedTotals.net !== editableResult.netAmount && (
                                <Button variant="link" size="sm" onClick={() => handleFieldChange('netAmount', calculatedTotals.net)}>Usar valor calculado: {formatCurrency(calculatedTotals.net)}</Button>
                            )}
                          </CardContent>
                        </Card>

                      </div>
                    </ScrollArea>
                  </div>
                </motion.div>
              )}

              {currentStep === 'confirm' && (
                <motion.div
                  key="confirm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full flex flex-col items-center justify-center"
                >
                   <Loader2 className="h-12 w-12 animate-spin text-primary" />
                   <h3 className="mt-4 text-xl font-semibold">Salvando dados...</h3>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t flex items-center justify-between shrink-0">
            <Button
              variant="ghost"
              onClick={handleReset}
              disabled={isSaving}
            >
              Cancelar
            </Button>

            <div className="flex items-center gap-3">
              {currentStep === 'review' && (
                <>
                  <Button variant="outline" onClick={() => dispatch({ type: 'SET_SHOW_PDF_PREVIEW', payload: !showPdfPreview })}>
                    {showPdfPreview ? <EyeOff className="mr-2 h-4 w-4"/> : <Eye className="mr-2 h-4 w-4"/>}
                    {showPdfPreview ? 'Ocultar PDF' : 'Mostrar PDF'}
                  </Button>
                   <Button variant="outline" onClick={handleReprocess} disabled={isProcessing}>
                    <RefreshCw className={cn("mr-2 h-4 w-4", isProcessing && "animate-spin")} />
                    Reanalisar
                  </Button>
                  <Button
                    onClick={handleConfirm}
                    disabled={isSaving || !editableResult?.netAmount}
                  >
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                    Confirmar e Salvar
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
