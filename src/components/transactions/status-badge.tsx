
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

const statusConfig = {
  paid: {
    label: (type: 'income' | 'expense') => (type === 'income' ? 'Recebido' : 'Pago'),
    icon: Check,
    className: "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/50 dark:text-green-300 dark:hover:bg-green-900/70",
  },
  pending: {
    label: () => 'Pendente',
    icon: Clock,
    className: "bg-orange-100 text-orange-800 hover:bg-orange-200 dark:bg-orange-900/50 dark:text-orange-300 dark:hover:bg-orange-900/70",
  },
};


export function StatusBadge({ status, type, onClick }: StatusBadgeProps) {
  const isPaid = status === 'paid';
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Button
      variant="ghost"
      onClick={onClick}
      disabled={isPaid}
      className={cn(
        "h-auto px-2.5 py-1 rounded-full text-xs font-medium gap-1.5",
        config.className,
        isPaid && "cursor-default pointer-events-none"
      )}
    >
        <Icon className="h-3 w-3" />
        <span>{config.label(type)}</span>
    </Button>
  );
}
