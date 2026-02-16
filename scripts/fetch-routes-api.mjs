#!/usr/bin/env node
/**
 * Fetches trade routes from UEX Corp API (or falls back to local JSON / PREFLIGHT_ROUTES_URL).
 * - When UEX_API_TOKEN is set: calls commodities_routes, maps to RoutePreset, caches response
 * - When no token or PREFLIGHT_ROUTES_SKIP_API=1: uses data/best-routes.json or PREFLIGHT_ROUTES_URL
 * - Writes src/data/routes.generated.ts
 *
 * Run: node scripts/fetch-routes-api.mjs
 * Env:  UEX_API_TOKEN=<token>           (create app at uexcorp.space/api/apps)
 *       PREFLIGHT_ROUTES_SKIP_API=1     (force local/URL fallback even if token set)
 *       PREFLIGHT_ROUTES_URL=<url>      (optional URL for fallback; overrides local JSON)
 *       PREFLIGHT_API_CACHE_MAX_AGE_MS  (default 24h; 0 = always fetch)
 */
import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const CACHE_DIR = join(__dirname, '.api-cache')
const CACHE_FILE = join(CACHE_DIR, 'routes.json')
const LOCAL_JSON = join(ROOT, 'data', 'best-routes.json')
const OUT_PATH = join(ROOT, 'src', 'data', 'routes.generated.ts')

const UEX_BASE = 'https://api.uexcorp.uk/2.0'
const CACHE_MAX_AGE_MS = Number(process.env.PREFLIGHT_API_CACHE_MAX_AGE_MS) ?? 86400000 // 24h
const DELAY_MS = 2000

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

function loadLocal() {
  if (!existsSync(LOCAL_JSON)) return []
  try {
    const raw = readFileSync(LOCAL_JSON, 'utf8')
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (r) => r && typeof r === 'object' && typeof r.id === 'string' && typeof r.label === 'string'
    )
  } catch {
    return []
  }
}

async function loadFromUrl(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`)
  const parsed = await res.json()
  if (!Array.isArray(parsed)) return []
  return parsed.filter(
    (r) => r && typeof r === 'object' && typeof r.id === 'string' && typeof r.label === 'string'
  )
}

function loadCache() {
  if (!existsSync(CACHE_FILE)) return null
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
    writeFileSync(CACHE_FILE, JSON.stringify(payload, null, 0), 'utf8')
  } catch (err) {
    console.warn('Could not write cache:', err.message)
  }
}

async function uexFetch(path, token) {
  await sleep(DELAY_MS)
  const url = `${UEX_BASE}${path}`
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  })
  if (res.status === 429) {
    const retryAfter = Math.min(
      120000,
      Math.max(60000, (Number(res.headers.get('Retry-After')) || 60) * 1000)
    )
    console.warn(`Rate limited (429). Waiting ${retryAfter / 1000}s...`)
    await sleep(retryAfter)
    return uexFetch(path, token)
  }
  if (!res.ok) throw new Error(`UEX API ${res.status}: ${res.statusText} ${url}`)
  return res.json()
}

function mapUexRoute(r) {
  const origin = r.origin_terminal_name || r.origin_terminal_slug || 'Unknown'
  const dest = r.destination_terminal_name || r.destination_terminal_slug || 'Unknown'
  const originSlug = r.origin_terminal_slug || slugify(origin)
  const destSlug = r.destination_terminal_slug || slugify(dest)
  const id = `${originSlug}-${destSlug}`.replace(/--+/g, '-')
  const label = `${origin} – ${dest}`
  const distance = r.distance != null ? Number(r.distance) : 0
  const crossSystem =
    r.id_star_system_origin != null &&
    r.id_star_system_destination != null &&
    r.id_star_system_origin !== r.id_star_system_destination
  const longHaul = crossSystem || distance > 50
  const highValueCommodities = ['laranite', 'quantanium', 'agricium', 'gold', 'titanium']
  const commoditySlug = (r.commodity_slug || r.commodity_name || '').toLowerCase()
  const highValue = highValueCommodities.some((c) => commoditySlug.includes(c))
  return {
    id,
    label,
    ...(longHaul && { longHaul: true }),
    ...(highValue && { highValue: true }),
  }
}

async function fetchFromUex(token) {
  const commoditiesRes = await uexFetch('/commodities/', token)
  const commodities = commoditiesRes?.data ?? commoditiesRes
  const list = Array.isArray(commodities) ? commodities : []
  const ids = list.slice(0, 5).map((c) => c.id).filter((id) => id != null)
  if (ids.length === 0) {
    ids.push(1)
  }

  const allRoutes = []
  const seen = new Set()

  for (const id of ids) {
    const routesRes = await uexFetch(`/commodities_routes/?id_commodity=${id}`, token)
    const routes = routesRes?.data ?? routesRes
    const arr = Array.isArray(routes) ? routes : []
    for (const r of arr) {
      const key =
        `${r.origin_terminal_slug || r.origin_terminal_name}-${r.destination_terminal_slug || r.destination_terminal_name}` ||
        r.code
      if (seen.has(key)) continue
      seen.add(key)
      allRoutes.push(r)
    }
  }

  return allRoutes.map(mapUexRoute)
}

function writeGenerated(routes) {
  const lines = [
    '// Generated by scripts/fetch-routes-api.mjs – do not edit by hand',
    '',
    `export const BEST_ROUTES = ${JSON.stringify(routes, null, 2)} as const`,
    '',
  ]
  writeFileSync(OUT_PATH, lines.join('\n'), 'utf8')
  console.log(`Wrote ${routes.length} best routes to ${OUT_PATH}`)
}

async function main() {
  const token = process.env.UEX_API_TOKEN
  const skipApi = process.env.PREFLIGHT_ROUTES_SKIP_API === '1' || process.env.PREFLIGHT_ROUTES_SKIP_API === 'true'

  if (!token || skipApi) {
    const url = process.env.PREFLIGHT_ROUTES_URL
    const routes = url ? await loadFromUrl(url) : loadLocal()
    writeGenerated(routes)
    return
  }

  let apiRoutes = loadCache()
  if (apiRoutes === null) {
    try {
      apiRoutes = await fetchFromUex(token)
      saveCache(apiRoutes)
    } catch (err) {
      console.warn('UEX API failed, falling back to local:', err.message)
      const url = process.env.PREFLIGHT_ROUTES_URL
      apiRoutes = url ? await loadFromUrl(url) : loadLocal()
    }
  } else {
    console.log(`Using cached routes (${apiRoutes.length} routes)`)
  }

  const localRoutes = loadLocal()
  const localIds = new Set(localRoutes.map((r) => r.id))
  const merged = [...localRoutes]
  for (const r of apiRoutes) {
    if (!localIds.has(r.id)) {
      merged.push(r)
      localIds.add(r.id)
    }
  }

  writeGenerated(merged)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
