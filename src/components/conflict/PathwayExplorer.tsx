import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GlassCard from "@/components/GlassCard";
import { AlertTriangle, CheckCircle, ChevronDown, ChevronRight } from "lucide-react";

interface PathwayExplorerProps {
  snapshot: any;
}

const riskColor: Record<string, string> = {
  low: "text-og-green bg-[rgba(68,255,136,0.12)]",
  medium: "text-accent-color bg-accent-dim",
  high: "text-[hsl(30,100%,60%)] bg-[rgba(255,140,0,0.12)]",
  critical: "text-red-vivid bg-red-dim",
};

const PathwayExplorer = ({ snapshot }: PathwayExplorerProps) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  if (!snapshot?.pathways) {
    return (
      <div className="space-y-4">
        <h2 className="font-mono-label text-og-secondary">POLICY SIMULATION</h2>
        <GlassCard className="text-center py-12">
          <p className="font-mono-label text-og-muted">ANALYSIS PENDING</p>
        </GlassCard>
      </div>
    );
  }

  const pathways = snapshot.pathways;
  const selected = pathways.find((p: any) => p.id === selectedId);

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-mono-label text-og-secondary">POLICY SIMULATION</h2>
        <p className="text-sm text-muted-foreground">
          Explore realistic pathways and their projected systemic effects
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {pathways.map((p: any) => {
          const isSelected = p.id === selectedId;
          return (
            <GlassCard
              key={p.id}
              className={`cursor-pointer transition-all ${isSelected ? "ring-1 ring-[hsl(var(--accent))] shadow-[0_0_20px_rgba(232,197,71,0.1)]" : ""}`}
              onClick={() => setSelectedId(isSelected ? null : p.id)}
            >
              <span className={`font-mono-label text-[10px] px-2 py-0.5 rounded ${riskColor[p.risk_level] || riskColor.medium}`}>
                {p.risk_level?.toUpperCase()} RISK
              </span>
              <h3 className="font-display text-lg font-bold text-foreground mt-2 mb-1">{p.name}</h3>
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{p.description}</p>
              {p.time_horizon && (
                <p className="font-mono-label text-accent-color text-[10px] mb-2">{p.time_horizon}</p>
              )}
              {/* Probability bar */}
              <div className="mb-2">
                <div className="w-full h-1.5 rounded-full bg-surface overflow-hidden relative">
                  <motion.div
                    className="h-full rounded-full bg-og-accent"
                    initial={{ width: 0 }}
                    animate={{ width: `${p.probability_estimate || 0}%` }}
                    transition={{ duration: 0.8 }}
                  />
                  {p.probability_confidence_low != null && p.probability_confidence_high != null && (
                    <div
                      className="absolute top-0 h-full rounded-full bg-og-accent opacity-30"
                      style={{
                        left: `${p.probability_confidence_low}%`,
                        width: `${p.probability_confidence_high - p.probability_confidence_low}%`,
                      }}
                    />
                  )}
                </div>
                <span className="font-mono-label text-og-muted text-[10px]">
                  Est. Success: {p.probability_estimate}%
                  {p.probability_confidence_low != null && ` [${p.probability_confidence_low}–${p.probability_confidence_high}%]`}
                </span>
              </div>
              <span className="font-mono-label text-accent-color text-[10px]">
                {isSelected ? "COLLAPSE ↑" : "EXPLORE →"}
              </span>
            </GlassCard>
          );
        })}
      </div>

      {/* Detail panel */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <GlassCard className="space-y-4">
              {/* Required Actions Accordion */}
              {selected.required_actions && (
                <div>
                  <button
                    className="flex items-center gap-2 w-full"
                    onClick={() => toggleSection("actions")}
                  >
                    {openSections.actions ? <ChevronDown className="w-4 h-4 text-og-secondary" /> : <ChevronRight className="w-4 h-4 text-og-secondary" />}
                    <span className="font-mono-label text-og-secondary">REQUIRED ACTIONS</span>
                  </button>
                  {openSections.actions && (
                    <div className="mt-2 space-y-3 pl-6">
                      {Object.entries(selected.required_actions).map(([actor, actions]: [string, any]) => (
                        <div key={actor}>
                          <p className="font-mono-label text-accent-color text-[10px] mb-1">
                            {actor.toUpperCase()}
                          </p>
                          {(actions as string[]).map((a: string, i: number) => (
                            <p key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                              <CheckCircle className="w-3 h-3 text-og-muted" />{a}
                            </p>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Preconditions */}
              {selected.preconditions?.length > 0 && (
                <div>
                  <button
                    className="flex items-center gap-2 w-full"
                    onClick={() => toggleSection("preconditions")}
                  >
                    {openSections.preconditions ? <ChevronDown className="w-4 h-4 text-og-secondary" /> : <ChevronRight className="w-4 h-4 text-og-secondary" />}
                    <span className="font-mono-label text-og-secondary">PRECONDITIONS</span>
                  </button>
                  {openSections.preconditions && (
                    <div className="mt-2 pl-6">
                      {selected.preconditions.map((p: string, i: number) => (
                        <p key={i} className="text-sm text-og-muted flex items-center gap-2">
                          <span className="w-3 h-3 rounded border border-og-muted" />{p}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Obstacles */}
              {selected.obstacles?.length > 0 && (
                <div>
                  <span className="font-mono-label text-og-secondary block mb-1">OBSTACLES</span>
                  {selected.obstacles.map((o: string, i: number) => (
                    <p key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                      <AlertTriangle className="w-3 h-3 text-accent-color" />{o}
                    </p>
                  ))}
                </div>
              )}

              {/* Side Effects */}
              {selected.systemic_side_effects?.length > 0 && (
                <div>
                  <span className="font-mono-label text-og-secondary block mb-1">SYSTEMIC SIDE EFFECTS</span>
                  {selected.systemic_side_effects.map((s: string, i: number) => (
                    <p key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                      <AlertTriangle className="w-3 h-3 text-red-vivid" />{s}
                    </p>
                  ))}
                </div>
              )}
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Disclaimer */}
      <p className="font-mono-label text-og-muted text-center text-[10px]">
        Simulation for analytical purposes only · Probabilities are model estimates · Methodology is open source
      </p>
    </div>
  );
};

export default PathwayExplorer;
