#!/usr/bin/env node
/**
 * Fetches Star Citizen commodities from UEX API or uses local data.
 * - When UEX_API_TOKEN is set: fetches from UEX API /commodities/ endpoint
 * - Falls back to cache, then local data/commodities.json, then existing commodities.ts
 * - Writes src/data/commodities.generated.ts
 *
 * Run: node scripts/fetch-commodities.mjs
 * Env:  UEX_API_TOKEN=<token>           (create app at uexcorp.space/api/apps)
 *       PREFLIGHT_COMMODITIES_SKIP_API=1 (force local fallback even if token set)
 *       PREFLIGHT_API_CACHE_MAX_AGE_MS=86400000 (use cache if newer than this, 0 = always fetch)
 *       PREFLIGHT_API_SKIP_CACHE=1     (ignore cache, always fetch)
 */
import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const CACHE_DIR = join(__dirname, '.api-cache')
const CACHE_FILE = join(CACHE_DIR, 'commodities.json')
const LOCAL_JSON = join(ROOT, 'data', 'commodities.json')
const OUT_PATH = join(ROOT, 'src', 'data', 'commodities.generated.ts')

const UEX_BASE = 'https://api.uexcorp.uk/2.0'
const CACHE_MAX_AGE_MS = Number(process.env.PREFLIGHT_API_CACHE_MAX_AGE_MS) ?? 86400000 // 24h
const SKIP_CACHE = process.env.PREFLIGHT_API_SKIP_CACHE === '1' || process.env.PREFLIGHT_API_SKIP_CACHE === 'true'
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

function determineCategory(name) {
  if (!name || typeof name !== 'string') return 'general'
  const lower = name.toLowerCase()
  
  // Scrap category
  if (lower.includes('scrap') || lower.includes('recyclable') || 
      lower.includes('construction') || lower.includes('waste') ||
      lower.includes('salvage')) {
    return 'scrap'
  }
  
  // Ore category
  if (lower.includes('agricium') || lower.includes('laranite') || 
      lower.includes('titanium') || lower.includes('quantanium') ||
      lower.includes('ore') || lower.includes('mineral') ||
      lower.includes('raw')) {
    return 'ore'
  }
  
  // Medical category
  if (lower.includes('medical') || lower.includes('stim') || 
      lower.includes('medpen') || lower.includes('health')) {
    return 'medical'
  }
  
  // Food category
  if (lower.includes('food') || lower.includes('water') || 
      lower.includes('provision') || lower.includes('consumable')) {
    return 'food'
  }
  
  // High-value category
  if (lower.includes('refined') || lower.includes('processed') || 
      lower.includes('luxury') || lower.includes('gold')) {
    return 'high-value'
  }
  
  // Default to general
  return 'general'
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

function mapUexCommodity(uexCommodity) {
  const name = uexCommodity.name || uexCommodity.commodity_name || 'Unknown'
  const id = slugify(name)
  const label = name
  const category = determineCategory(name)
  const scuPerUnit = uexCommodity.scu_per_unit !== undefined ? Number(uexCommodity.scu_per_unit) : 1
  
  return {
    id,
    label,
    category,
    scuPerUnit: scuPerUnit !== 1 ? scuPerUnit : undefined
  }
}

function loadLocal() {
  if (!existsSync(LOCAL_JSON)) return []
  try {
    const raw = readFileSync(LOCAL_JSON, 'utf8')
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (c) => c && typeof c === 'object' && typeof c.id === 'string' && typeof c.label === 'string'
    )
  } catch {
    return []
  }
}

