<template lang="pug">
  div(class="editor-header" ref="header"
      :style="headerPosStyle")
    template(v-if="!isLogin")
      span 若要儲存設計，請
      a(:href="`/signup?redirect=${path}`") 註冊
      span 或
      a(:href="`/login?redirect=${path}`") 登入
    template(v-else)
      span(class="body-3 pointer hover-effect" @click="goToPage('MyDesign')") {{$t('NN0080')}}
      span(class="body-3 pointer") {{`${!folderInfo.isRoot ? '/...': ''}`}}
      span(v-if="folderInfo.parentFolder" class="body-3 pointer hover-effect" @click="goToParentFolder()") {{`/${folderInfo.parentFolder}`}}
      span(class="body-3 ml-10 mr-5") /
      input(class="body-3 text-gray-2" type="text"
        :placeholder="`${$t('NN0079')}`"
        maxlength="30"
        :value="pagesName"
        @change="setPagesName"
        ref="pagesName")
      svg-icon(:iconName="'upload-cloud'"
        :iconWidth="'20px'"
        :iconColor="statusColor"
        class="ml-10"
        v-hint="statusHint")
</template>

<script lang="ts">
import Vue from 'vue'
import ShortcutUtils from '@/utils/shortcutUtils'
import StepsUtils from '@/utils/stepsUtils'
import { mapState, mapMutations, mapGetters } from 'vuex'
import store from '@/store'
import pageUtils from '@/utils/pageUtils'
import GeneralUtils from '@/utils/generalUtils'
import rulerUtils from '@/utils/rulerUtils'
import networkUtils from '@/utils/networkUtils'
import uploadUtils from '@/utils/uploadUtils'

export default Vue.extend({
  data() {
    return {
      ShortcutUtils,
      StepsUtils,
      online: false,
      designUploadStatus: 'success'
    }
  },
  created() {
    networkUtils.onNetworkChange((online) => {
      this.online = online
      if (!this.online) {
        this.$notify({ group: 'copy', text: `${this.$t('NN0349')}` })
      }
    })
    uploadUtils.onDesignUploadStatus((status) => {
      this.designUploadStatus = status
    })

    this.online = navigator.onLine
  },
  beforeDestroy() {
    networkUtils.offNetworkCahnge()
    uploadUtils.offDesignUploadStatus()
  },
  computed: {
    ...mapState('user', [
      'role',
      'adminMode']),
    ...mapGetters({
      groupId: 'getGroupId',
      folderInfo: 'getFolderInfo'
    }),
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
    },
    headerPosStyle() {
      const top = rulerUtils.showRuler ? `${rulerUtils.RULER_SIZE}px` : '0px'
      return {
        top
      }
    },
    statusColor(): string {
      if (!this.online) {
        return 'red'
      }
      return this.designUploadStatus === 'uploading' ? 'yellow' : 'green-1'
    },
    statusHint(): string {
      if (!this.online) {
        return `${this.$t('NN0349')}`
      }
      return this.designUploadStatus === 'uploading' ? `${this.$t('NN0136')}` : `${this.$t('NN0135')}`
    }
  },
  methods: {
    ...mapMutations({
      _setPages: 'SET_pages',
      _setModalInfo: 'modal/SET_MODAL_INFO',
      _setModalOpen: 'modal/SET_MODAL_OPEN'
    }),
    goToPage(pageName: string, queryString = '') {
      if (queryString) {
        this.$router.push({ name: pageName, query: { search: queryString } })
      } else {
        this.$router.push({ name: pageName })
      }
    },
    goToParentFolder() {
      this.$router.push({ path: `/mydesign/${this.folderInfo.path.split(',').join('&')}` })
    },
    setPagesName(event: Event) {
      const { value } = event.target as HTMLInputElement
      pageUtils.setPagesName(value)
    },
    copyText(text: string) {
      if (text.length === 0) {
        return
      }
      GeneralUtils.copyText(text)
        .then(() => {
          this.$notify({ group: 'copy', text: `${text} 已複製` })
        })
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
  pointer-events: auto;
  > span {
    height: 100%;
    transition: color 0.3s;
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

.hover-effect {
  &:hover {
    color: setColor(blue-1);
  }
}
</style>
