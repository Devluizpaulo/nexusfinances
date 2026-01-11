
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
import { 
  getNotificationIcon, 
  getNotificationColor, 
  getNotificationBgColor,
  getNotificationBorderColor,
  getNotificationLabel,
  getPriorityBadgeVariant 
} from '@/lib/notification-config';

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
                <Button 
                  variant="ghost" 
                  className="relative h-9 w-9 rounded-full p-0 hover:bg-slate-800/60 transition-all duration-200"
                >
                    <Avatar className="h-9 w-9 border border-slate-700/50 hover:border-primary/50 transition-colors">
                        {user.photoURL ? (
                           <AvatarImage src={user.photoURL} alt="Avatar do usuário"/>
                        ) : user.avatar ? (
                            <div className={cn("flex h-full w-full items-center justify-center rounded-full text-white", user.avatar.bgColor)}>
                                <Icon className="h-5 w-5" />
                            </div>
                        ) : (
                           <AvatarFallback className="bg-slate-800 text-slate-100">{user.displayName?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
                        )}
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="bottom" align="end" className="w-56 bg-slate-900/95 border-slate-800">
                <DropdownMenuLabel className='font-normal py-2'>
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-semibold leading-none text-slate-100">{getFirstName(user.displayName)}</p>
                        <p className="text-xs leading-none text-slate-400 truncate">{user.email}</p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-800/50" />
                <Link href="/profile">
                    <DropdownMenuItem className="hover:bg-slate-800/50 transition-colors duration-150 cursor-pointer">
                        <UserCircle className="mr-2 h-4 w-4 text-slate-400" />
                        <span className="text-slate-100">Perfil & Configurações</span>
                    </DropdownMenuItem>
                </Link>
                <DropdownMenuItem 
                  onClick={handleSignOut}
                  className="hover:bg-red-950/30 transition-colors duration-150 cursor-pointer"
                >
                    <LogOut className="mr-2 h-4 w-4 text-red-400" />
                    <span className="text-slate-100">Sair</span>
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
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="relative h-9 w-9 rounded-full text-slate-400 hover:bg-slate-800/60 hover:text-slate-100 transition-all duration-200"
                >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge 
                          variant="destructive" 
                          className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs font-bold shadow-lg"
                        >
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </Badge>
                    )}
                    <span className="sr-only">Notificações</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 bg-slate-900/95 border-slate-800">
                <DropdownMenuLabel className="text-slate-100 font-semibold">Notificações</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-800/50" />
                <div className="max-h-[28rem] overflow-y-auto">
                {isLoading ? (
                    <div className="p-4 text-center text-sm text-slate-400 flex items-center justify-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                      Carregando notificações...
                    </div>
                ) : notifications && notifications.length > 0 ? (
                    notifications.map((notification, idx) => {
                        const NotifIcon = getNotificationIcon(notification.type);
                        const iconColor = getNotificationColor(notification.type);
                        const bgColor = getNotificationBgColor(notification.type);
                        const borderColor = getNotificationBorderColor(notification.type);
                        const label = getNotificationLabel(notification.type);
                        
                        return (
                        <div key={notification.id} className={cn("border-b border-slate-800/40", idx === notifications.length - 1 && "border-b-0")}>
                          <DropdownMenuItem asChild className="cursor-pointer hover:bg-slate-800/50 p-0 transition-colors duration-150">
                            <Link href={notification.link || '#'} className="w-full" onClick={() => handleMarkAsRead(notification.id)}>
                                <div className="flex items-start gap-3 py-3 px-4 w-full">
                                    {/* Ícone com cor específica */}
                                    <div className={cn("p-2 rounded-lg shrink-0 border", bgColor, borderColor)}>
                                        <NotifIcon className={cn("h-4 w-4", iconColor)} />
                                    </div>
                                    
                                    <div className="flex-grow min-w-0">
                                        {/* Badge com tipo de notificação */}
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <Badge 
                                                variant={getPriorityBadgeVariant(notification.priority)} 
                                                className="text-[10px] px-1.5 py-0 h-5"
                                            >
                                                {label}
                                            </Badge>
                                            {!notification.isRead && (
                                                <div className="h-2 w-2 rounded-full bg-primary shrink-0 shadow-lg shadow-primary/50" />
                                            )}
                                        </div>
                                        
                                        <p className={cn(
                                            "text-sm leading-snug",
                                            notification.isRead ? "text-slate-400" : "text-slate-100 font-medium"
                                        )}>
                                            {notification.message}
                                        </p>
                                        
                                        <p className="text-xs text-slate-500 mt-1.5">
                                             {formatDistanceToNow(parseISO(notification.timestamp as string), { addSuffix: true, locale: ptBR })}
                                        </p>
                                    </div>
                                </div>
                            </Link>
                          </DropdownMenuItem>
                        </div>
                        );
                    })
                ) : (
                     <div className="p-8 text-center text-sm text-slate-400 flex flex-col items-center gap-3">
                        <div className="p-3 bg-slate-800/40 rounded-full">
                          <Bell className="h-6 w-6 text-slate-500"/>
                        </div>
                        <div>
                          <p className="font-medium">Tudo em dia!</p>
                          <p className="text-xs text-slate-500 mt-1">Nenhuma notificação no momento</p>
                        </div>
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
    <header className="sticky top-0 z-30 flex h-16 items-center border-b border-slate-800/60 bg-gradient-to-r from-slate-950/90 via-slate-950/85 to-slate-950/90 px-4 sm:px-6 backdrop-blur-xl shadow-[0_20px_50px_-30px_rgba(15,23,42,0.8)] transition-all duration-300 hover:shadow-[0_20px_50px_-25px_rgba(15,23,42,1)]">
      <div className="flex w-full items-center justify-between gap-4">
        {/* Botão para abrir sidebar no mobile */}
        <Button
          onClick={toggleSidebar}
          variant="ghost"
          size="icon"
          className="md:hidden rounded-full text-slate-400 hover:bg-slate-800/60 hover:text-slate-100 transition-all duration-200"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Abrir Menu</span>
        </Button>

        {/* Espaçador para centralizar o conteúdo do meio em telas maiores */}
        <div className="hidden md:flex flex-1" />

        {/* Ações da Direita */}
        <div className="flex items-center gap-2 ml-auto sm:gap-3">
          <div className="hidden sm:block h-6 w-px bg-slate-700/50" />
          <NotificationsMenu />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
