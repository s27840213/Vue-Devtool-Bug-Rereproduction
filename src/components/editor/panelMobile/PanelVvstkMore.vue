<template lang="pug">
  div(class="panel-vvstk-more")
    template(v-if="inInitialState")
      div(class="panel-vvstk-more__options")
        div(v-for="option in mainOptions"
            class="panel-vvstk-more__option"
            @click.prevent.stop="handleOptionAction(option.action)")
          div(class="panel-vvstk-more__option-icon")
            svg-icon(:iconName="option.icon"
                      :iconWidth="option.icon === 'settings' ? '20px' : '24px'"
                      iconColor="gray-2")
          div(class="panel-vvstk-more__option-title") {{ option.text }}
      div(class="horizontal-rule")
      div(class="panel-vvstk-more__option version" @pointerdown.prevent="handleDebugMode")
        div(class="panel-vvstk-more__option-icon")
          svg-icon(iconName="vivisticker__version"
                    iconWidth="24px"
                    iconColor="gray-3")
        span(class="panel-vvstk-more__option-title version") {{ `${$t('NN0743')} : v. ${appVersion} ${buildNumber}${domain}` }}
    template(v-if="lastHistory === 'locale'")
      div(class="panel-vvstk-more__options")
        div(v-for="option in localeOptions"
            class="panel-vvstk-more__option"
            :class="{selected: handleOptionSelected(option.selected)}"
            @click.prevent.stop="handleOptionAction(option.action)")
          div(class="panel-vvstk-more__option-icon")
            svg-icon(:iconName="option.icon"
                      iconWidth="24px"
                      iconColor="gray-2")
          div(class="panel-vvstk-more__option-title") {{ option.text }}
    template(v-if="lastHistory === 'domain'")
      div(class="panel-vvstk-more__options")
        div(v-for="option in domainOptions"
            class="panel-vvstk-more__option"
            :class="{selected: handleOptionSelected(option.selected)}"
            @click.prevent.stop="handleOptionAction(option.action)")
          div(class="panel-vvstk-more__option-icon")
            svg-icon(:iconName="option.icon"
                      iconWidth="24px"
                      iconColor="gray-2")
          div(class="panel-vvstk-more__option-title") {{ option.text }}
</template>

<script lang="ts">
import editorUtils from '@/utils/editorUtils'
import vivistickerUtils from '@/utils/vivistickerUtils'
import Vue, { PropType } from 'vue'
import { mapGetters, mapMutations } from 'vuex'

type OptionConfig = {
  text: string
  icon: string
  action?: () => void
  selected?: () => boolean
}

export default Vue.extend({
  data() {
    return {
      debugModeTimer: -1,
      debugModeCounter: 0,
      domain: window.location.hostname !== 'sticker.vivipic.com' ? `- ${window.location.hostname.replace('.vivipic.com', '')}` : '',
      debugMode: false
    }
  },
  props: {
    panelHistory: {
      type: Array as PropType<string[]>,
      default: () => []
    }
  },
  async mounted() {
    const debugMode = (await vivistickerUtils.getState('debugMode'))?.value ?? false
    this.debugMode = debugMode
  },
  computed: {
    ...mapGetters({
      userInfo: 'vivisticker/getUserInfo'
    }),
    mainOptions(): OptionConfig[] {
      return [{
        text: `${this.$t('NN0146')}`,
        icon: 'vivisticker_play-circle',
        action: this.handleShowTutorial
      }, {
        text: `${this.$t('NN0174')}`,
        icon: 'vivisticker_global',
        action: this.handleLocaleList
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
      }, ...this.debugMode ? [
        {
          text: 'domain 選單',
          icon: 'vivisticker_global',
          action: this.handleDomainList
        }
      ] : []]
    },
    localeOptions(): OptionConfig[] {
      return [{
        text: 'English',
        icon: 'vivisticker_global',
        selected: () => {
          return this.$i18n.locale === 'us'
        },
        action: () => { this.handleUpdateLocale('us') }
      }, {
        text: '繁體中文',
        icon: 'vivisticker_global',
        selected: () => {
          return this.$i18n.locale === 'tw'
        },
        action: () => { this.handleUpdateLocale('tw') }
      }, {
        text: '日本語',
        icon: 'vivisticker_global',
        selected: () => {
          return this.$i18n.locale === 'jp'
        },
        action: () => { this.handleUpdateLocale('jp') }
      }]
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
        text: 'test',
        icon: 'vivisticker_global',
        selected: () => {
          return window.location.hostname === 'stkrd.vivipic.com'
        },
        action: () => { this.switchDomain('stkrd') }
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
    appVersion(): string {
      return this.userInfo.appVer
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
      setSlideType: 'vivisticker/SET_slideType'
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
    handleLocaleList() {
      this.$emit('pushHistory', 'locale')
    },
    handleShowUserSettings() {
      this.setSlideType('slideUserSettings')
    },
    handleDomainList() {
      this.$emit('pushHistory', 'domain')
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
      vivistickerUtils.updateLocale(locale).then(() => {
        location.reload()
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
      this.debugModeTimer = setTimeout(() => {
        this.debugModeCounter = 0
      }, 1000)
    },
    toggleDebugMode() {
      this.debugMode = !this.debugMode
      vivistickerUtils.setState('debugMode', { value: this.debugMode })
    },
    switchDomain(domain: string) {
      vivistickerUtils.sendToIOS('SWITCH_DOMAIN', { domain })
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
    justify-content: start;
    &:not(.version):active {
      background: setColor(black-6);
    }
    &.selected {
      background: setColor(black-6);
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
    color: setColor(gray-2);
    &.version {
      color: setColor(gray-3);
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
