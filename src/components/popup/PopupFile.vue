<template lang="pug">
div(class="popup-file")
  div(class="popup-file__item text-gray-3")
    span {{pageSize.w}}{{$t('NN0220')}} x {{pageSize.h}}{{$t('NN0220')}}
  div(class="popup-file__item" @click="save()")
    span {{$t('NN0009')}}
  div(class="popup-file__item" @click="newDesign()")
    span {{$t('NN0072')}}
  hr(class="popup-file__hr")
  div(class="popup-file__item " @click="togglerRuler()")
    span {{$t('NN0073')}}
    svg-icon(v-if="isShownRuler" class="pointer"
      :iconName="'done'"
      :iconColor="'gray-2'"
      :iconWidth="'14px'")
  div(class="popup-file__item" @click="toggleGuideline()")
    span {{showGuideline ?$t('NN0074'):$t('NN0361')}}
  div(class="popup-file__item" @click="clearGuideline()")
    span {{$t('NN0075')}}
  template(v-if="isAdmin")
    div(class="popup-file__item" @click="importJSON()")
      span 匯入設計
    div(class="popup-file__item" @click="exportJSON()")
      span 匯出設計
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
import { mapGetters } from 'vuex'
import uploadUtils from '@/utils/uploadUtils'
import shortcutHandler from '@/utils/shortcutUtils'
import fileUtils from '@/utils/fileUtils'

export default Vue.extend({
  data() {
    return {
      showPreference: false
    }
  },
  computed: {
    ...mapGetters({
      isLogin: 'user/isLogin',
      isAdmin: 'user/isAdmin'
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
    isShownRuler() {
      return rulerUtils.showRuler
    }
  },
  methods: {
    closePopup() {
      popupUtils.closePopup()
    },
    clearGuideline() {
      rulerUtils.clearGuidelines()
    },
    showPrefSetting() {
      this.showPreference = true
    },
    togglerRuler() {
      rulerUtils.setShowRuler(!rulerUtils.showRuler)
    },
    toggleGuideline() {
      rulerUtils.setShowGuideline(!rulerUtils.showGuideline)
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
  padding: 0.125rem 0;
  &__item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    transition: background-color 0.1s ease-in;
    padding: 0.35rem 1.5rem;
    border-radius: 0.25rem;
    position: relative;
    > span {
      font-size: 0.75rem;
    }
    &:nth-child(1) {
      font-weight: bold;
    }
    &:nth-child(n + 2) {
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
    transform: translate3d(100%, 0, 0);
    display: flex;
    flex-direction: column;
    border: 1px solid setColor(gray-4);
    box-shadow: 0px 0px 7px setColor(gray-1, 0.25);
  }
}
</style>
