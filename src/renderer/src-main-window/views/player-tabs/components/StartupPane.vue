<template>
  <div class="workspace-home">
    <div class="workspace-container">
      <header class="workspace-heading">
        <div class="workspace-heading__brand">
          <span class="workspace-heading__icon"><NIcon><AkariLogo /></NIcon></span>
          <div class="workspace-heading__copy">
            <div class="workspace-eyebrow">LEAGUE AKARI <span class="workspace-version">v{{ as.version }}</span></div>
            <h1>{{ t('workspace.title') }}</h1>
            <p>{{ t('workspace.subtitle') }}</p>
          </div>
        </div>
        <NButton v-if="showNewVersionBadge" size="small" secondary @click="handleShowUpdateModal">
          {{ t('startup.launcher.newVersionAvailable') }}
        </NButton>
      </header>

      <section class="workspace-panel workspace-connection" aria-label="League client connection">
        <div class="workspace-connection__main">
          <span class="workspace-status-icon" :class="{ 'workspace-status-icon--online': lcs.isConnected }">
            <span class="workspace-status-icon__dot" />
          </span>
          <div class="workspace-connection__text">
            <span class="workspace-overline">{{ t('workspace.clientStatus') }}</span>
            <strong v-if="lcs.isConnected">{{ t('workspace.clientName') }}</strong>
            <strong v-else-if="lcs.isInConnectionLoop">{{ t('navigation.sidebar.status.inConnectionLoop') }}</strong>
            <strong v-else>{{ t('navigation.sidebar.status.notConnected') }}</strong>
            <span class="workspace-connection__caption">
              {{ lcs.isConnected ? t('workspace.connected') : t('workspace.disconnectedHint') }}
            </span>
          </div>
        </div>
        <NButton v-if="lcs.summoner.me" size="small" secondary @click="handleOpenSelfTab">
          {{ t('navigation.sidebar.menu.match-history') }}
          <template #icon><NIcon><ChevronRight20Filled /></NIcon></template>
        </NButton>
      </section>

      <div class="workspace-section-heading">
        <div><span class="workspace-overline">{{ t('workspace.shortcuts') }}</span><h2>{{ t('workspace.quickAccess') }}</h2></div>
      </div>
      <div class="workspace-actions">
        <button type="button" class="workspace-action" @click="openSearch('summoner')">
          <span class="workspace-action__symbol"><NIcon><Search20Regular /></NIcon></span>
          <span class="workspace-action__copy"><strong>{{ t('workspace.findPlayer') }}</strong><small>{{ t('workspace.findPlayerHint') }}</small></span>
          <NIcon class="workspace-action__arrow"><ChevronRight20Filled /></NIcon>
        </button>
        <button type="button" class="workspace-action" @click="navigate('automation')">
          <span class="workspace-action__symbol"><NIcon><Flash20Filled /></NIcon></span>
          <span class="workspace-action__copy"><strong>{{ t('navigation.sidebar.menu.automation') }}</strong><small>{{ t('workspace.automationHint') }}</small></span>
          <NIcon class="workspace-action__arrow"><ChevronRight20Filled /></NIcon>
        </button>
        <button type="button" class="workspace-action" @click="navigate('toolkit')">
          <span class="workspace-action__symbol"><NIcon><ToolFilled /></NIcon></span>
          <span class="workspace-action__copy"><strong>{{ t('navigation.sidebar.menu.toolkit') }}</strong><small>{{ t('workspace.toolkitHint') }}</small></span>
          <NIcon class="workspace-action__arrow"><ChevronRight20Filled /></NIcon>
        </button>
      </div>

      <div class="workspace-section-heading workspace-section-heading--secondary">
        <div><span class="workspace-overline">{{ t('workspace.resources') }}</span><h2>{{ t('workspace.continue') }}</h2></div>
      </div>
      <section class="workspace-panel workspace-resources">
        <button v-if="lcs.summoner.me" type="button" class="workspace-resource" @click="handleOpenSelfTab">
          <LcuImage class="workspace-resource__image workspace-resource__image--avatar" :src="profileIconUri(lcs.summoner.me.profileIconId)" />
          <span class="workspace-resource__copy">
            <StreamerModeMaskedText>
              <template #masked><strong>{{ t('summoner', { ns: 'common' }) }}</strong></template>
              <strong>{{ lcs.summoner.me.gameName }} <span class="workspace-muted">#{{ lcs.summoner.me.tagLine }}</span></strong>
            </StreamerModeMaskedText>
            <small>{{ t(`sgpServers.${sgps.availability.sgpServerId}`, { ns: 'common' }) }}</small>
          </span>
          <NIcon class="workspace-resource__arrow"><ChevronRight20Filled /></NIcon>
        </button>
        <template v-if="!lcs.isConnected">
          <button v-for="(client, index) in otherClients" :key="client.pid" type="button" class="workspace-resource" @click="handleConnect(client)">
            <LcuImage class="workspace-resource__image workspace-resource__image--avatar" :src="lcps.connectableClientExtraInfo[client.pid]?.profileIcon" />
            <span class="workspace-resource__copy">
              <strong>{{ otherClientName(client, index) }} <span class="workspace-muted">{{ otherClientTagLine(client) }}</span></strong>
              <small>{{ t('workspace.clientName') }} · PID {{ client.pid }}</small>
            </span>
            <NSpin v-if="lcs.connectingClient?.pid === client.pid" :size="14" />
            <NIcon v-else class="workspace-resource__arrow"><PlugConnected24Filled /></NIcon>
          </button>
        </template>
        <button v-for="item of launchItems" :key="item.path" type="button" class="workspace-resource" @click="item.launch">
          <img class="workspace-resource__image" :src="item.imgUrl" alt="" />
          <span class="workspace-resource__copy"><strong>{{ item.name }}</strong><small class="workspace-ellipsis">{{ item.path }}</small></span>
          <NIcon class="workspace-resource__arrow"><ChevronRight20Filled /></NIcon>
        </button>
        <div v-if="!lcs.summoner.me && !otherClients.length && !launchItems.length" class="workspace-empty">
          {{ t('workspace.empty') }}
        </div>
      </section>
      <footer class="workspace-footer">AKARI ENHANCED <span>·</span> v{{ as.version }}</footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import leagueIco from '@renderer-shared/assets/ico/league.ico'
