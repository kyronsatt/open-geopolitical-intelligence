import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import NavBar from "@/components/NavBar";
import GlassCard from "@/components/GlassCard";
import { seedIfEmpty } from "@/lib/seed";
import { supabase } from "@/integrations/supabase/client";
import type { Conflict } from "@/lib/schemas";

// Type for capital city data
interface CapitalCity {
  label: string;
  lat: number;
  lng: number;
}

// Type for GeoJSON features
interface GeoJSONFeature {
  type: string;
  properties: { name: string };
  geometry: { type: string; coordinates: number[][] | number[][][] };
}

// Known capital coordinates for arc rendering
const CAPITAL_COORDS: Record<string, { lat: number; lng: number }> = {
  US: { lat: 38.9, lng: -77 },
  IR: { lat: 35.7, lng: 51.4 },
  IL: { lat: 31.8, lng: 35.2 },
  RU: { lat: 55.75, lng: 37.6 },
  UA: { lat: 50.45, lng: 30.5 },
  CN: { lat: 39.9, lng: 116.4 },
  TW: { lat: 25.03, lng: 121.5 },
  SA: { lat: 24.7, lng: 46.7 },
  YE: { lat: 15.4, lng: 44.2 },
  LB: { lat: 33.9, lng: 35.5 },
  IQ: { lat: 33.3, lng: 44.4 },
  KP: { lat: 39.0, lng: 125.75 },
  KR: { lat: 37.57, lng: 127.0 },
  IN: { lat: 28.6, lng: 77.2 },
  PK: { lat: 33.7, lng: 73.1 },
};

