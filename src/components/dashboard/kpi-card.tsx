import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type ElementType } from 'react';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

type KpiCardProps = {
  title: string;
  value: string;
  icon: ElementType;
  description?: string;
  trend?: number;
  invertTrendColor?: boolean;
  index?: number;
};

export function KpiCard({ title, value, icon: Icon, description, trend, invertTrendColor = false }: KpiCardProps) {
  const hasTrend = typeof trend === 'number';
  const TrendIcon = !hasTrend || trend === 0 ? Minus : trend > 0 ? ArrowUpRight : ArrowDownRight;
  const isGoodTrend = hasTrend && trend !== 0 && ((trend > 0 && !invertTrendColor) || (trend < 0 && invertTrendColor));

  return (
    <Card className="h-full rounded-lg border-slate-800 bg-card/75 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-5 pb-3">
        <CardTitle className="text-sm font-medium text-slate-400">{title}</CardTitle>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-cyan-300">
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent className="p-5 pt-0">
        <div className="text-2xl font-bold tracking-normal text-slate-50 md:text-3xl">{value}</div>
        <div className="mt-3 flex min-h-6 items-center justify-between gap-3 text-xs">
          {description ? <p className="text-slate-400">{description}</p> : <span />}
          {hasTrend && (
            <div
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-semibold',
                trend === 0 && 'bg-slate-800 text-slate-400',
                trend !== 0 && isGoodTrend && 'bg-emerald-500/15 text-emerald-300',
                trend !== 0 && !isGoodTrend && 'bg-rose-500/15 text-rose-300',
              )}
            >
              <TrendIcon className="h-3.5 w-3.5" />
              {Math.abs(trend).toFixed(1)}%
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
