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
    :isAnyBackgroundImageControl="isAnyBackgroundImageControl")
</template>

<script lang="ts">
import NuPage from '@nu/vivi-lib/components/editor/global/NuPage.vue'
import { IPageState } from '@nu/vivi-lib/interfaces/page'
import editorUtils from '@nu/vivi-lib/utils/editorUtils'
import generalUtils from '@nu/vivi-lib/utils/generalUtils'
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
  mounted() {
    const contentScaleRatio = editorUtils.handleContentScaleCalc(this.config.config)
    this.$store.commit('SET_contentScaleRatio4Page', { pageIndex: this.pageIndex, contentScaleRatio })
  },
  computed: {
    ...mapGetters({
      contentScaleRatio: 'getContentScaleRatio',
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
      const contentScaleRatio = editorUtils.handleContentScaleRatio(this.pageIndex) as number
      this.$store.commit('SET_contentScaleRatio4Page', { pageIndex: this.pageIndex, contentScaleRatio })
    },
    currActivePanel(newVal, oldVal) {
      if (oldVal === 'bleed') {
        const contentScaleRatio = editorUtils.handleContentScaleRatio(this.pageIndex) as number
        this.$store.commit('SET_contentScaleRatio4Page', { pageIndex: this.pageIndex, contentScaleRatio })
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
