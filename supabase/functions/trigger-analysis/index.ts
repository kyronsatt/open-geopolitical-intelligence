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
const MODEL = "arcee-ai/trinity-large-preview:free";

// Fallback free models (in order of preference)
const FALLBACK_MODELS = [
  "nvidia/nemotron-3-nano-30b-a3b:free",
  "qwen/qwen3-vl-235b-a22b-thinking",
  "meta-ll/llama-3.1-8b-instruct",
  "mistralai/mistral-7b-instruct",
];

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

const CONTEXT = JSON.stringify({
  nuclear: {
    enrichment_pct: 60,
    breakout_weeks: 1,
    iaea_access: "severely restricted",
  },
  military: {
    us: [
      "2 carrier groups in region",
      "Al Udeid Qatar ~10k troops",
      "Al Dhafra UAE",
    ],
    iran: ["Shahab-3 2000km", "Fattah hypersonic 1400km", "125k IRGC"],
    recent: [
      "Houthi Red Sea attacks ongoing",
      "Iran direct strikes on Israel Apr+Oct 2024",
    ],
  },
  proxies: {
    hezbollah: "Lebanon 150k rockets",
    houthi: "Yemen Red Sea",
    pmf: "Iraq 100k fighters",
  },
  sanctions: { oil_bpd: 1500000, swift: "excluded", impact_usd_bn: 55 },
  economy: { inflation_pct: 40, usd_irr: 580000 },
  diplomacy: {
    oman: "backchannel",
    china: "main trade partner",
    russia: "arms ally",
  },
});

const SYSTEM = `You are a geopolitical analyst. Neutral, multi-perspective, fact-based.
Present each actor's logic from their own POV. Respond ONLY with valid JSON. No markdown, no code fences.`;

const SCHEMAS: Record<string, string> = {
  briefing: `{summary:string,military_posture:{usa:{current_posture:string,recent_actions:string[],stated_objectives:string[]},iran:{current_posture:string,recent_actions:string[],stated_objectives:string[]}},economic_measures:{active_sanctions:string[],trade_impact:string,currency_effects:string},diplomatic_status:{active_channels:[{name:string,status:"active"|"cold"|"broken"}],current_tone:string,third_party_mediators:string[]},internal_pressure:{usa:{pressure_level:number(0-100),political_pressure:string},iran:{pressure_level:number(0-100),regime_stability:string}},confidence_level:"low"|"medium"|"high",confidence_reasoning:string}`,
  impact: `{domestic_stability_usa:{score:number(0-100),trend:string,drivers:string[],confidence_low:number,confidence_high:number},domestic_stability_iran:{score:number(0-100),trend:string,drivers:string[],confidence_low:number,confidence_high:number},regional_destabilization:{score:number(0-100),trend:string,affected_countries:string[],mechanisms:string[],confidence_low:number,confidence_high:number},global_economic_shock:{score:number(0-100),trend:string,primary_channels:string[],confidence_low:number,confidence_high:number},energy_market_disruption:{score:number(0-100),trend:string,oil_price_impact:string,strait_of_hormuz_risk:number(0-100),confidence_low:number,confidence_high:number},alliance_stress:{score:number(0-100),trend:string,stressed_alliances:string[],confidence_low:number,confidence_high:number}}`,
  causal_graph: `{nodes:[{id:string,label:string,category:"actor"|"event"|"effect"|"variable",description:string}],edges:[{source:string,target:string,relationship:string,strength:"weak"|"moderate"|"strong",description:string}]} - generate 15-25 nodes and 20-30 edges modeling causal chains`,
  pathways: `[{id:string,name:string,description:string,required_actions:{usa:string[],iran:string[],international_community:string[]},preconditions:string[],risk_level:"low"|"medium"|"high"|"critical",probability_estimate:number(0-100),probability_confidence_low:number,probability_confidence_high:number,time_horizon:string,systemic_side_effects:string[],obstacles:string[]}] - exactly 3 items: diplomatic, economic pressure, military containment`,
};

