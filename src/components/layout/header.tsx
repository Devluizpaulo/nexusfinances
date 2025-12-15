'use client';
import { Button } from '@/components/ui/button';
import { Bell, UserCircle, LogOut, Menu } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useSidebar } from '../ui/sidebar';
import { useUser, useAuth, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { signOut } from 'firebase/auth';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { cn } from '@/lib/utils';
import { collection, query, orderBy, limit, doc, updateDoc } from 'firebase/firestore';
import type { Notification } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { parseISO } from 'date-fns';
import { Badge } from '../ui/badge';

function UserMenu() {
    const { user } = useUser();
    const auth = useAuth();
    
     const handleSignOut = async () => {
        if (!auth) return;
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Erro ao fazer logout:", error);
        }
    };

    const getFirstName = (displayName: string | null | undefined) => {
        if (!displayName) return 'Usuário';
        return displayName.split(' ')[0];
    }

    if (!user) return null;
    
    const Icon = user.avatar?.icon ? (LucideIcons as any)[user.avatar.icon] || LucideIcons.User : LucideIcons.User;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-9 w-9">
                        {user.photoURL ? (
                           <AvatarImage src={user.photoURL} alt="Avatar do usuário"/>
                        ) : user.avatar ? (
                            <div className={cn("flex h-full w-full items-center justify-center rounded-full text-white", user.avatar.bgColor)}>
                                <Icon className="h-5 w-5" />
                            </div>
                        ) : (
                           <AvatarFallback>{user.displayName?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
                        )}
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="bottom" align="end" className="w-56">
                <DropdownMenuLabel className='font-normal'>
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{getFirstName(user.displayName)}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <Link href="/profile">
                    <DropdownMenuItem>
                        <UserCircle className="mr-2 h-4 w-4" />
                        <span>Perfil & Configurações</span>
                    </DropdownMenuItem>
                </Link>
                <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sair</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

function NotificationsMenu() {
    const { user } = useUser();
    const firestore = useFirestore();

    const notificationsQuery = useMemoFirebase(() => {
        if (!user) return null;
        return query(
            collection(firestore, `users/${user.uid}/notifications`),
            orderBy('timestamp', 'desc'),
            limit(10)
        );
    }, [user, firestore]);

    const { data: notifications, isLoading } = useCollection<Notification>(notificationsQuery);
    
    const unreadCount = notifications?.filter(n => !n.isRead).length || 0;

    const handleMarkAsRead = async (notificationId: string) => {
        if (!user) return;
        const notification = notifications?.find(n => n.id === notificationId);
        // Only update if it's not already read to avoid unnecessary writes
        if (notification && !notification.isRead) {
            const notificationRef = doc(firestore, `users/${user.uid}/notifications`, notificationId);
            await updateDoc(notificationRef, { isRead: true });
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-10 w-10">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                          {unreadCount}
                        </Badge>
                    )}
                    <span className="sr-only">Notificações</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notificações</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="max-h-80 overflow-y-auto">
                {isLoading ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">Carregando...</div>
                ) : notifications && notifications.length > 0 ? (
                    notifications.map(notification => (
                        <DropdownMenuItem key={notification.id} asChild className="cursor-pointer data-[highlighted]:bg-slate-800">
                            <Link href={notification.link || '#'} className="items-start" onClick={() => handleMarkAsRead(notification.id)}>
                                <div className="flex items-start gap-3 py-2">
                                     {!notification.isRead && (
                                        <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                                    )}
                                    <div className={cn("flex-grow", notification.isRead && "pl-5")}>
                                        <p className="text-sm leading-snug">{notification.message}</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                             {formatDistanceToNow(parseISO(notification.timestamp as string), { addSuffix: true, locale: ptBR })}
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        </DropdownMenuItem>
                    ))
                ) : (
                     <div className="p-4 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                        <Bell className="h-8 w-8 text-muted-foreground/50"/>
                        <p>Tudo em dia!</p>
                    </div>
                )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export function Header() {
  const { toggleSidebar } = useSidebar();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center border-b border-slate-900/70 bg-slate-950/85 px-4 sm:px-6 backdrop-blur-xl shadow-[0_18px_45px_-30px_rgba(15,23,42,1)]">
      <div className="flex w-full items-center justify-between gap-4">
        {/* Botão para abrir sidebar no mobile */}
        <Button
          onClick={toggleSidebar}
          variant="ghost"
          size="icon"
          className="md:hidden rounded-full text-slate-300 hover:bg-slate-900/80 hover:text-white"
        >
          <Menu className="h-6 w-6" />
          <span className="sr-only">Abrir Menu</span>
        </Button>

        {/* Espaçador para centralizar o conteúdo do meio em telas maiores */}
        <div className="hidden md:flex" />

        {/* Ações da Direita */}
        <div className="flex items-center gap-2 ml-auto">
          <NotificationsMenu />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
