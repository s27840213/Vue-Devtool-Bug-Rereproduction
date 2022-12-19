<template lang="pug">
div(class="popup-file")
  div(v-if="isLogin"
    class="popup-file__profile")
    router-link(to="/settings/account"
        class="popup-file__option__link"
        @click.native="closePopup")
      avatar(class="mr-10"
        :textSize="14"
        :avatarSize="35")
      div(class="profile-text text-body-2")
        div {{showUname}}
  div(class="popup-file__item" :class="{disabled: isFontLoading}" @click="save()")
    span {{$t('NN0009')}}
  div(class="popup-file__item" @click="newDesign()")
    span {{$tc('NN0072')}}
  hr(class="popup-file__hr")
  div(class="popup-file__item " @click="toggleBleed()")
    span {{showBleed ? "關閉印刷出血" : "開啟印刷出血"}}
  div(class="popup-file__item " @click="togglerRuler()")
    span {{$t('NN0073')}}
    svg-icon(v-if="isShownRuler" class="pointer"
      :iconName="'done'"
      :iconColor="'gray-2'"
      :iconWidth="'14px'")
  div(class="popup-file__item" @click="toggleGuideline()")
    span {{showGuideline ?$t('NN0074'):$t('NN0361')}}
  div(class="popup-file__item" @click="togglelockGuideline()")
    span {{lockGuideline ?$t('NN0384'):$t('NN0383')}}
  div(class="popup-file__item" @click="clearGuideline()")
    span {{$t('NN0075')}}
  template(v-if="isAdmin")
    div(class="popup-file__item" @click="importJSON()")
      span 匯入設計
    div(class="popup-file__item" @click="exportJSON()")
      span 匯出設計
    //- div(class="popup-file__item" @click="testSubscribe()")
    //-   span 測試訂閱
    //- div(class="popup-file__item" @click="testTrail()")
    //-   span 測試試用
  hr(class="popup-file__hr")
  div(class="popup-file__item"
      @click="onLogoutClicked()")
      span {{$tc('NN0167',2)}}
  div(class="popup-file__item" @click="gotoMobile()")
    span(class="text-gray-3") Version: {{buildNumber}}
  template(v-if="isAdmin")
    div(class="popup-file__item" @click="addTwentyPage()")
      span AddTwentyPage
    div(class="popup-file__item" @click="clearAllPagesContent()")
      span clearAllPagesContent
    div(class="popup-file__item" @click="clearAllPages()")
      span clearAllPages
    div(class="popup-file__item" @click="duplicatePageTwentyTimes()")
      span duplicatePageTwentyTimes
  //- div(class="popup-file__item" @click="uploadTmpJson()")
  //-   span Upload Temp.json
  //- div(class="popup-file__item" @click="getTmpJson()")
  //-   span Get Temp.json
</template>

<script lang="ts">
import Vue from 'vue'
import popupUtils from '@/utils/popupUtils'
import pageUtils from '@/utils/pageUtils'
import rulerUtils from '@/utils/rulerUtils'
import { mapGetters, mapState, mapMutations } from 'vuex'
import shortcutHandler from '@/utils/shortcutUtils'
import fileUtils from '@/utils/fileUtils'
import Avatar from '@/components/Avatar.vue'
import stepsUtils from '@/utils/stepsUtils'
import gtmUtils from '@/utils/gtmUtils'
import page from '@/store/module/page'
import resizeUtils from '@/utils/resizeUtils'
import unitUtils, { PRECISION } from '@/utils/unitUtils'
import { IBleed } from '@/interfaces/page'
import { round } from 'lodash'

