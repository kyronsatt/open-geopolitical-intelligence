import GlassCard from "@/components/GlassCard";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { ImpactMetricsProps, ImpactMetric, TrendDirection } from "@/lib/schemas";

const METRICS = [
  {
    key: "domestic_stability_usa",
    label: "US DOMESTIC STABILITY",
    reversed: true,
  },
  {
    key: "domestic_stability_iran",
    label: "IRAN DOMESTIC STABILITY",
    reversed: true,
  },
  {
    key: "regional_destabilization",
    label: "REGIONAL DESTABILIZATION",
    reversed: false,
  },
  {
    key: "global_economic_shock",
    label: "GLOBAL ECONOMIC SHOCK",
    reversed: false,
  },
  {
    key: "energy_market_disruption",
    label: "ENERGY MARKET DISRUPTION",
    reversed: false,
  },
  { key: "alliance_stress", label: "ALLIANCE STRESS", reversed: false },
];

const ImpactMetrics: React.FC<ImpactMetricsProps> = ({ snapshot }) => {
  if (!snapshot?.impact) return null;

  const impact = snapshot.impact;

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
        {METRICS.map((m, idx) => {
          const data = impact[m.key];
          if (!data) return null;
          const score = data.score ?? 0;
          const isGood = m.reversed ? score >= 60 : score <= 30;
          const isBad = m.reversed ? score <= 30 : score >= 60;
          const scoreColor = isGood
            ? "text-og-green"
            : isBad
              ? "text-red-vivid"
              : "text-accent-color";
          const arcColorVal = isGood
            ? "hsl(var(--green-vivid))"
            : isBad
              ? "hsl(var(--red-vivid))"
              : "hsl(var(--accent))";
          const TrendIcon =
            data.trend === "up" || data.trend === "increasing"
              ? TrendingUp
              : data.trend === "down" || data.trend === "decreasing"
                ? TrendingDown
                : Minus;
          const trendColor =
            data.trend === "up" || data.trend === "increasing"
              ? m.reversed
                ? "text-og-green"
                : "text-red-vivid"
              : data.trend === "down" || data.trend === "decreasing"
                ? m.reversed
                  ? "text-red-vivid"
                  : "text-og-green"
                : "text-og-secondary";

          const drivers =
            data.drivers ||
            data.primary_channels ||
            data.mechanisms ||
            data.stressed_alliances ||
            [];

          // Gauge calculations
          const gaugeRadius = 52;
          const gaugeStroke = 6;
          const startAngle = 135; // degrees
          const endAngle = 405; // degrees (270 degree sweep)
          const sweepAngle = endAngle - startAngle;
          const circumference = 2 * Math.PI * gaugeRadius;
          const arcLength = (sweepAngle / 360) * circumference;
          const filledLength = (score / 100) * arcLength;
          const cx = 64;
          const cy = 64;

          // Confidence band
          const confLow = data.confidence_low ?? score;
          const confHigh = data.confidence_high ?? score;
          const confStartLength = (confLow / 100) * arcLength;
          const confBandLength = ((confHigh - confLow) / 100) * arcLength;

          return (
            <motion.div
              key={m.key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              viewport={{ once: true }}
            >
              <GlassCard>
                <span className="font-mono-label text-og-secondary block mb-3">
                  {m.label}
                </span>

                {/* Gauge */}
                <div className="flex justify-center mb-5">
                  <div className="relative" style={{ width: 128, height: 96 }}>
                    <svg viewBox="0 0 128 100" className="w-full h-full">
                      {/* Background arc */}
                      <circle
                        cx={cx}
                        cy={cy}
                        r={gaugeRadius}
                        fill="none"
                        stroke="hsl(var(--bg-surface))"
                        strokeWidth={gaugeStroke}
                        strokeDasharray={`${arcLength} ${circumference}`}
                        strokeDashoffset={0}
                        strokeLinecap="round"
                        transform={`rotate(${startAngle} ${cx} ${cy})`}
                      />
                      {/* Filled arc */}
                      <motion.circle
                        cx={cx}
                        cy={cy}
                        r={gaugeRadius}
                        fill="none"
                        stroke={arcColorVal}
                        strokeWidth={gaugeStroke}
                        strokeLinecap="round"
                        strokeDasharray={`${arcLength} ${circumference}`}
                        transform={`rotate(${startAngle} ${cx} ${cy})`}
                        initial={{ strokeDashoffset: arcLength }}
                        whileInView={{
                          strokeDashoffset: arcLength - filledLength,
                        }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        viewport={{ once: true }}
                      />
                    </svg>
                    {/* Center score */}
                    <div
                      className="absolute inset-0 flex flex-col items-center justify-center"
                      style={{ top: 30 }}
                    >
                      <span
                        className={`font-mono text-xl font-bold ${scoreColor}`}
                      >
                        {score}%
                      </span>
                      <TrendIcon className={`w-4 h-4 ${trendColor}`} />
                    </div>
                  </div>
                </div>

                {/* Drivers */}
                {drivers.slice(0, 3).map((d: string, i: number) => (
                  <p
                    key={i}
                    className="text-xs text-muted-foreground leading-relaxed"
                  >
                    - {d}
                  </p>
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
