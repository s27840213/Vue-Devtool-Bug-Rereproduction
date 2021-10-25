<template lang="pug">
  div(class="scale-ratio-editor")
    input(ref="scale-ratio-editor" type="range" min="0.1" max="5" step="0.01"
      v-model="ratioInPercent"
      :disabled="isShowPagePreview"
      @input="setScaleRatio(Math.round(ratioInPercent*100))"
      v-ratio-change)
    div(class="scale-ratio-editor__percentage lead-2")
      span(class="text-gray-2") {{pageScaleRatio}}%
    svg-icon(class="pointer" @click.native="plus()"
      :iconName="'chevron-down'" :iconColor="'gray-2'" iconWidth="16px")
    svg-icon(class="pointer" @click.native="setIsShowPagePreview(!isShowPagePreview)"
      :iconName="gridIcon" :iconColor="'gray-2'" iconWidth="16px")
</template>

<script lang="ts">
import Vue from 'vue'
import { mapGetters, mapMutations } from 'vuex'
export default Vue.extend({
  data() {
    return {
    }
  },
  computed: {
    ...mapGetters({
      pageScaleRatio: 'getPageScaleRatio',
      isShowPagePreview: 'page/getIsShowPagePreview',
      lastSelectedPageIndex: 'getLastSelectedPageIndex'
    }),
    ratioInPercent: {
      get(): number {
        return this.pageScaleRatio / 100
      },
      set(val: number): void {
        this.setScaleRatio(Math.round(val * 100))
      }
    },
    gridIcon(): string {
      return `grid${this.isShowPagePreview ? '-selected' : ''}`
    }
  },
  methods: {
    ...mapMutations({
      _setScaleRatio: 'SET_pageScaleRatio',
      _setIsShowPagePreview: 'page/SET_isShowPagePreview'
    }),
    setScaleRatio(ratio: number) {
      this._setScaleRatio(ratio)
    },
    setIsShowPagePreview(show: boolean) {
      this._setIsShowPagePreview(show)
      if (!show) {
        const currentPage = document.getElementsByClassName('nu-page')[this.lastSelectedPageIndex] as HTMLElement
        currentPage.scrollIntoView()
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.scale-ratio-editor {
  display: grid;
  grid-template-rows: auto;
  grid-template-columns: auto auto auto auto;
  background-color: setColor(white);
  align-items: center;
  box-shadow: 0px 0px 5px setColor(gray-2, 0.3);
  padding: 7px 14px;
  border-radius: 7px;
  column-gap: 5px;
  input[type="range"] {
    background: setColor(gray-6);
    &:focus {
      outline: none;
    }
  }
  &__percentage {
    // border: 1px solid setColor(gray-2, 0.3);
    width: 2.5rem;
  }
}
</style>
