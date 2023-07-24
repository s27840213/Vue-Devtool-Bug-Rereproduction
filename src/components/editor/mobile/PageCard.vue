<template lang="pug">
div(class="page-card"
    :id="`page-card_${pageIndex}`"
    :style="cardStyle"
    ref="card")
  nu-page(
    :pageIndex="pageIndex"
    :overflowContainer="editorView"
    :pageState="config"
    :isScaling="isScaling"
    :isAnyBackgroundImageControl="isAnyBackgroundImageControl"
    :minContentScaleRatio="minContentScaleRatio")
</template>

<script lang="ts">
import NuPage from '@/components/editor/global/NuPage.vue'
import { IPageState } from '@/interfaces/page'
import editorUtils from '@/utils/editorUtils'
import generalUtils from '@/utils/generalUtils'
import { defineComponent, PropType } from 'vue'
import { mapGetters } from 'vuex'

export default defineComponent({
  components: {
    NuPage
  },
  props: {
    config: {
      required: true,
      type: Object as PropType<IPageState>
    },
    cardWidth: {
      type: Number,
      required: true
    },
    cardHeight: {
      type: Number,
      required: true
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
      type: null as unknown as PropType<HTMLElement | null>,
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
    this.$store.commit('SET_contentScaleRatio4Page', { pageIndex: this.pageIndex, contentScaleRatio: this.minContentScaleRatio })
    // let card = this.$refs.card as HTMLElement | HTMLElement[]
    // if (Array.isArray(card)) card = card[0]
    // const cardRect = card.getBoundingClientRect()
    // const padding = +card.style.padding.slice(0, -2)
    // pageUtils.pageEventPosOffset.x = cardRect.x + padding
    // pageUtils.pageEventPosOffset.y = cardRect.y + padding
  },
  computed: {
    ...mapGetters({
      groupType: 'getGroupType',
      currCardIndex: 'mobileEditor/getCurrCardIndex',
      hasBleed: 'getHasBleed',
      currActivePanel: 'mobileEditor/getCurrActivePanel',
    }),
    cardStyle(): { [index: string]: string | number } {
      return {
        width: `${this.cardWidth}px`,
        height: this.isDetailPage ? 'initial' : `${this.cardHeight}px`,
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
        generalUtils.scaleFromCenter(this.editorView as HTMLElement)
      } else {
        const card = (this.$refs.card as HTMLElement[])[this.currCardIndex]
        generalUtils.scaleFromCenter(card)
      }
    },
    hasBleed() {
      this.minContentScaleRatio = editorUtils.handleContentScaleRatio(this.pageIndex) as number
    },
    currActivePanel(newVal, oldVal) {
      if (oldVal === 'bleed') {
        this.minContentScaleRatio = editorUtils.handleContentScaleRatio(this.pageIndex) as number
      }
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
  // display: flex;
  // align-items: center;
  // justify-content: center;
  @include no-scrollbar;
  overflow: hidden;
  // https://stackoverflow.com/questions/33454533/cant-scroll-to-top-of-flex-item-that-is-overflowing-container
  // justify-content: center;
}
</style>