const Index = () => {
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const GlobeRef = useRef<any>(null);
  const [GlobeComponent, setGlobeComponent] = useState<any>(null);
  const [geoJson, setGeoJson] = useState<{ features: GeoJSONFeature[] } | null>(null);
  const [capitals, setCapitals] = useState<CapitalCity[]>([]);

  // Seed + fetch all conflicts
  useEffect(() => {
    seedIfEmpty().then(() => {
      supabase.from('conflicts').select('*').then(({ data }) => {
        setConflicts((data || []) as unknown as Conflict[]);
        setLoading(false);
      });
    });
  }, []);

  useEffect(() => {
    import("react-globe.gl").then((mod) => setGlobeComponent(() => mod.default));
  }, []);

  useEffect(() => {
    fetch("/worldcities.csv")
      .then((res) => res.text())
      .then((text) => {
        const rows = text.split("\n").slice(1);
        const parsed = rows.map((row) => {
          const cols = row.split(",");
          if (cols.length < 4) return null;
          return { label: cols[1], lat: parseFloat(cols[2]), lng: parseFloat(cols[3]) };
        }).filter(Boolean) as CapitalCity[];
        setCapitals(parsed);
      });
  }, []);

  useEffect(() => {
    fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
      .then((r) => r.json())
      .then((topology) => {
        import("topojson-client").then((topojsonClient) => {
          const countries = topojsonClient.feature(topology, topology.objects.countries) as any;
          setGeoJson(countries);
        });
      });
  }, []);

  const goToConflict = useCallback((conflict: Conflict) => {
    navigate(`/conflict/${conflict.id}`);
  }, [navigate]);

  // Build arcs dynamically from all conflicts' actors
  const arcsData = conflicts.flatMap((c) => {
    const actorCoords = c.actors
      .map(a => CAPITAL_COORDS[a.country_code])
      .filter(Boolean);
    const arcs: any[] = [];
    for (let i = 0; i < actorCoords.length - 1; i++) {
      for (let j = i + 1; j < actorCoords.length; j++) {
        arcs.push({
          startLat: actorCoords[i].lat,
          startLng: actorCoords[i].lng,
          endLat: actorCoords[j].lat,
          endLng: actorCoords[j].lng,
          color: ["hsl(0,100%,63%)", "hsl(0,100%,63%)"],
        });
      }
    }
    return arcs;
  });

  // Build points from all actors across conflicts
  const pointsData = conflicts.flatMap((c) =>
    c.actors
      .filter(a => CAPITAL_COORDS[a.country_code])
      .map(a => ({
        lat: CAPITAL_COORDS[a.country_code].lat,
        lng: CAPITAL_COORDS[a.country_code].lng,
        size: 0.6,
        color: "hsl(0,100%,63%)",
        label: a.name,
      }))
  );

  // Status badge helper
  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('escalat')) return { label: 'ESCALATING', cls: 'bg-red-dim text-red-vivid animate-pulse-glow' };
    if (s.includes('de-escalat')) return { label: 'DE-ESCALATING', cls: 'bg-og-green/20 text-og-green' };
    if (s.includes('stable')) return { label: 'STABLE', cls: 'bg-og-green/20 text-og-green' };
    if (s.includes('frozen')) return { label: 'FROZEN', cls: 'bg-blue-vivid/20 text-blue-vivid' };
    return { label: 'ACTIVE', cls: 'bg-red-dim text-red-vivid' };
  };

  const firstConflictId = conflicts[0]?.id || null;

  return (
    <div className="relative min-h-screen bg-base overflow-visible">
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at center, rgba(232,197,71,0.03) 0%, transparent 70%)" }} />

      <NavBar conflictId={firstConflictId} />

      {/* Globe */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 1 }}
        className="absolute inset-0 flex items-center justify-center">
        {GlobeComponent && (
          <GlobeComponent
            ref={GlobeRef}
            globeImageUrl="https://unpkg.com/three-globe/example/img/earth-dark.jpg"
            backgroundColor="rgb(8,8,16)"
            showAtmosphere={true}
            atmosphereColor="rgb(232,197,71)"
            atmosphereAltitude={0.15}
            width={window.innerWidth}
            height={window.innerHeight}
            polygonsData={geoJson?.features || []}
            polygonCapColor={() => "rgba(0,0,0,0)"}
            polygonSideColor={() => "rgba(232,197,71,0.3)"}
            polygonStrokeColor={() => "rgba(232,197,71,0.1)"}
            polygonAltitude={0.001}
            polygonLabel={(d: any) => `<div style="background:rgba(14,14,26,0.95);padding:6px 10px;border-radius:8px;color:rgb(232,197,71);font-size:13px;">${d.properties?.name || ''}</div>`}
            onPolygonClick={() => firstConflictId && navigate(`/conflict/${firstConflictId}`)}
            pointsData={capitals}
            pointAltitude={0.001}
            pointRadius={0.25}
            pointColor={() => "rgb(232,197,71)"}
            pointLabel="label"
            onPointClick={() => firstConflictId && navigate(`/conflict/${firstConflictId}`)}
            arcsData={arcsData}
            arcColor={() => "hsl(0,100%,63%)"}
            arcStroke={0.2}
            arcAltitude={0.25}
            arcAltitudeAutoScale={0.6}
            arcDashLength={0.005}
            arcDashGap={0.01}
            arcDashAnimateTime={7000}
            enablePointerInteraction={true}
          />
        )}
      </motion.div>

      {/* Bottom left — dynamic conflict list */}
      <motion.div initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: loading ? 0 : 1, y: loading ? 30 : 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="absolute bottom-8 left-8 z-10 max-w-sm space-y-2">
        <span className="font-mono-label text-og-secondary block mb-1 px-1">MONITORED CONFLICTS</span>
        {conflicts.map((c) => {
          const badge = getStatusBadge(c.status);
          const pct = Math.round((c.intensity || 0) * 100);
          const actorFlags = c.actors.map(a => a.flag).join(' ');
          const actorNames = c.actors.map(a => a.country_code).join('–');
          return (
            <GlassCard key={c.id} className="cursor-pointer" onClick={() => goToConflict(c)}>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-lg">{actorFlags} {actorNames}</span>
                <span className={`font-mono-label px-2 py-0.5 rounded text-[10px] ${badge.cls}`}>
                  {badge.label}
                </span>
              </div>
              <div className="w-full h-1 rounded-full bg-surface overflow-visible">
                <motion.div className="h-full rounded-full" style={{ background: "hsl(var(--red-vivid))" }}
                  initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                  transition={{ delay: 0.8, duration: 1 }} />
              </div>
              <span className="font-mono-label text-og-muted mt-1 block text-[10px]">INTENSITY {pct}%</span>
            </GlassCard>
          );
        })}
      </motion.div>

      {/* Bottom right — featured */}
      {conflicts.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: loading ? 0 : 1, y: loading ? 30 : 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="absolute bottom-8 right-8 z-10 max-w-xs">
          <GlassCard className="cursor-pointer" onClick={() => goToConflict(conflicts[0])}>
            <span className="font-mono-label text-og-secondary block mb-2">FEATURED ANALYSIS</span>
            <h3 className="font-display text-lg font-bold text-foreground mb-2">
              {conflicts[0].name} Dynamics
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              {conflicts[0].summary?.slice(0, 120)}...
            </p>
            <button className="font-mono-label text-accent-color hover:underline">VIEW ANALYSIS →</button>
          </GlassCard>
        </motion.div>
      )}
    </div>
  );
};

export default Index;
