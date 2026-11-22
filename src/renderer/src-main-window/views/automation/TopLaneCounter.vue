<template>
  <div class="counter-page">
    <NScrollbar class="h-full">
      <div class="counter-wrap">
        <header class="counter-heading">
          <div>
            <div class="counter-kicker">{{ isZh ? '选人辅助 · TOP LANE' : 'DRAFT ASSISTANT · TOP LANE' }}</div>
            <h2>{{ isZh ? '上路对位助手' : 'Top lane matchups' }}</h2>
            <p>{{ isZh ? '依据已公开的英雄选择信息提供对位思路，最终由你决定选谁。' : 'Matchup ideas using publicly revealed champion picks. You make the final call.' }}</p>
          </div>
          <NTag size="small" :type="lcs.champSelect.session ? 'success' : 'default'" round>
            {{ lcs.champSelect.session ? (isZh ? '选人阶段' : 'Draft active') : (isZh ? '离线预览' : 'Offline preview') }}
          </NTag>
        </header>

        <div class="counter-panel counter-inputs">
          <div class="counter-input-group">
            <label class="counter-label">{{ isZh ? '对面上单' : 'Enemy top laner' }}</label>
            <NSelect
              v-model:value="manualEnemyId"
              :options="championOptions"
              filterable
              clearable
              :placeholder="isZh ? '搜索英雄或从已出现的敌方英雄选择' : 'Find a champion or choose a revealed enemy'"
              :disabled="!championOptions.length"
            />
            <div v-if="autoEnemyId" class="counter-tip">
              {{ isZh ? '检测到已公开的上路位置：' : 'Revealed top lane pick: ' }}
              <button type="button" class="counter-text-button" @click="manualEnemyId = autoEnemyId">{{ championLabel(autoEnemyId) }}</button>
            </div>
            <div v-else-if="revealedEnemies.length" class="counter-tip">
              {{ isZh ? '已公开的敌方英雄（位置尚不确定）：' : 'Revealed enemies (lane not confirmed):' }}
              <button v-for="id in revealedEnemies" :key="id" type="button" class="counter-pill" @click="manualEnemyId = id">
                {{ championLabel(id) }}
              </button>
            </div>
            <p v-else class="counter-hint">{{ isZh ? '无法确定对方上路时，请手动选择；不会推测隐藏信息。' : 'Select manually if the enemy role is unknown. Hidden information is never inferred.' }}</p>
          </div>
          <div class="counter-input-group">
            <label class="counter-label">{{ isZh ? '我的常用英雄（可选）' : 'My champion pool (optional)' }}</label>
            <NSelect
              v-model:value="myPool"
              :options="championOptions"
              multiple
              filterable
              clearable
              :max-tag-count="2"
              :placeholder="isZh ? '优先显示你熟悉的英雄' : 'Prioritize champions you play'"
              :disabled="!championOptions.length"
            />
            <p class="counter-hint">{{ isZh ? '保存在本机；只影响优先顺序，不修改原有自动选英雄设置。' : 'Saved locally. Changes ordering only, never auto-locks a champion.' }}</p>
          </div>
        </div>

        <section class="counter-live">
          <div class="counter-live__intro">
            <div>
              <div class="counter-live__eyebrow">{{ isZh ? 'DATA · OP.GG' : 'DATA · OP.GG' }}</div>
              <strong>{{ isZh ? '当前版本对位数据' : 'Live matchup statistics' }}</strong>
              <p>{{ isZh ? '按需查询真实排位样本；低于 200 场不参与推荐排序。' : 'Real ranked samples on demand; fewer than 200 games are excluded from rankings.' }}</p>
            </div>
            <div class="counter-live__actions">
              <NButton :disabled="!selectedEnemyAlias" :loading="statsLoading" size="small" type="primary" @click="loadLiveStats">
                {{ isZh ? '获取最新数据' : 'Fetch live stats' }}
              </NButton>
              <ExternalLink v-if="selectedEnemyAlias" :href="opggMatchupUrl(selectedEnemyAlias)" class="counter-link">
                {{ isZh ? '前往 OP.GG' : 'Open OP.GG' }}
              </ExternalLink>
            </div>
          </div>
          <div v-if="liveStats" class="counter-live__meta">
            <NTag type="success" size="small" :bordered="false">{{ isZh ? '真实样本' : 'Real samples' }}</NTag>
            <span>{{ isZh ? '版本' : 'Patch' }}: {{ liveStats.patch || (isZh ? '来源未提供' : 'unavailable') }}</span>
            <span>{{ isZh ? '更新时间' : 'Fetched' }}: {{ new Date(liveStats.fetchedAt).toLocaleString() }}</span>
            <span>{{ isZh ? '统计源' : 'Source' }}: OP.GG</span>
          </div>
          <p v-if="statsError" class="counter-live__error" role="status">
            {{ isZh ? '暂时无法读取第三方数据：' : 'Third-party data unavailable: ' }}{{ statsError }}
            <span>{{ isZh ? '可使用上面的 OP.GG 链接直接查看。' : 'Use the official OP.GG link above instead.' }}</span>
          </p>
          <p v-else-if="!liveStats" class="counter-live__hint">
            {{ isZh ? '不会上传你的账号信息。若服务无法跨域访问，会保留外部官网入口。' : 'No account identifiers are sent. The official site link remains available if browser access is blocked.' }}
          </p>
        </section>

        <div class="counter-results-header">
          <div>
            <h3>{{ isZh ? '对位建议' : 'Matchup ideas' }}</h3>
            <p>{{ liveStats ? (isZh ? '依据对位胜率、样本量与熟练英雄排序，供参考。' : 'Ordered using sample-aware stats and champion familiarity.') : (isZh ? '未加载数据时展示定性对线思路。' : 'Curated qualitative ideas until statistics are loaded.') }}</p>
          </div>
          <NTag size="small" :bordered="false">{{ liveStats ? (isZh ? '有版本数据' : 'Stats loaded') : (isZh ? '选人参考' : 'Draft reference') }}</NTag>
        </div>

        <div v-if="!selectedEnemyId" class="counter-empty">
          <div class="counter-empty-icon">⌕</div>
          <strong>{{ isZh ? '先选择对方的上路英雄' : 'Select an enemy champion' }}</strong>
          <span>{{ isZh ? '我们会展示候选英雄、选择原因与需要注意的风险。' : 'See candidate picks, rationale, and tradeoffs.' }}</span>
        </div>
        <div v-else-if="!suggestions.length" class="counter-empty">
          <strong>{{ isZh ? '暂无足够的对位样本' : 'No matchups with sufficient samples' }}</strong>
          <span>{{ isZh ? '点击“获取最新数据”查询 OP.GG；无数据时不伪造胜率。' : 'Fetch OP.GG stats; no win rates are invented when data is missing.' }}</span>
        </div>
        <div v-else class="counter-cards">
          <article v-for="(item, index) in suggestions" :key="item.champion" class="counter-card">
            <div class="counter-card-main">
              <span class="counter-rank">{{ String(index + 1).padStart(2, '0') }}</span>
              <LcuImage v-if="item.id" class="counter-avatar" :src="champions[item.id]?.squarePortraitPath" />
              <div class="counter-card-copy">
                <div class="counter-card-name">
                  <strong>{{ item.id ? championLabel(item.id) : item.champion }}</strong>
                  <NTag v-if="item.inMyPool" type="success" size="tiny" :bordered="false">
                    {{ isZh ? '常用' : 'My pool' }}
                  </NTag>
                  <NTag v-if="item.unavailable" type="warning" size="tiny" :bordered="false">
                    {{ isZh ? '本局不可选' : 'Unavailable' }}
                  </NTag>
                </div>
                <p>{{ isZh ? item.reasonZh : item.reasonEn }}</p>
                <div v-if="item.stats" class="counter-stat-line">
                  <strong>{{ item.stats.winRate.toFixed(1) }}%</strong>
                  <span>{{ isZh ? '对阵胜率' : 'win rate vs enemy' }}</span>
                  <span>·</span>
                  <span>{{ item.stats.games.toLocaleString() }} {{ isZh ? '场' : 'games' }}</span>
                  <ExternalLink v-if="selectedEnemyAlias" :href="opggMatchupUrl(selectedEnemyAlias, item.champion)" class="counter-stat-source">OP.GG</ExternalLink>
                </div>
                <div v-else-if="liveStats" class="counter-stat-unknown">{{ isZh ? '样本不足或来源未覆盖，暂无可靠胜率' : 'Sample unavailable or too small for a reliable rate' }}</div>
              </div>
            </div>
            <div class="counter-caution"><span>{{ isZh ? '注意' : 'CAUTION' }}</span>{{ isZh ? item.cautionZh : item.cautionEn }}</div>
          </article>
        </div>

        <div class="counter-disclaimer">
          {{ isZh ? '说明：对位数据由 OP.GG 提供，可能因地区、段位、版本、样本和时间而变化。低样本不显示可信胜率。客户端仅向 OP.GG 发送英雄标识，不上传账号；不读取隐藏选人信息、不自动锁定。' : 'Matchup data is provided by OP.GG and varies by region, tier, patch and sample. Small samples are not ranked. Only a champion identifier is sent; no account details, hidden picks or auto-locking.' }}
        </div>
      </div>
    </NScrollbar>
  </div>
