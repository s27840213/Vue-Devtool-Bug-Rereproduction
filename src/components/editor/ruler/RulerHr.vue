<template lang="pug">
div(class="ruler-hr"
    :style="rulerRootStyles")
  div(class="ruler-hr__body"
    ref="rulerBody"
    :style="rulerBodyStyles")
    div(v-for="i in scaleCount" class="ruler-hr__block ruler-hr__block--int")
      span(class="ruler-hr__number") {{(i-1)*scale}}
      div(v-for="i in 5" class="ruler-hr__line")
    div(v-if="scaleCount" class="ruler-hr__block ruler-hr__block--float")
      span(class="ruler-hr__number") {{scaleCount * scale}}
</template>

<script lang="ts">
import { IPage } from '@/interfaces/page'
import pageUtils from '@/utils/pageUtils'
import rulerUtils from '@/utils/rulerUtils'
import unitUtils from '@/utils/unitUtils'
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
      rulerBodyOffset: 0,
      scale: rulerUtils.adjRulerScale()
    }
  },
  computed: {
    ...mapGetters({
      getPage: 'getPage',
      currSelectedInfo: 'getCurrSelectedInfo',
      pageScaleRatio: 'getPageScaleRatio',
      showPagePanel: 'page/getShowPagePanel'
    }),
    currFocusPage(): IPage {
      return pageUtils.currFocusPage
    },
    currFocusPageSize() {
      return pageUtils.currFocusPageSize
    },
    currFocusPageSizeWithBleeds() {
      return pageUtils.currFocusPageSizeWithBleeds
    },
    rulerRootStyles(): { [index: string]: string } {
      return {
        cursor: `url(${require('@/assets/img/svg/ruler-h.svg')}) 16 16, pointer`,
        'z-index': `${pageUtils.pageNum + 10}`
      }
    },
    rulerBodyStyles(): { [index: string]: number | string } {
      return {
        width: `${this.currFocusPageSize.width * (this.pageScaleRatio / 100)}px`,
        height: `${rulerUtils.RULER_SIZE}px`,
        transform: `translate3d(${this.rulerBodyOffset}px,0px,0px)`,
        'grid-template-columns': `repeat(${this.scaleCount},${this.scaleSpace}px) auto`
      }
    },
    pxScale(): number {
      return unitUtils.convert(this.scale, this.currFocusPageSize.unit, 'px', pageUtils.getPageDPI().width)
    },
    scaleCount(): number {
      return Math.ceil(this.currFocusPageSize.width / this.pxScale)
    },
    scaleSpace(): number {
      return this.pxScale * this.pageScaleRatio / 100
    }
  },
  mounted() {
    this.calcRulerBodyOffset()
  },
  watch: {
    pageScaleRatio() {
      this.calcRulerBodyOffset()
      this.scale = rulerUtils.adjRulerScale(this.scale)
    },
    currFocusPage() {
      this.calcRulerBodyOffset()
      this.scale = rulerUtils.adjRulerScale()
    },
    currFocusPageSizeWithBleeds() {
      this.calcRulerBodyOffset()
      this.scale = rulerUtils.adjRulerScale(this.scale)
    },
    showPagePanel() {
      this.calcRulerBodyOffset()
    },
    canvasRect() {
      this.calcRulerBodyOffset()
    }
  },
  methods: {
    calcRulerBodyOffset(): void {
      this.$nextTick(() => {
        this.rulerBodyOffset = pageUtils.pageRect.left - this.canvasRect!.left + this.editorView!.scrollLeft
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
  }

  &__number {
    position: absolute;
    left: 0;
    top: 20%;
    font-size: 12px;
    transform: scale(0.8);
  }

  &__line {
    height: 6px;
    border-right: 1px solid setColor(gray-3);
  }
}
</style>
