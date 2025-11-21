'use client';
import { Sidebar, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter } from '@/components/ui/sidebar';
import { LayoutDashboard, Landmark, CreditCard, Banknote, DollarSign, Loader2, Target, LogOut } from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '../ui/button';
import { useSidebar } from '../ui/sidebar';
import { cn } from '@/lib/utils';
import { useUser, initiateAnonymousSignIn, useAuth } from '@/firebase';
import { useEffect } from 'react';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';

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

  const handleGoogleSignIn = async () => {
    if (!auth) return;
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Erro no login com Google:", error);
    }
  };

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

    if (user?.isAnonymous) {
        return (
             <div className={cn("p-2", state === "collapsed" && "p-0")}>
                <Button variant="outline" className="w-full" onClick={handleGoogleSignIn}>
                    <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                        <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 21.5 174.4 58.9L359.7 127.4c-27.8-26.2-63.5-42.6-111.7-42.6-88.5 0-160.9 72.4-160.9 161.2s72.4 161.2 160.9 161.2c38.3 0 71.3-12.8 96.2-34.4 22.1-19.1 33.4-44.9 36.8-74.6H248V261.8h239.2z"></path>
                    </svg>
                    <span className={cn(state === "collapsed" && "hidden")}>Entrar com Google</span>
                </Button>
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
