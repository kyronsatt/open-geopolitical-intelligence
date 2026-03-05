import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-admin-key",
};

const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY")!;
const ADMIN_SECRET = Deno.env.get("ADMIN_SECRET")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MODEL = Deno.env.get("MODEL") || "meta-llama/llama-3.3-70b-instruct:free";

const FALLBACK_MODELS = [
  "nvidia/nemotron-3-nano-30b-a3b:free",
  "qwen/qwen3-vl-235b-a22b-thinking",
  "meta-llama/llama-3.1-8b-instruct",
];

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

const SYSTEM = `You are a geopolitical analyst. Neutral, multi-perspective, fact-based.
Present each actor's logic from their own POV. Respond ONLY with valid JSON. No markdown, no code fences.`;

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ============================================================================
// Dynamic schema builders — adapt to any set of actors
// ============================================================================

interface ActorInfo {
  name: string;
  slug: string;
  country_code: string;
  interests: string[];
  red_lines: string[];
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

function buildBriefingSchema(actors: ActorInfo[]): string {
  const milParts = actors.map(a => `${a.slug}:{current_posture:string,recent_actions:string[],stated_objectives:string[]}`).join(",");
  const presParts = actors.map(a => `${a.slug}:{pressure_level:number(0-100),political_pressure:string,regime_stability:string}`).join(",");
  return `{summary:string,military_posture:{${milParts}},economic_measures:{active_sanctions:string[],trade_impact:string,currency_effects:string},diplomatic_status:{active_channels:[{name:string,status:"active"|"cold"|"broken"}],current_tone:string,third_party_mediators:string[]},internal_pressure:{${presParts}},confidence_level:"low"|"medium"|"high",confidence_reasoning:string}`;
}

function buildImpactSchema(actors: ActorInfo[]): string {
  const domesticParts = actors.map(a =>
    `domestic_stability_${a.slug}:{score:number(0-100),trend:string,drivers:string[],confidence_low:number,confidence_high:number}`
  ).join(",");
  return `{${domesticParts},regional_destabilization:{score:number(0-100),trend:string,affected_countries:string[],mechanisms:string[],confidence_low:number,confidence_high:number},global_economic_shock:{score:number(0-100),trend:string,primary_channels:string[],confidence_low:number,confidence_high:number},energy_market_disruption:{score:number(0-100),trend:string,oil_price_impact:string,strait_of_hormuz_risk:number(0-100),confidence_low:number,confidence_high:number},alliance_stress:{score:number(0-100),trend:string,stressed_alliances:string[],confidence_low:number,confidence_high:number}}`;
}

function buildGraphSchema(_actors: ActorInfo[]): string {
  return `{nodes:[{id:string,label:string,category:"actor"|"event"|"effect"|"variable",description:string}],edges:[{source:string,target:string,relationship:string,strength:"weak"|"moderate"|"strong",description:string}]} - generate 15-25 nodes and 20-30 edges modeling causal chains among ALL actors`;
}

function buildPathwaysSchema(actors: ActorInfo[]): string {
  const actorActions = actors.map(a => `${a.slug}:string[]`).join(",");
  return `[{id:string,name:string,description:string,required_actions:{${actorActions},international_community:string[]},preconditions:string[],risk_level:"low"|"medium"|"high"|"critical",probability_estimate:number(0-100),probability_confidence_low:number,probability_confidence_high:number,time_horizon:string,systemic_side_effects:string[],obstacles:string[]}] - exactly 3 items: diplomatic, economic pressure, military containment`;
}

function buildContext(actors: ActorInfo[], existingEvents: any[]): string {
  const actorContext = actors.map(a => ({
    name: a.name,
    code: a.country_code,
    interests: a.interests,
    red_lines: a.red_lines,
  }));
  const recentEvents = existingEvents.slice(-10).map(e => ({
    date: e.date,
    title: e.title,
    category: e.category,
    significance: e.significance,
  }));
  return JSON.stringify({ actors: actorContext, recent_events: recentEvents });
}

// ============================================================================
// LLM call with retry + fallback
// ============================================================================

async function callLLMWithRetry(
  schemaKey: string,
  schema: string,
  context: string,
  event: string,
  models: string[],
  attempt = 0,
): Promise<{ model: string; data: any }> {
  const currentModel = models[attempt % models.length];

  for (let retry = 0; retry < MAX_RETRIES; retry++) {
    try {
      console.log(`[trigger-analysis] [${schemaKey}] model=${currentModel} attempt=${attempt} retry=${retry}`);
      const startTime = Date.now();

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://ogse.io",
          "X-Title": "OGSE",
        },
        body: JSON.stringify({
          model: currentModel,
          temperature: 0.2,
          messages: [
            { role: "system", content: SYSTEM },
            { role: "user", content: `Context: ${context}\nEvent: ${event}\nRespond with JSON matching this schema: ${schema}` },
          ],
        }),
      });

