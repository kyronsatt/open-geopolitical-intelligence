import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import NavBar from "@/components/NavBar";
import GlassCard from "@/components/GlassCard";
import { seedIfEmpty } from "@/lib/seed";

const Index = () => {
  const [conflictId, setConflictId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const globeRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const GlobeRef = useRef<any>(null);
  const [GlobeComponent, setGlobeComponent] = useState<any>(null);

  useEffect(() => {
    seedIfEmpty().then(id => {
      setConflictId(id);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    import("react-globe.gl").then(mod => {
      setGlobeComponent(() => mod.default);
    });
  }, []);

  const goToConflict = useCallback(() => {
    if (conflictId) navigate(`/conflict/${conflictId}`);
  }, [conflictId, navigate]);

  const arcsData = [
    {
      startLat: 38.9,
      startLng: -77,
      endLat: 32.4,
      endLng: 53.7,
      color: ["hsl(0,100%,63%)", "hsl(0,100%,63%)"],
    },
  ];

  const pointsData = [
    { lat: 38.9, lng: -77, size: 0.6, color: "hsl(0,100%,63%)", label: "Washington DC" },
    { lat: 32.4, lng: 53.7, size: 0.6, color: "hsl(0,100%,63%)", label: "Tehran" },
  ];

  return (
    <div className="relative min-h-screen bg-base overflow-hidden">
      {/* Radial gradient bg */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, rgba(232,197,71,0.03) 0%, transparent 70%)",
        }}
      />

      <NavBar conflictId={conflictId} />

      {/* Globe */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 1 }}
        className="absolute inset-0 flex items-center justify-center"
      >
        {GlobeComponent && (
          <GlobeComponent
            ref={GlobeRef}
            globeImageUrl=""
            backgroundColor="rgba(0,0,0,0)"
            showGlobe={true}
            showAtmosphere={true}
            atmosphereColor="rgba(232,197,71,0.08)"
            atmosphereAltitude={0.15}
            globeMaterial={undefined}
            width={typeof window !== 'undefined' ? Math.min(window.innerWidth, 800) : 800}
            height={typeof window !== 'undefined' ? Math.min(window.innerHeight, 800) : 800}
            arcsData={arcsData}
            arcColor="color"
            arcDashLength={0.4}
            arcDashGap={0.2}
            arcDashAnimateTime={2000}
            arcStroke={1.5}
            pointsData={pointsData}
            pointAltitude={0.01}
            pointRadius="size"
            pointColor="color"
            pointLabel="label"
            onPointClick={goToConflict}
            onArcClick={goToConflict}
            enablePointerInteraction={true}
          />
        )}
      </motion.div>

      {/* Bottom left panel */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: loading ? 0 : 1, y: loading ? 30 : 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="absolute bottom-8 left-8 z-10 max-w-xs"
      >
        <GlassCard className="cursor-pointer" onClick={goToConflict}>
          <span className="font-mono-label text-og-secondary block mb-3">MONITORED CONFLICTS</span>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-lg">🇺🇸 USA — 🇮🇷 IRAN</span>
            <span className="font-mono-label px-2 py-0.5 rounded bg-red-dim text-red-vivid animate-pulse-glow">
              ESCALATING
            </span>
          </div>
          <div className="w-full h-1 rounded-full bg-surface overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: "hsl(var(--red-vivid))" }}
              initial={{ width: 0 }}
              animate={{ width: "82%" }}
              transition={{ delay: 0.8, duration: 1 }}
            />
          </div>
          <span className="font-mono-label text-og-muted mt-1 block">INTENSITY 82%</span>
        </GlassCard>
      </motion.div>

      {/* Bottom right panel */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: loading ? 0 : 1, y: loading ? 30 : 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="absolute bottom-8 right-8 z-10 max-w-xs"
      >
        <GlassCard className="cursor-pointer" onClick={goToConflict}>
          <span className="font-mono-label text-og-secondary block mb-2">FEATURED ANALYSIS</span>
          <h3 className="font-display text-lg font-bold text-foreground mb-2">
            US–Iran Escalation Dynamics
          </h3>
          <p className="text-sm text-muted-foreground mb-3">
            Multi-domain analysis of the latest escalation cycle.
          </p>
          <button className="font-mono-label text-accent-color hover:underline">
            VIEW ANALYSIS →
          </button>
        </GlassCard>
      </motion.div>
    </div>
  );
};

export default Index;
