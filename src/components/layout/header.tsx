'use client';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Bell, PanelLeft } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useSidebar } from '../ui/sidebar';
import { ThemeToggle } from '../theme-toggle';

const getTitle = (pathname: string) => {
    if (pathname.startsWith('/dashboard')) return 'Painel';
    if (pathname.startsWith('/income')) return 'Renda';
    if (pathname.startsWith('/expenses')) return 'Despesas';
    if (pathname.startsWith('/debts')) return 'Dívidas';
    if (pathname.startsWith('/goals')) return 'Reservas & Investimentos';
    if (pathname.startsWith('/profile')) return 'Perfil & Configuração';
    if (pathname.startsWith('/support')) return 'Suporte';
    return 'Nexus Finanças';
}

export function Header() {
  const pathname = usePathname();
  const title = getTitle(pathname);
  const { toggleSidebar } = useSidebar();

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
      <div className="flex items-center gap-4">
        <Button onClick={toggleSidebar} variant="ghost" size="icon" className="md:hidden">
            <PanelLeft />
            <span className="sr-only">Alternar Barra Lateral</span>
        </Button>
        <h1 className="text-xl font-semibold">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <Button variant="ghost" size="icon">
            <Bell />
            <span className="sr-only">Notificações</span>
        </Button>
      </div>
    </header>
  );
}