import riotClient from '@renderer-shared/assets/ico/riotclient.ico'
import weGameIco from '@renderer-shared/assets/ico/wegame.ico'
import AkariLogo from '@renderer-shared/assets/icon/AkariLogo.vue'
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import { useStreamerModeMaskedText } from '@renderer-shared/composables/useStreamerModeMaskedText'
import { useInstance } from '@renderer-shared/shards'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { ClientInstallationRenderer } from '@renderer-shared/shards/client-installation'
import { useClientInstallationStore } from '@renderer-shared/shards/client-installation/store'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { useLeagueClientUxStore } from '@renderer-shared/shards/league-client-ux/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { profileIconUri } from '@renderer-shared/shards/league-client/game-data-assets'
import { useSelfUpdateStore } from '@renderer-shared/shards/self-update/store'
import { useSgpStore } from '@renderer-shared/shards/sgp/store'
import { UxCommandLine } from '@shared/shards/league-client-ux'
import { ChevronRight20Filled, PlugConnected24Filled, Search20Regular, Flash20Filled } from '@vicons/fluent'
import { ToolFilled } from '@vicons/antd'
import { useTranslation } from 'i18next-vue'
import { NButton, NIcon, NSpin, useMessage } from 'naive-ui'
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useMainWindowAppContext } from '@main-window/context'

import { useLeagueClientPeekStore } from '@main-window/shards/league-client-peek/store'
import { PlayerTabsRenderer } from '@main-window/shards/player-tabs'
import { SimpleNotificationsRenderer } from '@main-window/shards/simple-notifications'

const { t } = useTranslation()

const as = useAppCommonStore()
const cis = useClientInstallationStore()
const lcs = useLeagueClientStore()
const lcuxs = useLeagueClientUxStore()
const lcps = useLeagueClientPeekStore()
const sgps = useSgpStore()

const sus = useSelfUpdateStore()

const lc = useInstance(LeagueClientRenderer)
const ci = useInstance(ClientInstallationRenderer)
const pt = useInstance(PlayerTabsRenderer)
const sn = useInstance(SimpleNotificationsRenderer)

const message = useMessage()
const router = useRouter()
const { openSearch } = useMainWindowAppContext()
const navigate = (routeName: 'automation' | 'toolkit') => void router.push({ name: routeName })
const { masked, summonerName: streamerSummonerName } = useStreamerModeMaskedText()

