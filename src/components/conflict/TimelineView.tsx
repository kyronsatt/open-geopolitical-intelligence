import { useState } from "react";
import { motion } from "framer-motion";
import GlassCard from "@/components/GlassCard";

interface TimelineViewProps {
  events: any[];
}

const categoryColor: Record<string, string> = {
  military: "var(--red-vivid)",
  diplomatic: "var(--blue-vivid)",
  economic: "46 76% 59%",
  cyber: "270 100% 63%",
};

const sizeMap: Record<string, number> = {
  critical: 16,
  high: 12,
  medium: 8,
  low: 6,
};

const getColor = (cat: string) => {
  if (cat === "military") return "hsl(var(--red-vivid))";
  if (cat === "diplomatic") return "hsl(var(--blue-vivid))";
  if (cat === "economic") return "hsl(var(--accent))";
  return "hsl(270,100%,63%)";
};

const TimelineView = ({ events }: TimelineViewProps) => {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <h2 className="font-mono-label text-og-secondary">CONFLICT TIMELINE</h2>

      {/* Desktop horizontal */}
      <div className="hidden md:block overflow-x-auto pb-4">
        <div className="relative flex items-start gap-0 min-w-max px-4">
          {/* Line */}
          <div
            className="absolute top-[22px] left-0 right-0 h-[2px]"
            style={{ background: "hsl(var(--border-default))" }}
          />
          {events.map((ev: any, i: number) => {
            const size = sizeMap[ev.significance] || 8;
            const color = getColor(ev.category);
            const isCritical = ev.significance === "critical";
            return (
              <motion.div
                key={ev.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                className="flex flex-col items-center cursor-pointer min-w-[120px] relative"
                onClick={() => setExpanded(expanded === ev.id ? null : ev.id)}
              >
                <span className="font-mono-label text-[10px] text-og-muted mb-2">{ev.date}</span>
                <div className="relative z-10">
                  <div
                    className="rounded-full"
                    style={{
                      width: size,
                      height: size,
                      background: color,
                      boxShadow: isCritical ? `0 0 12px ${color}` : undefined,
                    }}
                  />
                </div>
                <span className="font-display text-xs font-semibold text-foreground mt-2 text-center max-w-[110px] leading-tight">
                  {ev.title}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Mobile vertical */}
      <div className="md:hidden space-y-4">
        {events.map((ev: any, i: number) => {
          const color = getColor(ev.category);
          const size = sizeMap[ev.significance] || 8;
          return (
            <motion.div
              key={ev.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex gap-3 items-start cursor-pointer"
              onClick={() => setExpanded(expanded === ev.id ? null : ev.id)}
            >
              <div className="flex flex-col items-center pt-1">
                <div
                  className="rounded-full"
                  style={{ width: size, height: size, background: color }}
                />
                {i < events.length - 1 && (
                  <div className="w-[2px] flex-1 mt-1" style={{ background: "hsl(var(--border-default))" }} />
                )}
              </div>
              <div>
                <span className="font-mono-label text-[10px] text-og-muted">{ev.date}</span>
                <p className="font-display text-sm font-semibold text-foreground">{ev.title}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Expanded card */}
      {expanded && (() => {
        const ev = events.find((e: any) => e.id === expanded);
        if (!ev) return null;
        return (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <GlassCard>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ background: getColor(ev.category) }}
                />
                <span className="font-mono-label text-og-secondary">{ev.category.toUpperCase()}</span>
                <span className="font-mono-label text-og-muted">{ev.date}</span>
              </div>
              <h3 className="font-display text-lg font-bold text-foreground mb-2">{ev.title}</h3>
              <p className="text-sm text-muted-foreground mb-3">{ev.description}</p>
              {ev.sources?.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {ev.sources.map((s: string, i: number) => (
                    <span key={i} className="font-mono-label text-[10px] px-2 py-0.5 rounded bg-surface text-og-muted">
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </GlassCard>
          </motion.div>
        );
      })()}
    </div>
  );
};

export default TimelineView;
