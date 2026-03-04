
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE conflicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT NOT NULL,
  intensity FLOAT NOT NULL,
  start_date DATE,
  summary TEXT,
  tags TEXT[],
  actors JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conflict_id UUID REFERENCES conflicts(id),
  date DATE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  significance TEXT NOT NULL,
  sources TEXT[],
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE analysis_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conflict_id UUID REFERENCES conflicts(id),
  triggered_by_event_id UUID REFERENCES timeline_events(id),
  briefing JSONB,
  impact JSONB,
  causal_graph JSONB,
  pathways JSONB,
  model_version TEXT,
  is_latest BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE conflicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read conflicts" ON conflicts FOR SELECT USING (true);
CREATE POLICY "public read timeline" ON timeline_events FOR SELECT USING (true);
CREATE POLICY "public read snapshots" ON analysis_snapshots FOR SELECT USING (true);
CREATE POLICY "public insert conflicts" ON conflicts FOR INSERT WITH CHECK (true);
CREATE POLICY "public insert timeline" ON timeline_events FOR INSERT WITH CHECK (true);
CREATE POLICY "public insert snapshots" ON analysis_snapshots FOR INSERT WITH CHECK (true);
CREATE POLICY "public update snapshots" ON analysis_snapshots FOR UPDATE USING (true);