const { navigateToTabByPuuid } = pt.useNavigateToTab()

const showNewVersionBadge = computed(() => {
  const release = sus.releaseInfo
  if (!release?.isNew || !release.isUpdateSupported) {
    return false
  }

  if (sus.settings.ignoreVersion === release.version) {
    return false
  }

  return true
})

const handleShowUpdateModal = () => {
  sn.showNewReleaseModal()
}

const handleOpenSelfTab = () => {
  if (lcs.summoner.me) {
    navigateToTabByPuuid(lcs.summoner.me.puuid)
  }
}

const launch = async (fn: () => Promise<any>, name: string) => {
  try {
    await fn()
    message.success(t('startup.launcher.successMessage', { name }))
  } catch (error) {
    message.error(t('startup.launcher.failedMessage', { name, reason: (error as any).message }))
  }
}

const launchItems = computed(() => {
  const arr: {
    name: string
    imgUrl: string
    path: string
    launch: () => any | Promise<any>
  }[] = []

  if (cis.tclsExecutablePath) {
    arr.push({
      name: t('startup.launcher.tcls'),
      imgUrl: leagueIco,
      path: cis.tclsExecutablePath,
      launch: () => launch(ci.launchTencentTcls.bind(ci), t('startup.launcher.tcls'))
    })
  }

  if (cis.weGameLauncherExecutablePath) {
    arr.push({
      name: t('startup.launcher.weGame'),
      imgUrl: weGameIco,
      path: cis.weGameLauncherExecutablePath,
      launch: () => launch(ci.launchWeGameLeagueOfLegends.bind(ci), t('startup.launcher.weGame'))
    })
  }

  if (cis.officialRiotClientExecutablePath) {
    arr.push({
      name: t('startup.launcher.riotClient'),
      imgUrl: riotClient,
      path: cis.officialRiotClientExecutablePath,
      launch: () => launch(ci.launchDefaultRiotClient.bind(ci), t('startup.launcher.riotClient'))
    })
  }

  return arr
})

const otherClients = computed(() => {
  return lcuxs.launchedClients.filter((c) => c.pid !== lcs.auth?.pid)
})

const otherClientName = (client: UxCommandLine, index: number) => {
  const summoner = lcps.connectableClientExtraInfo[client.pid]?.summoner
  const name = summoner?.gameName || summoner?.displayName || '—'
  const seed = summoner?.gameName || summoner?.puuid || String(client.pid)
  return masked(name, () => streamerSummonerName(seed, index))
}

const otherClientTagLine = (client: UxCommandLine) => {
  const summoner = lcps.connectableClientExtraInfo[client.pid]?.summoner
  return masked(summoner ? `#${summoner.tagLine}` : '—', '#####')
}

const handleConnect = (cmd: UxCommandLine) => {
  if (lcs.connectingClient?.pid === cmd.pid) {
    lc.disconnect()
    return
  }

  lc.connect(cmd)
}
</script>

