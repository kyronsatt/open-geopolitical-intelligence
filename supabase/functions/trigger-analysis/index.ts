import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-key',
}

const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY')!
const ADMIN_SECRET = Deno.env.get('ADMIN_SECRET')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const MODEL = 'meta-llama/llama-3.3-70b-instruct:free'

const CONTEXT = JSON.stringify({
  nuclear: { enrichment_pct: 60, breakout_weeks: 1, iaea_access: 'severely restricted' },
  military: {
    us: ['2 carrier groups in region', 'Al Udeid Qatar ~10k troops', 'Al Dhafra UAE'],
    iran: ['Shahab-3 2000km', 'Fattah hypersonic 1400km', '125k IRGC'],
    recent: ['Houthi Red Sea attacks ongoing', 'Iran direct strikes on Israel Apr+Oct 2024']
  },
  proxies: { hezbollah: 'Lebanon 150k rockets', houthi: 'Yemen Red Sea', pmf: 'Iraq 100k fighters' },
  sanctions: { oil_bpd: 1500000, swift: 'excluded', impact_usd_bn: 55 },
  economy: { inflation_pct: 40, usd_irr: 580000 },
  diplomacy: { oman: 'backchannel', china: 'main trade partner', russia: 'arms ally' }
})

const SYSTEM = `You are a geopolitical analyst. Neutral, multi-perspective, fact-based.
Present each actor's logic from their own POV. Respond ONLY with valid JSON. No markdown, no code fences.`

const SCHEMAS: Record<string, string> = {
  briefing: `{summary:string,military_posture:{usa:{current_posture:string,recent_actions:string[],stated_objectives:string[]},iran:{current_posture:string,recent_actions:string[],stated_objectives:string[]}},economic_measures:{active_sanctions:string[],trade_impact:string,currency_effects:string},diplomatic_status:{active_channels:[{name:string,status:"active"|"cold"|"broken"}],current_tone:string,third_party_mediators:string[]},internal_pressure:{usa:{pressure_level:number(0-100),political_pressure:string},iran:{pressure_level:number(0-100),regime_stability:string}},confidence_level:"low"|"medium"|"high",confidence_reasoning:string}`,
  impact: `{domestic_stability_usa:{score:number(0-100),trend:string,drivers:string[],confidence_low:number,confidence_high:number},domestic_stability_iran:{score:number(0-100),trend:string,drivers:string[],confidence_low:number,confidence_high:number},regional_destabilization:{score:number(0-100),trend:string,affected_countries:string[],mechanisms:string[],confidence_low:number,confidence_high:number},global_economic_shock:{score:number(0-100),trend:string,primary_channels:string[],confidence_low:number,confidence_high:number},energy_market_disruption:{score:number(0-100),trend:string,oil_price_impact:string,strait_of_hormuz_risk:number(0-100),confidence_low:number,confidence_high:number},alliance_stress:{score:number(0-100),trend:string,stressed_alliances:string[],confidence_low:number,confidence_high:number}}`,
  causal_graph: `{nodes:[{id:string,label:string,category:"actor"|"event"|"effect"|"variable",description:string}],edges:[{source:string,target:string,relationship:string,strength:"weak"|"moderate"|"strong",description:string}]} - generate 15-25 nodes and 20-30 edges modeling causal chains`,
  pathways: `[{id:string,name:string,description:string,required_actions:{usa:string[],iran:string[],international_community:string[]},preconditions:string[],risk_level:"low"|"medium"|"high"|"critical",probability_estimate:number(0-100),probability_confidence_low:number,probability_confidence_high:number,time_horizon:string,systemic_side_effects:string[],obstacles:string[]}] - exactly 3 items: diplomatic, economic pressure, military containment`
}

async function callLLM(schemaKey: string, event: string): Promise<any> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://ogse.io',
      'X-Title': 'OGSE',
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.2,
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: `Context: ${CONTEXT}\nEvent: ${event}\nRespond with JSON matching this schema: ${SCHEMAS[schemaKey]}` }
      ]
    })
  })

  if (!response.ok) {
    const text = await response.text()
    console.error(`LLM error for ${schemaKey}:`, response.status, text)
    throw new Error(`LLM call failed for ${schemaKey}: ${response.status}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content || '{}'

  // Try to parse, handling potential markdown code fences
  let cleaned = content.trim()
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
  }

  return JSON.parse(cleaned)
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.headers.get('x-admin-key') !== ADMIN_SECRET) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    const body = await req.json()
    const eventStr = `${body.title} (${body.date}): ${body.description}`

    // Insert timeline event
    const { data: event, error } = await supabase
      .from('timeline_events')
      .insert({
        conflict_id: body.conflict_id,
        date: body.date,
        title: body.title,
        description: body.description,
        category: body.category,
        significance: body.significance,
        sources: body.sources
      })
      .select()
      .single()

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Run all 4 LLM calls in parallel
    const [briefing, impact, causal_graph, pathways] = await Promise.all([
      callLLM('briefing', eventStr),
      callLLM('impact', eventStr),
      callLLM('causal_graph', eventStr),
      callLLM('pathways', eventStr),
    ])

    // Demote old snapshots
    await supabase.from('analysis_snapshots')
      .update({ is_latest: false })
      .eq('conflict_id', body.conflict_id)

    // Insert new snapshot
    const { data: snapshot } = await supabase.from('analysis_snapshots').insert({
      conflict_id: body.conflict_id,
      triggered_by_event_id: event.id,
      briefing,
      impact,
      causal_graph,
      pathways,
      model_version: MODEL,
      is_latest: true
    }).select().single()

    return new Response(
      JSON.stringify({ success: true, event_id: event.id, snapshot_id: snapshot?.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (e) {
    console.error('trigger-analysis error:', e)
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
