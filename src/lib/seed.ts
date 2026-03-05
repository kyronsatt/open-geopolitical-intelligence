import { supabase } from "@/integrations/supabase/client";
import type { Conflict, TimelineEvent, ConflictSeedData, TimelineEventSeedData, ConflictActor } from "@/lib/schemas";

const CONFLICT_DATA: ConflictSeedData = {
  name: 'United States — Iran',
  category: 'hybrid',
  status: 'escalating',
  intensity: 0.82,
  start_date: '1979-11-04',
  summary: 'A decades-long conflict spanning nuclear brinkmanship, proxy warfare, comprehensive sanctions, and recurring escalation cycles. Critical inflection points include the 2018 US JCPOA withdrawal, the 2020 Soleimani assassination, and Iran\'s 2024 direct missile strikes on Israel.',
  tags: ['nuclear', 'sanctions', 'proxy', 'energy'],
  actors: [
    { name: 'United States', role: 'primary', country_code: 'US', flag: '🇺🇸',
      interests: ['Nuclear nonproliferation','Regional stability','Israel security','Oil markets'],
      red_lines: ['Iranian nuclear weapon','Strait of Hormuz closure','Attack on US forces'] },
    { name: 'Islamic Republic of Iran', role: 'primary', country_code: 'IR', flag: '🇮🇷',
      interests: ['Regime survival','Sanctions relief','Regional hegemony','Nuclear deterrence'],
      red_lines: ['Regime change','Military invasion','Nuclear program elimination'] }
  ]
};

const EVENTS: TimelineEventSeedData[] = [
  { date: '1979-11-04', title: 'Iran Hostage Crisis Begins', description: 'Iranian students storm US embassy in Tehran, taking 52 Americans hostage for 444 days. Marks the rupture of US-Iran diplomatic relations.', category: 'diplomatic', significance: 'critical', sources: [{ name: 'State Department Archives', url: 'https://history.state.gov/departmenthistory/short-history/iraniancrises' }] },
  { date: '2015-07-14', title: 'JCPOA Nuclear Agreement Signed', description: 'Iran and P5+1 reach landmark nuclear deal. Iran limits enrichment in exchange for sanctions relief.', category: 'diplomatic', significance: 'critical', sources: [{ name: 'UN Security Council' }, { name: 'IAEA', url: 'https://www.iaea.org/newscenter/focus/iran' }] },
  { date: '2018-05-08', title: 'US Withdraws from JCPOA', description: 'Trump announces withdrawal from nuclear agreement and reimposition of maximum pressure sanctions.', category: 'economic', significance: 'critical', sources: [{ name: 'White House' }] },
  { date: '2020-01-03', title: 'Soleimani Assassination', description: 'US drone strike kills IRGC Quds Force commander at Baghdad airport. Iran vows severe retaliation.', category: 'military', significance: 'critical', sources: [{ name: 'Pentagon' }, { name: 'Reuters', url: 'https://www.reuters.com' }] },
  { date: '2021-04-06', title: 'Vienna Nuclear Talks Begin', description: 'Indirect US-Iran negotiations begin in Vienna to revive JCPOA. EU acts as intermediary.', category: 'diplomatic', significance: 'high', sources: [{ name: 'EU External Action Service', url: 'https://www.eeas.europa.eu' }] },
  { date: '2023-09-18', title: '$6B Iranian Funds Released', description: 'US unfreezes $6B in Iranian oil revenues as part of prisoner exchange deal.', category: 'economic', significance: 'high', sources: [{ name: 'Treasury Department' }] },
  { date: '2024-04-01', title: 'Iran Strikes Israel Directly', description: 'Iran launches 300+ drones and missiles at Israel in first-ever direct attack, retaliating for Israeli strike on Iranian consulate in Damascus.', category: 'military', significance: 'critical', sources: [{ name: 'IDF' }, { name: 'Reuters', url: 'https://www.reuters.com' }] },
  { date: '2024-10-01', title: 'Iran Second Ballistic Missile Strike', description: 'Iran fires ~180 ballistic missiles at Israel. Most intercepted. Major escalation in direct confrontation.', category: 'military', significance: 'critical', sources: [{ name: 'IDF' }, { name: 'Pentagon' }] }
];

export async function seedIfEmpty(): Promise<string | null> {
  const { data: existing } = await supabase.from('conflicts').select('id').limit(1);
  if (existing && existing.length > 0) {
    return existing[0].id as string;
  }

  const { data: conflict, error } = await supabase
    .from('conflicts')
    .insert(CONFLICT_DATA)
    .select('id')
    .single();

  if (error || !conflict) {
    console.error('Seed conflict error:', error);
    return null;
  }

  const conflictId = conflict.id;
  const eventsWithId = EVENTS.map(e => ({ ...e, conflict_id: conflictId }));
  const { error: evError } = await supabase.from('timeline_events').insert(eventsWithId);
  if (evError) console.error('Seed events error:', evError);

  return conflictId;
}
