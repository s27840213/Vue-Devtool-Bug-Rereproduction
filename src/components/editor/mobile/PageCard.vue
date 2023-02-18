<template lang="pug">
div(class="page-card"
    :style="cardStyle"
    ref="card")
  nu-page(
    :ref="`page-${pageIndex}`"
    :pageIndex="pageIndex"
    :overflowContainer="editorView"
    :pageState="config"
    :isScaling="isScaling"
    :isAnyBackgroundImageControl="isAnyBackgroundImageControl"
    :minContentScaleRatio="minContentScaleRatio")
</template>

<script lang="ts">
import { IPageState } from '@/interfaces/page'
import editorUtils from '@/utils/editorUtils'
import generalUtils from '@/utils/generalUtils'
import { defineComponent, PropType } from 'vue'
import { mapGetters } from 'vuex'

export default defineComponent({
  props: {
    config: {
      required: true,
      type: Object as PropType<IPageState>
    },
    pageIndex: {
      required: true,
      type: Number
    },
    isScaling: {
      type: Boolean,
      default: false
    },
    editorView: {
      type: HTMLElement,
      required: true
    },
    isAnyBackgroundImageControl: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      minContentScaleRatio: 0
    }
  },
  mounted() {
    this.minContentScaleRatio = editorUtils.handleContentScaleCalc(this.config.config)
  },
  computed: {
    ...mapGetters({
      groupType: 'getGroupType',
      currCardIndex: 'mobileEditor/getCurrCardIndex',
      hasBleed: 'getHasBleed'
    }),
    cardStyle(): { [index: string]: string | number } {
      return {
        // width: `${this.cardWidth}px`,
        // height: this.isDetailPage ? 'initial' : `${this.cardHeight}px`,
        // padding: this.isDetailPage ? '0px' : `${pageUtils.MOBILE_CARD_PADDING}px`,
        flexDirection: this.isDetailPage ? 'column' : 'initial',
        // 'overflow-y': this.isDetailPage ? 'initial' : 'scroll',
        // overflow: this.isDetailPage ? 'initial' : 'scroll'
      }
    },
    isDetailPage(): boolean {
      return this.groupType === 1
    }
  },
  watch: {
    pageScaleRatio() {
      if (this.isDetailPage) {
        generalUtils.scaleFromCenter(this.editorView)
      } else {
        const card = (this.$refs.card as HTMLElement[])[this.currCardIndex]
        generalUtils.scaleFromCenter(card)
      }
    },
    hasBleed() {
      this.minContentScaleRatio = editorUtils.handleContentScaleRatio(this.pageIndex) as number
    }
  }
})
</script>

<style lang="scss" scoped>
.page-card {
  position: relative;
  width: 100%;
  touch-action: none;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  @include no-scrollbar;
  overflow: hidden;
  // https://stackoverflow.com/questions/33454533/cant-scroll-to-top-of-flex-item-that-is-overflowing-container
  // justify-content: center;
}
</style>
