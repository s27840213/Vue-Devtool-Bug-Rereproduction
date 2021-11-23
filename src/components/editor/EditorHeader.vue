<template lang="pug">
  div(class="editor-header")
    span(class="body-3") 我的設計
    span(class="body-3 ml-10 mr-5") /
    input(class="body-3 text-gray-2" type="text"
      placeholder="未命名設計"
      maxlength="30"
      :value="pagesName"
      @change="setPagesName"
      ref="pagesName")
    svg-icon(:iconName="'upload-cloud'"
      :iconWidth="'20px'"
      :iconColor="'green-1'"
      class="ml-10")
</template>

<script lang="ts">
import Vue from 'vue'
import ShortcutUtils from '@/utils/shortcutUtils'
import StepsUtils from '@/utils/stepsUtils'
import { mapState, mapMutations, mapGetters } from 'vuex'
import store from '@/store'
import pageUtils from '@/utils/pageUtils'
import PopupDownload from '@/components/popup/PopupDownload.vue'

export default Vue.extend({
  data() {
    return {
      ShortcutUtils,
      StepsUtils,
      download: false
    }
  },
  components: {
    PopupDownload
  },
  computed: {
    ...mapState('user', [
      'role',
      'adminMode']),
    ...mapGetters({
      lastSelectedPageIndex: 'getLastSelectedPageIndex'
    }),
    isInFirstStep(): boolean {
      return (StepsUtils.currStep === 0) && (StepsUtils.steps.length > 1)
    },
    isInLastStep(): boolean {
      return (StepsUtils.currStep === (StepsUtils.steps.length - 1)) && (StepsUtils.steps.length > 1)
    },
    isLogin(): boolean {
      return store.getters['user/isLogin']
    },
    isAdmin(): boolean {
      return this.role === 0
    },
    getAdminModeText(): string {
      return this.adminMode ? '' : '-disable'
    },
    path(): string {
      return this.$route.path
    },
    currLocale(): string {
      return this.$i18n.locale
    },
    pagesName(): string {
      return pageUtils.pagesName
    }
  },
  methods: {
    ...mapMutations({
      _setPages: 'SET_pages',
      _setModalInfo: 'modal/SET_MODAL_INFO',
      _setModalOpen: 'modal/SET_MODAL_OPEN'
    }),
    setAdminMode() {
      store.commit('user/SET_ADMIN_MODE', !this.adminMode)
    },
    goToPage(pageName: string) {
      this.$router.push({ name: pageName })
    },
    switchLocale() {
      const targetLocale = this.currLocale === 'en-US' ? 'zh-TW' : 'en-US'
      this.$i18n.locale = targetLocale
    },
    setPagesName(event: Event) {
      const { value } = event.target as HTMLInputElement
      pageUtils.setPagesName(value)
    },
    getInputTextWidth(el: HTMLInputElement): string {
      const text = document.createElement('span')
      document.body.appendChild(text)

      text.style.font = el.style.font
      text.style.fontSize = el.style.fontSize
      text.style.height = 'auto'
      text.style.width = 'auto'
      text.style.position = 'absolute'
      text.style.whiteSpace = 'no-wrap'
      text.innerHTML = el.value

      const formattedWidth = text.clientWidth + 'px'

      return formattedWidth
    },
    onInput() {
      const pagesNameInput = this.$refs.pagesName as HTMLInputElement
      console.log(this.getInputTextWidth(pagesNameInput))
      pagesNameInput.style.width = this.getInputTextWidth(pagesNameInput)
    }
  }
})
</script>

<style lang="scss" scoped>
.editor-header {
  width: fit-content;
  padding: 5px 10px;
  border-radius: 0 0 0.25rem 0.25rem;
  display: flex;
  background-color: setColor(white);
  box-sizing: border-box;
  position: sticky;
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
  box-sizing: border-box;
  box-shadow: 0px 2px 10px setColor(gray-2, 0.1);
  > span {
    height: 100%;
  }
  > input {
    width: auto;
    text-overflow: ellipsis;
    box-sizing: border-box;
    border: 2px solid transparent;
    padding: 2px;
    transition: all 0.3s;
    background-color: transparent;
    &::placeholder {
      transition: color 0.3s;
    }
    &:hover,
    &:focus {
      border: 2px solid setColor(blue-1, 0.5);
      box-sizing: border-box;
      border-radius: 5px;
      &::placeholder {
        color: setColor(blue-1, 0.5);
      }
    }
  }
}
</style>
