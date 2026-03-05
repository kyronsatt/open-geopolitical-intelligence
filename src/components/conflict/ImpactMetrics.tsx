import GlassCard from "@/components/GlassCard";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { ImpactMetricsProps, ImpactMetric } from "@/lib/schemas";
import { isReversedMetric, metricLabel } from "@/lib/schemas";

const ImpactMetrics: React.FC<ImpactMetricsProps> = ({ snapshot }) => {
  if (!snapshot?.impact) return null;

  const impact = snapshot.impact;
  // Dynamically derive all metrics from the impact object
  const metricKeys = Object.keys(impact).filter(k => impact[k] && typeof impact[k] === 'object' && 'score' in (impact[k] as any));

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-2">
        <h2 className="font-display text-2xl font-bold text-foreground">
          SYSTEMIC IMPACT ASSESSMENT
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Quantitative analysis of conflict consequences
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {metricKeys.map((key, idx) => {
          const data = impact[key] as ImpactMetric;
          if (!data) return null;
          const score = data.score ?? 0;
          const reversed = isReversedMetric(key);
          const isGood = reversed ? score >= 60 : score <= 30;
          const isBad = reversed ? score <= 30 : score >= 60;
          const scoreColor = isGood ? "text-og-green" : isBad ? "text-red-vivid" : "text-accent-color";
          const arcColorVal = isGood ? "hsl(var(--green-vivid))" : isBad ? "hsl(var(--red-vivid))" : "hsl(var(--accent))";

          const TrendIcon =
            data.trend === "up" || data.trend === "increasing" ? TrendingUp
            : data.trend === "down" || data.trend === "decreasing" ? TrendingDown
            : Minus;
          const trendColor =
            data.trend === "up" || data.trend === "increasing"
              ? (reversed ? "text-og-green" : "text-red-vivid")
              : data.trend === "down" || data.trend === "decreasing"
                ? (reversed ? "text-red-vivid" : "text-og-green")
                : "text-og-secondary";

          const drivers = data.drivers || data.primary_channels || data.mechanisms || data.stressed_alliances || [];

          // Gauge calculations
          const gaugeRadius = 52;
          const gaugeStroke = 6;
          const startAngle = 135;
          const sweepAngle = 270;
          const circumference = 2 * Math.PI * gaugeRadius;
          const arcLength = (sweepAngle / 360) * circumference;
          const filledLength = (score / 100) * arcLength;
          const cx = 64;
          const cy = 64;

          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              viewport={{ once: true }}
            >
              <GlassCard>
                <span className="font-mono-label text-og-secondary block mb-3">
                  {metricLabel(key)}
                </span>

                <div className="flex justify-center mb-5">
                  <div className="relative" style={{ width: 128, height: 96 }}>
                    <svg viewBox="0 0 128 100" className="w-full h-full">
                      <circle cx={cx} cy={cy} r={gaugeRadius} fill="none"
                        stroke="hsl(var(--bg-surface))" strokeWidth={gaugeStroke}
                        strokeDasharray={`${arcLength} ${circumference}`}
                        strokeDashoffset={0} strokeLinecap="round"
                        transform={`rotate(${startAngle} ${cx} ${cy})`}
                      />
                      <motion.circle cx={cx} cy={cy} r={gaugeRadius} fill="none"
                        stroke={arcColorVal} strokeWidth={gaugeStroke} strokeLinecap="round"
                        strokeDasharray={`${arcLength} ${circumference}`}
                        transform={`rotate(${startAngle} ${cx} ${cy})`}
                        initial={{ strokeDashoffset: arcLength }}
                        whileInView={{ strokeDashoffset: arcLength - filledLength }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        viewport={{ once: true }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ top: 30 }}>
                      <span className={`font-mono text-xl font-bold ${scoreColor}`}>{score}%</span>
                      <TrendIcon className={`w-4 h-4 ${trendColor}`} />
                    </div>
                  </div>
                </div>

                {(drivers as string[]).slice(0, 3).map((d: string, i: number) => (
                  <p key={i} className="text-xs text-muted-foreground leading-relaxed">- {d}</p>
                ))}
              </GlassCard>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default ImpactMetrics;
