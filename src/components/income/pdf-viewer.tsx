'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCw,
  RotateCcw,
  Maximize2, 
  Minimize2,
  FileText,
  Download,
  Printer,
  RefreshCw,
  Loader2,
  AlertCircle,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';

interface PDFViewerProps {
  pdfDataUri: string | null;
  fileName?: string;
  className?: string;
  showControls?: boolean;
  defaultZoom?: number;
  minZoom?: number;
  maxZoom?: number;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

export function PDFViewer({ 
  pdfDataUri, 
  fileName, 
  className,
  showControls = true,
  defaultZoom = 100,
  minZoom = 25,
  maxZoom = 300,
  onLoad,
  onError
}: PDFViewerProps) {
  const [zoom, setZoom] = useState(defaultZoom);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + 25, maxZoom));
  }, [maxZoom]);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - 25, minZoom));
  }, [minZoom]);

  const handleZoomReset = useCallback(() => {
    setZoom(100);
  }, []);

  // Rotation handlers
  const handleRotateRight = useCallback(() => {
    setRotation(prev => (prev + 90) % 360);
  }, []);

  const handleRotateLeft = useCallback(() => {
    setRotation(prev => (prev - 90 + 360) % 360);
  }, []);

  // Fullscreen handler
  const handleFullscreen = useCallback(() => {
    if (containerRef.current) {
      if (!isFullscreen) {
        containerRef.current.requestFullscreen?.();
      } else {
        document.exitFullscreen?.();
      }
    }
  }, [isFullscreen]);

  // Download handler
  const handleDownload = useCallback(() => {
    if (!pdfDataUri) return;
    
    const link = document.createElement('a');
    link.href = pdfDataUri;
    link.download = fileName || 'documento.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [pdfDataUri, fileName]);

  // Print handler
  const handlePrint = useCallback(() => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.print();
    }
  }, []);

  // Loading handlers
  const handleIframeLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
    onLoad?.();
  }, [onLoad]);

  const handleIframeError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
    onError?.(new Error('Falha ao carregar o PDF'));
  }, [onError]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!pdfDataUri) return;
      
      // Ctrl/Cmd + Plus: Zoom in
      if ((e.ctrlKey || e.metaKey) && e.key === '=') {
        e.preventDefault();
        handleZoomIn();
      }
      // Ctrl/Cmd + Minus: Zoom out
      if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        e.preventDefault();
        handleZoomOut();
      }
      // Ctrl/Cmd + 0: Reset zoom
      if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
        handleZoomReset();
      }
      // R: Rotate right
      if (e.key === 'r' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        handleRotateRight();
      }
      // F: Fullscreen
      if (e.key === 'f' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        handleFullscreen();
      }
      // Escape: Exit fullscreen
      if (e.key === 'Escape' && isFullscreen) {
        document.exitFullscreen?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pdfDataUri, isFullscreen, handleZoomIn, handleZoomOut, handleZoomReset, handleRotateRight, handleFullscreen]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Reset loading state when PDF changes
  useEffect(() => {
    if (pdfDataUri) {
      setIsLoading(true);
      setHasError(false);
    }
  }, [pdfDataUri]);

  // Empty state
  if (!pdfDataUri) {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center h-full bg-gradient-to-br from-muted/30 to-muted/50 rounded-xl border-2 border-dashed border-muted-foreground/20 transition-all duration-300",
        className
      )}>
        <div className="relative">
          <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl animate-pulse" />
          <div className="relative bg-muted/50 rounded-2xl p-6">
            <FileText className="h-16 w-16 text-muted-foreground/40" />
          </div>
        </div>
        <div className="mt-6 text-center space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            Nenhum documento carregado
          </p>
          <p className="text-xs text-muted-foreground/60">
            Selecione um arquivo PDF para visualizar
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (hasError) {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center h-full bg-destructive/5 rounded-xl border-2 border-dashed border-destructive/20",
        className
      )}>
        <div className="bg-destructive/10 rounded-2xl p-6">
          <AlertCircle className="h-16 w-16 text-destructive/60" />
        </div>
        <div className="mt-6 text-center space-y-2">
          <p className="text-sm font-medium text-destructive">
            Erro ao carregar o documento
          </p>
          <p className="text-xs text-muted-foreground">
            Verifique se o arquivo é um PDF válido
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => {
            setHasError(false);
            setIsLoading(true);
          }}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={cn(
        "flex flex-col h-full bg-muted/20 rounded-xl overflow-hidden border shadow-sm transition-all duration-300",
        isFullscreen && "fixed inset-0 z-50 bg-background rounded-none border-0",
        className
      )}
    >
      {/* Barra de controles */}
      {showControls && (
        <div className="flex items-center justify-between gap-2 p-2 bg-background/95 backdrop-blur-md border-b">
          <TooltipProvider delayDuration={300}>
            {/* Controles de zoom */}
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 hover:bg-muted" 
                    onClick={handleZoomOut} 
                    disabled={zoom <= minZoom}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Diminuir zoom</p>
                  <kbd className="ml-2 text-[10px] bg-muted px-1 rounded">Ctrl -</kbd>
                </TooltipContent>
              </Tooltip>

              <Slider
                value={[zoom]}
                onValueChange={([value]) => setZoom(value)}
                min={minZoom}
                max={maxZoom}
                step={25}
                className="w-24"
              />
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-xs font-mono min-w-[52px] hover:bg-muted"
                    onClick={handleZoomReset}
                  >
                    {zoom}%
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Resetar zoom</p>
                  <kbd className="ml-2 text-[10px] bg-muted px-1 rounded">Ctrl 0</kbd>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 hover:bg-muted" 
                    onClick={handleZoomIn} 
                    disabled={zoom >= maxZoom}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Aumentar zoom</p>
                  <kbd className="ml-2 text-[10px] bg-muted px-1 rounded">Ctrl +</kbd>
                </TooltipContent>
              </Tooltip>
            </div>

            <Separator orientation="vertical" className="h-6 hidden sm:block" />

            {/* Controles de rotação */}
            <div className="hidden sm:flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 hover:bg-muted" 
                    onClick={handleRotateLeft}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Rotacionar para esquerda</TooltipContent>
              </Tooltip>

              {rotation !== 0 && (
                <Badge variant="secondary" className="text-[10px] px-1.5 h-5">
                  {rotation}°
                </Badge>
              )}
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 hover:bg-muted" 
                    onClick={handleRotateRight}
                  >
                    <RotateCw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Rotacionar para direita</p>
                  <kbd className="ml-2 text-[10px] bg-muted px-1 rounded">R</kbd>
                </TooltipContent>
              </Tooltip>
            </div>

            <div className="flex-1" />

            {/* Ações */}
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 hover:bg-muted hidden sm:flex" 
                    onClick={handlePrint}
                  >
                    <Printer className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Imprimir</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 hover:bg-muted" 
                    onClick={handleDownload}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Baixar PDF</TooltipContent>
              </Tooltip>

              <Separator orientation="vertical" className="h-6" />
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 hover:bg-muted" 
                    onClick={handleFullscreen}
                  >
                    {isFullscreen ? (
                      <Minimize2 className="h-4 w-4" />
                    ) : (
                      <Maximize2 className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>{isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}</p>
                  <kbd className="ml-2 text-[10px] bg-muted px-1 rounded">F</kbd>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </div>
      )}

      {/* Área de visualização do PDF */}
      <ScrollArea className="flex-1 bg-muted/10">
        <div className="flex items-center justify-center min-h-full p-4">
          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                  <Loader2 className="h-10 w-10 text-primary animate-spin relative" />
                </div>
                <p className="text-sm text-muted-foreground animate-pulse">
                  Carregando documento...
                </p>
              </div>
            </div>
          )}

          <div
            style={{
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
              transformOrigin: 'center center',
            }}
            className={cn(
              "shadow-2xl rounded-lg overflow-hidden border bg-white transition-transform duration-300 ease-out",
              isLoading && "opacity-0"
            )}
          >
            <iframe
              ref={iframeRef}
              src={pdfDataUri}
              className="w-[600px] h-[800px] bg-white"
              title={fileName || 'Documento PDF'}
              loading="lazy"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
            />
          </div>
        </div>
      </ScrollArea>

      {/* Rodapé com nome do arquivo */}
      {fileName && (
        <div className="px-3 py-2 bg-background/95 backdrop-blur-md border-t flex items-center justify-between">
          <p className="text-xs text-muted-foreground truncate flex items-center gap-2">
            <FileText className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{fileName}</span>
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
            <Eye className="h-3 w-3" />
            <span>Visualizando</span>
          </div>
        </div>
      )}
    </div>
  );
}
