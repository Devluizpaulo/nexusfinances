
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { type ElementType } from "react";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

type KpiCardProps = {
  title: string;
  value: string;
  icon: ElementType;
  description?: string;
  trend?: number;
  invertTrendColor?: boolean;
  index?: number;
};

export function KpiCard({ title, value, icon: Icon, description, trend, invertTrendColor = false, index = 0 }: KpiCardProps) {
  const hasTrend = typeof trend === 'number';
  
  const TrendIcon = !hasTrend || trend === 0 
    ? Minus 
    : trend > 0 ? ArrowUpRight : ArrowDownRight;
  
  const trendColor = !hasTrend || trend === 0
    ? 'text-slate-500'
    : (trend > 0 && !invertTrendColor) || (trend < 0 && invertTrendColor)
      ? 'text-emerald-400'
      : 'text-rose-400';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card className="rounded-2xl border border-slate-900/60 bg-slate-950/70 p-4 sm:p-5 shadow-[0_18px_45px_-30px_rgba(15,23,42,1)] transition-all duration-300 hover:shadow-xl hover:border-slate-800/60 hover:scale-[1.02] h-full group cursor-default">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
          <CardTitle className="text-sm font-medium text-slate-400 group-hover:text-slate-300 transition-colors">{title}</CardTitle>
          <motion.div
            whileHover={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{ duration: 0.5 }}
          >
            <Icon className="h-4 w-4 text-slate-400 group-hover:text-primary transition-colors" />
          </motion.div>
        </CardHeader>
        <CardContent className="p-0">
          <motion.div 
            className="text-2xl font-bold text-slate-100"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            {value}
          </motion.div>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
            {description && <p className="group-hover:text-slate-400 transition-colors">{description}</p>}
            {hasTrend && (
              <motion.div 
                className={cn("flex items-center gap-1", trendColor)}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <TrendIcon className="h-3.5 w-3.5" />
                <span className="font-medium">{Math.abs(trend).toFixed(1)}%</span>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