</template>

<script setup lang="ts">
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import ExternalLink from '@renderer-shared/components/ExternalLink.vue'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { NButton, NScrollbar, NSelect, NTag } from 'naive-ui'
import { computed, ref, watch } from 'vue'

import { TOP_MATCHUP_NOTES } from './top-matchups'
import {
  fetchTopMatchupStats,
  opggMatchupUrl,
  type HeadToHeadStats,
  type TopMatchupStats
} from './opgg-matchup-stats'

const lcs = useLeagueClientStore()
const app = useAppCommonStore()
const isZh = computed(() => app.settings.locale !== 'en')
const champions = computed(() => lcs.gameData.champions)
const championOptions = computed(() =>
  Object.values(champions.value)
    .map((c) => ({ label: c.name, value: c.id }))
    .sort((a, b) => a.label.localeCompare(b.label, isZh.value ? 'zh-CN' : 'en'))
)
const championLabel = (id: number) => champions.value[id]?.name ?? String(id)

const autoEnemyId = computed(() => {
  const picks = lcs.champSelect.session?.theirTeam ?? []
  const top = picks.filter((p) => p.assignedPosition?.toLowerCase() === 'top' && p.championId > 0)
  return top.length === 1 ? top[0].championId : null
})
const revealedEnemies = computed(() =>
  [...new Set((lcs.champSelect.session?.theirTeam ?? []).map((p) => p.championId).filter((id) => id > 0))]
)

