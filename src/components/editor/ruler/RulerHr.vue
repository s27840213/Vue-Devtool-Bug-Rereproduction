<template lang="pug">
div(class="ruler-hr pointer")
  div(class="ruler-hr__body"
    ref="rulerBody"
    :style="rulerBodyStyles")
</template>

<script lang="ts">
import { IPage } from '@/interfaces/page'
import pageUtils from '@/utils/pageUtils'
import Vue from 'vue'
import { mapGetters } from 'vuex'

export default Vue.extend({
  props: {
    canvasRect: DOMRect,
    editorView: HTMLElement
  },
  data() {
    return {
      RULER_SIZE: 25,
      rulerBodyOffset: 0
    }
  },
  computed: {
    ...mapGetters({
      getPage: 'getPage',
      lastSelectedPageIndex: 'getLastSelectedPageIndex',
      currActivePageIndex: 'getCurrActivePageIndex',
      currSelectedInfo: 'getCurrSelectedInfo',
      getLayer: 'getLayer',
      pageSize: 'getPageSize',
      pageScaleRatio: 'getPageScaleRatio'
    }),
    currFocusPage(): IPage {
      const targetIndex = this.currActivePageIndex > 0 ? this.currActivePageIndex : this.lastSelectedPageIndex
      return this.getPage(targetIndex)
    },
    rulerBodyStyles(): { [index: string]: number | string } {
      return {
        width: `${this.currFocusPage.width * (this.pageScaleRatio / 100)}px`,
        height: `${this.RULER_SIZE}px`,
        backgroundColor: '#969BAB',
        transform: `translate3d(${this.rulerBodyOffset}px,0px,0px)`
      }
    }
  },
  mounted() {
    this.calcRulerBodyOffset()
  },
  watch: {
    pageScaleRatio() {
      this.calcRulerBodyOffset()
    },
    currFocusPage() {
      this.calcRulerBodyOffset()
    }
  },
  methods: {
    calcRulerBodyOffset(): void {
      this.rulerBodyOffset = pageUtils.pageRect.left - this.canvasRect.left + this.editorView.scrollLeft
    }
  }
})
</script>

<style lang="scss" scoped>
.ruler-hr {
  display: flex;
  position: sticky;
  grid-area: hr-rulers;
  top: 0px;
  left: 0px;
  background-color: setColor(gray-4);
  overflow: hidden;
}
</style>
