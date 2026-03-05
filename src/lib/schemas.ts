/**
 * OGI - Open Geopolitical Intelligence
 * Core type definitions for the application
 * 
 * This file contains all the type definitions for:
 * - Supabase database tables
 * - AI-generated analysis structures (briefing, causal graph, impact, pathways)
 * - Component props and state types
 */

// ============================================================================
// ENUMS
// ============================================================================

/** Conflict status categories */
export type ConflictStatus = 
  | 'escalating' 
  | 'de-escalating' 
  | 'stable' 
  | 'frozen' 
  | 'stalemate'
  | 'active';

/** Conflict category types */
export type ConflictCategory = 
  | 'hybrid' 
  | 'military' 
  | 'economic' 
  | 'proxy' 
  | 'cyber' 
  | 'diplomatic';

/** Timeline event significance levels */
export type EventSignificance = 'critical' | 'high' | 'medium' | 'low';

/** Timeline event categories */
export type EventCategory = 'military' | 'diplomatic' | 'economic' | 'political';

/** Confidence levels for AI analysis */
export type ConfidenceLevel = 'high' | 'medium' | 'low';

/** Risk levels for policy pathways */
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

/** Actor roles in a conflict */
export type ActorRole = 'primary' | 'secondary' | 'proxy' | 'mediator';

/** Causal graph node categories */
export type CausalNodeCategory = 'actor' | 'event' | 'effect' | 'variable';

/** Causal edge strength */
export type CausalEdgeStrength = 'strong' | 'moderate' | 'weak';

/** Trend direction for metrics */
export type TrendDirection = 'up' | 'down' | 'stable' | 'increasing' | 'decreasing';

// ============================================================================
// CORE ENTITY INTERFACES
// ============================================================================

/** A source reference for events or analysis */
export interface Source {
  name: string;
  url?: string;
}

/** An actor (country, organization, group) involved in a conflict */
export interface ConflictActor {
  name: string;
  role: ActorRole;
  country_code: string;
  flag: string;
  interests: string[];
  red_lines: string[];
}

// ============================================================================
// SUPABASE TABLE ROWS
// ============================================================================

/** Database row for conflicts table */
export interface Conflict {
  id: string;
  name: string;
  category: ConflictCategory;
  status: ConflictStatus;
  intensity: number; // 0-1 scale
  summary: string | null;
  tags: string[] | null;
  actors: ConflictActor[];
  start_date: string | null;
  created_at: string | null;
}

/** Insert payload for conflicts */
export interface ConflictInsert {
  name: string;
  category: ConflictCategory;
  status: ConflictStatus;
  intensity: number;
  summary?: string | null;
  tags?: string[] | null;
  actors: ConflictActor;
  start_date?: string | null;
}

/** Update payload for conflicts */
export interface ConflictUpdate {
  name?: string;
  category?: ConflictCategory;
  status?: ConflictStatus;
  intensity?: number;
  summary?: string | null;
  tags?: string[] | null;
  actors?: ConflictActor[];
  start_date?: string | null;
}

/** Database row for timeline_events table */
export interface TimelineEvent {
  id: string;
  conflict_id: string | null;
  title: string;
  description: string;
  date: string;
  category: EventCategory;
  significance: EventSignificance;
  sources: Source[] | null;
  created_at: string | null;
}

/** Insert payload for timeline_events */
export interface TimelineEventInsert {
  conflict_id?: string | null;
  title: string;
  description: string;
  date: string;
  category: EventCategory;
  significance: EventSignificance;
  sources?: Source[] | null;
}

/** Update payload for timeline_events */
export interface TimelineEventUpdate {
  title?: string;
  description?: string;
  date?: string;
  category?: EventCategory;
  significance?: EventSignificance;
  sources?: Source[] | null;
}

// ============================================================================
// AI-GENERATED ANALYSIS STRUCTURES
// ============================================================================

/** Military posture information for a side */
export interface MilitaryPosture {
  current_posture: string;
  recent_actions: string[];
  deployments?: string[];
  readiness_level?: string;
}

/** Economic measures and sanctions information */
export interface EconomicMeasures {
  active_sanctions: string[];
  trade_impact: string;
  currency_effects: string;
  energy_sector_impact?: string;
}

