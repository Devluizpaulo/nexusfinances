
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
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="group relative h-full"
    >
      {/* Glow effect */}
      <motion.div
        className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 rounded-2xl blur-xl opacity-0 group-hover:opacity-40"
        animate={{
          opacity: [0, 0.3, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
        }}
      />

      <Card className="relative rounded-2xl border border-blue-500/30 bg-gradient-to-br from-slate-950/50 to-slate-900/30 p-5 shadow-lg backdrop-blur-xl transition-all duration-300 hover:border-cyan-400/60 hover:shadow-2xl hover:shadow-blue-500/20 h-full group-hover:scale-[1.02]">
        {/* Shine effect */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 rounded-2xl opacity-0 group-hover:opacity-100"
          transition={{ duration: 0.3 }}
        />

        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 p-0 relative z-10">
          <CardTitle className="text-sm font-bold bg-gradient-to-r from-slate-300 to-slate-400 bg-clip-text text-transparent group-hover:from-slate-200 group-hover:to-slate-300 transition-colors">{title}</CardTitle>
          <motion.div
            whileHover={{ rotate: [0, -15, 15, -15, 0], scale: 1.1 }}
            transition={{ duration: 0.5 }}
            className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/10 group-hover:from-blue-500/40 group-hover:to-cyan-500/20 transition-colors"
          >
            <Icon className="h-4 w-4 text-cyan-400" />
          </motion.div>
        </CardHeader>
        <CardContent className="p-0 relative z-10">
          <motion.div 
            className="text-3xl font-bold bg-gradient-to-r from-blue-200 via-cyan-200 to-blue-300 bg-clip-text text-transparent"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            {value}
          </motion.div>
          <div className="flex items-center justify-between text-xs mt-3">
            {description && <p className="text-slate-400 group-hover:text-slate-300 transition-colors">{description}</p>}
            {hasTrend && (
              <motion.div 
                className={cn("flex items-center gap-1.5 px-2 py-1 rounded-lg backdrop-blur-sm", 
                  trend === 0 ? 'bg-slate-600/20' :
                  (trend > 0 && !invertTrendColor) || (trend < 0 && invertTrendColor)
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-rose-500/20 text-rose-300'
                )}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <TrendIcon className="h-3.5 w-3.5" />
                <span className="font-bold">{Math.abs(trend).toFixed(1)}%</span>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
