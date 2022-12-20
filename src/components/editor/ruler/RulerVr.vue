<template lang="pug">
div(class="ruler-vr"
    :style="rulerRootStyles")
  div(class="ruler-vr__body"
    ref="rulerBody"
    :style="rulerBodyStyles")
    div(v-for="i in rulerLineCount.count" class="ruler-vr__block ruler-vr__block--int")
      span(class="ruler-vr__number") {{(i-1)*SPLIT_UNIT}}
      div(v-for="i in 5" class="ruler-vr__line")
    div(v-if="rulerLineCount.float > 0" class="ruler-vr__block ruler-vr__block--float")
      span(class="ruler-vr__number") {{rulerLineCount.count * SPLIT_UNIT}}
</template>

<script lang="ts">
import { IPage } from '@/interfaces/page'
import pageUtils from '@/utils/pageUtils'
import rulerUtils from '@/utils/rulerUtils'
import { defineComponent } from 'vue'
import { mapGetters } from 'vuex'

export default defineComponent({
  emits: [],
  props: {
    canvasRect: DOMRect,
    editorView: HTMLElement
  },
  data() {
    return {
      rulerBodyOffset: 0
    }
  },
  computed: {
    ...mapGetters({
      getPage: 'getPage',
      currSelectedInfo: 'getCurrSelectedInfo',
      getLayer: 'getLayer',
      pageScaleRatio: 'getPageScaleRatio'
    }),
    currFocusPage(): IPage {
      return pageUtils.currFocusPage
    },
    rulerRootStyles(): { [index: string]: string } {
      return {
        cursor: `url(${'src/assets/img/svg/ruler-v.svg'}) 16 16, pointer`,
        'z-index': `${pageUtils.pageNum + 10}`
      }
    },
    rulerBodyStyles(): { [index: string]: number | string } {
      return {
        width: `${rulerUtils.RULER_SIZE}px`,
        height: `${this.currFocusPage.height * (this.pageScaleRatio / 100)}px`,
        transform: `translate3d(0px,${this.rulerBodyOffset}px,0px)`,
        'grid-template-rows': `repeat(${this.rulerLineCount.count},1fr) ${this.rulerLineCount.float}fr`

      }
    },
    rulerLineCount(): { count: number, float: number } {
      const lineCount = (pageUtils.currFocusPage.height / this.SPLIT_UNIT).toFixed(2).split('.')
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
        this.rulerBodyOffset = pageUtils.pageRect.top - this.canvasRect!.top + this.editorView!.scrollTop
      })
    }
  }
})
</script>

<style lang="scss" scoped>
.ruler-vr {
  display: flex;
  position: sticky;
  grid-area: vr-rulers;
  top: 0px;
  left: 0px;
  overflow: hidden;
  box-sizing: border-box;
  background-color: setColor(gray-4, 0.5);
  z-index: setZindex("ruler");

  &__body {
    display: grid;
    grid-template-columns: 1fr;
  }
  &__block {
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-evenly;
    align-items: flex-end;
    width: 100%;
    &--int {
      &:nth-child(1) {
        border-top: 1px solid setColor(gray-3);
      }
      border-bottom: 1px solid setColor(gray-3);
    }

    &--float {
    }
  }

  &__number {
    position: absolute;
    top: 0;
    left: 20%;
    font-size: 2px;
    transform: scale(0.8) rotate(180deg);
    writing-mode: vertical-lr;
  }

  &__line {
    width: 6px;
    border-bottom: 1px solid setColor(gray-3);
  }
}
</style>
