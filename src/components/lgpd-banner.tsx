
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Cookie } from 'lucide-react';

const LGPD_CONSENT_KEY = 'lgpd_consent_accepted';

export function LgpdBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // A verificação do localStorage deve ocorrer apenas no lado do cliente
    try {
      const consentAccepted = localStorage.getItem(LGPD_CONSENT_KEY);
      if (!consentAccepted) {
        setIsVisible(true);
      }
    } catch (error) {
      console.error('Failed to access localStorage for LGPD consent:', error);
    }
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem(LGPD_CONSENT_KEY, 'true');
      setIsVisible(false);
    } catch (error) {
       console.error('Failed to save LGPD consent to localStorage:', error);
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 w-full animate-in slide-in-from-bottom-5">
      <div className="container mx-auto p-4">
        <div className="flex flex-col items-center justify-between gap-4 rounded-lg border bg-background/95 p-4 shadow-2xl backdrop-blur-sm md:flex-row md:gap-8">
          <div className="flex items-start gap-3">
             <Cookie className="h-6 w-6 shrink-0 text-primary md:h-8 md:w-8" />
            <p className="text-sm text-muted-foreground">
              Usamos cookies e outras tecnologias para analisar o tráfego e personalizar sua experiência. Ao continuar,
              você concorda com nossa{' '}
              <Link href="/privacy" className="font-medium text-primary underline-offset-4 hover:underline">
                Política de Privacidade
              </Link>
              .
            </p>
          </div>
          <div className="flex w-full shrink-0 gap-2 md:w-auto">
            <Button onClick={handleAccept} className="w-full md:w-auto">
              Entendi
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
