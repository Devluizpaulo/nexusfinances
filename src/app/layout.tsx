import type { Metadata } from "next";
import { Inter } from 'next/font/google';
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { LgpdBanner } from "@/components/lgpd-banner";
import { cn } from "@/lib/utils";


const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: "Xô Planilhas | Controle Financeiro, Orçamento e Metas",
  description: "Abandone as planilhas! O Xô Planilhas é o app definitivo para controle financeiro pessoal, gestão de despesas, orçamento e planejamento de metas. Simples e poderoso.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <meta name="google-adsense-account" content="ca-pub-5750464088623363" />
      </head>
      <body className={cn("font-sans antialiased bg-slate-950 text-slate-100", inter.className)}>
        <ThemeProvider>
          <FirebaseClientProvider>
            {children}
          </FirebaseClientProvider>
        </ThemeProvider>
        <Toaster />
        <LgpdBanner />
      </body>
    </html>
  );
}
