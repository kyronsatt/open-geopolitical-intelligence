import { useState } from "react";
import { motion } from "framer-motion";
import GlassCard from "@/components/GlassCard";
import {
  Shield,
  AlertTriangle,
  Zap,
  Globe,
  Target,
  TrendingUp,
} from "lucide-react";

interface ConflictHeaderProps {
  conflict: any;
  snapshot: any;
  snapshotHistory: any[];
  events: any[];
}

// Helper to get badge styling based on status
const getStatusBadge = (status: string) => {
  const statusLower = (status || "").toLowerCase();
  if (statusLower.includes("escalat")) {
    return { label: "⚡ ESCALATING", className: "bg-red-dim text-red-vivid" };
  }
  if (statusLower.includes("de-escalat") || statusLower.includes("calm")) {
    return {
      label: "🕊️ DE-ESCALATING",
      className: "bg-og-green/20 text-og-green",
    };
  }
  if (statusLower.includes("stable")) {
    return { label: "⚖️ STABLE", className: "bg-og-green/20 text-og-green" };
  }
  if (statusLower.includes("frozen") || statusLower.includes("stalemate")) {
    return {
      label: "❄️ FROZEN",
      className: "bg-blue-vivid/20 text-blue-vivid",
    };
  }
  return { label: "⚡ ACTIVE", className: "bg-red-dim text-red-vivid" };
};

// Helper to get conflict type badge
const getTypeBadge = (type: string) => {
  const typeLower = (type || "").toLowerCase();
  if (typeLower.includes("hybrid")) {
    return { label: "🌐 HYBRID CONFLICT", icon: Globe };
  }
  if (typeLower.includes("military") || typeLower.includes("war")) {
    return { label: "🎯 MILITARY", icon: Target };
  }
  if (typeLower.includes("economic")) {
    return { label: "💰 ECONOMIC", icon: TrendingUp };
  }
  if (typeLower.includes("proxy")) {
    return { label: "👥 PROXY CONFLICT", icon: Globe };
  }
  if (typeLower.includes("cyber")) {
    return { label: "💻 CYBER", icon: Globe };
  }
  return { label: "⚔️ CONFLICT", icon: Zap };
};

// Helper to get intensity level
const getIntensityInfo = (intensity: number) => {
  const pct = Math.round((intensity || 0) * 100);
  let level = "LOW";
  let color = "text-og-green";
  let bg = "bg-og-green/20";

  if (pct >= 70) {
    level = "CRITICAL";
    color = "text-red-vivid";
    bg = "bg-red-dim";
  } else if (pct >= 50) {
    level = "HIGH";
    color = "text-[hsl(30,100%,60%)]";
    bg = "bg-[rgba(255,140,0,0.12)]";
  } else if (pct >= 30) {
    level = "MODERATE";
    color = "text-accent-color";
    bg = "bg-accent-dim";
  }

  return { level, pct, color, bg };
};

const ConflictHeader = ({
  conflict,
  snapshot,
  snapshotHistory,
  events,
}: ConflictHeaderProps) => {
  const [historyOpen, setHistoryOpen] = useState(false);

  const triggeringEvent = snapshot?.triggered_by_event_id
    ? events.find((e: any) => e.id === snapshot.triggered_by_event_id)
    : null;

  // Dynamic badges based on conflict data
  const statusBadge = getStatusBadge(conflict.status);
  const typeBadge = getTypeBadge(conflict.type);
  const intensityInfo = getIntensityInfo(conflict.intensity);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <p className="font-mono-label text-og-muted">
        OGSE / CONFLICTS / {conflict.name?.toUpperCase()}
      </p>

      {/* Title */}
      <h1
        className="font-mono-label text-foreground"
        style={{ fontSize: "clamp(2rem, 5vw, 4rem)", letterSpacing: "-0.04em" }}
      >
        {conflict.name}
      </h1>

      {/* Dynamic Badges */}
      <div className="flex flex-wrap gap-2">
        {/* Status Badge - from conflict.status */}
        <span
          className={`font-mono-label px-3 py-1 rounded ${statusBadge.className}`}
        >
          {statusBadge.label}
        </span>

        {/* Type Badge - from conflict.type */}
        <span className="font-mono-label px-3 py-1 rounded bg-[hsl(var(--bg-glass))] text-og-secondary flex items-center gap-1.5">
          {typeBadge.icon && <typeBadge.icon className="w-3.5 h-3.5" />}
          {typeBadge.label}
        </span>

        {/* Confidence Badge - from snapshot */}
        {snapshot?.briefing?.confidence_level && (
          <span
            className={`font-mono-label px-3 py-1 rounded ${
              snapshot.briefing.confidence_level === "high"
                ? "bg-og-green/20 text-og-green"
                : snapshot.briefing.confidence_level === "medium"
                  ? "bg-accent-dim text-accent-color"
                  : "bg-red-dim text-red-vivid"
            }`}
          >
            CONFIDENCE {snapshot.briefing.confidence_level.toUpperCase()}
          </span>
        )}
      </div>

      {/* Intensity bar with percentage */}
      <div className="relative w-full h-6 rounded-full bg-surface overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            background:
              "linear-gradient(270deg, hsl(var(--red-vivid)), hsl(46,76%,59%))",
          }}
          initial={{ width: 0 }}
          animate={{ width: `${(conflict.intensity || 0) * 100}%` }}
          transition={{ duration: 1, delay: 0.3 }}
        >
          <div className="absolute inset-0 flex items-center justify-end mr-4">
            <span className="font-mono-label font-bold text-foreground backdrop-blur-xl opacity-40 drop-shadow-2xl text-black">
              INTENSITY {Math.round((conflict.intensity || 0) * 100)}%
            </span>
          </div>
        </motion.div>
      </div>

      {/* Actors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(conflict.actors as any[])?.map((actor: any, i: number) => (
          <GlassCard key={i}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">{actor.flag}</span>
              <h3 className="font-display text-lg font-bold text-foreground">
                {actor.name}
              </h3>
            </div>
            <div className="mb-3">
              <span className="font-mono-label text-og-secondary mb-1 block">
                INTERESTS
              </span>
              <ul className="space-y-1">
                {actor.interests?.map((int: string, j: number) => (
                  <li
                    key={j}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <Shield className="w-3 h-3 text-og-blue" />
                    {int}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <span className="font-mono-label text-og-secondary mb-1 block">
                RED LINES
              </span>
              <ul className="space-y-1">
                {actor.red_lines?.map((rl: string, j: number) => (
                  <li
                    key={j}
                    className="flex items-center gap-2 text-sm text-red-vivid"
                  >
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
            Analysis based on:{" "}
            <span className="text-accent-color">{triggeringEvent.title}</span> ·{" "}
            {triggeringEvent.date}
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
          <span className="font-mono-label text-og-secondary block mb-2">
            SNAPSHOT HISTORY
          </span>
          {snapshotHistory.map((s: any) => (
            <div
              key={s.id}
              className="flex items-center justify-between py-1 border-b border-border last:border-0"
            >
              <span className="font-mono-label text-xs text-og-muted">
                {s.id.slice(0, 8)}
              </span>
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
