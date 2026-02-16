#!/usr/bin/env node
/**
 * Fetches Star Citizen locations (cities, space stations, outposts) from UEX API
 * and writes src/data/locations.generated.ts for the Generate Checklist menu.
 * - When UEX_API_TOKEN is set: fetches from UEX API /cities/, /space_stations/, /outposts/
 * - Falls back to cache (scripts/.api-cache/locations.json), then parses LOCATIONS from contexts.ts
 * - Writes src/data/locations.generated.ts
 *
 * Run: node scripts/fetch-locations.mjs
 * Env:  UEX_API_TOKEN=<token>              (create app at uexcorp.space/api/apps)
 *       PREFLIGHT_LOCATIONS_SKIP_API=1       (force cache/fallback even if token set)
 *       PREFLIGHT_API_CACHE_MAX_AGE_MS=86400000 (use cache if newer than this, 0 = always fetch)
 *       PREFLIGHT_API_SKIP_CACHE=1           (ignore cache, always fetch)
 *       UEX_CLIENT_VERSION=<version>         (optional; set if your UEX app has Client Version Lock)
 */
import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const CACHE_DIR = join(__dirname, '.api-cache')
const CACHE_FILE = join(CACHE_DIR, 'locations.json')
const CONTEXTS_PATH = join(ROOT, 'src', 'data', 'contexts.ts')
const OUT_PATH = join(ROOT, 'src', 'data', 'locations.generated.ts')

const UEX_BASE = 'https://api.uexcorp.uk/2.0'
const CACHE_MAX_AGE_MS = Number(process.env.PREFLIGHT_API_CACHE_MAX_AGE_MS) ?? 86400000 // 24h
const SKIP_CACHE = process.env.PREFLIGHT_API_SKIP_CACHE === '1' || process.env.PREFLIGHT_API_SKIP_CACHE === 'true'
const DELAY_MS = 2000

const TYPE_ORDER = { station: 0, city: 1, outpost: 2, none: 3 }

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

function slugify(s) {
  if (!s || typeof s !== 'string') return 'unknown'
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

async function uexFetch(path, token) {
  await sleep(DELAY_MS)
  const url = `${UEX_BASE}${path}`
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
  }
  const clientVersion = process.env.UEX_CLIENT_VERSION
  if (clientVersion) headers['X-Client-Version'] = clientVersion

  const res = await fetch(url, { headers })
  const body = await res.json().catch(() => ({}))
  if (res.status === 429) {
    const retryAfter = Math.min(
      120000,
      Math.max(60000, (Number(res.headers.get('Retry-After')) || 60) * 1000)
    )
    console.warn(`Rate limited (429). Waiting ${retryAfter / 1000}s...`)
    await sleep(retryAfter)
    return uexFetch(path, token)
  }
  if (!res.ok) {
    const msg = body.message || body.status || res.statusText
    throw new Error(`UEX API ${res.status}: ${msg} (${url})`)
  }
  return body
}

function extractData(res) {
  const raw = res?.data ?? res
  if (Array.isArray(raw)) return raw
  if (raw?.results && Array.isArray(raw.results)) return raw.results
  if (raw?.items && Array.isArray(raw.items)) return raw.items
  return []
}

function mapCity(row) {
  const name = row.name || 'Unknown'
  const id = (row.code && slugify(row.code)) || slugify(name)
  const system = row.star_system_name || undefined
  if (row.is_decommissioned === 1) return null
  return { id, label: name, type: 'city', system }
}

function mapSpaceStation(row) {
  const name = row.name || row.nickname || 'Unknown'
  const id = slugify(name)
  const system = row.star_system_name || undefined
  if (row.is_decommissioned === 1) return null
  return { id, label: name, type: 'station', system }
}

function mapOutpost(row) {
  const name = row.name || row.nickname || 'Unknown'
  const id = slugify(name)
  const system = row.star_system_name || undefined
  if (row.is_decommissioned === 1) return null
  return { id, label: name, type: 'outpost', system }
}

function dedupeById(locations) {
  const seen = new Set()
  return locations.filter((loc) => {
    if (seen.has(loc.id)) return false
    seen.add(loc.id)
    return true
  })
}

function sortLocations(locations) {
  return [...locations].sort((a, b) => {
    const sysA = a.system ?? '\uffff'
    const sysB = b.system ?? '\uffff'
    if (sysA !== sysB) return sysA.localeCompare(sysB)
    const orderA = TYPE_ORDER[a.type] ?? 4
    const orderB = TYPE_ORDER[b.type] ?? 4
    if (orderA !== orderB) return orderA - orderB
    return (a.label || '').localeCompare(b.label || '')
  })
}

function loadCache() {
  if (SKIP_CACHE || !existsSync(CACHE_FILE)) return null
  try {
    const raw = readFileSync(CACHE_FILE, 'utf8')
    const obj = JSON.parse(raw)
    if (!Array.isArray(obj.data)) return null
    const age = obj.fetchedAt ? Date.now() - obj.fetchedAt : Infinity
    if (CACHE_MAX_AGE_MS > 0 && age > CACHE_MAX_AGE_MS) return null
    return obj.data
  } catch {
    return null
  }
}

function saveCache(data) {
  try {
    if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true })
    const payload = { fetchedAt: Date.now(), data }
    writeFileSync(CACHE_FILE, JSON.stringify(payload, null, 2), 'utf8')
  } catch (err) {
    console.warn('Could not write cache:', err.message)
  }
}

