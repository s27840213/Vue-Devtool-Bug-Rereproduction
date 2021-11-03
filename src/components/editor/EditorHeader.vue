<template lang="pug">
  div(class="editor-header")
    div(class="body-2")
      svg-icon(class="pointer" style="height: 50px;"
      :iconName="'logo'" :iconWidth="'100px'"
      @click.native="goToPage('Home')")
      div(class="btn-file" @click="openFIlePopup()")
        span 檔案
      div
        div(style="height: 25px; border-right: solid #474A57 1px;")
      svg-icon(:class="{'pointer': !isInFirstStep}"
        :iconName="'undo'"
        :iconWidth="'20px'"
        :iconColor="!isInFirstStep ? 'gray-2' : 'gray-4'"
        @click.native="ShortcutUtils.undo()")
      svg-icon(:class="{'pointer': !isInLastStep}"
        :iconName="'redo'"
        :iconWidth="'20px'"
        :iconColor="!isInLastStep ? 'gray-2' : 'gray-4'"
        @click.native="ShortcutUtils.redo()")
    div(class="body-2")
      span 我的設計 / 新增檔案名稱
    div(class="body-2 relative")
      div(class="editor-header__locale" @click="switchLocale()")
        span {{currLocale}}
      div(v-if="!isLogin")
        span 若要儲存設計，請
        a(:href="`/signup?redirect=${path}`") 註冊
        span 或
        a(:href="`/login?redirect=${path}`") 登入
      svg-icon(v-if="isAdmin"
        :iconName="`user-admin${getAdminModeText}`"
        :iconWidth="'20px'"
        :iconColor="'gray-2'"
        @click.native="setAdminMode()")
      svg-icon(:iconName="'share-alt'"
        :iconWidth="'20px'"
        :iconColor="'gray-2'")
      //- btn(:hasIcon="true"
      //-   :iconName="'download'"
      //-   :iconWidth="'15px'"
      //-   :type="'primary-mid'"
      //-   @click.native="importJsonFile()") Import JSON
      //- btn(:hasIcon="true"
      //-   :iconName="'download'"
      //-   :iconWidth="'15px'"
      //-   :type="'primary-mid'"
      //-   @click.native="exportJsonFile()") Export JSON
      btn(:hasIcon="true"
        :iconName="'download'"
        :iconWidth="'15px'"
        :type="'primary-sm'"
        class="rounded"
        style="padding: 5px 40px;"
        @click.native="download = true") 下 載
      popup-download(v-if="download"
        class="editor-header__download"
        @close="() => (download = false)")
      //- img(:src="require('@/assets/img/svg/avatar.svg')")
</template>

<script lang="ts">
import Vue from 'vue'
import FileUtils from '@/utils/fileUtils'
import ShortcutUtils from '@/utils/shortcutUtils'
import StepsUtils from '@/utils/stepsUtils'
import ModalUtils from '@/utils/modalUtils'
import { mapState, mapMutations } from 'vuex'
import store from '@/store'
import pageUtils from '@/utils/pageUtils'
import popupUtils from '@/utils/popupUtils'
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
    }
  },
  methods: {
    ...mapMutations({
      _setPages: 'SET_pages',
      _setModalInfo: 'modal/SET_MODAL_INFO',
      _setModalOpen: 'modal/SET_MODAL_OPEN'
    }),
    exportJsonFile() {
      FileUtils.export()
    },
    importJsonFile() {
      FileUtils.import()
    },
    setAdminMode() {
      store.commit('user/SET_ADMIN_MODE', !this.adminMode)
    },
    setPages() {
      this._setPages([pageUtils.newPage({})])
    },
    setModalOpen(open: boolean) {
      ModalUtils.setModalInfo('測試', ['1', '2', '3'], {
        msg: '確認',
        action: () => {
          console.log('確認')
        }
      }, {
        msg: '消取',
        action: () => {
          console.log('消取')
        }
      })
      this._setModalOpen(open)
    },
    openFIlePopup() {
      popupUtils.openPopup('file')
    },
    goToPage(pageName: string) {
      this.$router.push({ name: pageName })
    },
    switchLocale() {
      const targetLocale = this.currLocale === 'en-US' ? 'zh-TW' : 'en-US'
      this.$i18n.locale = targetLocale
    }
  }
})
</script>

<style lang="scss" scoped>
.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 50px;
  background-color: #eaf1f6;
  border: 1px solid #e2e5e6;
  box-sizing: border-box;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: setZindex("editor-header");
  > div {
    &:nth-child(1) {
      display: grid;
      grid-template-columns: repeat(7, auto);
      grid-template-rows: 1fr;
      column-gap: 20px;
      justify-items: center;
      align-items: center;
      margin-left: 40px;
    }
    &:nth-child(2) {
      display: grid;
      grid-template-columns: repeat(1, auto);
      grid-template-rows: 1fr;
      column-gap: 20px;
      justify-items: center;
      align-items: center;
    }
    &:nth-child(3) {
      display: grid;
      grid-template-columns: repeat(4, auto);
      grid-template-rows: 1fr;
      column-gap: 20px;
      justify-items: center;
      align-items: center;
      margin-right: 40px;
    }
  }
  &__download {
    position: absolute;
    top: 100%;
    margin-top: 12px;
    right: 0;
    width: 210px;
  }
}
</style>
