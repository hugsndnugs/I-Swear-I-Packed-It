/**
 * Map of canonical UI strings to pirate equivalents.
 * Used when pirate speak setting is enabled.
 */
const PIRATE_MAP: Record<string, string> = {
  'Start Pre-Flight': 'Weigh Anchor',
  'Pre-Flight Assistant': 'Pre-Flight Assistant',
  'Generate Checklist': 'Generate Articles',
  'Pre-Flight Checklist': 'Articles o\' the Ship',
  'Cargo run': 'Haul',
  Bounty: 'Bounty',
  'Medical rescue': 'Rescue',
  'Org op': 'Org op',
  Salvage: 'Salvage',
  Mining: 'Mining',
  Piracy: 'Piracy',
  'Ship readiness': 'Ship shape',
  Critical: 'Critical',
  Flight: 'Flight',
  Tools: 'Tools',
  Cargo: 'Cargo',
  Medical: 'Medical',
  Crew: 'Crew',
  Home: 'Quarterdeck',
  Generate: 'Chart Course',
  Manifest: 'Manifest',
  Pack: 'Sea Chest',
  Equipment: 'Equipment',
  'Op Mode': 'Op Mode',
  'Pack List': 'Sea Chest',
  'Quick-start': 'Quick sail',
  Presets: 'Presets',
  'Import preset': 'Import preset',
  Ship: 'Ship',
  Operation: 'Operation',
  'All Green': 'All hands ready',
  'Crew readiness': 'Crew ready',
  'Start pre-flight checklist': 'Weigh anchor (start checklist)',
  'Pre-Flight Assistant home': 'Pre-Flight Assistant home',
  'View Pack List': 'View Sea Chest',
  'Back to Generator': 'Back to Chart Course'
}

export function pirateSpeak(original: string, enabled: boolean): string {
  if (!enabled || !original) return original
  const trimmed = original.trim()
  const translated = PIRATE_MAP[trimmed]
  return translated ?? original
}
