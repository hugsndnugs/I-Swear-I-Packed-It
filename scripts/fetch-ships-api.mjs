#!/usr/bin/env node
/**
 * Fetches Star Citizen vehicles from the paginated /api/vehicles endpoint (all spaceships).
 * - Paginates with page[size]=100 until no more pages
 * - Configurable delay between requests (PREFLIGHT_API_DELAY_MS, default 2000)
 * - Cache raw response; skip fetch if cache is fresh (PREFLIGHT_API_CACHE_MAX_AGE_MS, default 24h)
 * - On 429, wait Retry-After (or 60s) and retry
 * - Writes cache to scripts/.api-cache/vehicles.json and src/data/ships.generated.ts
 *
 * Run: node scripts/fetch-ships-api.mjs
 * Env:  PREFLIGHT_API_DELAY_MS=2000   (ms before each request)
 *       PREFLIGHT_API_CACHE_MAX_AGE_MS=86400000 (use cache if newer than this, 0 = always fetch)
 *       PREFLIGHT_API_SKIP_CACHE=1     (ignore cache, always fetch)
 *       PREFLIGHT_FLIGHT_READY_ONLY=1  (default: only write flight-ready ships to generated file)
 */
import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const CACHE_DIR = join(__dirname, '.api-cache')
const CACHE_FILE = join(CACHE_DIR, 'vehicles.json')
const OUT_PATH = join(ROOT, 'src', 'data', 'ships.generated.ts')

const DELAY_MS = Number(process.env.PREFLIGHT_API_DELAY_MS) || 2000
const CACHE_MAX_AGE_MS = Number(process.env.PREFLIGHT_API_CACHE_MAX_AGE_MS) ?? 86400000 // 24h
const SKIP_CACHE = process.env.PREFLIGHT_API_SKIP_CACHE === '1' || process.env.PREFLIGHT_API_SKIP_CACHE === 'true'
const FLIGHT_READY_ONLY = process.env.PREFLIGHT_FLIGHT_READY_ONLY !== '0'

const BASE_URL = 'https://api.star-citizen.wiki/api/vehicles'
const PAGE_SIZE = 100

const CARGO_FOCI = new Set([
  'medium freight', 'heavy freight', 'light freight', 'cargo', 'transport',
  'medium cargo', 'heavy cargo'
])
const COMBAT_FOCI = new Set([
  'light fighter', 'heavy fighter', 'medium fighter', 'gunship', 'bomber',
  'interdiction', 'stealth fighter', 'stealth bomber', 'heavy combat fighter', 'interceptor'
])
const MEDICAL_FOCI = new Set(['medical', 'support - medical'])
const MINING_FOCI = new Set(['prospecting and mining', 'heavy mining'])

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

function mapSize(en) {
  if (!en) return undefined
  const s = String(en).toLowerCase()
  if (['small', 'medium', 'large', 'capital'].includes(s)) return s
  return undefined
}

function mapStatus(en) {
  if (!en) return undefined
  const s = String(en).toLowerCase().replace(/\s+/g, '-')
  if (s === 'flight-ready') return 'flight-ready'
  if (s === 'in-concept' || s === 'concept') return 'in-concept'
  if (s === 'production') return 'production'
  return undefined
}

function deriveRoles(api) {
  const typeEn = (api.type?.en_EN || '').toLowerCase()
  const foci = (api.foci || []).map((f) => (f.en_EN || '').toLowerCase())
  const roleEn = (api.role || '').toLowerCase()
  const crewMax = api.crew?.max ?? 1
  const roles = new Set()
  if (typeEn === 'transport' || foci.some((f) => CARGO_FOCI.has(f)) || roleEn.includes('freight')) roles.add('cargo')
  if (typeEn === 'combat' || foci.some((f) => COMBAT_FOCI.has(f)) || roleEn.includes('fighter') || roleEn.includes('interceptor')) roles.add('combat')
  if (foci.some((f) => MEDICAL_FOCI.has(f))) roles.add('medical')
  if (foci.some((f) => MINING_FOCI.has(f))) roles.add('mining')
  if (crewMax >= 2) roles.add('multi-crew')
  if (roles.size === 0) roles.add('cargo')
  return Array.from(roles)
}