const manualEnemyId = ref<number | null>(null)
const selectedEnemyId = computed(() => manualEnemyId.value ?? autoEnemyId.value)
const selectedEnemyAlias = computed(() =>
  selectedEnemyId.value ? champions.value[selectedEnemyId.value]?.alias || null : null
)

const liveStats = ref<TopMatchupStats | null>(null)
const statsLoading = ref(false)
const statsError = ref('')
let statsSequence = 0

const loadLiveStats = async () => {
  const alias = selectedEnemyAlias.value
  if (!alias) return
  const request = ++statsSequence
  statsLoading.value = true
  statsError.value = ''
  try {
    const result = await fetchTopMatchupStats(alias)
    if (request === statsSequence && selectedEnemyAlias.value === alias) liveStats.value = result
  } catch (error) {
    if (request === statsSequence) statsError.value = error instanceof Error ? error.message : 'Network error'
  } finally {
    if (request === statsSequence) statsLoading.value = false
  }
}

watch(selectedEnemyAlias, () => {
  ++statsSequence
  liveStats.value = null
  statsError.value = ''
  statsLoading.value = false
})
watch(() => lcs.champSelect.session?.gameId, () => { manualEnemyId.value = null })

const POOL_KEY = 'akari-enhanced-top-counter-pool'
const readPool = (): number[] => {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(POOL_KEY) || '[]')
    return Array.isArray(value) ? value.filter((id): id is number => typeof id === 'number' && Number.isFinite(id)).slice(0, 30) : []
  } catch { return [] }
}
const myPool = ref<number[]>(readPool())
watch(myPool, (value) => {
  try { localStorage.setItem(POOL_KEY, JSON.stringify(value.slice(0, 30))) } catch { /* private mode */ }
})

const MIN_MATCHUP_GAMES = 200

const wilsonLower = (wins: number, games: number) => {
  if (!games) return 0
  const p = wins / games
  const z = 1.96
  const z2 = z * z
  return (p + z2 / (2 * games) - z * Math.sqrt((p * (1 - p) + z2 / (4 * games)) / games)) / (1 + z2 / games)
}

