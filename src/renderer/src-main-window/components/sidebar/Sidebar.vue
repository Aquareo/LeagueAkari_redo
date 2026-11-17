<template>
  <div
    class="app-sidebar"
    ref="app-sidebar"
    :class="{
      collapsed: mui.frontendSettings.sidebarCollapsed
    }"
    :style="{
      '--la-sidebar-width-collapsed': as.isMacOS ? '68px' : '52px',
      '--la-sidebar-width-expanded': as.isMacOS ? '200px' : '196px',
      '--la-sidebar-icon-height': as.isMacOS ? '40px' : '36px',
      '--la-sidebar-icon-horizontal-padding': as.isMacOS ? '10px' : '10px'
    }"
  >
    <!-- macOS 的 logo 区留给交通等 -->
    <div class="app-sidebar__head-safe-area" v-if="as.isMacOS"></div>
    <div class="app-sidebar__head" v-else>
      <div class="app-sidebar__logo">
        <NIcon class="app-sidebar__logo-icon">
          <AkariLogo />
        </NIcon>
      </div>
      <div class="app-sidebar__logo-text">
        {{ t('appName', { ns: 'common' }) }}
      </div>
    </div>

    <div v-if="!mui.frontendSettings.sidebarCollapsed" class="app-sidebar__section-label">{{ t('workspace.sidebarGroup') }}</div>
    <button class="app-sidebar__search" type="button" :title="t('workspace.search')" @click="openSearch()">
      <NIcon class="app-sidebar__search-icon"><Search20Regular /></NIcon>
      <span class="app-sidebar__search-label">{{ t('workspace.search') }}</span>
      <span class="app-sidebar__search-hint">⌕</span>
    </button>

    <SidebarMenu
      class="app-sidebar__menu"
      :items="menu"
      :current="currentMenu"
      @update:current="(key) => handleMenuChange(key)"
      :is-collapsed="mui.frontendSettings.sidebarCollapsed"
    />

    <div class="app-sidebar__padding"></div>

    <SidebarFixed
      class="app-sidebar__fixed"
      :is-collapsed="mui.frontendSettings.sidebarCollapsed"
    />

    <!-- 一个展开和缩小的按钮 -->
    <div class="app-sidebar__expand-line" ref="expandLineEl" @mousedown="toggleCollapse">
      <div class="app-sidebar__expand-line-inner"></div>
    </div>
  </div>
</template>

<script setup lang="tsx">
import AkariLogo from '@renderer-shared/assets/icon/AkariLogo.vue'
import { useInstance } from '@renderer-shared/shards'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { useOngoingGameStore } from '@renderer-shared/shards/ongoing-game/store'
import { WindowManagerRenderer } from '@renderer-shared/shards/window-manager'
import { ToolFilled as ToolFilledIcon } from '@vicons/antd'
import {
  AnimalRabbit28Filled as AnimalRabbit28FilledIcon,
  Flash20Filled as Flash20FilledIcon,
  Search20Regular,
  Games24Filled as Games24FilledIcon
} from '@vicons/fluent'
import { AnalyticsRound as AnalyticsRoundIcon } from '@vicons/material'
import { useTranslation } from 'i18next-vue'
import { NIcon } from 'naive-ui'
import {
  Component as ComponentC,
  computed,
  nextTick,
  ref,
  useTemplateRef,
  watch,
  watchEffect
} from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useMainWindowUiStore } from '@main-window/shards/main-window-ui/store'
import { useMainWindowAppContext } from '@main-window/context'

import SidebarFixed from './SidebarFixed.vue'
import { SidebarMenu } from './sidebar-menu'

const { t } = useTranslation()

const as = useAppCommonStore()
const ogs = useOngoingGameStore()
const mui = useMainWindowUiStore()
const lcs = useLeagueClientStore()
const wm = useInstance(WindowManagerRenderer)
const sidebarEl = useTemplateRef('app-sidebar')
const { openSearch } = useMainWindowAppContext()

const MAIN_WINDOW_TRAFFIC_LIGHT_DEFAULT_POSITION = {
  x: 4,
  y: 12
}
const MAIN_WINDOW_TRAFFIC_LIGHT_EXPANDED_FALLBACK_X = 8

