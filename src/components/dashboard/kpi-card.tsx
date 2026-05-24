import { type ElementType } from 'react';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { useCountUp } from '@/hooks/use-count-up';

type KpiCardProps = {
  title: string;
  value: string;
  icon: ElementType;
  description?: string;
  trend?: number;
  invertTrendColor?: boolean;
  index?: number;
};

const parseNumericValue = (str: string): number => {
  const isNegative = str.includes('-');
  let cleaned = str.replace(/[^\d,.]/g, '');
  
  if (cleaned.includes(',') && cleaned.includes('.')) {
    cleaned = cleaned.replace(/\./g, '').replace(/,/g, '.');
  } else if (cleaned.includes(',')) {
    cleaned = cleaned.replace(/,/g, '.');
  }
  
  const parsed = parseFloat(cleaned);
  if (isNaN(parsed)) return 0;
  return isNegative ? -parsed : parsed;
};

export function KpiCard({ title, value, icon: Icon, description, trend, invertTrendColor = false, index = 0 }: KpiCardProps) {
  const hasTrend = typeof trend === 'number';
  const TrendIcon = !hasTrend || trend === 0 ? Minus : trend > 0 ? ArrowUpRight : ArrowDownRight;
  const isGoodTrend = hasTrend && trend !== 0 && ((trend > 0 && !invertTrendColor) || (trend < 0 && invertTrendColor));

  // Custom colors for icon container based on KPI type
  const iconColors = [
    'text-emerald-400 border-emerald-500/20 bg-emerald-500/5', // Receitas
    'text-rose-400 border-rose-500/20 bg-rose-500/5', // Despesas
    'text-sky-400 border-sky-500/20 bg-sky-500/5', // Balanço
    'text-purple-400 border-purple-500/20 bg-purple-500/5', // Poupança
  ];
  const iconColorClass = iconColors[index % iconColors.length];

  // CountUp logic
  const numericVal = parseNumericValue(value);
  const animatedVal = useCountUp({ end: numericVal });

  const displayValue = value.includes('R$')
    ? formatCurrency(animatedVal)
    : value.includes('%')
    ? `${animatedVal.toFixed(0)}%`
    : animatedVal.toLocaleString('pt-BR');

  return (
    <div className="card-premium h-full flex flex-col justify-between hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
      <div>
        <div className="flex items-center justify-between gap-4 mb-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{title}</span>
          <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg border", iconColorClass)}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <div className="text-2xl font-bold tracking-tight text-slate-100 md:text-3xl font-mono">{displayValue}</div>
      </div>
      
      <div className="mt-4 flex min-h-6 items-center justify-between gap-3 text-xs">
        {description ? <p className="text-slate-400 text-[11px]">{description}</p> : <span />}
        {hasTrend && (
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-bold text-[10px]',
                trend === 0 && 'bg-slate-800 text-slate-400',
                trend !== 0 && isGoodTrend && 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
                trend !== 0 && !isGoodTrend && 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
              )}
            >
              <TrendIcon className="h-3 w-3" />
              {Math.abs(trend).toFixed(1)}%
            </span>
            <span className="text-[10px] text-slate-500 font-medium">vs mês anterior</span>
          </div>
        )}
      </div>
    </div>
  );
}
