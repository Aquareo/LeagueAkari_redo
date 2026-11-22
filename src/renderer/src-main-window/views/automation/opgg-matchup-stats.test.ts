import { describe, expect, it } from 'vitest'

import { normalizeTopStats, opggMatchupUrl } from './opgg-matchup-stats'

describe('normalizeTopStats', () => {
  it('inverts enemy-side win counts for the champion the user can pick', () => {
    const data = normalizeTopStats({
      data: {
        counters: [
          { champion_id: 122, play: 500, win: 275 },
          { champion_id: 24, play: 200, win: 90 }
        ],
        trends: { win: [{ version: '26.22', rate: 0.53 }] }
      }
    }, 1234)
    expect(data.patch).toBe('26.22')
    expect(data.fetchedAt).toBe(1234)
    expect(data.rows).toEqual([
      { opponentId: 122, games: 500, wins: 225, winRate: 45 },
      { opponentId: 24, games: 200, wins: 110, winRate: 55.00000000000001 }
    ])
  })

  it('rejects malformed counts and impossible wins instead of producing fake stats', () => {
    const data = normalizeTopStats({
      data: { counters: [
        { champion_id: 2, play: 10, win: 11 },
        { champion_id: 3, play: -1, win: 0 },
        { champion_id: 4, play: 100, win: 45 }
      ] }
    })
    expect(data.rows).toHaveLength(1)
    expect(data.rows[0].opponentId).toBe(4)
    expect(data.patch).toBeNull()
  })

  it('fails clearly when the upstream service schema changes', () => {
    expect(() => normalizeTopStats({ data: {} })).toThrow('matchup counts')
    expect(() => normalizeTopStats({ data: { counters: [] } })).toThrow('usable')
  })
})

describe('opggMatchupUrl', () => {
  it('points to the official top lane matchup page, including candidate filter', () => {
    const url = new URL(opggMatchupUrl('Darius', 'Quinn'))
    expect(url.hostname).toBe('op.gg')
    expect(url.pathname).toBe('/lol/champions/darius/counters/top')
    expect(url.searchParams.get('target_champion')).toBe('quinn')
    expect(url.searchParams.get('type')).toBe('ranked')
  })
})