function deriveStorageBehavior(api) {
  const sizeEn = (api.size?.en_EN || '').toLowerCase()
  const typeEn = (api.type?.en_EN || '').toLowerCase()
  if (typeEn === 'combat' && sizeEn === 'small') return 'local'
  if (['large', 'capital'].includes(sizeEn) && typeEn === 'transport') return 'ship'
  if (['medium', 'large'].includes(sizeEn)) return 'both'
  return 'both'
}

function mapVehicle(api) {
  const id = api.slug || api.uuid || String(api.id)
  const name = api.name || api.shipmatrix_name || id
  const status = mapStatus(api.production_status?.en_EN)
  const roles = deriveRoles(api)
  const crewMin = api.crew?.min != null ? api.crew.min : undefined
  const crewMax = api.crew?.max != null ? api.crew.max : undefined
  const cargoScu = api.cargo_capacity != null ? api.cargo_capacity : undefined
  return {
    id,
    name,
    roles,
    storageBehavior: deriveStorageBehavior(api),
    manufacturer: api.manufacturer?.name,
    size: mapSize(api.size?.en_EN),
    status: status || undefined,
    ...(crewMin != null && { crewMin }),
    ...(crewMax != null && { crewMax }),
    ...(cargoScu != null && { cargoScu }),
  }
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
    writeFileSync(CACHE_FILE, JSON.stringify(payload, null, 0), 'utf8')
  } catch (err) {
    console.warn('Could not write cache:', err.message)
  }
}

async function fetchWithRetry(url) {
  await sleep(DELAY_MS)
  const res = await fetch(url)
  if (res.status === 429) {
    const retryAfter = Math.min(
      120000,
      Math.max(60000, (Number(res.headers.get('Retry-After')) || 60) * 1000)
    )
    console.warn(`Rate limited (429). Waiting ${retryAfter / 1000}s...`)
    await sleep(retryAfter)
    return fetchWithRetry(url)
  }
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText} ${url}`)
  return res.json()
}

async function fetchAllVehicles() {
  const all = []
  let page = 1
  const params = new URLSearchParams({
    'page[size]': String(PAGE_SIZE),
    'filter[is_spaceship]': 'true',
  })
  // eslint-disable-next-line no-constant-condition
  while (true) {
    params.set('page[number]', String(page))
    const url = `${BASE_URL}?${params.toString()}`
    console.log(`Fetching page ${page}...`)
    const json = await fetchWithRetry(url)
    const list = json.data || json
    if (!Array.isArray(list)) throw new Error('Unexpected API response shape')
    all.push(...list)
    if (list.length < PAGE_SIZE) break
    page += 1
  }
  console.log(`Received ${all.length} spaceships total`)
  return all
}

function writeGenerated(vehicles) {
  const toEmit = FLIGHT_READY_ONLY
    ? vehicles.filter((v) => (v.production_status?.en_EN || '').toLowerCase() === 'flight-ready')
    : vehicles
  const mapped = toEmit.map(mapVehicle)
  const lines = [
    '/* eslint-disable @typescript-eslint/no-unused-expressions */',
    '// Generated by scripts/fetch-ships-api.mjs – do not edit by hand',
    "import type { ShipProfile } from './shipTypes'",
    '',
    `export const shipsGenerated: ShipProfile[] = ${JSON.stringify(mapped, null, 2)}`,
    '',
  ]
  writeFileSync(OUT_PATH, lines.join('\n'), 'utf8')
  const label = FLIGHT_READY_ONLY ? 'flight-ready' : 'all'
  console.log(`Wrote ${mapped.length} ships (${label}) to ${OUT_PATH}`)
}

async function main() {
  let list = loadCache()
  if (list === null) {
    list = await fetchAllVehicles()
    saveCache(list)
  } else {
    console.log(`Using cached data (${list.length} vehicles)`)
  }

  writeGenerated(list)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
