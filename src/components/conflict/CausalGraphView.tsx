import { useEffect, useRef, useState, useCallback } from "react";
import GlassCard from "@/components/GlassCard";
import * as d3Force from "d3-force";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import type { CausalGraphViewProps, CausalNode, CausalEdge, CausalNodeCategory } from "@/lib/schemas";
import { CAUSAL_NODE_COLORS, CAUSAL_NODE_RADIUS } from "@/lib/schemas";

// Extend CausalNode with d3 simulation props
interface SimNode extends CausalNode {
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
  vx?: number;
  vy?: number;
  index?: number;
}

interface SimEdge {
  source: string | SimNode;
  target: string | SimNode;
  strength: string;
  description?: string;
  relationship?: string;
}

const NODE_COLORS = CAUSAL_NODE_COLORS;
const NODE_RADIUS = CAUSAL_NODE_RADIUS;

const CausalGraphView: React.FC<CausalGraphViewProps> = ({ snapshot }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<SimNode[]>([]);
  const [edges, setEdges] = useState<SimEdge[]>([]);
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<SimNode | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
  const [isReady, setIsReady] = useState(false);
  const isDragging = useRef(false);
  const dragNode = useRef<SimNode | null>(null);
  const panStart = useRef<{ x: number; y: number } | null>(null);
  const simRef = useRef<d3Force.Simulation<SimNode, undefined> | null>(null);

  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth || 800;
        setDimensions({ width: w, height: 500 });
      }
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    if (!snapshot?.causal_graph) return;
    setIsReady(false);

    const g = snapshot.causal_graph;
    const simNodes: SimNode[] = (g.nodes || []).map((n) => ({
      ...n,
      x: dimensions.width / 2 + (Math.random() - 0.5) * 200,
      y: dimensions.height / 2 + (Math.random() - 0.5) * 200,
    }));
    const simEdges: SimEdge[] = (g.edges || []).map((e) => ({
      ...e,
      source: e.source,
      target: e.target,
    }));

    const sim = d3Force
      .forceSimulation<SimNode>(simNodes)
      .force("link", d3Force.forceLink<SimNode, any>(simEdges).id((d) => d.id).distance(100))
      .force("charge", d3Force.forceManyBody().strength(-300))
      .force("center", d3Force.forceCenter(dimensions.width / 2, dimensions.height / 2))
      .force("collision", d3Force.forceCollide().radius(30))
      .force("x", d3Force.forceX(dimensions.width / 2).strength(0.05))
      .force("y", d3Force.forceY(dimensions.height / 2).strength(0.05))
      .alphaDecay(0.02);

    simRef.current = sim;

    sim.on("tick", () => {
      setNodes([...simNodes]);
      setEdges([...simEdges]);
      setIsReady(true);
    });

    setNodes(simNodes);
    setEdges(simEdges);
    setIsReady(true);

    return () => { sim.stop(); };
  }, [snapshot?.causal_graph, dimensions]);

  const connectedIds = useCallback((nodeId: string) => {
    const ids = new Set<string>([nodeId]);
    edges.forEach((e) => {
      const sId = typeof e.source === "object" ? (e.source as SimNode)?.id : e.source;
      const tId = typeof e.target === "object" ? (e.target as SimNode)?.id : e.target;
      if (sId === nodeId) ids.add(tId);
      if (tId === nodeId) ids.add(sId);
    });
    return ids;
  }, [edges]);

  const handleZoomIn = useCallback(() => setTransform(p => ({ ...p, k: Math.min(3, p.k * 1.2) })), []);
  const handleZoomOut = useCallback(() => setTransform(p => ({ ...p, k: Math.max(0.3, p.k / 1.2) })), []);
  const handleReset = useCallback(() => setTransform({ x: 0, y: 0, k: 1 }), []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) return;
      e.preventDefault();
      e.stopPropagation();
      const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
      setTransform(prev => ({ ...prev, k: Math.max(0.3, Math.min(3, prev.k * scaleFactor)) }));
    };
    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as SVGElement).tagName === "svg" || (e.target as SVGElement).tagName === "rect") {
      panStart.current = { x: e.clientX - (transform?.x ?? 0), y: e.clientY - (transform?.y ?? 0) };
    }
  }, [transform]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (dragNode.current && simRef.current) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = (e.clientX - rect.left - (transform?.x ?? 0)) / (transform?.k ?? 1);
      const y = (e.clientY - rect.top - (transform?.y ?? 0)) / (transform?.k ?? 1);
      dragNode.current.fx = x;
      dragNode.current.fy = y;
      simRef.current.alpha(0.3).restart();
      return;
    }
    if (panStart.current) {
      setTransform(prev => ({ ...prev, x: e.clientX - panStart.current!.x, y: e.clientY - panStart.current!.y }));
    }
  }, [transform]);

  const handleMouseUp = useCallback(() => {
    panStart.current = null;
    if (dragNode.current) {
      dragNode.current.fx = null;
      dragNode.current.fy = null;
      dragNode.current = null;
    }
  }, []);

  const startDragNode = useCallback((e: React.MouseEvent, node: SimNode) => {
    e.stopPropagation();
    dragNode.current = node;
    if (simRef.current) simRef.current.alphaTarget(0.3).restart();
  }, []);

  if (!snapshot?.causal_graph) {
    return (
      <div className="space-y-4">
        <div className="border-b border-border pb-2">
          <h2 className="font-display text-2xl font-bold text-foreground">CAUSAL ANALYSIS</h2>
          <p className="text-sm text-muted-foreground">How actions propagate through the system</p>
        </div>
        <GlassCard className="text-center py-12">
          <p className="font-mono-label text-og-muted">ANALYSIS PENDING</p>
        </GlassCard>
      </div>
    );
  }

  const highlightSet = hovered ? connectedIds(hovered) : null;

  const renderEdge = (e: SimEdge, i: number) => {
    const sx = typeof e.source === "object" ? ((e.source as SimNode)?.x ?? 0) : 0;
    const sy = typeof e.source === "object" ? ((e.source as SimNode)?.y ?? 0) : 0;
    const tx = typeof e.target === "object" ? ((e.target as SimNode)?.x ?? 0) : 0;
    const ty = typeof e.target === "object" ? ((e.target as SimNode)?.y ?? 0) : 0;
    const sId = typeof e.source === "object" ? (e.source as SimNode)?.id : e.source;
    const tId = typeof e.target === "object" ? (e.target as SimNode)?.id : e.target;
    if (sx === 0 && sy === 0 && tx === 0 && ty === 0) return null;
    const visible = !highlightSet || (highlightSet.has(sId) && highlightSet.has(tId));
    const strokeW = e.strength === "strong" ? 2 : e.strength === "moderate" ? 1.5 : 1;
    const dash = e.strength === "moderate" ? "4,4" : e.strength === "weak" ? "2,4" : undefined;

    return (
      <line key={i} x1={sx} y1={sy} x2={tx} y2={ty}
        stroke="rgba(255,255,255,0.2)" strokeWidth={strokeW} strokeDasharray={dash}
        opacity={visible ? 1 : 0.1}
        markerEnd={e.strength === "strong" ? "url(#arrow)" : undefined}
        style={{ transition: "opacity 0.2s" }}
      />
    );
  };

  return (
    <div className="space-y-4">
      <div className="border-b border-border pb-2">
        <h2 className="font-display text-2xl font-bold text-foreground">CAUSAL ANALYSIS</h2>
        <p className="text-sm text-muted-foreground">How actions propagate through the system · Scroll to zoom · Drag to pan</p>
      </div>

      <div className="flex gap-4">
        <GlassCard className="flex-1 p-0 overflow-hidden relative" ref={containerRef}>
          <div className="absolute top-3 right-3 z-10 flex flex-col gap-1">
            <button onClick={handleZoomIn} className="p-2 rounded-md bg-surface/90 hover:bg-surface border border-border text-og-secondary hover:text-foreground transition-colors" title="Zoom In"><ZoomIn className="w-4 h-4" /></button>
            <button onClick={handleZoomOut} className="p-2 rounded-md bg-surface/90 hover:bg-surface border border-border text-og-secondary hover:text-foreground transition-colors" title="Zoom Out"><ZoomOut className="w-4 h-4" /></button>
            <button onClick={handleReset} className="p-2 rounded-md bg-surface/90 hover:bg-surface border border-border text-og-secondary hover:text-foreground transition-colors" title="Reset View"><RotateCcw className="w-4 h-4" /></button>
          </div>
          <div className="absolute bottom-3 right-3 z-10">
            <span className="font-mono-label text-xs text-og-secondary bg-surface/90 px-2 py-1 rounded border border-border">
              {Math.round((transform?.k ?? 1) * 100)}%
            </span>
          </div>

          <svg ref={svgRef} width={dimensions.width} height={dimensions.height}
            style={{ cursor: panStart.current ? "grabbing" : "grab" }}
            onMouseDown={handleMouseDown} onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
            <rect width={dimensions.width} height={dimensions.height} fill="transparent" />
            <defs>
              <marker id="arrow" viewBox="0 0 10 6" refX="10" refY="3" markerWidth="8" markerHeight="6" orient="auto">
                <path d="M0,0 L10,3 L0,6" fill="rgba(255,255,255,0.3)" />
              </marker>
            </defs>
            <g transform={`translate(${transform?.x ?? 0},${transform?.y ?? 0}) scale(${transform?.k ?? 1})`}>
              {isReady && edges.map((e, i) => renderEdge(e, i))}
              {isReady && nodes.map((n) => {
                const r = NODE_RADIUS[n.category as CausalNodeCategory] || 8;
                const color = NODE_COLORS[n.category as CausalNodeCategory] || "#888";
                const visible = !highlightSet || highlightSet.has(n.id);
                if (n.x === undefined || n.y === undefined) return null;
                return (
                  <g key={n.id} transform={`translate(${n.x},${n.y})`}
                    style={{ cursor: "grab", transition: "opacity 0.2s" }}
                    opacity={visible ? 1 : 0.1}
                    onMouseEnter={() => setHovered(n.id)} onMouseLeave={() => setHovered(null)}
                    onClick={() => setSelected(n)} onMouseDown={(e) => startDragNode(e, n)}>
                    <circle r={r} fill={color} />
                    {hovered === n.id && <circle r={r + 4} fill="none" stroke={color} strokeWidth={1} opacity={0.4} />}
                    <text y={r + 14} textAnchor="middle" fill="hsl(var(--text-secondary))" fontSize={10} fontFamily="JetBrains Mono">
                      {n.label?.slice(0, 20)}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
        </GlassCard>

        {selected && (
          <GlassCard className="w-72 shrink-0 hidden md:block">
            <button onClick={() => setSelected(null)} className="font-mono-label text-og-muted text-[10px] float-right">CLOSE</button>
            <div className="w-4 h-4 rounded-full mb-2" style={{ background: NODE_COLORS[selected.category as CausalNodeCategory] }} />
            <span className="font-mono-label text-og-secondary text-[10px]">{selected.category?.toUpperCase()}</span>
            <h3 className="font-display text-lg font-bold text-foreground mt-1 mb-2">{selected.label}</h3>
            <p className="text-sm text-muted-foreground mb-3">{selected.description}</p>
            <span className="font-mono-label text-og-muted text-[10px] block mb-1">CONNECTIONS</span>
            {edges.filter(e => {
              const sId = typeof e.source === "object" ? (e.source as SimNode)?.id : e.source;
              const tId = typeof e.target === "object" ? (e.target as SimNode)?.id : e.target;
              return sId === selected.id || tId === selected.id;
            }).map((e, i) => {
              const sId = typeof e.source === "object" ? (e.source as SimNode)?.id : e.source;
              const tId = typeof e.target === "object" ? (e.target as SimNode)?.id : e.target;
              const other = sId === selected.id ? tId : sId;
              const otherNode = nodes.find(n => n.id === other);
              return <p key={i} className="text-xs text-muted-foreground">{sId === selected.id ? "→" : "←"} {otherNode?.label || other}</p>;
            })}
          </GlassCard>
        )}
      </div>

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
