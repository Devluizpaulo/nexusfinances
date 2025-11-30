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
  Loader2, FileCheck2, FileText, UploadCloud, Banknote, CalendarIcon,
  CheckCircle2, XCircle, AlertCircle, ZoomIn, ZoomOut, RotateCw,
  Maximize2, Minimize2, RefreshCw, Save, Plus, Trash2, ChevronRight, Sparkles,
  Eye, EyeOff
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

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
  pdfZoom: number;
  pdfRotation: number;
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
  | { type: 'SET_PDF_ZOOM'; payload: number }
  | { type: 'SET_PDF_ROTATION'; payload: number }
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
  pdfZoom: 100,
  pdfRotation: 0,
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
    case 'SET_PDF_ZOOM':
      return { ...state, pdfZoom: action.payload };
    case 'SET_PDF_ROTATION':
      return { ...state, pdfRotation: action.payload };
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
    editableResult, analysisQuality, pdfZoom, pdfRotation, showPdfPreview,
    isProcessing, isSaving
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
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={cn(
                    "flex items-center justify-center w-9 h-9 rounded-full text-sm font-medium transition-all duration-300 border-2",
                    index < currentIndex && "bg-primary text-primary-foreground border-primary",
                    index === currentIndex && "bg-primary text-primary-foreground border-primary ring-2 ring-primary ring-offset-2",
                    index > currentIndex && "bg-muted text-muted-foreground border-muted-foreground/30"
                  )}>
                    {index < currentIndex ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{step.label}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

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
      <DialogContent size="full" className="!max-w-[1500px] h-[94vh] max-h-[900px] p-0 gap-0 overflow-hidden">
        <div className="flex flex-col h-full bg-background">
        {/* Header */}
        <div className="px-6 py-4 border-b bg-gradient-to-r from-muted/30 to-muted/10 shrink-0">
          <DialogHeader className="text-left">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
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
              </div>
              {editableResult && (
                <div className="flex items-center gap-2">
                  {QualityBadge}
                </div>
              )}
            </div>
          </DialogHeader>
          {StepIndicator}
        </div>

        {/* Main Content - Scrollable */}
        <ScrollArea className="flex-1">
          <div className="min-h-0">
            <AnimatePresence mode="wait">
              {currentStep === 'upload' && (
                <motion.div
                  key="upload"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="h-full flex items-center justify-center p-6"
                >
                  <div className="w-full max-w-2xl">
                    <div
                      {...getRootProps()}
                      className={cn(
                        'flex flex-col items-center justify-center w-full h-72 border-3 border-dashed rounded-2xl cursor-pointer transition-all duration-300 p-8',
                        isDragActive
                          ? 'border-primary bg-primary/10 scale-[1.02] shadow-lg'
                          : 'border-border hover:border-primary/60 hover:bg-muted/40 hover:shadow-md'
                      )}
                    >
                      <input {...getInputProps()} />
                      {file ? (
                        <div className="text-center space-y-4">
                          <div className="w-20 h-20 mx-auto rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                            <FileCheck2 className="h-10 w-10 text-emerald-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-lg text-foreground">Arquivo selecionado!</p>
                            <p className="text-sm text-muted-foreground mt-1 truncate max-w-xs">{file.name}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center space-y-4">
                          <div className="w-20 h-20 mx-auto rounded-2xl bg-muted flex items-center justify-center">
                            <UploadCloud className="h-10 w-10 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium text-lg text-foreground">
                              Arraste e solte seu PDF aqui
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              ou clique para selecionar
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              Suporte para arquivos de até 10MB
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {file && (
                      <div className="mt-8 flex justify-center">
                        <Button
                          size="lg"
                          onClick={handleExtract}
                          disabled={isProcessing}
                          className="gap-3 px-8 py-3 text-base h-auto"
                        >
                          <Sparkles className="h-5 w-5" />
                          {isProcessing ? 'Processando...' : 'Analisar com IA'}
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
                  className="h-full flex flex-col items-center justify-center p-8"
                >
                  <div className="w-full max-w-md text-center space-y-6">
                    <div className="w-24 h-24 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                      <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-2xl font-semibold">Analisando documento...</h3>
                      <p className="text-muted-foreground text-lg">
                        Nossa IA está extraindo os dados do seu holerite
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Progress value={analysisProgress} className="h-3" />
                      <p className="text-sm text-muted-foreground font-medium">
                        {analysisProgress.toFixed(0)}% concluído
                      </p>
                    </div>
                  </div>
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
                    {/* PDF Preview Panel */}
                    {showPdfPreview && (
                      <div className="lg:w-[42%] xl:w-[38%] flex flex-col border-b lg:border-b-0 lg:border-r bg-muted/5 shrink-0 min-w-[300px]">
                        <div className="flex items-center justify-between p-3 border-b bg-background/80 backdrop-blur-sm shrink-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => dispatch({ type: 'SET_PDF_ZOOM', payload: Math.max(pdfZoom - 25, 50) })}
                                    disabled={pdfZoom <= 50}
                                    className="h-8 w-8 p-0"
                                  >
                                    <ZoomOut className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Diminuir zoom</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <span className="text-sm font-medium px-3 py-1 bg-muted rounded-md min-w-[60px] text-center">
                              {pdfZoom}%
                            </span>

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => dispatch({ type: 'SET_PDF_ZOOM', payload: Math.min(pdfZoom + 25, 200) })}
                                    disabled={pdfZoom >= 200}
                                    className="h-9 w-9 p-0"
                                  >
                                    <ZoomIn className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Aumentar zoom</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <Separator orientation="vertical" className="h-6 mx-1" />

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => dispatch({ type: 'SET_PDF_ROTATION', payload: (pdfRotation + 90) % 360 })}
                                    className="h-9 w-9 p-0"
                                  >
                                    <RotateCw className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Rotacionar 90°</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={handleReprocess}
                                  disabled={isProcessing}
                                  className="h-9 gap-2"
                                >
                                  <RefreshCw className={cn("h-4 w-4", isProcessing && "animate-spin")} />
                                  Reanalisar
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Processar documento novamente</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>

                        <div className="flex-1 overflow-auto p-6 bg-gradient-to-br from-muted/10 to-muted/5">
                          {pdfDataUri && (
                            <div className="flex justify-center items-start min-h-full">
                              <div
                                className="bg-white rounded-xl shadow-2xl border transition-transform duration-200"
                                style={{
                                  transform: `scale(${pdfZoom / 100}) rotate(${pdfRotation}deg)`,
                                  transformOrigin: 'top center'
                                }}
                              >
                                <iframe
                                  src={pdfDataUri}
                                  className="w-full h-[600px] rounded-lg"
                                  title="Visualização do documento PDF"
                                  loading="lazy"
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="p-3 border-t bg-background/80 backdrop-blur-sm shrink-0">
                          <p className="text-sm text-muted-foreground truncate flex items-center gap-2">
                            <FileText className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">{file?.name}</span>
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Data Panel */}
                    <div className={cn(
                      "flex-1 flex flex-col min-w-0 overflow-hidden",
                      !showPdfPreview && "w-full"
                    )}>
                      <div className="flex items-center justify-between p-4 border-b bg-background/80 backdrop-blur-sm shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => dispatch({ type: 'SET_SHOW_PDF_PREVIEW', payload: !showPdfPreview })}
                          className="gap-2"
                        >
                          {showPdfPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          {showPdfPreview ? 'Ocultar PDF' : 'Mostrar PDF'}
                        </Button>

                        <span className="text-sm text-muted-foreground hidden sm:block">
                          Edite os valores se necessário
                        </span>
                      </div>

                      <div className="flex-1 overflow-y-auto">
                        <div className="p-4 lg:p-6 space-y-4 w-full">
                          {/* Basic Information */}
                          <Card className="shadow-sm border-l-4 border-l-blue-500">
                            <CardHeader className="pb-4">
                              <CardTitle className="text-base font-semibold flex items-center gap-2">
                                Informações Básicas
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                <div className="space-y-2">
                                  <label className="text-sm font-medium text-muted-foreground">
                                    Pagador / Empresa
                                  </label>
                                  <Input
                                    value={editableResult.companyName || ''}
                                    onChange={(e) => handleFieldChange('companyName', e.target.value)}
                                    placeholder="Nome da empresa ou pagador"
                                    className="h-10"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-sm font-medium text-muted-foreground">
                                    Data de Competência
                                  </label>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button
                                        variant="outline"
                                        className="w-full h-10 justify-start text-left font-normal"
                                      >
                                        <CalendarIcon className="mr-3 h-4 w-4 text-muted-foreground" />
                                        {editableResult.issueDate && isValid(parseISO(editableResult.issueDate))
                                          ? format(parseISO(editableResult.issueDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                                          : 'Selecione a data'}
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                      <Calendar
                                        mode="single"
                                        selected={editableResult.issueDate ? parseISO(editableResult.issueDate) : new Date()}
                                        onSelect={(date) => handleFieldChange('issueDate', date ? format(date, 'yyyy-MM-dd') : '')}
                                        initialFocus
                                        locale={ptBR}
                                      />
                                    </PopoverContent>
                                  </Popover>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Earnings */}
                          <Card className="shadow-sm border-l-4 border-l-emerald-500">
                            <CardHeader className="pb-4">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-base font-semibold text-emerald-600 flex items-center gap-2">
                                  Proventos (Ganhos)
                                </CardTitle>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleAddEarning}
                                  className="h-9 gap-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                >
                                  <Plus className="h-4 w-4" />
                                  Adicionar
                                </Button>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              {editableResult.earnings && editableResult.earnings.length > 0 ? (
                                <div className="space-y-3">
                                  {editableResult.earnings.map((item, index) => (
                                    <div key={index} className="flex items-center gap-3 group">
                                      <Input
                                        value={item.name}
                                        className="flex-1 h-10"
                                        placeholder="Descrição do provento"
                                        onChange={e => {
                                          const newEarnings = [...editableResult.earnings!];
                                          newEarnings[index].name = e.target.value;
                                          handleFieldChange('earnings', newEarnings);
                                        }}
                                      />
                                      <CurrencyInput
                                        value={item.amount}
                                        className="w-36 h-10 text-right font-medium"
                                        onValueChange={value => {
                                          const newEarnings = [...editableResult.earnings!];
                                          newEarnings[index].amount = value;
                                          handleFieldChange('earnings', newEarnings);
                                        }}
                                      />
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-10 w-10 opacity-50 hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive flex-shrink-0"
                                        onClick={() => handleRemoveEarning(index)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-6 border-2 border-dashed border-muted-foreground/20 rounded-lg">
                                  <p className="text-muted-foreground">Nenhum provento encontrado</p>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    Adicione manualmente os ganhos
                                  </p>
                                </div>
                              )}

                              <Separator />

                              <div className="flex justify-between items-center py-2">
                                <span className="font-semibold text-base">Total de Proventos</span>
                                <span className="text-xl font-bold text-emerald-600">
                                  {formatCurrency(calculatedTotals.earnings)}
                                </span>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Deductions */}
                          <Card className="shadow-sm border-l-4 border-l-red-500">
                            <CardHeader className="pb-4">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-base font-semibold text-red-500 flex items-center gap-2">
                                  Descontos
                                </CardTitle>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleAddDeduction}
                                  className="h-9 gap-2 text-red-500 hover:text-red-600 hover:bg-red-50"
                                >
                                  <Plus className="h-4 w-4" />
                                  Adicionar
                                </Button>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              {editableResult.deductions && editableResult.deductions.length > 0 ? (
                                <div className="space-y-3">
                                  {editableResult.deductions.map((item, index) => (
                                    <div key={index} className="flex items-center gap-3 group">
                                      <Input
                                        value={item.name}
                                        className="flex-1 h-10"
                                        placeholder="Descrição do desconto"
                                        onChange={e => {
                                          const newDeductions = [...editableResult.deductions!];
                                          newDeductions[index].name = e.target.value;
                                          handleFieldChange('deductions', newDeductions);
                                        }}
                                      />
                                      <CurrencyInput
                                        value={item.amount}
                                        className="w-36 h-10 text-right font-medium"
                                        onValueChange={value => {
                                          const newDeductions = [...editableResult.deductions!];
                                          newDeductions[index].amount = value;
                                          handleFieldChange('deductions', newDeductions);
                                        }}
                                      />
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-10 w-10 opacity-50 hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive flex-shrink-0"
                                        onClick={() => handleRemoveDeduction(index)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-6 border-2 border-dashed border-muted-foreground/20 rounded-lg">
                                  <p className="text-muted-foreground">Nenhum desconto encontrado</p>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    Adicione manualmente os descontos
                                  </p>
                                </div>
                              )}

                              <Separator />

                              <div className="flex justify-between items-center py-2">
                                <span className="font-semibold text-base">Total de Descontos</span>
                                <span className="text-xl font-bold text-red-500">
                                  {formatCurrency(calculatedTotals.deductions)}
                                </span>
                              </div>
                            </CardContent>
                          </Card>

                          {/* FGTS */}
                          {(editableResult.fgtsAmount !== undefined && editableResult.fgtsAmount !== null) && (
                            <Card className="shadow-sm border-l-4 border-l-amber-500">
                              <CardContent className="py-6">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <Banknote className="h-5 w-5 text-amber-600" />
                                    <div>
                                      <span className="text-sm font-medium">FGTS do Mês</span>
                                      <p className="text-xs text-muted-foreground">
                                        Valor depositado no FGTS
                                      </p>
                                    </div>
                                  </div>
                                  <CurrencyInput
                                    value={editableResult.fgtsAmount || 0}
                                    className="w-40 h-10 text-right font-medium text-amber-600"
                                    onValueChange={value => handleFieldChange('fgtsAmount', value)}
                                  />
                                </div>
                              </CardContent>
                            </Card>
                          )}

                          {/* Notes */}
                          <Card className="shadow-sm">
                            <CardContent className="py-6">
                              <div className="space-y-3">
                                <label className="text-sm font-medium text-muted-foreground">
                                  Observações
                                </label>
                                <Textarea
                                  value={editableResult.description || ''}
                                  onChange={(e) => handleFieldChange('description', e.target.value)}
                                  placeholder="Adicione observações sobre este holerite..."
                                  rows={3}
                                  className="resize-none min-h-[100px]"
                                />
                              </div>
                            </CardContent>
                          </Card>

                          {/* Net Amount */}
                          <Card className="shadow-lg border-2 border-primary bg-gradient-to-br from-primary/5 to-primary/10">
                            <CardContent className="py-8">
                              <div className="text-center space-y-4">
                                <label className="text-sm font-medium text-primary/80 uppercase tracking-wide">
                                  Valor Líquido a Registrar
                                </label>
                                <div className="mt-2">
                                  <CurrencyInput
                                    value={editableResult.netAmount || 0}
                                    onValueChange={value => handleFieldChange('netAmount', value)}
                                    className="text-4xl font-bold text-primary bg-transparent border-0 text-center h-auto p-0 shadow-none focus-visible:ring-0 w-full"
                                  />
                                </div>

                                {calculatedTotals.net !== editableResult.netAmount && (
                                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                                    <span>Calculado: {formatCurrency(calculatedTotals.net)}</span>
                                    <Button
                                      variant="link"
                                      size="sm"
                                      className="h-auto p-0 text-primary font-medium"
                                      onClick={() => handleFieldChange('netAmount', calculatedTotals.net)}
                                    >
                                      Usar este valor
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === 'confirm' && (
                <motion.div
                  key="confirm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full flex flex-col items-center justify-center p-8"
                >
                  <div className="text-center space-y-6">
                    <div className="w-24 h-24 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                      <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-2xl font-semibold">Salvando dados...</h3>
                      <p className="text-muted-foreground text-lg">
                        Registrando sua renda no sistema
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-muted/30 flex items-center justify-between shrink-0">
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
                <Button
                  variant="outline"
                  onClick={() => dispatch({ type: 'SET_CURRENT_STEP', payload: 'upload' })}
                  disabled={isSaving}
                >
                  Voltar
                </Button>
                <Button
                  onClick={handleConfirm}
                  disabled={isSaving || !editableResult?.netAmount}
                  className="gap-2 px-6"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
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