import GlassCard from "@/components/GlassCard";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface ImpactMetricsProps {
  snapshot: any;
}

const METRICS = [
  { key: "domestic_stability_usa", label: "US DOMESTIC STABILITY", reversed: true },
  { key: "domestic_stability_iran", label: "IRAN DOMESTIC STABILITY", reversed: true },
  { key: "regional_destabilization", label: "REGIONAL DESTABILIZATION", reversed: false },
  { key: "global_economic_shock", label: "GLOBAL ECONOMIC SHOCK", reversed: false },
  { key: "energy_market_disruption", label: "ENERGY MARKET DISRUPTION", reversed: false },
  { key: "alliance_stress", label: "ALLIANCE STRESS", reversed: false },
];

const ImpactMetrics = ({ snapshot }: ImpactMetricsProps) => {
  if (!snapshot?.impact) return null;

  const impact = snapshot.impact;

  return (
    <div className="space-y-4">
      <h2 className="font-mono-label text-og-secondary">SYSTEMIC IMPACT ASSESSMENT</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {METRICS.map((m, idx) => {
          const data = impact[m.key];
          if (!data) return null;
          const score = data.score ?? 0;
          const isGood = m.reversed ? score >= 60 : score <= 30;
          const isBad = m.reversed ? score <= 30 : score >= 60;
          const scoreColor = isGood ? "text-og-green" : isBad ? "text-red-vivid" : "text-accent-color";
          const barColor = isGood ? "bg-og-green" : isBad ? "bg-og-red" : "bg-og-accent";
          const TrendIcon = data.trend === "up" || data.trend === "increasing"
            ? TrendingUp
            : data.trend === "down" || data.trend === "decreasing"
            ? TrendingDown
            : Minus;
          const trendColor = (data.trend === "up" || data.trend === "increasing")
            ? (m.reversed ? "text-og-green" : "text-red-vivid")
            : (data.trend === "down" || data.trend === "decreasing")
            ? (m.reversed ? "text-red-vivid" : "text-og-green")
            : "text-og-secondary";

          const drivers = data.drivers || data.primary_channels || data.mechanisms || data.stressed_alliances || [];

          return (
            <motion.div
              key={m.key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              viewport={{ once: true }}
            >
              <GlassCard>
                <span className="font-mono-label text-og-secondary block mb-3">{m.label}</span>
                <div className="flex items-end gap-3 mb-3">
                  <span className={`font-display text-5xl font-bold ${scoreColor}`}>{score}</span>
                  <TrendIcon className={`w-5 h-5 ${trendColor} mb-2`} />
                </div>
                {/* Thermometer */}
                <div className="relative w-1 h-20 rounded-full bg-surface overflow-hidden mb-3">
                  <motion.div
                    className={`absolute bottom-0 w-full rounded-full ${barColor}`}
                    initial={{ height: 0 }}
                    whileInView={{ height: `${score}%` }}
                    transition={{ duration: 0.8 }}
                    viewport={{ once: true }}
                  />
                  {data.confidence_low != null && data.confidence_high != null && (
                    <div
                      className="absolute w-full opacity-30 rounded-full"
                      style={{
                        bottom: `${data.confidence_low}%`,
                        height: `${data.confidence_high - data.confidence_low}%`,
                        background: isGood ? "hsl(var(--green-vivid))" : isBad ? "hsl(var(--red-vivid))" : "hsl(var(--accent))",
                      }}
                    />
                  )}
                </div>
                {/* Drivers */}
                {drivers.slice(0, 3).map((d: string, i: number) => (
                  <p key={i} className="text-xs text-muted-foreground leading-relaxed">{d}</p>
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
