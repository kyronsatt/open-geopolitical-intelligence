import GlassCard from "@/components/GlassCard";
import { motion } from "framer-motion";
import type { BriefingPanelProps, Briefing, DiplomaticChannel } from "@/lib/schemas";

const BriefingPanel: React.FC<BriefingPanelProps> = ({ snapshot }) => {
  if (!snapshot?.briefing) {
    return (
      <div className="space-y-4">
        <div className="border-b border-border pb-2">
          <h2 className="font-display text-2xl font-bold text-foreground">
            CURRENT SITUATION ASSESSMENT
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Executive summary of the conflict analysis
          </p>
        </div>
        <GlassCard className="text-center py-12">
          <p className="font-mono-label text-og-muted mb-2">
            NO ANALYSIS AVAILABLE
          </p>
          <p className="text-sm text-muted-foreground">
            Trigger the admin endpoint to generate the first analysis.
          </p>
        </GlassCard>
      </div>
    );
  }

  const b = snapshot.briefing;
  const confColor =
    b.confidence_level === "high"
      ? "text-og-green"
      : b.confidence_level === "medium"
        ? "text-accent-color"
        : "text-red-vivid";

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-2 flex items-center gap-3">
        <h2 className="font-display text-2xl font-bold text-foreground">
          CURRENT SITUATION ASSESSMENT
        </h2>
        <span className="font-mono-label px-2 py-0.5 rounded bg-accent-dim text-accent-color text-[10px]">
          AI GENERATED
        </span>
        <span className="font-mono-label text-og-muted text-[10px]">
          {new Date(snapshot.created_at).toLocaleDateString()}
        </span>
      </div>

      {/* Executive Summary */}
      <GlassCard
        className="relative"
        style={{ borderLeft: '2px solid hsl(var(--accent))' }}
      >
        <p className="text-base font-body leading-relaxed text-foreground pr-24">
          {b.summary}
        </p>
        <span className={`self-end font-mono-label text-[10px] ${confColor}`}>
          {b.confidence_level?.toUpperCase()} CONFIDENCE
        </span>
      </GlassCard>

      {/* Three columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Military */}
        <GlassCard>
          <span className="font-display text-lg font-bold text-foreground block mb-3">
            MILITARY POSTURE
          </span>
          {["usa", "iran"].map((side) => {
            const data = b.military_posture?.[side];
            if (!data) return null;
            return (
              <div key={side} className="mb-4">
                <p className="font-mono-label text-accent-color text-[10px] mb-1">
                  {side.toUpperCase()}
                </p>
                <p className="text-sm text-foreground mb-2">
                  {data.current_posture}
                </p>
                {data.recent_actions?.map((a: string, i: number) => (
                  <p
                    key={i}
                    className="text-xs text-muted-foreground flex items-center gap-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-og-red" />
                    {a}
                  </p>
                ))}
              </div>
            );
          })}
        </GlassCard>

        {/* Economic */}
        <GlassCard>
          <span className="font-display text-lg font-bold text-foreground block mb-3">
            ECONOMIC MEASURES
          </span>
          {b.economic_measures?.active_sanctions && (
            <p className="font-display text-5xl font-bold text-accent-color mb-2">
              {b.economic_measures.active_sanctions.length}
            </p>
          )}
          <p className="font-mono-label text-og-muted text-[10px] mb-3">
            ACTIVE SANCTIONS
          </p>
          <p className="text-sm text-muted-foreground mb-2">
            {b.economic_measures?.trade_impact}
          </p>
          <p className="text-sm text-muted-foreground">
            {b.economic_measures?.currency_effects}
          </p>
        </GlassCard>

        {/* Diplomatic */}
        <GlassCard>
          <span className="font-display text-lg font-bold text-foreground block mb-3">
            DIPLOMATIC STATUS
          </span>
          <p className="font-mono-label text-[10px] text-accent-color mb-2">
            TONE: {b.diplomatic_status?.current_tone?.toUpperCase()}
          </p>
          {b.diplomatic_status?.active_channels?.map((ch: DiplomaticChannel, i: number) => {
            const dotColor =
              ch.status === "active"
                ? "bg-og-green"
                : ch.status === "cold"
                  ? "bg-og-accent"
                  : "bg-og-red";
            const name = typeof ch === "string" ? ch : ch.name || ch;
            return (
              <p
                key={i}
                className="text-sm text-muted-foreground flex items-center gap-2"
              >
                <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                {name}
              </p>
            );
          })}
          {b.diplomatic_status?.third_party_mediators?.length > 0 && (
            <div className="mt-3">
              <span className="font-mono-label text-og-muted text-[10px]">
                MEDIATORS
              </span>
              <p className="text-sm text-muted-foreground">
                {b.diplomatic_status.third_party_mediators.join(", ")}
              </p>
            </div>
          )}
        </GlassCard>
      </div>

      {/* Internal pressure */}
      {b.internal_pressure && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {["usa", "iran"].map((side) => {
            const data = b.internal_pressure[side];
            if (!data) return null;
            const level = data.pressure_level || 0;
            const barColor =
              level > 70
                ? "bg-og-red"
                : level > 40
                  ? "bg-og-accent"
                  : "bg-og-green";
            return (
              <GlassCard key={side}>
                <span className="font-display text-lg font-bold text-foreground block mb-2">
                  {side.toUpperCase()} INTERNAL PRESSURE
                </span>
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex-1 h-2 rounded-full bg-surface overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${barColor}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${level}%` }}
                      transition={{ duration: 1 }}
                    />
                  </div>
                  <span className="font-mono-label text-foreground">
                    {level}%
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {data.political_pressure || data.regime_stability}
                </p>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BriefingPanel;