function loadExistingCommodities() {
  // Load from existing commodities.ts as fallback seed data
  try {
    const commoditiesPath = join(ROOT, 'src', 'data', 'commodities.ts')
    if (!existsSync(commoditiesPath)) return []
    const content = readFileSync(commoditiesPath, 'utf8')
    // Extract COMMODITIES array using regex (simple approach)
    const match = content.match(/export const COMMODITIES[^=]*=\s*\[([\s\S]*?)\]/)
    if (!match) return []
    
    // Parse the array entries - this is a simplified parser
    const entries = []
    const entryRegex = /\{\s*id:\s*['"]([^'"]+)['"],\s*label:\s*['"]([^'"]+)['"],\s*category:\s*['"]([^'"]+)['"](?:,\s*scuPerUnit:\s*(\d+))?\s*\}/g
    let m
    while ((m = entryRegex.exec(match[1])) !== null) {
      entries.push({
        id: m[1],
        label: m[2],
        category: m[3],
        scuPerUnit: m[4] ? Number(m[4]) : undefined
      })
    }
    return entries
  } catch {
    return []
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
    writeFileSync(CACHE_FILE, JSON.stringify(payload, null, 2), 'utf8')
  } catch (err) {
    console.warn('Could not write cache:', err.message)
  }
}

async function fetchFromUex(token) {
  console.log('Fetching commodities from UEX API...')
  
  // First, try fetching without pagination to see the response structure
  const firstRes = await uexFetch('/commodities/', token)
  console.log('API response structure:', {
    hasData: !!firstRes?.data,
    isArray: Array.isArray(firstRes),
    dataIsArray: Array.isArray(firstRes?.data),
    keys: firstRes ? Object.keys(firstRes) : [],
    dataLength: Array.isArray(firstRes?.data) ? firstRes.data.length : 'N/A',
    directLength: Array.isArray(firstRes) ? firstRes.length : 'N/A'
  })
  
  // Handle different response formats
  let commodities = firstRes?.data ?? firstRes
  if (!Array.isArray(commodities)) {
    // Try other common response formats
    if (firstRes?.results && Array.isArray(firstRes.results)) {
      commodities = firstRes.results
    } else if (firstRes?.items && Array.isArray(firstRes.items)) {
      commodities = firstRes.items
    } else {
      // Log the actual response for debugging
      console.log('Unexpected response format, attempting to parse:', JSON.stringify(firstRes).substring(0, 500))
      throw new Error('Unexpected API response format - expected array or object with data/results/items array')
    }
  }
  
  const allCommodities = [...commodities]
  console.log(`Received ${allCommodities.length} commodities from first page`)
  
  // Check if there's pagination info in the response
  const hasMore = firstRes?.next || firstRes?.has_more || firstRes?.pagination?.has_more
  const totalCount = firstRes?.count || firstRes?.total || firstRes?.pagination?.total
  
  if (totalCount && totalCount > allCommodities.length) {
    console.log(`API indicates ${totalCount} total commodities, but only received ${allCommodities.length}`)
  }
  
  // If we got fewer than expected and there's indication of more pages, try pagination
  // Also try pagination if we got fewer than 50 items (user expects 80-90)
  if (hasMore || (totalCount && totalCount > allCommodities.length) || allCommodities.length < 50) {
    if (allCommodities.length < 50) {
      console.log(`Only received ${allCommodities.length} commodities, attempting pagination to fetch more...`)
    } else {
      console.log('Attempting to fetch additional pages...')
    }
    let page = 2
    const pageSize = 100
    
    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        const path = `/commodities/?page=${page}&per_page=${pageSize}`
        console.log(`Fetching page ${page}...`)
        const pageRes = await uexFetch(path, token)
        
        let pageCommodities = pageRes?.data ?? pageRes
        if (!Array.isArray(pageCommodities)) {
          if (pageRes?.results && Array.isArray(pageRes.results)) {
            pageCommodities = pageRes.results
          } else if (pageRes?.items && Array.isArray(pageRes.items)) {
            pageCommodities = pageRes.items
          } else {
            break
          }
        }
        
        if (!Array.isArray(pageCommodities) || pageCommodities.length === 0) {
          break
        }
        
        allCommodities.push(...pageCommodities)
        console.log(`  Received ${pageCommodities.length} commodities (total: ${allCommodities.length})`)
        
        // Check if there's more
        const pageHasMore = pageRes?.next || pageRes?.has_more || pageRes?.pagination?.has_more
        if (!pageHasMore && pageCommodities.length < pageSize) {
          break
        }
        
        page += 1
      } catch (err) {
        console.warn(`Error fetching page ${page}, stopping pagination:`, err.message)
        break
      }
    }
  }
  
  if (allCommodities.length === 0) {
    throw new Error('No commodities returned from UEX API')
  }
  
  console.log(`Total: ${allCommodities.length} commodities fetched from UEX API`)
  return allCommodities.map(mapUexCommodity)
}

