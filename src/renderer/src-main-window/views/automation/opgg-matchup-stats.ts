/**
 * Optional, user-triggered OP.GG matchup lookup.
 * Uses OP.GG's public MCP endpoint directly, without scraping private HTML/API routes.
 * One guide lookup per enemy champion, no prefetch/bulk crawling, no account identifiers.
 * OP.GG may change access rules: always provide a link to the official page as fallback.
 *
 * The endpoint's use in other third-party applications does not confer blanket
 * redistribution rights. Keep source attribution visible and review usage policy
 * before publishing a wider release.
 */
export interface HeadToHeadStats {
  opponentId: number
  games: number
  wins: number // wins for candidate against enemy, not enemy wins
  winRate: number
}

export interface TopMatchupStats {
  source: 'OP.GG'
  patch: string | null
  fetchedAt: number
  rows: HeadToHeadStats[]
}

const ENDPOINT = 'https://mcp-api.op.gg/mcp'
const CACHE_MS = 4 * 60 * 60 * 1000
const cache = new Map<string, TopMatchupStats>()
let sequence = 0

function parseRpcResponse(source: string): { result?: unknown; error?: { message?: string } } {
  // Streamable HTTP may respond with JSON or Server-Sent Events (SSE).
  const events = source.split(/\r?\n/).filter((line) => line.startsWith('data:'))
  const payload = events.length ? events[events.length - 1].slice(5).trim() : source
  const result: unknown = JSON.parse(payload)
  if (!result || typeof result !== 'object') throw new Error('Invalid OP.GG response')
  return result as { result?: unknown; error?: { message?: string } }
}

async function postRpc(
  method: string,
  params: Record<string, unknown>,
  sessionId: string | null,
  signal: AbortSignal
): Promise<{ body: { result?: unknown; error?: { message?: string } }; sessionId: string | null }> {
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
      ...(sessionId ? { 'Mcp-Session-Id': sessionId } : {})
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: ++sequence, method, params }),
    signal
  })
  if (!response.ok) throw new Error(`OP.GG HTTP ${response.status}`)
  const body = parseRpcResponse(await response.text())
  if (body.error) throw new Error(body.error.message || 'OP.GG rejected request')
  return { body, sessionId: response.headers.get('mcp-session-id') ?? sessionId }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const finitePositive = (value: unknown): number | null => {
  const n = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN
  return Number.isFinite(n) && n >= 0 ? n : null
}

export function normalizeTopStats(raw: unknown, fetchedAt = Date.now()): TopMatchupStats {
  if (!isRecord(raw) || !isRecord(raw.data)) throw new Error('Missing OP.GG matchup data')
  const data = raw.data
  if (!Array.isArray(data.counters)) throw new Error('OP.GG did not return matchup counts')
  const rows: HeadToHeadStats[] = []
  for (const input of data.counters) {
    if (!isRecord(input)) continue
    const opponentId = finitePositive(input.champion_id)
    const games = finitePositive(input.play)
    const enemyWins = finitePositive(input.win)
    if (
      opponentId === null || !Number.isInteger(opponentId) || opponentId <= 0 ||
      games === null || !Number.isInteger(games) || games <= 0 ||
      enemyWins === null || !Number.isInteger(enemyWins) || enemyWins > games
    ) continue
    const wins = games - enemyWins
    rows.push({ opponentId, games, wins, winRate: (wins / games) * 100 })
  }
  if (!rows.length) throw new Error('No usable OP.GG matchup samples')

  let patch: string | null = null
  if (isRecord(data.trends) && Array.isArray(data.trends.win)) {
    const latest = data.trends.win[0]
    if (isRecord(latest) && typeof latest.version === 'string') patch = latest.version
  }

  return { source: 'OP.GG', patch, fetchedAt, rows }
}

/**
 * Only needs a Data Dragon champion alias, e.g. "Darius".
 * No summoner names, PUUIDs or other private client data are sent.
 */
export async function fetchTopMatchupStats(enemyAlias: string): Promise<TopMatchupStats> {
  const alias = enemyAlias.trim()
  if (!/^[a-zA-Z0-9]{2,36}$/.test(alias)) throw new Error('Invalid champion alias')
  const key = alias.toLowerCase()
  const previous = cache.get(key)
  if (previous && Date.now() - previous.fetchedAt < CACHE_MS) return previous

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 16000)
  try {
    const initialized = await postRpc('initialize', {
      protocolVersion: '2025-03-26',
      capabilities: {},
      clientInfo: { name: 'league-akari-enhanced', version: '0.1.0' }
    }, null, controller.signal)

    const result = await postRpc('tools/call', {
      name: 'lol_get_lane_matchup_guide',
      arguments: {
        position: 'top',
        my_champion: alias,
        opponent_champion: alias
      }
    }, initialized.sessionId, controller.signal)

    const value = result.body.result
    if (!isRecord(value)) throw new Error('Empty OP.GG tool response')
    if (value.isError === true) throw new Error('OP.GG guide tool returned an error')
    const content = value.content
    if (!Array.isArray(content)) throw new Error('Missing OP.GG guide content')
    const texts = content.filter(isRecord).map((part) => part.text).filter((x): x is string => typeof x === 'string')
    if (!texts.length) throw new Error('Missing OP.GG text data')
    // The matchup guide returns JSON text. Do not guess values when its schema changes.
    const normalized = normalizeTopStats(JSON.parse(texts.join('\n')))
    cache.set(key, normalized)
    return normalized
  } finally {
    clearTimeout(timeout)
  }
}

/** Official OP.GG matchup page; does not invoke a private API or embed scraped content. */
export function opggMatchupUrl(enemyAlias: string, candidateAlias?: string): string {
  const enemy = encodeURIComponent(enemyAlias.toLowerCase())
  const url = new URL(`https://op.gg/lol/champions/${enemy}/counters/top`)
  url.searchParams.set('type', 'ranked')
  if (candidateAlias) url.searchParams.set('target_champion', candidateAlias.toLowerCase())
  return url.toString()
}
