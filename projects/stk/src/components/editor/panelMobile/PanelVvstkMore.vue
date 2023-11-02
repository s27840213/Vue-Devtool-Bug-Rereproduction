<template lang="pug">
div(class="panel-vvstk-more")
  template(v-if="inInitialState")
    div(class="panel-vvstk-more__options")
      div(v-for="option in mainOptions"
          :key="option.text"
          class="panel-vvstk-more__option"
          @click.prevent.stop="handleOptionAction(option.action)")
        div(class="panel-vvstk-more__option-icon")
          svg-icon(:iconName="option.icon"
                    :iconWidth="iconWidth(option.icon)"
                    iconColor="white")
        div(class="panel-vvstk-more__option-title") {{ option.text }}
    div(class="horizontal-rule")
    div(class="panel-vvstk-more__option version" @pointerdown.prevent="handleDebugMode")
      div(class="panel-vvstk-more__option-icon")
        svg-icon(iconName="vivisticker_version"
                  iconWidth="24px"
                  iconColor="black-5")
      span(class="panel-vvstk-more__option-title version") {{ `${userInfo.appVer}/${userInfo.osVer}/${userInfo.modelName} ${buildNumber}${domain} ${hostId}` }}
  template(v-else)
    div(class="panel-vvstk-more__options")
      div(v-for="option in options"
          :key="option.text"
          class="panel-vvstk-more__option"
          :class="{selected: handleOptionSelected(option.selected)}"
          @click.prevent.stop="handleOptionAction(option.action)")
        div(class="panel-vvstk-more__option-icon")
          svg-icon(:iconName="option.icon"
                    iconWidth="24px"
                    iconColor="white")
        div(class="panel-vvstk-more__option-title") {{ option.text }}
</template>

<script lang="ts">
import editorUtils from '@nu/vivi-lib/utils/editorUtils'
import localeUtils from '@nu/vivi-lib/utils/localeUtils'
import stkWVUtils from '@nu/vivi-lib/utils/stkWVUtils'
import { defineComponent, PropType } from 'vue'
import { mapGetters, mapMutations, mapState } from 'vuex'

type OptionConfig = {
  text: string
  icon: string
  action?: () => void
  selected?: () => boolean
}