      const elapsed = Date.now() - startTime;
      console.log(`[trigger-analysis] [${schemaKey}] status=${response.status} elapsed=${elapsed}ms`);

      if (!response.ok) {
        const text = await response.text();
        console.error(`[trigger-analysis] [${schemaKey}] ERROR: ${response.status} - ${text}`);
        if ((response.status >= 500 || response.status === 429) && (attempt + 1) < models.length) {
          return callLLMWithRetry(schemaKey, schema, context, event, models, attempt + 1);
        }
        if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          throw new Error(`LLM ${schemaKey}: ${response.status} - ${text}`);
        }
        await delay(RETRY_DELAY_MS * (retry + 1));
        continue;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "{}";
      console.log(`[trigger-analysis] [${schemaKey}] content_len=${content.length} usage=${JSON.stringify(data.usage || {})}`);

      let cleaned = content.trim();
      if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      }

      const parsed = JSON.parse(cleaned);
      console.log(`[trigger-analysis] [${schemaKey}] ✅ parsed keys=${Object.keys(parsed).join(",")}`);
      return { model: currentModel, data: parsed };
    } catch (e) {
      console.error(`[trigger-analysis] [${schemaKey}] exception retry=${retry}:`, e);
      if (e instanceof SyntaxError && (attempt + 1) < models.length) {
        return callLLMWithRetry(schemaKey, schema, context, event, models, attempt + 1);
      }
      await delay(RETRY_DELAY_MS * (retry + 1));
    }
  }

  if ((attempt + 1) < models.length) {
    return callLLMWithRetry(schemaKey, schema, context, event, models, attempt + 1);
  }
  throw new Error(`LLM failed for ${schemaKey} after all retries and fallbacks`);
}

// ============================================================================
// Main handler
// ============================================================================

