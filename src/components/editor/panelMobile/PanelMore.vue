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
    template(v-if="isAdmin")
      hr(class="panel-more__hr")
      div(class="panel-more__item"
          @click="onDomainListClicked()")
          span(class="body-2 pointer") domain 選單
    div(class="panel-more__item"
        @click="toggleDebugTool")
      span Toggle admin tool
    div(class="body-2 panel-more__item" @click="gotoDesktop")
      span(class="text-gray-3") Version: {{buildNumber}}{{appVersion}}{{domain}}
  template(v-if="lastHistory === 'domain-list'")
    div(v-for="domain in domainList" class="panel-more__item" @click="switchDomain(domain.key)")
        span(class="body-2 pointer") {{domain.title}}
</template>

<script lang="ts">
import MobileSlider from '@/components/editor/mobile/MobileSlider.vue'
import layerUtils from '@/utils/layerUtils'
import pageUtils from '@/utils/pageUtils'
import picWVUtils from '@/utils/picWVUtils'
import shortcutHandler from '@/utils/shortcutUtils'
import stepsUtils from '@/utils/stepsUtils'
import { defineComponent, PropType } from 'vue'
import { mapGetters, mapMutations, mapState } from 'vuex'

export default defineComponent({
  components: {
    MobileSlider
  },
  emits: ['close', 'pushHistory'],
  props: {
    panelHistory: {
      type: Array as PropType<string[]>,
      default: () => []
    }
  },
  data() {
    return {
      domain: window.location.hostname !== 'vivipic.com' ? ` - ${window.location.hostname.replace('.vivipic.com', '')}` : '',
    }
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
    opacity(): number {
      return layerUtils.getCurrOpacity
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
    domainList(): { key: string, title: string }[] {
      return [
        {
          key: 'prod',
          title: 'vivipic'
        },
        {
          key: 'rd',
          title: 'rd'
        },
        {
          key: 'qa',
          title: 'qa'
        },
        ...(new Array(6).fill(0).map((_, i) => ({
          key: `dev${i}`,
          title: `dev${i}`
        })))
      ]
    }
  },
  methods: {
    ...mapMutations({
      setUserState: 'user/SET_STATE'
    }),
    updateLayerOpacity(val: number) {
      layerUtils.updateLayerOpacity(val)
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
    gotoDesktop() { // TO-DELETE
      this.$router.push(this.$router.currentRoute.value.fullPath.replace('mobile-editor', 'editor'))
    },
    toggleDebugTool() {
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
    }
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
  }

  &__hr {
    margin: 8px 0;
    border: none;
    border-bottom: 1px solid setColor(gray-4);
  }
}
</style>
