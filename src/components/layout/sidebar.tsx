'use client';
import { Sidebar, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter } from '@/components/ui/sidebar';
import { LayoutDashboard, Landmark, CreditCard, Banknote, DollarSign, Loader2, Target, LogOut } from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '../ui/button';
import { useSidebar } from '../ui/sidebar';
import { cn } from '@/lib/utils';
import { useUser, useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';

const menuItems = [
  { href: '/dashboard', label: 'Painel', icon: LayoutDashboard },
  { href: '/income', label: 'Renda', icon: Landmark },
  { href: '/expenses', label: 'Despesas', icon: CreditCard },
  { href: '/debts', label: 'Dívidas', icon: Banknote },
  { href: '/goals', label: 'Metas', icon: Target },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { state } = useSidebar();
  const { user, isUserLoading } = useUser();
  const auth = useAuth();

  const handleSignOut = async () => {
    if (!auth) return;
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Erro ao fazer logout:", error);
    }
  };

  const renderUserContent = () => {
    if (isUserLoading) {
        return (
            <div className="flex items-center gap-3 p-2 rounded-md bg-secondary">
                 <Loader2 className="size-9 animate-spin" />
                 <div className={cn("flex flex-col", state === "collapsed" && "hidden")}>
                    <span className="font-semibold text-sm">Carregando...</span>
                </div>
            </div>
        )
    }

    if(user) {
        return (
            <div className="flex w-full items-center justify-between p-2 rounded-md bg-secondary">
                <div className="flex items-center gap-3">
                    <Avatar className="size-9">
                        <AvatarImage src={user?.photoURL || undefined} alt="Avatar do usuário"/>
                        <AvatarFallback>{user?.email?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className={cn("flex flex-col", state === "collapsed" && "hidden")}>
                        <span className="font-semibold text-sm">{user?.displayName || 'Usuário'}</span>
                        <span className="text-xs text-muted-foreground">{user?.email}</span>
                    </div>
                </div>
                 <Button variant="ghost" size="icon" className={cn("w-8 h-8", state === "collapsed" && "hidden")} onClick={handleSignOut}>
                    <LogOut className="w-4 h-4"/>
                </Button>
            </div>
        )
    }

    return null;
  }

  return (
    <Sidebar variant="sidebar" collapsible="icon">
        <SidebarHeader className={cn("transition-transform duration-200", state === "collapsed" && "p-1")}>
            <Button variant="ghost" className="h-12 w-full justify-start items-center gap-2 px-3">
                 <div className="p-2.5 rounded-lg bg-primary text-primary-foreground">
                    <DollarSign className="size-5" />
                </div>
                <span className={cn("text-lg font-semibold", state === "collapsed" && "hidden")}>Nexus Finanças</span>
            </Button>
        </SidebarHeader>
        <SidebarMenu className="flex-1">
            {menuItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={pathname.startsWith(item.href)} tooltip={item.label}>
                        <Link href={item.href}>
                            <item.icon />
                            <span>{item.label}</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            ))}
        </SidebarMenu>
        <SidebarFooter className={cn("transition-transform duration-200 p-2", state === "collapsed" && "p-1")}>
             {renderUserContent()}
        </SidebarFooter>
    </Sidebar>
  );
}
