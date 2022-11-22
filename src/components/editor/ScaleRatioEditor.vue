<template lang="pug">
  div(class="scale-ratio-editor")
    input(class="scale-ratio-editor__input pointer"
      ref="scale-ratio-editor" type="range" min="0.1" max="5" step="0.01"
      v-model="ratioInPercent"
      :style="ratioStyles()"
      :disabled="isShowPagePreview"
      @input="setScaleRatio(Math.round(ratioInPercent*100))"
      @mousedown="setIsSettingScaleRatio(true)"
      @mouseup="handleMouseUp"
      v-ratio-change)
    div(class="px-5 flex items-center  btn-page-resize hover-effect pointer"
        @click="openResizePopup()")
      div(class="scale-ratio-editor__percentage lead-2")
        span(class="text-gray-2") {{pageScaleRatio}}%
      svg-icon(class="pointer"
        :class="[{'rotate-hr': isPageScalePopupOpen}]"
        :iconName="'chevron-down'" :iconColor="'gray-2'" iconWidth="16px")
    svg-icon(:class="{'hover-effect': !inBgRemoveMode, 'click-disabled': inBgRemoveMode}"
      @click.native="setIsShowPagePreview(!isShowPagePreview)"
      :iconName="'grid'"
      :iconColor="inBgRemoveMode ? 'gray-4' :'gray-2'"
      :disabled="inBgRemoveMode"
      :iconWidth="'24px'")
    svg-icon(:class="{'hover-effect': !inBgRemoveMode, 'click-disabled': inBgRemoveMode}"
      :iconName="'navPage'"
      :iconColor="inBgRemoveMode? 'gray-4' :'gray-2'"
      :iconWidth="'24px'"
      :disabled="inBgRemoveMode"
      @click.native="setShowPagePanel(!showPagePanel)")
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { mapGetters, mapMutations } from 'vuex'
import pageUtils from '@/utils/pageUtils'
import popupUtils from '@/utils/popupUtils'

export default defineComponent({
  data() {
    return {
    }
  },
  computed: {
    ...mapGetters({
      pageScaleRatio: 'getPageScaleRatio',
      isShowPagePreview: 'page/getIsShowPagePreview',
      showPagePanel: 'page/getShowPagePanel',
      inBgRemoveMode: 'bgRemove/getInBgRemoveMode'
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
      _setShowPagePanel: 'page/SET_showPagePanel',
      setIsSettingScaleRatio: 'SET_isSettingScaleRatio'
    }),
    ratioStyles() {
      return {
        '--progress': `${(this.ratioInPercent - 0.1) / 4.9 * 100}%`
      }
    },
    handleMouseUp() {
      this.setIsSettingScaleRatio(false)
      pageUtils.activeMiddlemostPage()
    },
    setScaleRatio(ratio: number) {
      this._setScaleRatio(ratio)
    },
    setIsShowPagePreview(show: boolean) {
      this._setIsShowPagePreview(show)
      if (!show) {
        this._setShowPagePanel(false)
      }
    },
    setShowPagePanel(show: boolean) {
      if (this.isShowPagePreview) {
        this.setIsShowPagePreview(false)
        this._setShowPagePanel(true)
      } else {
        this.toggleSidebarPanel(show)
        this._setShowPagePanel(show)
      }
    },
    toggleSidebarPanel(open: boolean) {
      this.$emit('toggleSidebarPanel', open)
    },
    openResizePopup() {
      popupUtils.openPopup('page-scale', {
        posX: 'right',
        posY: 'top'
      })
    }
  }
})
</script>

<style lang="scss" scoped>
.scale-ratio-editor {
  position: absolute;
  right: 16px;
  bottom: 24px;
  z-index: setZindex("scale-ratio-editor");
  display: grid;
  grid-auto-flow: column;
  column-gap: 8px;
  background-color: setColor(white);
  align-items: center;
  box-shadow: 0px 0px 5px setColor(gray-2, 0.3);
  padding: 10px;
  border-radius: 7px;
  opacity: 0.7;
  &:hover {
    opacity: 1;
  }
  &__input {
    display: none;
    .scale-ratio-editor:hover & {
      // Show range input when hovering this component.
      display: block;
    }
    width: 180px;
    --lower-color: #{setColor(gray-1)};
    --upper-color: #{setColor(gray-4)};
    height: 2px;
    appearance: none;
    outline: none;
    background: linear-gradient(
      to right,
      var(--lower-color) var(--progress),
      var(--upper-color) var(--progress)
    );
    &:focus {
      outline: none;
    }
    &::-webkit-slider-runnable-track {
      height: 2px;
    }
    &::-webkit-slider-thumb {
      appearance: none;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background-color: setColor(white);
      border: 2px solid setColor(gray-1);
      margin-top: -7px;
      position: relative;
    }
    &::-moz-range-thumb {
      appearance: none;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background-color: setColor(white);
      border: 2px solid setColor(gray-1);
      position: relative;
    }
  }
  &__percentage {
    width: 2.5rem;
  }
}

.hover-effect {
  border-radius: 4px;
  cursor: pointer;
  &:hover {
    background-color: setColor(gray-5);
  }
}
</style>
