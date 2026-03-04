
-- Step 1: Add a new jsonb column
ALTER TABLE timeline_events ADD COLUMN sources_new jsonb;

-- Step 2: Convert existing text[] data to jsonb array of objects
UPDATE timeline_events
SET sources_new = (
  SELECT jsonb_agg(jsonb_build_object('name', elem))
  FROM unnest(sources) AS elem
)
WHERE sources IS NOT NULL;

-- Step 3: Drop old column and rename new one
ALTER TABLE timeline_events DROP COLUMN sources;
ALTER TABLE timeline_events RENAME COLUMN sources_new TO sources;
