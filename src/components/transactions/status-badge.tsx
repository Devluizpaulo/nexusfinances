"use client";

import { cn } from "@/lib/utils";
import { Check, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Transaction } from "@/lib/types";

type StatusBadgeProps = {
  status: Transaction['status'];
  type: 'income' | 'expense';
  onClick?: () => void;
};

export function StatusBadge({ status, type, onClick }: StatusBadgeProps) {
  const isPaid = status === 'paid';
  
  const baseClasses = "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer";
  
  const paidClasses = "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/50 dark:text-green-300 dark:hover:bg-green-900/70";
  const pendingClasses = "bg-orange-100 text-orange-800 hover:bg-orange-200 dark:bg-orange-900/50 dark:text-orange-300 dark:hover:bg-orange-900/70";

  const text = isPaid ? (type === 'income' ? 'Recebido' : 'Pago') : 'Pendente';
  const Icon = isPaid ? Check : Clock;

  return (
    <Button
      variant="ghost"
      onClick={onClick}
      disabled={isPaid}
      className={cn(
        "h-auto p-0 hover:bg-transparent",
        isPaid && "cursor-default"
      )}
    >
      <div
        className={cn(
          baseClasses,
          isPaid ? paidClasses : pendingClasses,
        )}
      >
        <Icon className="h-3 w-3" />
        <span>{text}</span>
      </div>
    </Button>
  );
}
