<template lang="pug">
div(class="ruler-hr"
    :style="{'cursor': `url(${require('@/assets/img/svg/ruler-h.svg')}) 16 16, pointer`}")
  div(class="ruler-hr__body"
    ref="rulerBody"
    :style="rulerBodyStyles")
    div(v-for="i in rulerLineCount.count" class="ruler-hr__block ruler-hr__block--int")
      span(class="ruler-hr__number") {{(i-1)*SPLIT_UNIT}}
      div(v-for="i in 5" class="ruler-hr__line")
    div(v-if="rulerLineCount.float > 0" class="ruler-hr__block ruler-hr__block--float")
      span(class="ruler-hr__number") {{rulerLineCount.count * SPLIT_UNIT}}
</template>

<script lang="ts">
import { IPage } from '@/interfaces/page'
import pageUtils from '@/utils/pageUtils'
import rulerUtils from '@/utils/rulerUtils'
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
        transform: `translate3d(${this.rulerBodyOffset}px,0px,0px)`,
        'grid-template-columns': `repeat(${this.rulerLineCount.count},1fr) ${this.rulerLineCount.float}fr`
      }
    },
    rulerLineCount(): { count: number, float: number } {
      const lineCount = (pageUtils.currFocusPage.width / this.SPLIT_UNIT).toFixed(2).split('.')
      return {
        count: parseInt(lineCount[0]),
        float: parseFloat(`0.${lineCount[1]}`)
      }
    },
    SPLIT_UNIT(): number {
      return rulerUtils.mapSplitUnit()
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
      this.$nextTick(() => {
        this.rulerBodyOffset = pageUtils.pageRect.left - this.canvasRect.left + this.editorView.scrollLeft
      })
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
  overflow: hidden;
  box-sizing: border-box;
  background-color: setColor(gray-4, 0.5);
  &__body {
    display: grid;
    grid-template-rows: 1fr;
  }
  &__block {
    display: flex;
    justify-content: space-evenly;
    align-items: flex-end;
    position: relative;
    height: 100%;
    &--int {
      &:nth-child(1) {
        border-left: 1px solid setColor(gray-3);
      }
      border-right: 1px solid setColor(gray-3);
    }

    &--float {
    }
  }

  &__number {
    position: absolute;
    left: 0;
    top: 20%;
    font-size: 2px;
    transform: scale(0.8);
  }

  &__line {
    height: 6px;
    border-right: 1px solid setColor(gray-3);
  }
}
</style>