const renderIcon = (icon: ComponentC) => {
  const Icon = icon as any
  return () => (
    <NIcon>
      <Icon />
    </NIcon>
  )
}

const router = useRouter()
const route = useRoute()

const shouldShowOngoingGameBadge = ref(false)
const isInCombatPhase = computed(() => {
  return ogs.queryStage.phase !== 'unavailable' && ogs.queryStage.phase !== 'lobby'
})

const toggleCollapse = () => {
  mui.frontendSettings.sidebarCollapsed = !mui.frontendSettings.sidebarCollapsed
}

const getSidebarPxProperty = (propertyName: string, fallback: number) => {
  if (!sidebarEl.value) {
    return fallback
  }

  const value = Number.parseFloat(getComputedStyle(sidebarEl.value).getPropertyValue(propertyName))
  return Number.isFinite(value) ? value : fallback
}

const syncMainWindowTrafficLightPosition = () => {
  if (!as.isMacOS) {
    return
  }

  if (mui.frontendSettings.sidebarCollapsed) {
    void wm.mainWindow.setTrafficLightPosition(
      MAIN_WINDOW_TRAFFIC_LIGHT_DEFAULT_POSITION.x,
      MAIN_WINDOW_TRAFFIC_LIGHT_DEFAULT_POSITION.y
    )
    return
  }

  const x = getSidebarPxProperty(
    '--la-sidebar-icon-horizontal-padding',
    MAIN_WINDOW_TRAFFIC_LIGHT_EXPANDED_FALLBACK_X
  )

  void wm.mainWindow.setTrafficLightPosition(
    Math.round(x),
    MAIN_WINDOW_TRAFFIC_LIGHT_DEFAULT_POSITION.y
  )
}

// TODO: 临时方案：折叠状态仍由前端拥有，因此先在这里同步 macOS 交通灯位置。
watch(
  () => [as.isMacOS, mui.frontendSettings.sidebarCollapsed] as const,
  () => {
    void nextTick(syncMainWindowTrafficLightPosition)
  },
  { immediate: true, flush: 'post' }
)

watch(
  () => isInCombatPhase.value,
  (yes) => {
    if (yes && currentMenu.value !== 'ongoing-game') {
      shouldShowOngoingGameBadge.value = true
    } else {
      shouldShowOngoingGameBadge.value = false
    }
  }
)

const currentMenu = ref('match-history')
const menu = computed(() => {
  return [
    {
      key: 'player-tabs',
      icon: renderIcon(AnalyticsRoundIcon),
      name: t('navigation.sidebar.menu.match-history')
    },
    {
      key: 'ongoing-game',
      icon: renderIcon(Games24FilledIcon),
      name: t('navigation.sidebar.menu.ongoing-game'),
      inProgress: shouldShowOngoingGameBadge.value,
      isDisabled: !lcs.isConnected
    },
    {
      key: 'automation',
      icon: renderIcon(Flash20FilledIcon),
      name: t('navigation.sidebar.menu.automation')
    },
    {
      key: 'toolkit',
      icon: renderIcon(ToolFilledIcon),
      name: t('navigation.sidebar.menu.toolkit')
    },
    {
      key: 'test',
      icon: renderIcon(AnimalRabbit28FilledIcon),
      name: t('navigation.sidebar.menu.test'),
      show: mui.frontendSettings.showTestPage
    }
  ]
})

const handleMenuChange = async (val: string | undefined) => {
  try {
    await router.replace({ name: val })
  } catch (error) {
    console.error('routing', error)
  }
}

watchEffect(() => {
  currentMenu.value = route.name as string

  if (route.name === 'ongoing-game') {
    shouldShowOngoingGameBadge.value = false
  }
})

watch(
  () => lcs.isConnected,
  (isConnected) => {
    if (!isConnected && route.name === 'ongoing-game') {
      router.replace({ name: 'player-tabs' })
    }
  }
)
</script>