interface LLMResponse {
  model: string;
  data: any;
  error?: string;
}

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callLLMWithRetry(
  schemaKey: string,
  event: string,
  models: string[],
  attempt = 0,
): Promise<LLMResponse> {
  const currentModel = models[attempt % models.length];

  for (let retry = 0; retry < MAX_RETRIES; retry++) {
    try {
      console.log(
        `[trigger-analysis] Calling LLM for ${schemaKey} with model ${currentModel} (retry ${retry})`,
      );

      const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
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
              {
                role: "user",
                content: `Context: ${CONTEXT}\nEvent: ${event}\nRespond with JSON matching this schema: ${SCHEMAS[schemaKey]}`,
              },
            ],
          }),
        },
      );

      if (!response.ok) {
        const text = await response.text();
        console.error(
          `[trigger-analysis] LLM error for ${schemaKey}:`,
          response.status,
          text,
        );

        // Try next model on persistent errors
        if (response.status >= 500 || response.status === 429) {
          const nextModelIndex = (attempt + 1) % models.length;
          if (nextModelIndex !== 0) {
            console.log(
              `[trigger-analysis] Switching to fallback model for ${schemaKey}`,
            );
            return callLLMWithRetry(schemaKey, event, models, attempt + 1);
          }
        }

        // Don't retry on client errors (4xx except 429)
        if (
          response.status >= 400 &&
          response.status < 500 &&
          response.status !== 429
        ) {
          throw new Error(
            `LLM call failed for ${schemaKey}: ${response.status} - ${text}`,
          );
        }

        await delay(RETRY_DELAY_MS * (retry + 1));
        continue;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "{}";

      // Try to parse, handling potential markdown code fences
      let cleaned = content.trim();
      if (cleaned.startsWith("```")) {
        cleaned = cleaned
          .replace(/^```(?:json)?\n?/, "")
          .replace(/\n?```$/, "");
      }

      const parsed = JSON.parse(cleaned);
      console.log(
        `[trigger-analysis] Successfully processed ${schemaKey} with model ${currentModel}`,
      );

      return { model: currentModel, data: parsed };
    } catch (e) {
      console.error(
        `[trigger-analysis] Exception for ${schemaKey} (retry ${retry}):`,
        e,
      );

      // If this is a JSON parse error, don't retry with the same model
      if (e instanceof SyntaxError) {
        const nextModelIndex = (attempt + 1) % models.length;
        if (nextModelIndex !== 0) {
          console.log(
            `[trigger-analysis] JSON parse error, switching to fallback model for ${schemaKey}`,
          );
          return callLLMWithRetry(schemaKey, event, models, attempt + 1);
        }
      }

      await delay(RETRY_DELAY_MS * (retry + 1));
    }
  }

  // All retries exhausted, try next model in the list
  const nextModelIndex = (attempt + 1) % models.length;
  if (nextModelIndex !== 0) {
    console.log(
      `[trigger-analysis] All retries exhausted for ${schemaKey}, trying next model`,
    );
    return callLLMWithRetry(schemaKey, event, models, attempt + 1);
  }

  throw new Error(
    `LLM call failed for ${schemaKey} after all retries and fallbacks`,
  );
}

