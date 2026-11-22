<template>
  <div class="enhanced-player-header flex items-center">
    <!-- name & something -->
    <div class="flex h-16 min-w-0 flex-1">
      <!-- profile icon / summoner level -->
      <div class="relative size-16">
        <LcuImage
          class="enhanced-player-header__avatar size-full rounded"
          :src="summoner ? profileIconUri(summoner.profileIconId) : undefined"
        />
        <div
          v-if="summoner"
          class="absolute -right-1 -bottom-1 rounded px-1 py-0.5 text-[10px] dark:bg-black/40 dark:text-white"
        >
          {{ summoner.level }}
        </div>
      </div>

      <!-- name & tag -->
      <StreamerModeMaskedText>
        <template #masked>
          <div class="ml-3 flex flex-col gap-1 self-center">
            <div class="flex items-center gap-1">
              <span class="text-xl font-bold text-black dark:text-white">{{ maskedName }}</span>
            </div>
            <div class="text-sm text-gray-500 dark:text-gray-400">
              {{ maskedTagLine }}
            </div>
          </div>
        </template>
        <div class="ml-3 flex flex-col gap-1 self-center">
          <div class="flex items-center gap-1">
            <CopyableText
              class="font-bold text-black dark:text-white"
              :class="summoner && summoner.gameName.length >= 16 ? 'text-sm' : 'text-xl'"
              :text="summoner ? `${summoner.gameName}#${summoner.tagLine}` : '—'"
            >
              {{ summoner?.gameName || '—' }}
            </CopyableText>
          </div>
          <div class="text-sm text-gray-500 dark:text-gray-400">
            {{ summoner ? `#${summoner.tagLine}` : '—' }}
          </div>
        </div>
      </StreamerModeMaskedText>
    </div>

    <!-- ranked -->
    <RankedPane />

    <!-- buttons -->
    <div class="ml-8 flex justify-end gap-2">
      <!-- tag edit -->
      <NPopover
        v-if="!isSelfTab && !isCrossRegion"
        v-model:show="isTagEditPopoverShowing"
        trigger="click"
        placement="bottom-end"
      >
        <template #trigger>
          <NButton secondary class="size-10.5!">
            <template #icon>
              <NIcon><Edit20Filled /></NIcon>
            </template>
          </NButton>
        </template>

        <PlayerTagEditPanel
          :puuid="puuid"
          :summoner="summoner"
          @cancel="isTagEditPopoverShowing = false"
          @saved="handleTagSaved"
        />
      </NPopover>

      <!-- refresh -->
      <NButton secondary class="size-10.5!" :loading="isSomethingLoading" @click="refresh">
        <template #icon>
          <NIcon><RefreshSharp /></NIcon>
        </template>
      </NButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import CopyableText from '@renderer-shared/components/CopyableText.vue'
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import { PlayerTagEditPanel } from '@renderer-shared/components/player-tag-edit'
import StreamerModeMaskedText from '@renderer-shared/components/StreamerModeMaskedText.vue'
import { useStreamerModeMaskedText } from '@renderer-shared/composables/useStreamerModeMaskedText'
import { profileIconUri } from '@renderer-shared/shards/league-client/game-data-assets'
import { Edit20Filled } from '@vicons/fluent'
import { RefreshSharp } from '@vicons/ionicons5'
import { NButton, NIcon, NPopover } from 'naive-ui'
import { computed, ref } from 'vue'

import { usePlayerTab } from '../context'
import { useSummoner } from '../data/summoner'
import { useTags } from '../data/tags'
import { useRefresh } from '../utils/refresh'
import RankedPane from './RankedPane.vue'

const { puuid, isSelfTab, isCrossRegion } = usePlayerTab()
const { summoner } = useSummoner()
const { loadTags } = useTags()

const { masked, summonerName: streamerSummonerName } = useStreamerModeMaskedText()

const { refresh, isSomethingLoading } = useRefresh()

const isTagEditPopoverShowing = ref(false)

const maskedName = computed(() => {
  const seed = summoner.value?.gameName || summoner.value?.puuid || puuid.value
  return streamerSummonerName(seed, 0)
})

const maskedTagLine = computed(() => masked(summoner.value?.tagLine || '—', '#####'))

const handleTagSaved = async () => {
  isTagEditPopoverShowing.value = false
  await loadTags()
}
</script>

<style scoped>
.enhanced-player-header {
  position: relative;
  border: 1px solid rgba(125, 136, 154, 0.16);
  border-radius: 14px;
  padding: 12px 16px;
  background: rgba(125, 136, 154, 0.04);
  box-sizing: border-box;
  min-height: 108px;
}

[data-theme='dark'] .enhanced-player-header {
  border-color: rgba(154, 169, 189, 0.17);
  background: rgba(22, 29, 39, 0.7);
}

.enhanced-player-header__avatar {
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.10);
}
</style>