export default defineComponent({
  data() {
    return {
      debugModeTimer: -1,
      debugModeCounter: 0,
      domain: window.location.hostname !== 'sticker.vivipic.com' ? ` ${window.location.hostname.replace('.vivipic.com', '')}` : '',
    }
  },
  props: {
    panelHistory: {
      type: Array as PropType<string[]>,
      default: () => []
    }
  },
  computed: {
    ...mapState('user', [
      'uname',
      'enableAdminView'
    ]),
    ...mapGetters({
      userInfo: 'vivisticker/getUserInfo',
      inReviewMode: 'webView/getInReviewMode',
      _debugMode: 'vivisticker/getDebugMode'
    }),
    debugMode: {
      get() {
        return this._debugMode
      },
      set(value: boolean) {
        this.setDebugMode(value)
      }
    },
    hostId(): string {
      return this.userInfo.hostId
    },
    mainOptions(): OptionConfig[] {
      return [...stkWVUtils.checkOSVersion('16.0') ? [
        {
          text: `${this.$t('STK0032')}`,
          icon: 'vivisticker_play-circle',
          action: this.handleShowIOS16Tutorial
        }
      ] : [],
      {
        text: `${this.$t('NN0146')}`,
        icon: 'vivisticker_play-circle',
        action: this.handleShowTutorial
      },
      {
        text: 'Vivisticker Pro',
        icon: 'pro',
        action: () => { stkWVUtils.openPayment() }
      },
      {
        text: `${this.$t('NN0174')}`,
        icon: 'vivisticker_global',
        action: () => { this.handleList('locale') }
      }, {
        text: `${this.$t('NN0649')}`,
        icon: 'vivisticker_settings',
        action: this.handleShowUserSettings
      }, {
        text: `${this.$t('NN0147')}`,
        icon: 'vivisticker_info',
        action: this.handleOpenInfo
      }, {
        text: `${this.$t('NN0742')}`,
        icon: 'vivisticker_mail',
        action: this.handleOpenInfo
      },
      ...this.debugMode ? [
        {
          text: 'domain 選單',
          icon: 'vivisticker_global',
          action: () => { this.handleList('domain') }
        }, {
          text: 'App 事件測試',
          icon: 'vivisticker_global',
          action: () => { this.handleList('event-test') }
        }, {
          text: '進入 Native 事件測試器',
          icon: 'vivisticker_global',
          action: () => { window.location.pathname = 'nativeevttest' }
        }, {
          text: 'import design',
          icon: 'vivisticker_global',
          action: this.handleImportDesign
        }, {
          text: 'toggle admin tool',
          icon: 'vivisticker_global',
          action: this.toogleAdminTool
        }
      ] : []]
    },
    localeOptions(): OptionConfig[] {
      return localeUtils.SUPPORTED_LOCALES.map(supported_locale => {
        return {
          text: supported_locale.name,
          icon: 'vivisticker_global',
          selected: () => {
            return this.$i18n.locale === supported_locale.abbreviation
          },
          action: () => { this.handleUpdateLocale(supported_locale.abbreviation) }
        }
      })
    },
    domainOptions(): OptionConfig[] {
      return [{
        text: 'production',
        icon: 'vivisticker_global',
        selected: () => {
          return window.location.hostname === 'sticker.vivipic.com'
        },
        action: () => { this.switchDomain('sticker') }
      }, {
        text: 'rd',
        icon: 'vivisticker_global',
        selected: () => {
          return window.location.hostname === 'stkrd.vivipic.com'
        },
        action: () => { this.switchDomain('stkrd') }
      }, {
        text: 'qa',
        icon: 'vivisticker_global',
        selected: () => {
          return window.location.hostname === 'stickertest.vivipic.com'
        },
        action: () => { this.switchDomain('stickertest') }
      }, {
        text: 'localhost',
        icon: 'vivisticker_global',
        selected: () => {
          return window.location.hostname === 'localhost:8080'
        },
        action: () => {
          if (process.env.NODE_ENV === 'development') {
            this.switchDomain('localhost')
          } else {
            this.$notify({
              group: 'error',
              text: 'Only available in development mode.  '
            })
          }
        }
      }, ...Array(6).fill(1).map((_, index) => {
        const host = `stkdev${index}`
        return {
          text: host,
          icon: 'vivisticker_global',
          selected: () => {
            return window.location.hostname === `${host}.vivipic.com`
          },
          action: () => { this.switchDomain(host) }
        }
      })]
    },
    eventOptions(): OptionConfig[] {
      return ['A', 'B', 'C', 'D', 'E'].map(c => ({
        text: c,
        icon: 'vivisticker_global',
        action: () => { this.sendTestEvent(c) }
      }))
    },
    options(): OptionConfig[] {
      switch (this.lastHistory) {
        case 'locale':
          return this.localeOptions
        case 'domain':
          return this.domainOptions
        case 'event-test':
          return this.eventOptions
        default:
          return []
      }
    },
    buildNumber(): string {
      const { VUE_APP_BUILD_NUMBER: buildNumber } = process.env
      return buildNumber ? `v.${buildNumber}` : 'local'
    },
    historySize(): number {
      return this.panelHistory.length
    },
    inInitialState(): boolean {
      return this.historySize === 0
    },
    lastHistory(): string {
      return this.panelHistory[this.historySize - 1]
    }
  },
  methods: {
    ...mapMutations({
      setShowTutorial: 'vivisticker/SET_showTutorial',
      setSlideType: 'vivisticker/SET_slideType',
      setFullPageConfig: 'SET_fullPageConfig',
      setDebugMode: 'vivisticker/SET_debugMode',
      setUserState: 'user/SET_STATE'
    }),
    handleOptionAction(action?: () => void) {
      if (action) {
        action()
      }
    },
    handleOptionSelected(selected?: () => boolean): boolean {
      if (selected) {
        return selected()
      } else {
        return false
      }
    },
    handleShowTutorial() {
      this.setShowTutorial(true)
      editorUtils.setCloseMobilePanelFlag(true)
    },
    handleShowIOS16Tutorial() {
      stkWVUtils.openFullPageVideo('iOS')
    },
    handleShowUserSettings() {
      this.setSlideType('slideUserSettings')
      editorUtils.setCloseMobilePanelFlag(true)
    },
    handleList(listType: string) {
      this.$emit('pushHistory', listType)
    },
    handleOpenInfo() {
      let url = 'https://www.instagram.com/vivisticker/'
      switch (this.$i18n.locale) {
        case 'tw':
          url = 'https://www.instagram.com/vivistickertw/'
          break
        case 'jp':
          url = 'https://www.instagram.com/vivistickerjp/'
          break
      }
      window.open(url, '_blank')
    },
    handleUpdateLocale(locale: string) {
      if (locale === this.$i18n.locale) return
      stkWVUtils.updateLocale(locale).then((success) => {
        success && location.reload()
      })
    },
    handleDebugMode() {
      if (this.debugModeTimer) {
        clearTimeout(this.debugModeTimer)
      }
      this.debugModeCounter++
      if (this.debugModeCounter === 7) {
        this.toggleDebugMode()
      }
      this.debugModeTimer = window.setTimeout(() => {
        this.debugModeCounter = 0
      }, 1000)
    },
    toogleAdminTool() {
      this.setUserState({ enableAdminView: !this.enableAdminView })
    },
    toggleDebugMode() {
      this.debugMode = !this.debugMode
      stkWVUtils.setState('debugMode', { value: this.debugMode })
      if (this.debugMode) {
        stkWVUtils.recordDebugModeEntrance()
      }
    },
    switchDomain(domain: string) {
      stkWVUtils.sendToIOS('SWITCH_DOMAIN', { domain })
    },
    sendTestEvent(option: string) {
      stkWVUtils.sendToIOS('EVENT_TEST', { option })
    },
    handleImportDesign() {
      stkWVUtils.importDesign()
      editorUtils.setCloseMobilePanelFlag(true)
    },
    iconWidth(icon: string): string {
      switch (icon) {
        case 'settings':
          return '20px'
        case 'pro':
          return '18px'
        default:
          return '24px'
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.panel-vvstk-more {
  padding: 0 0 8px 0;
  &__options {
    display: flex;
    flex-direction: column;
  }
  &__option {
    height: 40px;
    padding: 0 24px;
    display: flex;
    gap: 16px;
    align-items: center;
    justify-content: flex-start;
    &:not(.version):active {
      background: setColor(black-3-5);
    }
    &.selected {
      background: setColor(black-3-5);
    }
  }
  &__option-icon {
    @include size(24px);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  &__option-title {
    @include body-SM;
    color: setColor(white);
    &.version {
      color: setColor(black-5);
    }
  }
}

.horizontal-rule {
  height: 1px;
  background-color: setColor(gray-4);
  width: calc(100% - 32px);
  margin-top: 8px;
  margin-bottom: 8px;
  margin-left: auto;
  margin-right: auto;
}
</style>