/** Diplomatic channel status */
export interface DiplomaticChannel {
  name: string;
  status: 'active' | 'cold' | 'suspended' | 'unknown';
  last_contact?: string;
}

/** Diplomatic status information */
export interface DiplomaticStatus {
  current_tone: string;
  active_channels: DiplomaticChannel[];
  third_party_mediators: string[];
  negotiation_status?: string;
}

/** Internal political pressure information */
export interface InternalPressure {
  pressure_level: number; // 0-100
  political_pressure?: string;
  regime_stability?: string;
  economic_grievances?: string[];
  public_sentiment?: string;
}

/** Complete briefing structure generated by AI */
export interface Briefing {
  summary: string;
  confidence_level: ConfidenceLevel;
  military_posture: {
    usa?: MilitaryPosture;
    iran?: MilitaryPosture;
    [key: string]: MilitaryPosture | undefined;
  };
  economic_measures: EconomicMeasures;
  diplomatic_status: DiplomaticStatus;
  internal_pressure: {
    usa?: InternalPressure;
    iran?: InternalPressure;
    [key: string]: InternalPressure | undefined;
  };
  key_developments?: string[];
  strategic_insights?: string[];
}

/** A node in the causal graph */
export interface CausalNode {
  id: string;
  label: string;
  description: string;
  category: CausalNodeCategory;
}

/** An edge in the causal graph */
export interface CausalEdge {
  id?: string;
  source: string;
  target: string;
  strength: CausalEdgeStrength;
  description?: string;
}

/** Complete causal graph structure */
export interface CausalGraph {
  nodes: CausalNode[];
  edges: CausalEdge[];
}

/** Impact metric data point */
export interface ImpactMetric {
  score: number; // 0-100
  trend: TrendDirection;
  confidence_low?: number;
  confidence_high?: number;
  drivers?: string[];
  primary_channels?: string[];
  mechanisms?: string[];
  stressed_alliances?: string[];
  [key: string]: unknown; // Allow additional fields
}

/** Complete impact assessment structure */
export interface ImpactAssessment {
  domestic_stability_usa: ImpactMetric;
  domestic_stability_iran: ImpactMetric;
  regional_destabilization: ImpactMetric;
  global_economic_shock: ImpactMetric;
  energy_market_disruption: ImpactMetric;
  alliance_stress: ImpactMetric;
  [key: string]: ImpactMetric | undefined;
}

/** Required actions for a pathway */
export interface PathwayActions {
  [actor: string]: string[];
}

/** A policy pathway simulation */
export interface PolicyPathway {
  id: string;
  name: string;
  description: string;
  risk_level: RiskLevel;
  probability_estimate: number;
  probability_confidence_low?: number;
  probability_confidence_high?: number;
  time_horizon?: string;
  required_actions?: PathwayActions;
  preconditions?: string[];
  obstacles?: string[];
  systemic_side_effects?: string[];
  expected_outcomes?: string[];
  warning_indicators?: string[];
}

/** Complete pathways structure */
export interface PolicyPathways {
  pathways: PolicyPathway[];
  scenario_analysis?: string;
  key_uncertainties?: string[];
}

/** Complete analysis snapshot from AI */
export interface AnalysisSnapshot {
  id: string;
  conflict_id: string | null;
  triggered_by_event_id: string | null;
  briefing: Briefing | null;
  causal_graph: CausalGraph | null;
  pathways: PolicyPathway[] | null;
  impact: ImpactAssessment | null;
  is_latest: boolean | null;
  model_version: string | null;
  created_at: string | null;
}

/** Insert payload for analysis_snapshots */
export interface AnalysisSnapshotInsert {
  conflict_id?: string | null;
  triggered_by_event_id?: string | null;
  briefing?: Briefing | null;
  causal_graph?: CausalGraph | null;
  pathways?: PolicyPathway[] | null;
  impact?: ImpactAssessment | null;
  is_latest?: boolean | null;
  model_version?: string | null;
}