<style scoped>
.app-sidebar {
  --la-sidebar-macos-safe-top: 42px;

  display: flex;
  flex-direction: column;
  height: 100%;
  width: var(--la-sidebar-width-expanded);
  transition: width 0.26s cubic-bezier(0.2, 0.75, 0.2, 1);
  position: relative;

  &.collapsed {
    width: var(--la-sidebar-width-collapsed);
  }

  .app-sidebar__head-safe-area {
    height: var(--la-sidebar-macos-safe-top);
  }

  .app-sidebar__head {
    position: relative;
    display: flex;
    align-items: center;
    padding-inline: var(--la-sidebar-icon-horizontal-padding);
    padding-block: 18px 16px;
    gap: 10px;
    overflow: hidden;
    border-bottom: 1px solid rgba(110, 124, 148, 0.14);
    margin-bottom: 16px;
  }

  .app-sidebar__logo {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: calc(var(--la-sidebar-width-collapsed) - var(--la-sidebar-icon-horizontal-padding) * 2);
    height: var(--la-sidebar-icon-height);
    font-size: 20px;
    flex-shrink: 0;
    -webkit-app-region: drag;
  }

  .app-sidebar__logo-icon {
    color: #bfaa81;
    filter: none;
    transition:
      filter 0.2s,
      opacity 0.2s;
  }

  .app-sidebar__logo-text {
    font-size: 14px;
    font-weight: 650;
    letter-spacing: 0.025em;
    font-family: 'Comfortaa', sans-serif;
    text-wrap-mode: nowrap;
    transition: opacity 0.2s;

    .collapsed & {
      opacity: 0;
    }
  }

  .app-sidebar__logo-toggle {
    position: absolute;
    color: rgba(0, 0, 0, 1);
    transition:
      opacity 0.2s ease,
      color 0.2s ease,
      transform 0.2s ease;
    opacity: 0;

    &:active {
      transform: scale(0.9);
    }

    [data-theme='dark'] & {
      color: rgba(255, 255, 255, 1);
    }

    [data-theme-id]:not([data-theme-id='light']):not([data-theme-id='dark']) & {
      color: color-mix(in oklch, var(--la-color-text-themed) 92%, transparent);
    }
  }

  .app-sidebar__section-label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.12em;
    opacity: 0.46;
    padding: 0 16px 10px;
  }

  .app-sidebar__search {
    display: flex;
    align-items: center;
    text-align: left;
    gap: 9px;
    height: 36px;
    margin: 0 10px 15px;
    padding: 0 10px;
    border: 1px solid rgba(97, 109, 126, 0.22);
    border-radius: 8px;
    background: rgba(122, 138, 159, 0.055);
    color: inherit;
    font: inherit;
    cursor: pointer;
    transition: background 0.15s ease, border-color 0.15s ease;
  }
  .app-sidebar__search:hover {
    background: rgba(121, 143, 169, 0.12);
    border-color: rgba(121, 143, 169, 0.35);
  }
  .app-sidebar__search:focus-visible { outline: 2px solid #579ae7; outline-offset: 2px; }
  .app-sidebar__search-icon { font-size: 16px; flex: 0 0 auto; opacity: 0.7; }
  .app-sidebar__search-label { font-size: 12px; opacity: 0.7; overflow: hidden; white-space: nowrap; }
  .app-sidebar__search-hint { margin-left: auto; opacity: 0.42; }
  &.collapsed .app-sidebar__search { width: 32px; height: 32px; padding: 0; justify-content: center; margin: 0 auto 12px; }
  &.collapsed .app-sidebar__search-label,
  &.collapsed .app-sidebar__search-hint { display: none; }

  .app-sidebar__padding {
    flex: 1;
  }

  .app-sidebar__fixed {
    margin-bottom: 10px;
    padding-top: 12px;
    border-top: 1px solid rgba(110, 124, 148, 0.14);
  }

  .app-sidebar__expand-line {
    position: absolute;
    right: 0;
    top: 0;
    height: 100%;
    padding: 0 4px;
    transform: translateX(50%);
    cursor: ew-resize;

    &:hover .app-sidebar__expand-line-inner {
      background-color: #c9a96a;
    }

    .app-sidebar__expand-line-inner {
      width: 2px;
      border-radius: 2px;
      height: 100%;
      background-color: transparent;
      transition: background-color 0.4s;
    }
  }
}
</style>
