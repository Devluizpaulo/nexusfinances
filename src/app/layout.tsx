import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AppSidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

export const metadata: Metadata = {
  title: "Nexus Finanças",
  description: "Seu dashboard de finanças pessoais.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <Header />
            <main className="flex-1 overflow-y-auto p-4 lg:p-6">
              {children}
            </main>
          </SidebarInset>
        </SidebarProvider>
        <Toaster />
      </body>
    </html>
  );
}
