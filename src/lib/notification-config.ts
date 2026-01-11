import type { NotificationType, NotificationPriority } from '@/lib/types';
import { 
  Bell, 
  Target, 
  TrendingUp, 
  AlertTriangle, 
  AlertCircle, 
  Calendar, 
  Sparkles, 
  CreditCard,
  PieChart,
  Trophy
} from 'lucide-react';

export const notificationConfig = {
  debt_due: {
    icon: Calendar,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/20',
    label: 'Vencimento Próximo'
  },
  goal_reached: {
    icon: Trophy,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/20',
    label: 'Meta Alcançada'
  },
  goal_milestone: {
    icon: Target,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
    label: 'Marco de Meta'
  },
  budget_warning: {
    icon: AlertTriangle,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/20',
    label: 'Orçamento em Alerta'
  },
  budget_exceeded: {
    icon: AlertCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/20',
    label: 'Orçamento Estourado'
  },
  debt_overdue: {
    icon: AlertCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-600/10',
    borderColor: 'border-red-600/20',
    label: 'Dívida Vencida'
  },
  upcoming_due: {
    icon: Calendar,
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/10',
    borderColor: 'border-blue-400/20',
    label: 'Conta a Vencer'
  },
  recurrence_created: {
    icon: Sparkles,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/20',
    label: 'Recorrência Criada'
  },
  credit_card_notification: {
    icon: CreditCard,
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-500/10',
    borderColor: 'border-indigo-500/20',
    label: 'Cartão de Crédito'
  },
  monthly_summary: {
    icon: PieChart,
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/20',
    label: 'Resumo Mensal'
  }
} as const;

export const priorityConfig = {
  low: {
    color: 'text-slate-400',
    label: 'Baixa',
    badgeVariant: 'secondary' as const
  },
  medium: {
    color: 'text-yellow-500',
    label: 'Média',
    badgeVariant: 'default' as const
  },
  high: {
    color: 'text-red-500',
    label: 'Alta',
    badgeVariant: 'destructive' as const
  }
} as const;

export function getNotificationIcon(type: NotificationType) {
  return notificationConfig[type]?.icon || Bell;
}

export function getNotificationColor(type: NotificationType) {
  return notificationConfig[type]?.color || 'text-slate-500';
}

export function getNotificationBgColor(type: NotificationType) {
  return notificationConfig[type]?.bgColor || 'bg-slate-500/10';
}

export function getNotificationBorderColor(type: NotificationType) {
  return notificationConfig[type]?.borderColor || 'border-slate-500/20';
}

export function getNotificationLabel(type: NotificationType) {
  return notificationConfig[type]?.label || 'Notificação';
}

export function getPriorityColor(priority?: NotificationPriority) {
  if (!priority) return priorityConfig.low.color;
  return priorityConfig[priority]?.color || priorityConfig.low.color;
}

export function getPriorityLabel(priority?: NotificationPriority) {
  if (!priority) return priorityConfig.low.label;
  return priorityConfig[priority]?.label || priorityConfig.low.label;
}

export function getPriorityBadgeVariant(priority?: NotificationPriority) {
  if (!priority) return priorityConfig.low.badgeVariant;
  return priorityConfig[priority]?.badgeVariant || priorityConfig.low.badgeVariant;
}
