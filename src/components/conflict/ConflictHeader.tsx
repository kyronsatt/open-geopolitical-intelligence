import { useState } from "react";
import { motion } from "framer-motion";
import GlassCard from "@/components/GlassCard";
import { Shield, AlertTriangle } from "lucide-react";

interface ConflictHeaderProps {
  conflict: any;
  snapshot: any;
  snapshotHistory: any[];
  events: any[];
}

const ConflictHeader = ({ conflict, snapshot, snapshotHistory, events }: ConflictHeaderProps) => {
  const [historyOpen, setHistoryOpen] = useState(false);

  const triggeringEvent = snapshot?.triggered_by_event_id
    ? events.find((e: any) => e.id === snapshot.triggered_by_event_id)
    : null;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <p className="font-mono-label text-og-muted">
        OGSE / CONFLICTS / {conflict.name?.toUpperCase()}
      </p>

      {/* Title */}
      <h1
        className="font-display font-extrabold text-foreground"
        style={{ fontSize: "clamp(2rem, 5vw, 4rem)", letterSpacing: "-0.04em" }}
      >
        {conflict.name}
      </h1>

      {/* Badges */}
      <div className="flex flex-wrap gap-2">
        <span className="font-mono-label px-3 py-1 rounded bg-red-dim text-red-vivid">
          ⚡ ESCALATING
        </span>
        <span className="font-mono-label px-3 py-1 rounded bg-[hsl(var(--bg-glass))] text-og-secondary">
          HYBRID CONFLICT
        </span>
        <span className="font-mono-label px-3 py-1 rounded bg-accent-dim text-accent-color">
          INTENSITY {Math.round(conflict.intensity * 100)}%
        </span>
      </div>

      {/* Intensity bar */}
      <div className="w-full h-1 rounded-full bg-surface overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: "linear-gradient(90deg, hsl(var(--red-vivid)), hsl(46,76%,59%))" }}
          initial={{ width: 0 }}
          animate={{ width: `${conflict.intensity * 100}%` }}
          transition={{ duration: 1, delay: 0.3 }}
        />
      </div>

      {/* Actors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(conflict.actors as any[])?.map((actor: any, i: number) => (
          <GlassCard key={i}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">{actor.flag}</span>
              <h3 className="font-display text-lg font-bold text-foreground">{actor.name}</h3>
            </div>
            <div className="mb-3">
              <span className="font-mono-label text-og-secondary mb-1 block">INTERESTS</span>
              <ul className="space-y-1">
                {actor.interests?.map((int: string, j: number) => (
                  <li key={j} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Shield className="w-3 h-3 text-og-blue" />
                    {int}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <span className="font-mono-label text-og-secondary mb-1 block">RED LINES</span>
              <ul className="space-y-1">
                {actor.red_lines?.map((rl: string, j: number) => (
                  <li key={j} className="flex items-center gap-2 text-sm text-red-vivid">
                    <AlertTriangle className="w-3 h-3" />
                    {rl}
                  </li>
                ))}
              </ul>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Analysis trigger info */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        {triggeringEvent && (
          <span>
            Analysis based on: <span className="text-accent-color">{triggeringEvent.title}</span> · {triggeringEvent.date}
          </span>
        )}
        {snapshotHistory.length > 0 && (
          <button
            onClick={() => setHistoryOpen(!historyOpen)}
            className="font-mono-label text-accent-color hover:underline"
          >
            VIEW HISTORY ({snapshotHistory.length})
          </button>
        )}
      </div>

      {/* History slide */}
      {historyOpen && (
        <GlassCard>
          <span className="font-mono-label text-og-secondary block mb-2">SNAPSHOT HISTORY</span>
          {snapshotHistory.map((s: any) => (
            <div key={s.id} className="flex items-center justify-between py-1 border-b border-border last:border-0">
              <span className="font-mono-label text-xs text-og-muted">{s.id.slice(0, 8)}</span>
              <span className="text-xs text-muted-foreground">
                {new Date(s.created_at).toLocaleDateString()}
              </span>
            </div>
          ))}
        </GlassCard>
      )}
    </div>
  );
};

export default ConflictHeader;
