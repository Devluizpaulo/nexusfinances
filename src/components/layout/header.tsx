'use client';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Bell, PanelLeft } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useSidebar } from '../ui/sidebar';

const getTitle = (pathname: string) => {
    if (pathname.startsWith('/dashboard')) return 'Dashboard';
    if (pathname.startsWith('/income')) return 'Income';
    if (pathname.startsWith('/expenses')) return 'Expenses';
    if (pathname.startsWith('/debts')) return 'Debts';
    return 'Nexus Finances';
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
            <span className="sr-only">Toggle Sidebar</span>
        </Button>
        <h1 className="text-xl font-semibold">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon">
            <Bell />
            <span className="sr-only">Notifications</span>
        </Button>
      </div>
    </header>
  );
}