<style scoped>
.workspace-home {
  height: 100%;
  overflow: auto;
  padding: 32px clamp(20px, 5vw, 64px) 24px;
  box-sizing: border-box;
  color: var(--la-color-text-primary);
}
.workspace-container { width: min(100%, 980px); margin: 0 auto; }
.workspace-heading { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; margin-bottom: 28px; }
.workspace-heading__brand { display: flex; align-items: center; gap: 16px; min-width: 0; }
.workspace-heading__icon { width: 52px; height: 52px; flex: 0 0 52px; border-radius: 12px; display: grid; place-items: center; color: #c7a86e; background: rgba(158, 142, 111, .1); font-size: 28px; border: 1px solid var(--workspace-border); }
.workspace-heading__copy h1 { font-size: 25px; letter-spacing: -.035em; font-weight: 700; margin: 3px 0 4px; line-height: 1.25; }
.workspace-heading__copy p { font-size: 13px; opacity: .62; margin: 0; line-height: 1.5; }
.workspace-eyebrow,.workspace-overline { display: block; font-size: 10px; font-weight: 750; letter-spacing: .13em; opacity: .5; }
.workspace-version { font-weight: 500; letter-spacing: normal; margin-left: 5px; }
.workspace-panel { background: var(--workspace-surface); border: 1px solid var(--workspace-border); border-radius: 10px; }
.workspace-connection { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 18px 20px; }
.workspace-connection__main { display: flex; align-items: center; gap: 14px; min-width: 0; }
.workspace-status-icon { width: 38px; height: 38px; flex: 0 0 38px; background: var(--workspace-subtle); border-radius: 9px; display: grid; place-items: center; }
.workspace-status-icon__dot { width: 10px; height: 10px; border-radius: 50%; background: #8c959f; box-shadow: 0 0 0 4px rgba(140,149,159,.14); }
.workspace-status-icon--online .workspace-status-icon__dot { background: #3fb883; box-shadow: 0 0 0 4px rgba(63,184,131,.16); }
.workspace-connection__text,.workspace-resource__copy { min-width: 0; display: flex; flex-direction: column; gap: 4px; }
.workspace-connection__text strong { font-size: 14px; font-weight: 650; }
.workspace-connection__caption { font-size: 12px; opacity: .58; }
.workspace-section-heading { margin: 32px 0 14px; }
.workspace-section-heading--secondary { margin-top: 30px; }
.workspace-section-heading h2 { font-size: 16px; font-weight: 700; margin: 5px 0 0; letter-spacing: -.015em; }
.workspace-actions { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 12px; }
.workspace-action { min-width: 0; display: flex; align-items: flex-start; text-align: left; gap: 12px; padding: 17px 14px; background: var(--workspace-surface); border: 1px solid var(--workspace-border); border-radius: 10px; color: inherit; cursor: pointer; transition: border-color 150ms ease, background 150ms ease; font: inherit; }
.workspace-action:hover,.workspace-resource:hover { background: var(--workspace-hover); border-color: var(--workspace-border-hover); }
.workspace-action:focus-visible,.workspace-resource:focus-visible { outline: 2px solid #579ae7; outline-offset: 2px; }
.workspace-action__symbol { flex: 0 0 32px; width: 32px; height: 32px; border-radius: 8px; display: grid; place-items: center; font-size: 18px; background: var(--workspace-subtle); }
.workspace-action__copy { display: flex; flex-direction: column; gap: 6px; flex: 1; min-width: 0; }
.workspace-action__copy strong { font-size: 13px; font-weight: 650; }
.workspace-action__copy small { font-size: 11px; opacity: .57; line-height: 1.5; }
.workspace-action__arrow { opacity: .35; margin-top: 8px; }
.workspace-resources { overflow: hidden; }
.workspace-resource { width: 100%; display: flex; gap: 13px; padding: 12px 16px; text-align: left; align-items: center; background: transparent; border: 0; border-bottom: 1px solid var(--workspace-border); color: inherit; cursor: pointer; font: inherit; transition: background 150ms ease; }
.workspace-resource:last-child { border-bottom: 0; }
.workspace-resource__image { width: 32px; height: 32px; object-fit: contain; flex: 0 0 32px; }
.workspace-resource__image--avatar { border-radius: 50%; }
.workspace-resource__copy { flex: 1; }
.workspace-resource__copy strong { font-size: 13px; font-weight: 600; }
.workspace-resource__copy small { font-size: 11px; opacity: .56; }
.workspace-muted { font-weight: 400; opacity: .6; }
.workspace-ellipsis { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: block; max-width: 100%; }
.workspace-resource__arrow { opacity: .42; }
.workspace-empty { padding: 22px; font-size: 12px; opacity: .6; line-height: 1.6; }
.workspace-footer { margin: 28px 0 0; text-align: center; font-size: 10px; letter-spacing: .11em; opacity: .36; }
.workspace-footer span { padding: 0 8px; }
.workspace-home { --workspace-surface: rgba(255,255,255,.56); --workspace-subtle: rgba(86,99,117,.075); --workspace-border: rgba(31,42,56,.13); --workspace-border-hover: rgba(31,42,56,.27); --workspace-hover: rgba(95,107,127,.085); }
[data-theme='dark'] .workspace-home { --workspace-surface: rgba(22,29,39,.78); --workspace-subtle: rgba(148,163,184,.105); --workspace-border: rgba(154,169,189,.17); --workspace-border-hover: rgba(167,190,220,.34); --workspace-hover: rgba(126,152,184,.11); }
@media (max-width: 850px) { .workspace-actions { grid-template-columns: 1fr; } .workspace-home { padding: 22px 20px; } .workspace-heading__copy h1 {font-size:22px;} }
@media (prefers-reduced-motion: reduce) { .workspace-action,.workspace-resource {transition: none;} }
</style>