const suggestions = computed(() => {
  const selected = selectedEnemyId.value
  if (!selected) return []
  const enemyAlias = champions.value[selected]?.alias
  if (!enemyAlias) return []
  const notes = TOP_MATCHUP_NOTES[enemyAlias] ?? []
  const noteMap = new Map(notes.map((item) => [item.champion.toLowerCase(), item]))
  const availableIds = lcs.champSelect.currentPickableChampionIds
  const hasRestriction = Boolean(lcs.champSelect.session && availableIds.size > 0)
  const knownPicks = new Set([
    ...(lcs.champSelect.session?.myTeam ?? []).map((x) => x.championId),
    ...(lcs.champSelect.session?.theirTeam ?? []).map((x) => x.championId),
    ...(lcs.champSelect.session?.bans?.myTeamBans ?? []),
    ...(lcs.champSelect.session?.bans?.theirTeamBans ?? [])
  ])

  const statsMap = new Map<number, HeadToHeadStats>(
    (liveStats.value?.rows ?? []).filter((row) => row.games >= MIN_MATCHUP_GAMES)
      .map((row) => [row.opponentId, row])
  )
  // With live stats, show a broad data-backed short list beyond the curated notes.
  // Without stats, preserve the original hand-curated suggestions.
  const recommendedIds = liveStats.value
    ? [...statsMap.values()].filter((row) => row.opponentId !== selected && champions.value[row.opponentId])
        .sort((a, b) => wilsonLower(b.wins, b.games) - wilsonLower(a.wins, a.games))
        .slice(0, 12).map((row) => row.opponentId)
    : []

  const candidateNames = new Set<string>([
    ...notes.map((item) => item.champion.toLowerCase()),
    ...recommendedIds.map((id) => champions.value[id]?.alias.toLowerCase() ?? '')
  ])

  return [...candidateNames].filter(Boolean).map((alias) => {
    const found = Object.values(champions.value).find((c) => c.alias.toLowerCase() === alias)
    const id = found?.id ?? null
    const note = noteMap.get(alias)
    const stats = id ? statsMap.get(id) ?? null : null
    return {
      champion: found?.alias ?? note?.champion ?? alias,
      reasonZh: note?.reasonZh || '当前版本样本数据提示值得关注；请结合自身熟练度与阵容决定。',
      reasonEn: note?.reasonEn || 'Observed matchup data suggests an option to consider; factor in champion mastery and composition.',
      cautionZh: note?.cautionZh || '统计相关性不等于保证克制，注意对线操作与阵容适配。',
      cautionEn: note?.cautionEn || 'Statistics are not a guarantee: consider execution and team composition.',
      id, stats,
      inMyPool: id !== null && myPool.value.includes(id),
      unavailable: id !== null && Boolean(lcs.champSelect.session) &&
        (knownPicks.has(id) || (hasRestriction && !availableIds.has(id)))
    }
  }).sort((a, b) =>
    Number(a.unavailable) - Number(b.unavailable) ||
    Number(b.inMyPool) - Number(a.inMyPool) ||
    (liveStats.value ? wilsonLower(b.stats?.wins ?? 0, b.stats?.games ?? 0) -
      wilsonLower(a.stats?.wins ?? 0, a.stats?.games ?? 0) : 0)
  ).slice(0, liveStats.value ? 12 : 8)
})
</script>

