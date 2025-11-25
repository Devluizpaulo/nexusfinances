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
import { Loader2, FileUp, FileCheck2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDropzone } from 'react-dropzone';
import { cn } from '@/lib/utils';

type ImportTransactionsSheetProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function ImportTransactionsSheet({ isOpen, onClose }: ImportTransactionsSheetProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
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
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: { 'application/pdf': ['.pdf'] },
  });

  const handleImport = async () => {
    if (!file) return;

    setIsProcessing(true);
    toast({
        title: "Em desenvolvimento",
        description: "A funcionalidade de processar o PDF ainda está sendo construída."
    });
    
    // Simulação do processamento
    setTimeout(() => {
        setIsProcessing(false);
        // onClose(); // Manter aberto por enquanto
    }, 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Importar Extrato Bancário</DialogTitle>
          <DialogDescription>
            Envie seu extrato em PDF para importar suas transações automaticamente.
          </DialogDescription>
        </DialogHeader>
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
           <div className="flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0" />
                <div>
                    <p className="font-semibold">Funcionalidade em desenvolvimento</p>
                    <p>A extração de dados do PDF é uma funcionalidade complexa. No momento, a interface de envio está pronta, mas o processamento automático do arquivo ainda está em construção.</p>
                </div>
            </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleImport} disabled={!file || isProcessing}>
            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Importar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
