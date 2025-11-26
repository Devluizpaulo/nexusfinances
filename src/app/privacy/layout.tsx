
import { ReactNode } from "react";
import Link from 'next/link';
import { DollarSign, ArrowLeft } from 'lucide-react';

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <DollarSign className="h-6 w-6" />
            </div>
            <span className="text-xl font-bold">Xô Planilhas</span>
          </Link>
           <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar para a página inicial
            </Link>
        </div>
      </header>
      <main className="flex-1">
        <div className="container mx-auto max-w-4xl py-12 md:py-16">
            {children}
        </div>
      </main>
       <footer className="border-t">
          <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-6 md:flex-row">
              <p className="text-sm text-muted-foreground">
                  © {new Date().getFullYear()} Xô Planilhas. Todos os direitos reservados.
              </p>
              <div className="flex gap-4">
                  <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">Termos</Link>
                  <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">Privacidade</Link>
              </div>
          </div>
      </footer>
    </div>
  );
}
