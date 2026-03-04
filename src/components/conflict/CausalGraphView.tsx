import { useEffect, useRef, useState, useCallback } from "react";
import GlassCard from "@/components/GlassCard";
import * as d3Force from "d3-force";

interface CausalGraphViewProps {
  snapshot: any;
}

const NODE_COLORS: Record<string, string> = {
  actor: "#e8c547",
  event: "#ff4444",
  effect: "#4488ff",
  variable: "#888899",
};

const NODE_RADIUS: Record<string, number> = {
  actor: 18,
  event: 12,
  effect: 10,
  variable: 8,
};

const CausalGraphView = ({ snapshot }: CausalGraphViewProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [nodes, setNodes] = useState<any[]>([]);
  const [edges, setEdges] = useState<any[]>([]);
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<any>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });

  useEffect(() => {
    const update = () => {
      const w = svgRef.current?.parentElement?.clientWidth || 800;
      setDimensions({ width: w, height: 500 });
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    if (!snapshot?.causal_graph) return;
    const g = snapshot.causal_graph;
    const simNodes = (g.nodes || []).map((n: any) => ({ ...n, x: dimensions.width / 2, y: dimensions.height / 2 }));
    const simEdges = (g.edges || []).map((e: any) => ({ ...e, source: e.source, target: e.target }));

    const sim = d3Force.forceSimulation(simNodes)
      .force("link", d3Force.forceLink(simEdges).id((d: any) => d.id).distance(80))
      .force("charge", d3Force.forceManyBody().strength(-200))
      .force("center", d3Force.forceCenter(dimensions.width / 2, dimensions.height / 2))
      .force("collision", d3Force.forceCollide().radius(25));

    sim.on("tick", () => {
      setNodes([...simNodes]);
      setEdges([...simEdges]);
    });

    return () => { sim.stop(); };
  }, [snapshot?.causal_graph, dimensions]);

  const connectedIds = useCallback((nodeId: string) => {
    const ids = new Set<string>([nodeId]);
    edges.forEach((e: any) => {
      const sId = typeof e.source === "object" ? e.source.id : e.source;
      const tId = typeof e.target === "object" ? e.target.id : e.target;
      if (sId === nodeId) ids.add(tId);
      if (tId === nodeId) ids.add(sId);
    });
    return ids;
  }, [edges]);

  if (!snapshot?.causal_graph) {
    return (
      <div className="space-y-4">
        <h2 className="font-mono-label text-og-secondary">CAUSAL RIPPLE ANALYSIS</h2>
        <GlassCard className="text-center py-12">
          <p className="font-mono-label text-og-muted">ANALYSIS PENDING</p>
        </GlassCard>
      </div>
    );
  }

  const highlightSet = hovered ? connectedIds(hovered) : null;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-mono-label text-og-secondary">CAUSAL RIPPLE ANALYSIS</h2>
        <p className="text-sm text-muted-foreground">How actions propagate through the system</p>
      </div>

      <div className="flex gap-4">
        <GlassCard className="flex-1 p-0 overflow-hidden relative">
          <svg ref={svgRef} width={dimensions.width} height={dimensions.height}>
            <defs>
              <marker id="arrow" viewBox="0 0 10 6" refX="10" refY="3" markerWidth="8" markerHeight="6" orient="auto">
                <path d="M0,0 L10,3 L0,6" fill="rgba(255,255,255,0.3)" />
              </marker>
            </defs>
            {edges.map((e: any, i: number) => {
              const sx = typeof e.source === "object" ? e.source.x : 0;
              const sy = typeof e.source === "object" ? e.source.y : 0;
              const tx = typeof e.target === "object" ? e.target.x : 0;
              const ty = typeof e.target === "object" ? e.target.y : 0;
              const sId = typeof e.source === "object" ? e.source.id : e.source;
              const tId = typeof e.target === "object" ? e.target.id : e.target;
              const visible = !highlightSet || (highlightSet.has(sId) && highlightSet.has(tId));
              const strokeW = e.strength === "strong" ? 2 : e.strength === "moderate" ? 1.5 : 1;
              const dash = e.strength === "moderate" ? "4,4" : e.strength === "weak" ? "2,4" : undefined;
              return (
                <line
                  key={i}
                  x1={sx} y1={sy} x2={tx} y2={ty}
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth={strokeW}
                  strokeDasharray={dash}
                  opacity={visible ? 1 : 0.1}
                  markerEnd={e.strength === "strong" ? "url(#arrow)" : undefined}
                  style={{ transition: "opacity 0.2s" }}
                />
              );
            })}
            {nodes.map((n: any) => {
              const r = NODE_RADIUS[n.category] || 8;
              const color = NODE_COLORS[n.category] || "#888";
              const visible = !highlightSet || highlightSet.has(n.id);
              return (
                <g
                  key={n.id}
                  transform={`translate(${n.x},${n.y})`}
                  style={{ cursor: "pointer", transition: "opacity 0.2s" }}
                  opacity={visible ? 1 : 0.1}
                  onMouseEnter={() => setHovered(n.id)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => setSelected(n)}
                >
                  <circle r={r} fill={color} />
                  <text
                    y={r + 14}
                    textAnchor="middle"
                    fill="hsl(var(--text-secondary))"
                    fontSize={10}
                    fontFamily="JetBrains Mono"
                  >
                    {n.label?.slice(0, 20)}
                  </text>
                </g>
              );
            })}
          </svg>
        </GlassCard>

        {/* Detail panel */}
        {selected && (
          <GlassCard className="w-72 shrink-0 hidden md:block">
            <button
              onClick={() => setSelected(null)}
              className="font-mono-label text-og-muted text-[10px] float-right"
            >
              CLOSE
            </button>
            <div
              className="w-4 h-4 rounded-full mb-2"
              style={{ background: NODE_COLORS[selected.category] }}
            />
            <span className="font-mono-label text-og-secondary text-[10px]">
              {selected.category?.toUpperCase()}
            </span>
            <h3 className="font-display text-lg font-bold text-foreground mt-1 mb-2">{selected.label}</h3>
            <p className="text-sm text-muted-foreground mb-3">{selected.description}</p>
            <span className="font-mono-label text-og-muted text-[10px] block mb-1">CONNECTIONS</span>
            {edges
              .filter((e: any) => {
                const sId = typeof e.source === "object" ? e.source.id : e.source;
                const tId = typeof e.target === "object" ? e.target.id : e.target;
                return sId === selected.id || tId === selected.id;
              })
              .map((e: any, i: number) => {
                const sId = typeof e.source === "object" ? e.source.id : e.source;
                const tId = typeof e.target === "object" ? e.target.id : e.target;
                const other = sId === selected.id ? tId : sId;
                const otherNode = nodes.find((n: any) => n.id === other);
                return (
                  <p key={i} className="text-xs text-muted-foreground">
                    {sId === selected.id ? "→" : "←"} {otherNode?.label || other}
                  </p>
                );
              })}
          </GlassCard>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4">
        {Object.entries(NODE_COLORS).map(([k, c]) => (
          <div key={k} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full" style={{ background: c }} />
            <span className="font-mono-label text-og-muted text-[10px]">{k.toUpperCase()}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CausalGraphView;
