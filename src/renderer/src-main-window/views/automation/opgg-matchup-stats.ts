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

const CACHE_MS = 4 * 60 * 60 * 1000
const cache = new Map<string, TopMatchupStats>()

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

  // The fixed-endpoint main-process bridge avoids Electron renderer CORS failures.
  // It sends only the enemy champion alias, never a player's identity or token.
  const response: unknown = await window.electron.ipcRenderer.invoke('akari-top-matchup-stats', alias)
  const normalized = normalizeTopStats(response)
  cache.set(key, normalized)
  return normalized
}

/** Official OP.GG matchup page; does not invoke a private API or embed scraped content. */
export function opggMatchupUrl(enemyAlias: string, candidateAlias?: string): string {
  const enemy = encodeURIComponent(enemyAlias.toLowerCase())
  const url = new URL(`https://op.gg/lol/champions/${enemy}/counters/top`)
  url.searchParams.set('type', 'ranked')
  if (candidateAlias) url.searchParams.set('target_champion', candidateAlias.toLowerCase())
  return url.toString()
}