function loadFromContexts() {
  if (!existsSync(CONTEXTS_PATH)) return []
  try {
    const content = readFileSync(CONTEXTS_PATH, 'utf8')
    const match = content.match(/export const LOCATIONS[^=]*=\s*\[([\s\S]*?)\]\s*(?:\n|$)/)
    if (!match) return []
    const arrStr = '[' + match[1] + ']'
    const entries = []
    const entryRegex = /\{\s*id:\s*['"]([^'"]+)['"],\s*label:\s*['"]([^'"]+)['"],\s*type:\s*['"]([^'"]+)['"](?:,\s*system:\s*['"]([^'"]*)['"])?\s*\}/g
    let m
    while ((m = entryRegex.exec(arrStr)) !== null) {
      entries.push({
        id: m[1],
        label: m[2],
        type: m[3],
        system: m[4] || undefined,
      })
    }
    return entries
  } catch {
    return []
  }
}

function loadFromGeneratedFile() {
  if (!existsSync(OUT_PATH)) return []
  try {
    const content = readFileSync(OUT_PATH, 'utf8')
    const match = content.match(/export const LOCATIONS_GENERATED\s*=\s*\[([\s\S]*?)\]\s*(?:\n|$)/)
    if (!match) return []
    const arrStr = '[' + match[1] + ']'
    const entries = []
    const entryRegex = /\{\s*id:\s*['"]([^'"]+)['"],\s*label:\s*['"]([^'"]+)['"],\s*type:\s*['"]([^'"]+)['"](?:,\s*system:\s*['"]([^'"]*)['"])?\s*\}/g
    let m
    while ((m = entryRegex.exec(arrStr)) !== null) {
      entries.push({
        id: m[1],
        label: m[2],
        type: m[3],
        system: m[4] || undefined,
      })
    }
    return entries
  } catch {
    return []
  }
}

async function fetchFromUex(token) {
  console.log('Fetching locations from UEX API...')

  const [citiesRes, spaceStationsRes, outpostsRes] = await Promise.all([
    uexFetch('/cities/', token),
    uexFetch('/space_stations/', token),
    uexFetch('/outposts/', token),
  ])

  const cities = extractData(citiesRes).map(mapCity).filter(Boolean)
  const stations = extractData(spaceStationsRes).map(mapSpaceStation).filter(Boolean)
  const outposts = extractData(outpostsRes).map(mapOutpost).filter(Boolean)

  let all = dedupeById([...stations, ...cities, ...outposts])
  all = sortLocations(all)
  all.push({ id: 'none', label: 'None', type: 'none' })

  console.log(`Fetched: ${stations.length} stations, ${cities.length} cities, ${outposts.length} outposts → ${all.length} total (incl. None)`)
  return all
}

function generateLocationsFile(locations) {
  const lines = [
    '// Generated by scripts/fetch-locations.mjs – do not edit by hand',
    '',
    'export const LOCATIONS_GENERATED = [',
  ]
  for (const loc of locations) {
    const systemStr = loc.system != null ? `, system: ${JSON.stringify(loc.system)}` : ''
    lines.push(
      `  { id: ${JSON.stringify(loc.id)}, label: ${JSON.stringify(loc.label)}, type: ${JSON.stringify(loc.type)}${systemStr} },`
    )
  }
  lines.push(']')
  lines.push('')
  return lines.join('\n')
}

async function main() {
  try {
    const token = process.env.UEX_API_TOKEN
    const skipApi =
      process.env.PREFLIGHT_LOCATIONS_SKIP_API === '1' ||
      process.env.PREFLIGHT_LOCATIONS_SKIP_API === 'true'

    if (!token) {
      console.log('ℹ️  No UEX_API_TOKEN set - will use fallback data')
      console.log('   Set UEX_API_TOKEN to fetch from UEX API (uexcorp.space/api/apps)')
    }

    let locations = []

    if (token && !skipApi) {
      const cached = loadCache()
      if (cached != null && cached.length > 0) {
        console.log(`Using cached locations (${cached.length} items)`)
        locations = cached
      } else {
        try {
          locations = await fetchFromUex(token)
          saveCache(locations)
        } catch (err) {
          console.warn('UEX API failed, falling back:', err.message)
          locations = loadCache()
          if (locations == null || locations.length === 0) {
            locations = loadFromContexts()
            if (locations.length > 0) {
              console.log(`Using LOCATIONS from contexts.ts (${locations.length} items)`)
            }
          }
        }
      }
    }

    if (locations.length === 0) {
      locations = loadFromContexts()
      if (locations.length > 0) {
        console.log(`Using LOCATIONS from contexts.ts (${locations.length} items)`)
      }
    }

    if (locations.length === 0) {
      locations = loadFromGeneratedFile()
      if (locations.length > 0) {
        console.log(`Keeping existing locations.generated.ts (${locations.length} items)`)
      }
    }

    if (locations.length === 0) {
      console.warn('No locations from API, cache, contexts, or generated file. Writing minimal list.')
      locations = [
        { id: 'none', label: 'None', type: 'none' },
      ]
    }

    const content = generateLocationsFile(locations)
    writeFileSync(OUT_PATH, content, 'utf8')
    console.log(`✓ Wrote ${locations.length} locations to ${OUT_PATH}`)
  } catch (err) {
    console.error('Error fetching locations:', err)
    process.exit(1)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
