'use client';
import { Sidebar, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter } from '@/components/ui/sidebar';
import { LayoutDashboard, Landmark, CreditCard, Banknote, DollarSign, Loader2, Target } from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '../ui/button';
import { useSidebar } from '../ui/sidebar';
import { cn } from '@/lib/utils';
import { useUser, initiateAnonymousSignIn, useAuth } from '@/firebase';
import { useEffect } from 'react';

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

  useEffect(() => {
    if (!isUserLoading && !user) {
      initiateAnonymousSignIn(auth);
    }
  }, [isUserLoading, user, auth]);

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
        <SidebarFooter className={cn("transition-transform duration-200", state === "collapsed" && "p-1")}>
             <div className="flex items-center gap-3 p-2 rounded-md bg-secondary">
                {isUserLoading ? (
                  <Loader2 className="size-9 animate-spin" />
                ) : (
                  <Avatar className="size-9">
                      <AvatarImage src={user?.photoURL || undefined} alt="Avatar do usuário"/>
                      <AvatarFallback>{user?.isAnonymous ? 'A' : (user?.email?.charAt(0)?.toUpperCase() || 'U')}</AvatarFallback>
                  </Avatar>
                )}
                <div className={cn("flex flex-col", state === "collapsed" && "hidden")}>
                    <span className="font-semibold text-sm">{isUserLoading ? 'Carregando...' : (user?.isAnonymous ? 'Usuário Anônimo' : (user?.displayName || 'Usuário'))}</span>
                    <span className="text-xs text-muted-foreground">{!isUserLoading && !user?.isAnonymous ? user?.email : ''}</span>
                </div>
            </div>
        </SidebarFooter>
    </Sidebar>
  );
}
