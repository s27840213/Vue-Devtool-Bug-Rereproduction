<template lang="pug">
  div(class="scale-ratio-editor")
    input(class="scale-ratio-editor__input"
      ref="scale-ratio-editor" type="range" min="0.1" max="5" step="0.01"
      v-model="ratioInPercent"
      :disabled="isShowPagePreview"
      @input="setScaleRatio(Math.round(ratioInPercent*100))"
      v-ratio-change)
    div(class="px-5 flex items-center  btn-page-resize hover-effect"
        @click="openResizePopup()")
      div(class="scale-ratio-editor__percentage lead-2")
        span(class="text-gray-2") {{pageScaleRatio}}%
      svg-icon(class="pointer"
        :class="[{'rotate-hr': isPageScalePopupOpen}]"
        :iconName="'chevron-down'" :iconColor="'gray-2'" iconWidth="16px")
    svg-icon(class="hover-effect pointer"
      @click.native="deleteLayer"
      :iconName="'trash'" :iconColor="'gray-2'" iconWidth="20px")
</template>

<script lang="ts">
import Vue from 'vue'
import { mapGetters, mapMutations } from 'vuex'
import pageUtils from '@/utils/pageUtils'
import popupUtils from '@/utils/popupUtils'
import shortcutUtils from '@/utils/shortcutUtils'

export default Vue.extend({
  data() {
    return {
    }
  },
  computed: {
    ...mapGetters({
      pageScaleRatio: 'getPageScaleRatio',
      isShowPagePreview: 'page/getIsShowPagePreview',
      showPagePanel: 'page/getShowPagePanel'
    }),
    isPageScalePopupOpen(): boolean {
      return popupUtils.isPopupOpen && popupUtils.currPopupType === 'page-scale'
    },
    ratioInPercent: {
      get(): number {
        return this.pageScaleRatio / 100
      },
      set(val: number): void {
        this.setScaleRatio(Math.round(val * 100))
      }
    }
  },
  methods: {
    ...mapMutations({
      _setScaleRatio: 'SET_pageScaleRatio',
      _setIsShowPagePreview: 'page/SET_isShowPagePreview',
      _setShowPagePanel: 'page/SET_showPagePanel'
    }),
    setScaleRatio(ratio: number) {
      this._setScaleRatio(ratio)
    },
    setIsShowPagePreview(show: boolean) {
      this._setIsShowPagePreview(show)
      if (!show) {
        pageUtils.scrollIntoPage(pageUtils.currFocusPageIndex, 'auto')
        this._setShowPagePanel(false)
      }
    },
    setShowPagePanel(show: boolean) {
      this.toggleSidebarPanel(show)
      this._setShowPagePanel(show)
    },
    toggleSidebarPanel(open: boolean) {
      this.$emit('toggleSidebarPanel', open)
    },
    openResizePopup() {
      popupUtils.openPopup('page-scale', {
        posX: 'right',
        posY: 'bottom'
      })
    },
    deleteLayer() {
      shortcutUtils.del()
    }
  }
})
</script>

<style lang="scss" scoped>
.scale-ratio-editor {
  display: grid;
  grid-template-rows: auto;
  grid-template-columns: repeat(3, auto);
  background-color: setColor(white);
  align-items: center;
  box-shadow: 0px 0px 5px setColor(gray-2, 0.3);
  padding: 2px;
  border-radius: 0 0 7px 7px;
  column-gap: 5px;
  &__input {
    background: setColor(gray-6);
    width: min(180px, 35vw);
    &:focus {
      outline: none;
    }
  }
  &__percentage {
    // border: 1px solid setColor(gray-2, 0.3);
    width: 2.5rem;
  }
}

.hover-effect {
  border-radius: 4px;
  &:hover {
    background-color: setColor(gray-5);
  }
}
</style>
