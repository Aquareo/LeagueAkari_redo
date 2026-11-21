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

        <div class="counter-results-header">
          <div>
            <h3>{{ isZh ? '对位建议' : 'Matchup ideas' }}</h3>
            <p>{{ isZh ? '定性参考，不是实时胜率排名。' : 'Qualitative ideas, not live win-rate rankings.' }}</p>
          </div>
          <NTag size="small" :bordered="false">{{ isZh ? '仅供选人参考' : 'Draft reference only' }}</NTag>
        </div>

        <div v-if="!selectedEnemyId" class="counter-empty">
          <div class="counter-empty-icon">⌕</div>
          <strong>{{ isZh ? '先选择对方的上路英雄' : 'Select an enemy champion' }}</strong>
          <span>{{ isZh ? '我们会展示候选英雄、选择原因与需要注意的风险。' : 'See candidate picks, rationale, and tradeoffs.' }}</span>
        </div>
        <div v-else-if="!suggestions.length" class="counter-empty">
          <strong>{{ isZh ? '暂无经过整理的对位建议' : 'No curated matchup notes yet' }}</strong>
          <span>{{ isZh ? '不会用虚构胜率推荐英雄；后续可添加有版本、段位和样本量的数据源。' : 'No fake win rates. Patch- and rank-specific data can be integrated later.' }}</span>
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
              </div>
            </div>
            <div class="counter-caution"><span>{{ isZh ? '注意' : 'CAUTION' }}</span>{{ isZh ? item.cautionZh : item.cautionEn }}</div>
          </article>
        </div>

        <div class="counter-disclaimer">
          {{ isZh ? '说明：仅使用客户端已经公开的敌方英雄和本地对位笔记；不读取隐藏信息，不自动锁定英雄。建议未使用实时版本胜率数据，并不保证一定克制。' : 'Notes use only revealed client picks and local matchup knowledge. No hidden data, auto-locking or patch-specific win rates. A counter pick never guarantees victory.' }}
        </div>
      </div>
    </NScrollbar>
  </div>
</template>

<script setup lang="ts">
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { NScrollbar, NSelect, NTag } from 'naive-ui'
import { computed, ref, watch } from 'vue'

import { TOP_MATCHUP_NOTES } from './top-matchups'

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

const suggestions = computed(() => {
  const selected = selectedEnemyId.value
  if (!selected) return []
  const enemyAlias = champions.value[selected]?.alias
  if (!enemyAlias) return []
  const notes = TOP_MATCHUP_NOTES[enemyAlias] ?? []
  const availableIds = lcs.champSelect.currentPickableChampionIds
  const hasRestriction = Boolean(lcs.champSelect.session && availableIds.size > 0)
  const knownPicks = new Set([
    ...(lcs.champSelect.session?.myTeam ?? []).map((x) => x.championId),
    ...(lcs.champSelect.session?.theirTeam ?? []).map((x) => x.championId),
    ...(lcs.champSelect.session?.bans?.myTeamBans ?? []),
    ...(lcs.champSelect.session?.bans?.theirTeamBans ?? [])
  ])
  return notes.map((item) => {
    const found = Object.values(champions.value).find((c) => c.alias.toLowerCase() === item.champion.toLowerCase())
    const id = found?.id ?? null
    return {
      ...item, id,
      inMyPool: id !== null && myPool.value.includes(id),
      unavailable: id !== null && Boolean(lcs.champSelect.session) &&
        (knownPicks.has(id) || (hasRestriction && !availableIds.has(id)))
    }
  }).sort((a, b) =>
    Number(a.unavailable) - Number(b.unavailable) ||
    Number(b.inMyPool) - Number(a.inMyPool)
  )
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