async function fetchCommodities(token, skipApi) {
  console.log('Fetching commodities...')
  console.log(`Token available: ${!!token}, Skip API: ${skipApi}`)
  
  // Try UEX API first if token is available and not skipped
  if (token && !skipApi) {
    let apiCommodities = loadCache()
    // If cache has very few items (< 50), fetch fresh data to ensure we get all commodities
    if (apiCommodities === null || (apiCommodities.length > 0 && apiCommodities.length < 50)) {
      if (apiCommodities && apiCommodities.length < 50) {
        console.log(`Cache has only ${apiCommodities.length} items, fetching fresh data...`)
      }
      try {
        apiCommodities = await fetchFromUex(token)
        saveCache(apiCommodities)
      } catch (err) {
        console.warn('UEX API failed, falling back to local:', err.message)
        // If we had cached data, use it even if it's incomplete
        if (apiCommodities === null) {
          apiCommodities = loadCache()
        }
        if (!apiCommodities || apiCommodities.length === 0) {
          apiCommodities = null
        }
      }
    } else {
      console.log(`Using cached commodities (${apiCommodities.length} items)`)
    }
    
    if (apiCommodities && apiCommodities.length > 0) {
      return apiCommodities
    }
  }
  
  // Try local JSON file
  const local = loadLocal()
  if (local.length > 0) {
    console.log(`Using local commodities (${local.length} items)`)
    saveCache(local)
    return local
  }
  
  // Fallback to existing commodities.ts
  const existing = loadExistingCommodities()
  if (existing.length > 0) {
    console.log(`⚠️  Using existing commodities from commodities.ts (${existing.length} items)`)
    console.log(`   This is a fallback - set UEX_API_TOKEN to fetch from API`)
    return existing
  }
  
  // Last resort: return empty array
  console.warn('No commodities data found anywhere')
  return []
}

function generateCommoditiesFile(commodities) {
  const lines = [
    '/**',
    ' * Generated commodities list.',
    ' * Auto-generated by scripts/fetch-commodities.mjs',
    ' * Do not edit manually.',
    ' */',
    '',
    "import type { CommodityType } from './commodities'",
    '',
    'export const COMMODITIES_GENERATED: CommodityType[] = ['
  ]

  for (const c of commodities) {
    const category = c.category || 'general'
    const scuPerUnit = c.scuPerUnit !== undefined ? c.scuPerUnit : 1
    const scuPerUnitStr = scuPerUnit !== 1 ? `, scuPerUnit: ${scuPerUnit}` : ''
    lines.push(
      `  { id: ${JSON.stringify(c.id)}, label: ${JSON.stringify(c.label)}, category: ${JSON.stringify(category)}${scuPerUnitStr} },`
    )
  }

  lines.push(']')
  lines.push('')

  return lines.join('\n')
}

async function main() {
  try {
    const token = process.env.UEX_API_TOKEN
    const skipApi = process.env.PREFLIGHT_COMMODITIES_SKIP_API === '1' || 
                     process.env.PREFLIGHT_COMMODITIES_SKIP_API === 'true'
    
    if (!token) {
      console.log('ℹ️  No UEX_API_TOKEN set - will use fallback data')
      console.log('   Set UEX_API_TOKEN environment variable to fetch from API')
      console.log('   PowerShell: $env:UEX_API_TOKEN="your-token"')
      console.log('   Bash: export UEX_API_TOKEN="your-token"')
    }
    
    const commodities = await fetchCommodities(token, skipApi)
    
    if (commodities.length === 0) {
      console.log('No commodities to generate, skipping file write')
      return
    }

    const content = generateCommoditiesFile(commodities)
    writeFileSync(OUT_PATH, content, 'utf8')
    console.log(`✓ Wrote ${commodities.length} commodities to ${OUT_PATH}`)
  } catch (err) {
    console.error('Error fetching commodities:', err)
    process.exit(1)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