serve(async (req) => {
  console.log(`[trigger-analysis] ${req.method} received`);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const adminKey = req.headers.get("x-admin-key");
  if (adminKey !== ADMIN_SECRET) {
    console.warn(`[trigger-analysis] Unauthorized`);
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const body = await req.json();
    console.log(`[trigger-analysis] body:`, JSON.stringify({
      conflict_id: body.conflict_id, title: body.title, date: body.date,
      category: body.category, significance: body.significance,
    }));

    // ---------------------------------------------------------------
    // 1. Fetch conflict + actors + recent events dynamically
    // ---------------------------------------------------------------
    const { data: conflict, error: conflictErr } = await supabase
      .from("conflicts")
      .select("*")
      .eq("id", body.conflict_id)
      .single();

    if (conflictErr || !conflict) {
      console.error("[trigger-analysis] Conflict not found:", conflictErr);
      return new Response(JSON.stringify({ error: "Conflict not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const actorsRaw = conflict.actors as any[];
    const actors: ActorInfo[] = actorsRaw.map((a: any) => ({
      name: a.name,
      slug: slugify(a.name),
      country_code: a.country_code,
      interests: a.interests || [],
      red_lines: a.red_lines || [],
    }));
    console.log(`[trigger-analysis] Actors: ${actors.map(a => a.name).join(", ")}`);

    const { data: existingEvents } = await supabase
      .from("timeline_events")
      .select("date, title, category, significance")
      .eq("conflict_id", body.conflict_id)
      .order("date", { ascending: true });

    // ---------------------------------------------------------------
    // 2. Build dynamic schemas and context
    // ---------------------------------------------------------------
    const schemas: Record<string, string> = {
      briefing: buildBriefingSchema(actors),
      impact: buildImpactSchema(actors),
      causal_graph: buildGraphSchema(actors),
      pathways: buildPathwaysSchema(actors),
    };

    const context = buildContext(actors, existingEvents || []);
    const eventStr = `${body.title} (${body.date}): ${body.description}`;
    const models = [MODEL, ...FALLBACK_MODELS];

    // ---------------------------------------------------------------
    // 3. Run all 4 LLM calls in parallel
    // ---------------------------------------------------------------
    console.log("[trigger-analysis] Starting 4 parallel LLM calls...");
    const [briefingResult, impactResult, causalGraphResult, pathwaysResult] = await Promise.all(
      Object.keys(schemas).map(key => callLLMWithRetry(key, schemas[key], context, eventStr, models))
    );
    console.log("[trigger-analysis] All LLM calls succeeded");

    // ---------------------------------------------------------------
    // 4. Normalize sources
    // ---------------------------------------------------------------
    const sources = body.sources
      ? Array.isArray(body.sources)
        ? body.sources.map((s: any) => typeof s === "string" ? { name: s } : s)
        : body.sources
      : null;

    // ---------------------------------------------------------------
    // 5. Insert event
    // ---------------------------------------------------------------
    const { data: event, error: eventError } = await supabase
      .from("timeline_events")
      .insert({
        conflict_id: body.conflict_id,
        date: body.date,
        title: body.title,
        description: body.description,
        category: body.category,
        significance: body.significance,
        sources,
      })
      .select()
      .single();

    if (eventError) {
      console.error("[trigger-analysis] Event insert failed:", eventError);
      return new Response(JSON.stringify({ error: "Event insert failed", details: eventError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    console.log(`[trigger-analysis] Event created: ${event.id}`);

    // ---------------------------------------------------------------
    // 6. Demote old snapshots + insert new
    // ---------------------------------------------------------------
    await supabase
      .from("analysis_snapshots")
      .update({ is_latest: false })
      .eq("conflict_id", body.conflict_id);

    const { data: snapshot, error: snapshotError } = await supabase
      .from("analysis_snapshots")
      .insert({
        conflict_id: body.conflict_id,
        triggered_by_event_id: event.id,
        briefing: briefingResult.data,
        impact: impactResult.data,
        causal_graph: causalGraphResult.data,
        pathways: pathwaysResult.data,
        model_version: [briefingResult, impactResult, causalGraphResult, pathwaysResult]
          .map(r => r.model).join("/"),
        is_latest: true,
      })
      .select()
      .single();

    if (snapshotError) {
      console.error("[trigger-analysis] Snapshot insert failed:", snapshotError);
      return new Response(JSON.stringify({ error: "Snapshot insert failed", event_id: event.id, details: snapshotError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[trigger-analysis] ✅ Complete. snapshot=${snapshot?.id}`);
    return new Response(
      JSON.stringify({
        success: true,
        event_id: event.id,
        snapshot_id: snapshot?.id,
        actors: actors.map(a => a.name),
        models_used: {
          briefing: briefingResult.model,
          impact: impactResult.model,
          causal_graph: causalGraphResult.model,
          pathways: pathwaysResult.model,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("[trigger-analysis] Fatal error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unknown error",
        stack: e instanceof Error ? e.stack : undefined,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