/** Update payload for analysis_snapshots */
export interface AnalysisSnapshotUpdate {
  briefing?: Briefing | null;
  causal_graph?: CausalGraph | null;
  pathways?: PolicyPathway[] | null;
  impact?: ImpactAssessment | null;
  is_latest?: boolean | null;
  model_version?: string | null;
}

// ============================================================================
// COMPONENT-SPECIFIC TYPES
// ============================================================================

/** Props for ConflictHeader component */
export interface ConflictHeaderProps {
  conflict: Conflict;
  snapshot: AnalysisSnapshot | null;
  snapshotHistory: Pick<AnalysisSnapshot, 'id' | 'created_at' | 'triggered_by_event_id'>[];
  events: TimelineEvent[];
}

/** Props for BriefingPanel component */
export interface BriefingPanelProps {
  snapshot: AnalysisSnapshot | null;
}

/** Props for ImpactMetrics component */
export interface ImpactMetricsProps {
  snapshot: AnalysisSnapshot | null;
}

/** Props for TimelineView component */
export interface TimelineViewProps {
  events: TimelineEvent[];
}

/** Props for CausalGraphView component */
export interface CausalGraphViewProps {
  snapshot: AnalysisSnapshot | null;
}

/** Props for PathwayExplorer component */
export interface PathwayExplorerProps {
  snapshot: AnalysisSnapshot | null;
}

// ============================================================================
// SEED DATA TYPES
// ============================================================================

/** Seed data for conflicts (used in seed.ts) */
export interface ConflictSeedData {
  name: string;
  category: ConflictCategory;
  status: ConflictStatus;
  intensity: number;
  start_date: string;
  summary: string;
  tags: string[];
  actors: ConflictActor[];
}

/** Seed data for timeline events */
export interface TimelineEventSeedData {
  date: string;
  title: string;
  description: string;
  category: EventCategory;
  significance: EventSignificance;
  sources: Source[];
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/** Standard API response wrapper */
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

/** Paginated response */
export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** Supabase query result */
export interface SupabaseQueryResult<T> {
  data: T | null;
  error: Error | null;
  count: number | null;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/** Make all properties optional recursively */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/** Extract row type from table */
export type RowType<T> = T extends { Row: infer R } ? R : never;

/** Extract insert type from table */
export type InsertType<T> = T extends { Insert: infer I } ? I : never;

/** Extract update type from table */
export type UpdateType<T> = T extends { Update: infer U } ? U : never;

// ============================================================================
// DISPLAY HELPER TYPES
// ============================================================================

/** Status badge configuration */
export interface StatusBadge {
  label: string;
  className: string;
}

/** Type badge configuration */
export interface TypeBadge {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

/** Intensity level information */
export interface IntensityInfo {
  level: string;
  pct: number;
  color: string;
  bg: string;
}

/** Risk color mapping */
export type RiskColorMap = Record<RiskLevel, string>;

// ============================================================================
// CONSTANTS
// ============================================================================

/** Node colors for causal graph */
export const CAUSAL_NODE_COLORS: Record<CausalNodeCategory, string> = {
  actor: '#e8c547',
  event: '#ff4444',
  effect: '#4488ff',
  variable: '#888899',
};

/** Node radius sizes for causal graph */
export const CAUSAL_NODE_RADIUS: Record<CausalNodeCategory, number> = {
  actor: 18,
  event: 12,
  effect: 10,
  variable: 8,
};

/** Risk color mapping */
export const RISK_COLORS: RiskColorMap = {
  low: 'text-og-green bg-[rgba(68,255,136,0.12)]',
  medium: 'text-accent-color bg-accent-dim',
  high: 'text-[hsl(30,100%,60%)] bg-[rgba(255,140,0,0.12)]',
  critical: 'text-red-vivid bg-red-dim',
};

/** Event significance to size mapping */
export const EVENT_SIZE_MAP: Record<EventSignificance, number> = {
  critical: 16,
  high: 12,
  medium: 8,
  low: 6,
};

/** Event category to color mapping */
export const EVENT_COLOR_MAP: Record<EventCategory, string> = {
  military: 'hsl(var(--red-vivid))',
  diplomatic: 'hsl(var(--blue-vivid))',
  economic: 'hsl(var(--accent))',
  political: 'hsl(270,100%,63%)',
};