export default Vue.extend({
  components: {
    Avatar
  },
  data() {
    return {
      showPreference: false
    }
  },
  computed: {
    ...mapState([
      'showBleed'
    ]),
    ...mapState('user', [
      'uname'
    ]),
    ...mapGetters({
      isLogin: 'user/isLogin',
      isAdmin: 'user/isAdmin',
      account: 'user/getAccount',
      isFontLoading: 'text/getIsFontLoading',
      pagesLength: 'getPagesLength'
    }),
    pageSize(): { w: number, h: number } {
      return {
        w: pageUtils.currFocusPage.width,
        h: pageUtils.currFocusPage.height
      }
    },
    showGuideline(): boolean {
      return rulerUtils.showGuideline
    },
    lockGuideline(): boolean {
      return rulerUtils.lockGuideline
    },
    isShownRuler() {
      return rulerUtils.showRuler
    },
    buildNumber(): string {
      const { VUE_APP_BUILD_NUMBER: buildNumber } = process.env
      return buildNumber ? `v.${buildNumber}` : 'local'
    },
    showUname(): string {
      if (this.uname.length > 10) {
        return this.uname.substring(0, 10).concat('...')
      } else {
        return this.uname
      }
    }
  },
  methods: {
    ...mapMutations({
      setShowBleed: 'SET_showBleed'
    }),
    closePopup() {
      popupUtils.closePopup()
    },
    clearGuideline() {
      rulerUtils.clearGuidelines()
      stepsUtils.record()
    },
    showPrefSetting() {
      this.showPreference = true
    },
    togglerRuler() {
      localStorage.setItem('showRuler', `${!rulerUtils.showRuler}`)
      rulerUtils.setShowRuler(!rulerUtils.showRuler)
    },
    toggleGuideline() {
      rulerUtils.setShowGuideline(!rulerUtils.showGuideline)
    },
    togglelockGuideline() {
      rulerUtils.setLockGuideline(!rulerUtils.lockGuideline)
    },
    toggleBleed() {
      this.setShowBleed(!this.showBleed)
      if (this.showBleed) {
        for (let idx = 0; idx < this.pagesLength; idx++) {
          const page = pageUtils.getPage(idx)
          const dpi = pageUtils.getPageDPI(page)
          const defaultBleeds = Object.fromEntries(Object.entries({
            top: 3,
            bottom: 3,
            left: 3,
            right: 3
          }).map(([k, v]) => [k, round(unitUtils.convert(v, 'mm', page.unit, k === 'left' || k === 'right' ? dpi.width : dpi.height), page.unit === 'px' ? 0 : PRECISION)])) as IBleed
          resizeUtils.resizeBleeds(idx, defaultBleeds)
        }
      } else {
        for (let idx = 0; idx < this.pagesLength; idx++) {
          resizeUtils.resizeBleeds(idx, {
            top: 0,
            bottom: 0,
            left: 0,
            right: 0
          })
        }
      }
      stepsUtils.record()
    },
    newDesign() {
      // designUtils.newDesign()
      const path = `${window.location.origin}${window.location.pathname}`
      window.open(path)
      this.closePopup()
    },
    save() {
      shortcutHandler.save()
    },
    importJSON() {
      fileUtils.import()
    },
    exportJSON() {
      fileUtils.export()
      // designUtils.newDesign()
    },
    testSubscribe() {
      // fbPixelUtils.subscribe(false)
    },
    testTrial() {
      // fbPixelUtils.startTrail()
    },
    testSignup() {
      gtmUtils.signUp('Vivipic')
      // fbPixelUtils.signUp()
    },
    addTwentyPage() {
      console.log('add twenty page')
      pageUtils.addTwentyPages()
    },
    clearAllPagesContent() {
      pageUtils.clearAllPagesContent()
    },
    clearAllPages() {
      pageUtils.setPages([pageUtils.newPage({})])
    },
    duplicatePageTwentyTimes() {
      pageUtils.duplicatePage1(40)
    },
    onLogoutClicked() {
      localStorage.setItem('token', '')
      window.location.href = '/'
    },
    gotoMobile() { // TO-DELETE
      window.location.href = this.$router.currentRoute.fullPath.replace('editor', 'mobile-editor')
    }
  }
})
</script>

<style lang="scss" scoped>
.popup-file {
  position: relative;
  border-radius: 5px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  z-index: setZindex("dropdowns");
  padding: 25px 20px;

  &__profile {
    display: flex;
    padding-bottom: 10px;
    .profile-img {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 40px;
      height: 40px;
      color: white;
      font-size: 18px;
      font-weight: 700;
      background: #61aac2;
      border-radius: 50%;
    }
    .profile-text {
      display: flex;
      text-align: left;
      flex-direction: column;
      justify-content: center;
    }
  }
  &__option {
    &__link {
      display: flex;
      color: unset;
      text-decoration: unset;
    }
  }
  &__item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    transition: background-color 0.1s ease-in;
    padding: 0.35rem;
    border-radius: 0.25rem;
    position: relative;
    cursor: pointer;
    &.disabled {
      color: setColor(gray-4);
    }
    > span {
      font-size: 0.75rem;
    }
    &:not(:last-child):not(.disabled) {
      &:hover {
        background-color: setColor(blue-3, 0.5);
      }
      &:active {
        background-color: setColor(blue-3);
      }
    }
  }

  &__hr {
    margin: 0.25rem 0;
    border: none;
    border-bottom: 1px solid setColor(gray-4);
  }

  &__preference-item {
    position: absolute;
    background-color: setColor(white);
    top: 0;
    right: 0px;
    transform: translate(100%, 0);
    display: flex;
    flex-direction: column;
    border: 1px solid setColor(gray-4);
    box-shadow: 0px 0px 7px setColor(gray-1, 0.25);
  }
}
</style>
