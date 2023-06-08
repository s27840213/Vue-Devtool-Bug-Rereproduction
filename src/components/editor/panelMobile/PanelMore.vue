<template lang="pug">
div(class="panel-more")
  template(v-if="inInitialState")
    div(class="panel-more__page-name")
      input(class="body-1 text-gray-2" type="text"
        :placeholder="`${$t('NN0079')}`"
        maxlength="30"
        :value="pagesName"
        @change="setPagesName"
        ref="pagesName")
    hr(class="panel-more__hr")
    div(class="panel-more__item" @click="save()")
      span(class="body-2 pointer") {{$t('NN0009')}}
    div(class="panel-more__item" @click="newDesign()")
      span(class="body-2 pointer") {{$tc('NN0072')}}
    div(class="panel-more__item" @click="copyDesignLink()")
      span(class="body-2 pointer") {{$tc('NN0862', {item: `${$t('NN0863')}`})}}
    hr(class="panel-more__hr")
    div(class="panel-more__item " @click="toggleBleed()")
      span(class="body-2 pointer") {{hasBleed ? `${$t('NN0779')}` : `${$t('NN0778')}`}}
    hr(class="panel-more__hr")
    div(class="panel-more__item" @click="goToPage('MyDesign')")
      span(class="body-2 pointer") {{$t('NN0080')}}
    hr(class="panel-more__hr")
    div(class="panel-more__item"
        @click="onLogoutClicked()")
        span(class="body-2 pointer") {{$tc('NN0167',2)}}
    template(v-if="debugMode")
      hr(class="panel-more__hr")
      div(class="panel-more__item"
          @click="onDomainListClicked()")
          span(class="body-2 pointer") domain 選單
      div(class="panel-more__item"
          @click="testError()")
          span(class="body-2 pointer") testError
    div(v-if="isAdmin" class="panel-more__item"
        @click="toggleDebugTool")
      span Toggle admin tool
    div(class="body-2 panel-more__item" @pointerdown.prevent="handleDebugMode")
      span(class="text-gray-3") Version: {{buildNumber}}{{appVersion}}{{domain}}
  template(v-if="lastHistory === 'domain-list'")
    div(v-for="domain in domainList"
        :key="domain.key"
        class="panel-more__item"
        :class="{ selected: handleDomainSelected(domain.selected) }"
        @click="switchDomain(domain.key)")
      span(class="body-2 pointer") {{domain.title}}
</template>

<script lang="ts">
import generalUtils from '@/utils/generalUtils'
import pageUtils from '@/utils/pageUtils'
import picWVUtils from '@/utils/picWVUtils'
import shortcutHandler from '@/utils/shortcutUtils'
import stepsUtils from '@/utils/stepsUtils'
import { defineComponent, PropType } from 'vue'
import { mapGetters, mapMutations, mapState } from 'vuex'

export default defineComponent({
  emits: ['close', 'pushHistory'],
  props: {
    panelHistory: {
      type: Array as PropType<string[]>,
      default: () => []
    }
  },
  data() {
    return {
      debugModeTimer: -1,
      debugModeCounter: 0,
      domain: window.location.hostname !== 'vivipic.com' ? ` - ${window.location.hostname.replace('.vivipic.com', '')}` : '',
      debugMode: false
    }
  },
  async mounted() {
    const debugMode = (await picWVUtils.getState('debugMode'))?.value ?? false
    this.debugMode = debugMode
  },
  computed: {
    ...mapState('user', [
      'enableAdminView'
    ]),
    ...mapGetters({
      pagesLength: 'getPagesLength',
      hasBleed: 'getHasBleed',
      isAdmin: 'user/isAdmin'
    }),
    historySize(): number {
      return this.panelHistory.length
    },
    inInitialState(): boolean {
      return this.historySize === 0
    },
    lastHistory(): string {
      return this.panelHistory[this.historySize - 1]
    },
    pagesName(): string {
      return pageUtils.pagesName
    },
    buildNumber(): string {
      const { VUE_APP_BUILD_NUMBER: buildNumber } = process.env
      return buildNumber ? `v.${buildNumber}` : 'local'
    },
    appVersion(): string {
      return picWVUtils.inBrowserMode ? '' : ` - ${picWVUtils.getUserInfoFromStore().appVer}`
    },
    domainList(): { key: string, title: string, selected: () => boolean }[] {
      return [
        {
          key: 'prod',
          title: 'vivipic',
          selected: () => {
            return window.location.hostname === 'vivipic.com'
          },
        },
        {
          key: 'rd',
          title: 'rd',
          selected: () => {
            return window.location.hostname === 'rd.vivipic.com'
          },
        },
        {
          key: 'qa',
          title: 'qa',
          selected: () => {
            return window.location.hostname === 'qa.vivipic.com'
          },
        },
        ...(new Array(6).fill(0).map((_, i) => ({
          key: `dev${i}`,
          title: `dev${i}`,
          selected: () => {
            return window.location.hostname === `dev${i}.vivipic.com`
          },
        })))
      ]
    }
  },
  methods: {
    ...mapMutations({
      setUserState: 'user/SET_STATE'
    }),
    handleDomainSelected(selected: () => boolean): boolean {
      return selected()
    },
    newDesign() {
      const path = `${window.location.origin}${window.location.pathname}`
      picWVUtils.openOrGoto(path)
    },
    save() {
      shortcutHandler.save()
    },
    onLogoutClicked() {
      localStorage.setItem('token', '')
      window.location.href = '/'
    },
    goToPage(pageName: string, queryString = '') {
      if (queryString) {
        this.$router.push({ name: pageName, query: { search: queryString } })
      } else {
        this.$router.push({ name: pageName })
      }
      this.$emit('close')
    },
    setPagesName(event: Event) {
      const { value } = event.target as HTMLInputElement
      pageUtils.setPagesName(value)
    },
    toggleDebugTool() {
      localStorage.setItem('enableAdminView', `${!this.enableAdminView}`)
      this.setUserState({ enableAdminView: !this.enableAdminView })
    },
    toggleBleed() {
      const isEnableBleed = !this.hasBleed
      for (let idx = 0; idx < this.pagesLength; idx++) pageUtils.setIsEnableBleed(isEnableBleed, idx)
      stepsUtils.record()
    },
    onDomainListClicked() {
      this.$emit('pushHistory', 'domain-list')
    },
    switchDomain(key: string) {
      picWVUtils.switchDomain(key)
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
    toggleDebugMode() {
      this.debugMode = !this.debugMode
      picWVUtils.setState('debugMode', { value: this.debugMode })
    },
    copyDesignLink() {
      generalUtils.copyText(window.location.href)
        .then(() => {
          this.$notify({ group: 'copy', text: `${this.$tc('NN0210', { content: `${this.$t('NN0863')}` })}` })
        })
    },
    testError() {
      throw new Error('test')
    },
  }
})
</script>

<style lang="scss" scoped>
.panel-more {
  display: flex;
  flex-direction: column;

  &__page-name {
    padding: 0.35rem;
    display: flex;
  }

  &__item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    transition: color 0.1s ease-in;
    padding: 8px;
    border-radius: 0.25rem;
    position: relative;

    &:not(:last-child) {
      &:active {
        color: setColor(blue-1);
      }
    }
    &.selected {
      text-decoration: underline;
      -webkit-text-docoration: underline;
    }
  }

  &__hr {
    margin: 8px 0;
    border: none;
    border-bottom: 1px solid setColor(gray-4);
  }
}
</style>
