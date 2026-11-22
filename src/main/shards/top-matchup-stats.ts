import { ipcMain } from 'electron'

/**
 * Opt-in data lookup: renderer cannot call cross-origin MCP from Electron with
 * web security enabled, so only this fixed OP.GG endpoint is reachable here.
 * No arbitrary URL, authentication, Riot IDs, or private game state is accepted.
 */
const ENDPOINT = 'https://mcp-api.op.gg/mcp'
const CACHE_MS = 4 * 60 * 60 * 1000
const cache = new Map<string, { at: number; value: unknown }>()
const inFlight = new Map<string, Promise<unknown>>()
let requestId = 0

type RpcPayload = {
  result?: { content?: { text?: string }[]; isError?: boolean }
  error?: { message?: string }
}
const extractEvent = (raw: string): RpcPayload => {
  const lines = raw.split(/\r?\n/).filter((line) => line.startsWith('data:'))
  const payload = lines.length ? lines[lines.length - 1].slice(5).trim() : raw
  return JSON.parse(payload) as RpcPayload
}

async function requestRpc(
  method: string,
  params: Record<string, unknown>,
  sessionId: string | null,
  signal: AbortSignal
): Promise<{ data: RpcPayload; sessionId: string | null }> {
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      Accept: 'application/json, text/event-stream',
      'Content-Type': 'application/json',
      ...(sessionId ? { 'Mcp-Session-Id': sessionId } : {})
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: ++requestId, method, params }),
    signal
  })
  if (!response.ok) throw new Error(`OP.GG HTTP ${response.status}`)
  const text = await response.text()
  if (text.length > 2_000_000) throw new Error('OP.GG response exceeds size limit')
  const data = extractEvent(text)
  if (data.error) throw new Error(data.error.message ?? 'OP.GG request rejected')
  return { data, sessionId: response.headers.get('mcp-session-id') ?? sessionId }
}

async function fetchOne(enemyAlias: string): Promise<unknown> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 16000)
  try {
    const init = await requestRpc('initialize', {
      protocolVersion: '2025-03-26',
      capabilities: {},
      clientInfo: { name: 'league-akari-enhanced', version: '0.1.0' }
    }, null, controller.signal)
    const tool = await requestRpc('tools/call', {
      name: 'lol_get_lane_matchup_guide',
      arguments: {
        position: 'top',
        my_champion: enemyAlias,
        opponent_champion: enemyAlias
      }
    }, init.sessionId, controller.signal)
    if (tool.data.result?.isError) throw new Error('OP.GG guide tool returned an error')
    const text = (tool.data.result?.content ?? []).map((part) => part.text ?? '').join('\n')
    if (!text || text.length > 2_000_000) throw new Error('OP.GG returned invalid guide text')
    return JSON.parse(text) as unknown
  } finally {
    clearTimeout(timer)
  }
}

export function registerTopMatchupStatsIpc() {
  ipcMain.handle('akari-top-matchup-stats', async (_event, alias: unknown) => {
    if (typeof alias !== 'string' || !/^[a-zA-Z0-9]{2,36}$/.test(alias)) {
      throw new Error('Invalid champion alias')
    }

    const key = alias.toLowerCase()
    const stored = cache.get(key)
    if (stored && Date.now() - stored.at < CACHE_MS) return stored.value

    // Prevent parallel duplicate lookups; avoid API hammering from rapid clicks.
    const existing = inFlight.get(key)
    if (existing) return existing

    const job = fetchOne(alias).then((value) => {
      cache.set(key, { at: Date.now(), value })
      return value
    }).finally(() => inFlight.delete(key))

    inFlight.set(key, job)
    return job
  })
}
