import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import ConflictHeader from "@/components/conflict/ConflictHeader";
import TimelineView from "@/components/conflict/TimelineView";
import BriefingPanel from "@/components/conflict/BriefingPanel";
import ImpactMetrics from "@/components/conflict/ImpactMetrics";
import CausalGraphView from "@/components/conflict/CausalGraphView";
import PathwayExplorer from "@/components/conflict/PathwayExplorer";
import StickyDotNav from "@/components/conflict/StickyDotNav";
import { X } from "lucide-react";
import type { Conflict, TimelineEvent, AnalysisSnapshot } from "@/lib/schemas";

const ConflictPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [conflict, setConflict] = useState<Conflict | null>(null);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [snapshot, setSnapshot] = useState<AnalysisSnapshot | null>(null);
  const [snapshotHistory, setSnapshotHistory] = useState<Pick<AnalysisSnapshot, 'id' | 'created_at' | 'triggered_by_event_id'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [bannerVisible, setBannerVisible] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      supabase.from("conflicts").select("*").eq("id", id).single(),
      supabase
        .from("timeline_events")
        .select("*")
        .eq("conflict_id", id)
        .order("date", { ascending: true }),
      supabase
        .from("analysis_snapshots")
        .select("*")
        .eq("conflict_id", id)
        .eq("is_latest", true)
        .single(),
      supabase
        .from("analysis_snapshots")
        .select("id, created_at, triggered_by_event_id")
        .eq("conflict_id", id)
        .order("created_at", { ascending: false }),
    ]).then(([c, e, s, sh]) => {
      setConflict(c.data as Conflict | null);
      setEvents((e.data || []) as TimelineEvent[]);
      setSnapshot(s.data as AnalysisSnapshot | null);
      setSnapshotHistory((sh.data || []) as Pick<AnalysisSnapshot, 'id' | 'created_at' | 'triggered_by_event_id'>[]);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-base p-8 pt-24">
        <div className="max-w-6xl mx-auto space-y-6">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-32 rounded-xl bg-[hsl(var(--bg-glass))] animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!conflict) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center">
        <p className="text-muted-foreground">Conflict not found.</p>
      </div>
    );
  }

  const sections = [
    "Timeline",
    "Briefing",
    "Causal Analysis",
    "Simulation",
    "Impact",
  ];

  return (
    <div className="min-h-screen bg-base">
      {/* Nav */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center px-6 py-4"
        style={{
          backdropFilter: "blur(20px)",
          background: "rgba(8,8,16,0.8)",
          borderBottom: "1px solid hsl(var(--border-subtle))",
        }}
      >
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <span className="font-display text-xl font-extrabold tracking-tight text-foreground">
            OGI
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-og-green animate-pulse-glow" />
            <span className="font-mono-label text-og-green">LIVE</span>
          </span>
        </div>
      </nav>

      <StickyDotNav sections={sections} />

      <div className="pt-20 max-w-6xl mx-auto px-4 md:px-8 space-y-16">
        {/* Banner */}
        <AnimatePresence>
          {bannerVisible && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-accent-dim rounded-lg px-4 py-2 flex items-center justify-between"
            >
              <span className="font-mono-label text-accent-color text-xs">
                AI-generated analysis · Not for operational use
              </span>
              <button onClick={() => setBannerVisible(false)}>
                <X className="w-4 h-4 text-og-secondary" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <ConflictHeader
          conflict={conflict}
          snapshot={snapshot}
          snapshotHistory={snapshotHistory}
          events={events}
        />

        <div id="section-Timeline">
          <TimelineView events={events} />
        </div>

        <div id="section-Briefing">
          <BriefingPanel snapshot={snapshot} />
        </div>

        <div id="section-Causal Analysis">
          <CausalGraphView snapshot={snapshot} />
        </div>

        <div id="section-Simulation">
          <PathwayExplorer snapshot={snapshot} />
        </div>

        <div id="section-Impact">
          <ImpactMetrics snapshot={snapshot} />
        </div>

        {/* Footer */}
        <footer className="border-t border-border pt-8 text-center space-y-2">
          <p className="font-display text-lg font-bold text-foreground">OGI</p>
          <p className="font-mono-label text-og-muted">
            Data: ACLED · UCDP · World Bank · EIA &nbsp;|&nbsp; AI:
            meta-llama/llama-3.3-70b via OpenRouter
          </p>
          <p className="font-mono-label text-og-muted text-[10px]">
            Simulation for analytical purposes only · Probabilities are model
            estimates · Methodology is open source
          </p>
        </footer>
      </div>
    </div>
  );
};

export default ConflictPage;
