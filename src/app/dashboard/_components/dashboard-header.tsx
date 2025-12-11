'use client';

import { useUser } from "@/firebase";
import { useDashboardDate } from "@/context/dashboard-date-context";
import { format, addMonths, subMonths } from "date-fns";
import { ptBR } from 'date-fns/locale';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import * as LucideIcons from 'lucide-react';

export function DashboardHeader() {
    const { user } = useUser();
    const { selectedDate, setSelectedDate } = useDashboardDate();

    const getFirstName = (displayName: string | null | undefined) => {
        if (!displayName) return 'Olá';
        return `Olá, ${displayName.split(' ')[0]}!`;
    }

    const Icon = user?.avatar?.icon ? (LucideIcons as any)[user.avatar.icon] || LucideIcons.User : LucideIcons.User;

    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                 <Avatar className="h-11 w-11 border-2 border-primary/20">
                    {user?.photoURL ? (
                        <AvatarImage src={user.photoURL} alt="Avatar do usuário"/>
                    ) : user?.avatar ? (
                        <div className={cn("flex h-full w-full items-center justify-center rounded-full text-white", user.avatar.bgColor)}>
                            <Icon className="h-6 w-6" />
                        </div>
                    ) : (
                        <AvatarFallback>{user?.displayName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
                    )}
                </Avatar>
                <div>
                    <h1 className="text-xl font-bold tracking-tight">{getFirstName(user?.displayName)}</h1>
                    <p className="text-sm text-muted-foreground">Bem-vindo(a) de volta.</p>
                </div>
            </div>
            
            <div className="flex items-center gap-1 rounded-full bg-muted p-1">
                <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full" onClick={() => setSelectedDate(subMonths(selectedDate, 1))}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="w-28 text-center text-sm font-medium capitalize">
                    {format(selectedDate, "MMMM", { locale: ptBR })}
                </span>
                <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full" onClick={() => setSelectedDate(addMonths(selectedDate, 1))}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
