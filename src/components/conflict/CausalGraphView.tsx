import { useEffect, useRef, useState, useCallback } from "react";
import GlassCard from "@/components/GlassCard";
import * as d3Force from "d3-force";
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";

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
  const containerRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<any[]>([]);
  const [edges, setEdges] = useState<any[]>([]);
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<any>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const update = () => {
      const w = containerRef.current?.clientWidth || 800;
      setDimensions({ width: w, height: 500 });
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    if (!snapshot?.causal_graph) return;
    const g = snapshot.causal_graph;
    const simNodes = (g.nodes || []).map((n: any, i: number) => ({
      ...n,
      x: dimensions.width / 2 + (Math.random() - 0.5) * 200,
      y: dimensions.height / 2 + (Math.random() - 0.5) * 200,
    }));
    const simEdges = (g.edges || []).map((e: any) => ({
      ...e,
      source: e.source,
      target: e.target,
    }));

    const sim = d3Force
      .forceSimulation(simNodes)
      .force(
        "link",
        d3Force
          .forceLink(simEdges)
          .id((d: any) => d.id)
          .distance(100),
      )
      .force("charge", d3Force.forceManyBody().strength(-300))
      .force(
        "center",
        d3Force.forceCenter(dimensions.width / 2, dimensions.height / 2),
      )
      .force("collision", d3Force.forceCollide().radius(30))
      .force("x", d3Force.forceX(dimensions.width / 2).strength(0.05))
      .force("y", d3Force.forceY(dimensions.height / 2).strength(0.05))
      .alphaDecay(0.02);

    simRef.current = sim;

    sim.on("tick", () => {
      setNodes([...simNodes]);
      setEdges([...simEdges]);
    });

    return () => {
      sim.stop();
    };
  }, [snapshot?.causal_graph, dimensions]);

  const connectedIds = useCallback(
    (nodeId: string) => {
      const ids = new Set<string>([nodeId]);
      edges.forEach((e: any) => {
        const sId = typeof e.source === "object" ? e.source.id : e.source;
        const tId = typeof e.target === "object" ? e.target.id : e.target;
        if (sId === nodeId) ids.add(tId);
        if (tId === nodeId) ids.add(sId);
      });
      return ids;
    },
    [edges],
  );

  const handleZoomIn = () => {
    setScale((s) => Math.min(s + 0.25, 3));
  };

  const handleZoomOut = () => {
    setScale((s) => Math.max(s - 0.25, 0.5));
  };

  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setScale((s) => Math.max(0.5, Math.min(3, s + delta)));
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  if (!snapshot?.causal_graph) {
    return (
      <div className="space-y-4">
        <div className="border-b border-border pb-2">
          <h2 className="font-display text-2xl font-bold text-foreground">
            CAUSAL RIPPLE ANALYSIS
          </h2>
          <p className="text-sm text-muted-foreground">
            How actions propagate through the system
          </p>
        </div>
        <GlassCard className="text-center py-12">
          <p className="font-mono-label text-og-muted">ANALYSIS PENDING</p>
        </GlassCard>
      </div>
    );
  }

  const highlightSet = hovered ? connectedIds(hovered) : null;

  return (
    <div className="space-y-4">
      <div className="border-b border-border pb-2">
        <h2 className="font-display text-2xl font-bold text-foreground">
          CAUSAL RIPPLE ANALYSIS
        </h2>
        <p className="text-sm text-muted-foreground">
          How actions propagate through the system
        </p>
      </div>

      <div className="flex gap-4" ref={containerRef}>
        <GlassCard className="flex-1 p-0 overflow-hidden relative">
          {/* Zoom controls */}
          <div className="absolute top-3 right-3 z-10 flex flex-col gap-1">
            <button
              onClick={handleZoomIn}
              className="p-2 rounded-md bg-surface/80 hover:bg-surface text-og-secondary hover:text-foreground transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-2 rounded-md bg-surface/80 hover:bg-surface text-og-secondary hover:text-foreground transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleReset}
              className="p-2 rounded-md bg-surface/80 hover:bg-surface text-og-secondary hover:text-foreground transition-colors"
              title="Reset View"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>

          {/* Scale indicator */}
          <div className="absolute bottom-3 right-3 z-10">
            <span className="font-mono-label text-xs text-og-secondary bg-surface/80 px-2 py-1 rounded">
              {Math.round(scale * 100)}%
            </span>
          </div>

          <div
            ref={containerRef}
            className="overflow-hidden cursor-grab active:cursor-grabbing"
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ touchAction: "none" }}
          >
            <svg
              ref={svgRef}
              width={dimensions.width}
              height={dimensions.height}
              style={{
                transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
                transformOrigin: "center center",
                transition: isDragging ? "none" : "transform 0.1s ease-out",
              }}
            >
              <defs>
                <marker
                  id="arrow"
                  viewBox="0 0 10 6"
                  refX="10"
                  refY="3"
                  markerWidth="8"
                  markerHeight="6"
                  orient="auto"
                >
                  <path d="M0,0 L10,3 L0,6" fill="rgba(255,255,255,0.3)" />
                </marker>
              </defs>
              {edges.map((e: any, i: number) => {
                const sx = typeof e.source === "object" ? e.source.x : 0;
                const sy = typeof e.source === "object" ? e.source.y : 0;
                const tx = typeof e.target === "object" ? e.target.x : 0;
                const ty = typeof e.target === "object" ? e.target.y : 0;
                const sId =
                  typeof e.source === "object" ? e.source.id : e.source;
                const tId =
                  typeof e.target === "object" ? e.target.id : e.target;
                const visible =
                  !highlightSet ||
                  (highlightSet.has(sId) && highlightSet.has(tId));
                const strokeW =
                  e.strength === "strong"
                    ? 2
                    : e.strength === "moderate"
                      ? 1.5
                      : 1;
                const dash =
                  e.strength === "moderate"
                    ? "4,4"
                    : e.strength === "weak"
                      ? "2,4"
                      : undefined;
                return (
                  <line
                    key={i}
                    x1={sx}
                    y1={sy}
                    x2={tx}
                    y2={ty}
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth={strokeW}
                    strokeDasharray={dash}
                    opacity={visible ? 1 : 0.1}
                    markerEnd={
                      e.strength === "strong" ? "url(#arrow)" : undefined
                    }
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
          </div>
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
            <h3 className="font-display text-lg font-bold text-foreground mt-1 mb-2">
              {selected.label}
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              {selected.description}
            </p>
            <span className="font-mono-label text-og-muted text-[10px] block mb-1">
              CONNECTIONS
            </span>
            {edges
              .filter((e: any) => {
                const sId =
                  typeof e.source === "object" ? e.source.id : e.source;
                const tId =
                  typeof e.target === "object" ? e.target.id : e.target;
                return sId === selected.id || tId === selected.id;
              })
              .map((e: any, i: number) => {
                const sId =
                  typeof e.source === "object" ? e.source.id : e.source;
                const tId =
                  typeof e.target === "object" ? e.target.id : e.target;
                const other = sId === selected.id ? tId : sId;
                const otherNode = nodes.find((n: any) => n.id === other);
                return (
                  <p key={i} className="text-xs text-muted-foreground">
                    {sId === selected.id ? "→" : "←"}{" "}
                    {otherNode?.label || other}
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
            <span className="font-mono-label text-og-muted text-[10px]">
              {k.toUpperCase()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CausalGraphView;