<style scoped>
.counter-page {height:100%;min-width:0;}
.counter-wrap {max-width:900px;margin:auto;padding:28px clamp(16px,4vw,40px) 44px;box-sizing:border-box;}
.counter-heading,.counter-results-header {display:flex;align-items:flex-start;justify-content:space-between;gap:16px;}
.counter-kicker {font-size:10px;letter-spacing:.13em;font-weight:750;color:#559c83;}
.counter-heading h2 {font-size:23px;font-weight:700;letter-spacing:-.03em;margin:7px 0;}
.counter-heading p,.counter-results-header p {margin:0;font-size:12px;line-height:1.7;opacity:.65;}
.counter-panel {border:1px solid rgba(111,135,147,.22);border-radius:12px;background:rgba(245,252,249,.55);}
.counter-inputs {display:grid;grid-template-columns:1fr 1fr;gap:18px;margin:25px 0 30px;padding:20px;}
.counter-input-group {min-width:0;}
.counter-label {display:block;font-weight:650;font-size:12px;margin-bottom:10px;}
.counter-tip,.counter-hint {font-size:11px;opacity:.68;line-height:1.7;margin:9px 0 0;}
.counter-text-button {border:0;background:none;color:#218c68;font:inherit;font-weight:650;cursor:pointer;}
.counter-pill {margin:4px 4px 0 0;padding:3px 8px;border:1px solid rgba(88,143,112,.24);border-radius:5px;background:rgba(96,157,120,.08);font:inherit;color:inherit;cursor:pointer;}
.counter-results-header {margin-bottom:15px;align-items:center;}
.counter-live {border:1px solid rgba(84,153,124,.28);background:rgba(137,199,164,.065);border-radius:12px;padding:16px 18px;margin-bottom:26px;}
.counter-live__intro {display:flex;justify-content:space-between;align-items:center;gap:18px;}
.counter-live__eyebrow {color:#498f6e;font-size:10px;font-weight:700;letter-spacing:.1em;margin-bottom:6px;}
.counter-live__intro strong {font-size:14px;}
.counter-live__intro p {font-size:11px;line-height:1.6;opacity:.64;margin:6px 0 0;}
.counter-live__actions {display:flex;gap:12px;align-items:center;flex-wrap:wrap;flex-shrink:0;}
.counter-link,.counter-stat-source {font-size:11px;}
.counter-live__meta {display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-top:13px;font-size:11px;opacity:.75;}
.counter-live__error {margin:12px 0 0;font-size:11px;color:#b05d40;line-height:1.6;}
.counter-live__error span {display:block;}
.counter-live__hint {font-size:11px;opacity:.54;margin:10px 0 0;line-height:1.5;}
.counter-stat-line {display:flex;align-items:center;gap:8px;font-size:11px;margin-top:8px;flex-wrap:wrap;}
.counter-stat-line strong {font-size:16px;color:#4d9d79;}
.counter-stat-line span {opacity:.68;}
.counter-stat-source {margin-left:auto;}
.counter-stat-unknown {font-size:11px;opacity:.5;margin-top:7px;}
[data-theme='dark'] .counter-live {background:rgba(57,116,85,.10);border-color:rgba(114,188,151,.25);}
@media(max-width:760px){.counter-live__intro {align-items:flex-start;flex-direction:column;}.counter-live__actions {width:100%;}}
.counter-results-header h3 {font-size:16px;letter-spacing:-.015em;margin:0 0 3px;font-weight:700;}
.counter-cards {display:grid;grid-template-columns:1fr;gap:10px;}
.counter-card {border:1px solid rgba(111,135,147,.22);background:rgba(245,252,249,.43);border-radius:11px;padding:17px;}
.counter-card-main {display:flex;align-items:center;gap:12px;}
.counter-rank {font-size:11px;color:#57977e;font-weight:750;letter-spacing:.06em;}
.counter-avatar {width:42px;height:42px;border-radius:9px;flex-shrink:0;}
.counter-card-copy {min-width:0;}
.counter-card-name {display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
.counter-card-name strong {font-size:14px;}
.counter-card-copy p {margin:6px 0 0;font-size:12px;line-height:1.65;opacity:.78;}
.counter-caution {border-top:1px solid rgba(111,135,147,.15);padding-top:11px;margin-top:13px;font-size:11px;line-height:1.7;opacity:.73;}
.counter-caution span {font-size:10px;font-weight:750;color:#b78a47;margin-right:10px;}
.counter-empty {min-height:160px;border:1px dashed rgba(111,135,147,.27);border-radius:12px;display:flex;align-items:center;justify-content:center;flex-direction:column;text-align:center;gap:10px;padding:20px;}
.counter-empty strong {font-size:14px;}
.counter-empty span {font-size:11px;line-height:1.7;opacity:.65;}
.counter-empty-icon {font-size:26px;opacity:.38;}
.counter-disclaimer {margin-top:23px;font-size:11px;line-height:1.75;opacity:.58;border-left:2px solid #72b39b;padding-left:12px;}
[data-theme='dark'] .counter-panel,[data-theme='dark'] .counter-card {background:rgba(25,40,44,.65);border-color:rgba(134,181,163,.18);}
@media(max-width:760px){.counter-inputs{grid-template-columns:1fr;}.counter-heading h2{font-size:20px;}.counter-wrap{padding:20px 16px 30px;}}
</style>