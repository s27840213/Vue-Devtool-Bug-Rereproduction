<template lang="pug">
div(class="popup-file")
  div(class="popup-file__item")
    span 檔案名稱
  div(class="popup-file__item text-gray-3")
    span {{pageSize.w}}像素 x {{pageSize.h}}像素
  div(class="popup-file__item")
    span 保存
  div(class="popup-file__item")
    span 建立新設計
  hr(class="popup-file__hr")
  div(class="popup-file__item popup-file__preference flex flex-between"
      @click="showPrefSetting()")
    span 偏好設定
    svg-icon(
      class="pointer"
      :iconName="'chevron-right'"
      :iconWidth="'12px'"
      :iconColor="'gray-1'")
    div(v-if="showPreference" class="popup-file__preference-item")
      div(class="popup-file__item" @click="togglerRuler()")
        span 尺規
      //- div(class="popup-file__item text-gray-3")
      //-   span 刪除此參考線
      div(class="popup-file__item" @click="clearGuideline()")
        span 刪除所有參考線
      div(class="popup-file__item" @click="toggleGuideline()")
        span {{showGuideline ?'隱藏所有參考線':'顯示所有參考線'}}
</template>

<script lang="ts">
import Vue from 'vue'
import popupUtils from '@/utils/popupUtils'
import pageUtils from '@/utils/pageUtils'
import rulerUtils from '@/utils/rulerUtils'

export default Vue.extend({
  data() {
    return {
      showPreference: false
    }
  },
  computed: {
    pageSize(): { w: number, h: number } {
      return {
        w: pageUtils.currFocusPage.width,
        h: pageUtils.currFocusPage.height
      }
    },
    showGuideline(): boolean {
      return rulerUtils.showGuideline
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
  border: 1px solid setColor(gray-4);
  box-shadow: 0px 0px 7px setColor(gray-1, 0.25);
  &__item {
    display: flex;
    align-items: center;
    transition: background-color 0.1s ease-in;
    padding: 0.25rem 0.725rem;
    border-radius: 0.25rem;
    position: relative;
    > span {
      font-size: 0.75rem;
    }
    &:not(.popup-file__preference) {
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