async function callLLM(schemaKey: string, event: string): Promise<any> {
  console.log(
    `[LLM:${schemaKey}] Starting call for event: ${event.slice(0, 80)}...`,
  );
  const startTime = Date.now();

  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://ogse.io",
        "X-Title": "OGSE",
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.2,
        messages: [
          { role: "system", content: SYSTEM },
          {
            role: "user",
            content: `Context: ${CONTEXT}\nEvent: ${event}\nRespond with JSON matching this schema: ${SCHEMAS[schemaKey]}`,
          },
        ],
      }),
    },
  );

  const elapsed = Date.now() - startTime;
  console.log(
    `[LLM:${schemaKey}] Response status: ${response.status} (${elapsed}ms)`,
  );

  if (!response.ok) {
    const text = await response.text();
    console.error(`[LLM:${schemaKey}] ERROR: ${response.status} - ${text}`);
    throw new Error(`LLM call failed for ${schemaKey}: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "{}";
  console.log(`[LLM:${schemaKey}] Raw content length: ${content.length} chars`);
  console.log(`[LLM:${schemaKey}] Usage: ${JSON.stringify(data.usage || {})}`);

  // Try to parse, handling potential markdown code fences
  let cleaned = content.trim();
  if (cleaned.startsWith("```")) {
    console.log(`[LLM:${schemaKey}] Stripping markdown code fences`);
    cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  try {
    const parsed = JSON.parse(cleaned);
    console.log(
      `[LLM:${schemaKey}] ✅ Parsed successfully. Top-level keys: ${Object.keys(parsed).join(", ")}`,
    );
    return parsed;
  } catch (parseErr) {
    console.error(`[LLM:${schemaKey}] ❌ JSON parse error: ${parseErr}`);
    console.error(
      `[LLM:${schemaKey}] Content preview: ${cleaned.slice(0, 500)}`,
    );
    throw parseErr;
  }
}

serve(async (req) => {
  console.log(`[trigger-analysis] ${req.method} request received`);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const adminKey = req.headers.get("x-admin-key");
  if (adminKey !== ADMIN_SECRET) {
    console.warn(`[trigger-analysis] Unauthorized: admin key mismatch`);
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const body = await req.json();
    console.log(
      `[trigger-analysis] Input body:`,
      JSON.stringify({
        conflict_id: body.conflict_id,
        title: body.title,
        date: body.date,
        category: body.category,
        significance: body.significance,
      }),
    );

    const eventStr = `${body.title} (${body.date}): ${body.description}`;

    // Sources should be jsonb array of {name, url?}
    const sources = body.sources
      ? Array.isArray(body.sources)
        ? body.sources.map((s: any) =>
            typeof s === "string" ? { name: s } : s,
          )
        : body.sources
      : null;

    // Build model list: primary model first, then fallbacks
    const models = [MODEL, ...FALLBACK_MODELS];

    // Run all 4 LLM calls in parallel (with retry logic)
    console.log("[trigger-analysis] Starting LLM calls...");
    const [briefingResult, impactResult, causalGraphResult, pathwaysResult] =
      await Promise.all([
        callLLMWithRetry("briefing", eventStr, models),
        callLLMWithRetry("impact", eventStr, models),
        callLLMWithRetry("causal_graph", eventStr, models),
        callLLMWithRetry("pathways", eventStr, models),
      ]);

    console.log(
      "[trigger-analysis] All LLM calls succeeded, inserting timeline event",
    );

    // NOW insert timeline event (only after LLM calls succeed)
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
      // LLM succeeded but event insert failed - this is problematic
      console.error(
        "[trigger-analysis] Timeline event insert failed:",
        eventError,
      );
      return new Response(
        JSON.stringify({
          error: "LLM analysis succeeded but failed to save event",
          details: eventError.message,
          llm_results: {
            briefing: briefingResult.model,
            impact: impactResult.model,
            causal_graph: causalGraphResult.model,
            pathways: pathwaysResult.model,
          },
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
    console.log(`[trigger-analysis] Timeline event created: ${event.id}`);

    // Demote old snapshots
    console.log(
      `[trigger-analysis] Demoting old snapshots for conflict ${body.conflict_id}`,
    );
    await supabase
      .from("analysis_snapshots")
      .update({ is_latest: false })
      .eq("conflict_id", body.conflict_id);

    // Insert new snapshot
    const { data: snapshot, error: snapshotError } = await supabase
      .from("analysis_snapshots")
      .insert({
        conflict_id: body.conflict_id,
        triggered_by_event_id: event.id,
        briefing: briefingResult.data,
        impact: impactResult.data,
        causal_graph: causalGraphResult.data,
        pathways: pathwaysResult.data,
        model_version: `${briefingResult.model}/${impactResult.model}/${causalGraphResult.model}/${pathwaysResult.model}`,
        is_latest: true,
      })
      .select()
      .single();

    if (snapshotError) {
      console.error(
        "[trigger-analysis] Snapshot insert failed:",
        snapshotError,
      );
      // Event exists but snapshot failed - partial success
      return new Response(
        JSON.stringify({
          error: "Event saved but snapshot failed",
          event_id: event.id,
          details: snapshotError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    console.log("[trigger-analysis] Successfully completed analysis");
    return new Response(
      JSON.stringify({
        success: true,
        event_id: event.id,
        snapshot_id: snapshot?.id,
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
    console.error("[trigger-analysis] trigger-analysis error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unknown error",
        stack: e instanceof Error ? e.stack : undefined,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
