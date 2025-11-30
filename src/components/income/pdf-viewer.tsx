'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Maximize2, 
  Minimize2,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

interface PDFViewerProps {
  pdfDataUri: string | null;
  fileName?: string;
  className?: string;
}

export function PDFViewer({ pdfDataUri, fileName, className }: PDFViewerProps) {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 50));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  
  const handleFullscreen = () => {
    if (containerRef.current) {
      if (!isFullscreen) {
        containerRef.current.requestFullscreen?.();
      } else {
        document.exitFullscreen?.();
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  if (!pdfDataUri) {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center h-full bg-muted/30 rounded-lg border-2 border-dashed",
        className
      )}>
        <FileText className="h-16 w-16 text-muted-foreground/50" />
        <p className="mt-4 text-sm text-muted-foreground">
          Nenhum documento carregado
        </p>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={cn(
        "flex flex-col h-full bg-muted/20 rounded-lg overflow-hidden",
        isFullscreen && "fixed inset-0 z-50 bg-background",
        className
      )}
    >
      {/* Barra de controles */}
      <div className="flex items-center justify-between gap-2 p-2 bg-background/80 backdrop-blur-sm border-b">
        <TooltipProvider>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomOut} disabled={zoom <= 50}><ZoomOut className="h-4 w-4" /></Button>
              </TooltipTrigger>
              <TooltipContent>Diminuir zoom</TooltipContent>
            </Tooltip>

            <Slider
              value={[zoom]}
              onValueChange={([value]) => setZoom(value)}
              min={50}
              max={200}
              step={25}
              className="w-20"
            />
            <span className="text-xs font-medium w-10 text-center">{zoom}%</span>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomIn} disabled={zoom >= 200}><ZoomIn className="h-4 w-4" /></Button>
              </TooltipTrigger>
              <TooltipContent>Aumentar zoom</TooltipContent>
            </Tooltip>
          </div>

          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleRotate}><RotateCw className="h-4 w-4" /></Button>
              </TooltipTrigger>
              <TooltipContent>Rotacionar 90°</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleFullscreen}>
                  {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Tela cheia</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>

      {/* Área de visualização do PDF */}
      <ScrollArea className="flex-1 p-4 bg-muted/10">
        <div className="flex items-center justify-center min-h-full">
          <div
            style={{
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
              transformOrigin: 'center center',
              transition: 'transform 0.2s ease-out',
            }}
            className="shadow-lg rounded-lg overflow-hidden border"
          >
            <iframe
              ref={iframeRef}
              src={pdfDataUri}
              className="w-[600px] h-[800px] bg-white"
              title={fileName || 'Documento PDF'}
              loading="lazy"
            />
          </div>
        </div>
      </ScrollArea>

      {/* Rodapé com nome do arquivo */}
      {fileName && (
        <div className="px-3 py-2 bg-background/80 backdrop-blur-sm border-t">
          <p className="text-xs text-muted-foreground truncate flex items-center gap-2">
            <FileText className="h-3 w-3" />
            {fileName}
          </p>
        </div>
      )}
    </div>
  );
}
