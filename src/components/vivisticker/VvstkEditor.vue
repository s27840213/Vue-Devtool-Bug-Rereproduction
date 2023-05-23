<template lang="pug">
div(class="vvstk-editor" v-touch :style="copyingStyles()" @pointerdown="selectStart" @swiperight="handleSwipeRight" @swipeleft="handleSwipeLeft")
  div(class="vvstk-editor__pages-container" :style="containerStyles()")
    transition-group(name="scale-in-fade-out" tag="div" class="vvstk-editor__pages" @before-leave="handleBeforePageLeave" :css="animated")
      page-card(v-for="(page, index) in pagesState" :key="`page-${page.config.id}`"
                :class="{'no-transition': currActivePageIndex < 0}"
                :pageIndex="index"
                :pageState="page"
                :cardWidth="cardWidth"
                :cardHeight="cardHeight"
                :marginTop="marginTop"
                :no-bg="!editorTypeTemplate")
  div(v-if="editorTypeTemplate" class="page-pill" @click="showPanelPageManagement")
    svg-icon(iconName="all-pages" iconWidth="16px" iconColor="black-5")
    span(class="page-pill__text body-XS text-black-5") {{ strPagePill }}
</template>

<script lang="ts">
import PageCard from '@/components/vivisticker/PageCard.vue'
import { IPageState } from '@/interfaces/page'
import { LayerType } from '@/store/types'
import controlUtils from '@/utils/controlUtils'
import editorUtils from '@/utils/editorUtils'
import frameUtils from '@/utils/frameUtils'
import layerUtils from '@/utils/layerUtils'
import { MovingUtils } from '@/utils/movingUtils'
import pageUtils from '@/utils/pageUtils'
import resizeUtils from '@/utils/resizeUtils'
import vivistickerUtils from '@/utils/vivistickerUtils'
import { defineComponent } from 'vue'
import { mapGetters, mapMutations, mapState } from 'vuex'

export default defineComponent({
  props: {
    isInEditor: {
      type: Boolean,
      required: true
    },
    marginBottom: {
      type: Number,
      default: 0
    }
  },
  data() {
    return {
      marginTop: 44,
      cardWidth: 0,
      cardHeight: 0,
      animated: false
    }
  },
  watch: {
    isInEditor(newVal, oldVal): void {
      if (newVal && !oldVal) {
        this.$nextTick(() => {
          this.handleResize()
          this.animated = true
        })
      } else {
        this.animated = false
      }
    },
    windowSize: {
      handler(): void {
        if (!this.isInEditor) return
        this.$nextTick(() => {
          this.handleResize()
        })
      },
      deep: true
    },
  },
  computed: {
    ...mapState({
      windowSize: 'windowSize'
    }),
    ...mapGetters({
      currSelectedInfo: 'getCurrSelectedInfo',
      lastSelectedLayerIndex: 'getLastSelectedLayerIndex',
      getMiddlemostPageIndex: 'getMiddlemostPageIndex',
      currActivePageIndex: 'getCurrActivePageIndex',
      currSubSelectedInfo: 'getCurrSubSelectedInfo',
      currSelectedIndex: 'getCurrSelectedIndex',
      pagesState: 'getPagesState',
      getLayer: 'getLayer',
      editorBg: 'vivisticker/getEditorBg',
      editorType: 'vivisticker/getEditorType',
      editorTypeTemplate: 'vivisticker/getEditorTypeTemplate',
      imgControlPageIdx: 'imgControl/imgControlPageIdx',
      contentScaleRatio: 'getContentScaleRatio',
      isDuringCopy: 'vivisticker/getIsDuringCopy',
      isImgCtrl: 'imgControl/isImgCtrl',
      isBgImgCtrl: 'imgControl/isBgImgCtrl',
      isInTemplateShare: 'vivisticker/getIsInTemplateShare'
    }),
    currFocusPageIndex(): number {
      return pageUtils.currFocusPageIndex
    },
    strPagePill(): string {
      return this.pagesState.length > 1 ? `${this.currFocusPageIndex + 1} / ${this.pagesState.length}` : 'Pages'
    }
  },
  components: {
    PageCard
  },
  methods: {
    ...mapMutations({
      setCurrActivePageIndex: 'SET_currActivePageIndex',
    }),
    copyingStyles() {
      return this.isDuringCopy ? { background: 'transparent' } : {}
    },
    containerStyles() {
      return this.isInEditor ? { transform: `translateY(-${this.marginBottom}px)` } : {}
    },
    selectStart(e: PointerEvent) {
      if (e.pointerType === 'mouse' && e.button !== 0) return
      const isClickOnController = controlUtils.isClickOnController(e)
      if (this.isImgCtrl && !isClickOnController) {
        const { getCurrLayer: currLayer, pageIndex, layerIndex, subLayerIdx } = layerUtils
        switch (currLayer.type) {
          case LayerType.image:
          case LayerType.group:
            layerUtils.updateLayerProps(pageIndex, layerIndex, { imgControl: false }, subLayerIdx)
            break
          case LayerType.frame:
            frameUtils.updateFrameLayerProps(pageIndex, layerIndex, subLayerIdx, { imgControl: false })
            break
        }
        return
      }
      if (layerUtils.layerIndex !== -1) {
        /**
         * when the user click the control-region outsize the page,
         * the moving logic should be applied to the EditorView.
         */
        if (isClickOnController) {
          const movingUtils = new MovingUtils({
            _config: { config: layerUtils.getCurrLayer },
            snapUtils: pageUtils.getPageState(layerUtils.pageIndex).modules.snapUtils,
            body: document.getElementById(`nu-layer_${layerUtils.pageIndex}_${layerUtils.layerIndex}_-1`) as HTMLElement
          })
          movingUtils.moveStart(e)
        } else {
          if (this.isInEditor) {
            vivistickerUtils.deselect()
          }
        }
      }
    },
    showPanelPageManagement() {
      editorUtils.setCurrActivePanel('page-management')
      editorUtils.setShowMobilePanel(true)
    },
    handleResize() {
      if (this.isInTemplateShare) return

      // resize all pages
      this.pagesState.forEach((pageState: IPageState, pageIndex: number) => {
        resizeUtils.resizePage(pageIndex, pageState.config, vivistickerUtils.getPageSize(this.editorType))
      })

      // update margin-top
      const elTop = document.getElementsByClassName('vivisticker__top')[0]
      const headerHeight = 44
      const shortEdge = Math.min(elTop.clientWidth, elTop.clientHeight - headerHeight)
      this.marginTop = Math.round(shortEdge * 0.05)

      // update page card size
      const elEditor = this.$el as HTMLElement
      this.cardWidth = elEditor.clientWidth
      this.cardHeight = elEditor.clientHeight

      this.$nextTick(() => { vivistickerUtils.scrollIntoPage(pageUtils.currFocusPageIndex, 0) })
    },
    handleSwipeRight() {
      this.setCurrActivePageIndex(Math.max(0, this.currFocusPageIndex - 1))
      this.$nextTick(() => { vivistickerUtils.scrollIntoPage(pageUtils.currFocusPageIndex, 300) })
    },
    handleSwipeLeft() {
      this.setCurrActivePageIndex(Math.min(this.currFocusPageIndex + 1, this.pagesState.length - 1))
      this.$nextTick(() => { vivistickerUtils.scrollIntoPage(pageUtils.currFocusPageIndex, 300) })
    },
    handleBeforePageLeave(el: Element) {
      const elTarget = el as HTMLElement
      const { margin, marginLeft, marginTop, width, height } = window.getComputedStyle(elTarget)

      // set absolute position
      elTarget.style.left = `${elTarget.offsetLeft - parseFloat(marginLeft)}px`
      elTarget.style.top = `${elTarget.offsetTop - parseFloat(marginTop)}px`

      // set computed size
      elTarget.style.width = width
      elTarget.style.height = height
      elTarget.style.margin = margin
    }
  }
})
</script>

<style lang="scss" scoped>
.vvstk-editor {
  @include size(100%);
  background: setColor(black-2);
  overflow: hidden;
  &__pages-container {
    transition: transform 0.3s map-get($ease-functions, ease-in-out-quint);
  }
  &__pages {
    display: grid;
    grid-auto-flow: column;
    position: relative;
  }
}

.page-pill {
  @include size(80px, 30px);
  padding: 4px 8px;
  box-sizing: border-box;
  position: absolute;
  left: 50%;
  bottom: 14px;
  transform: translateX(-50%);
  background-color: setColor(black-3);
  border-radius: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  column-gap: 4px;
}

.scale-in-fade-out {
  &-move {
    transition: v-bind("animated ? 'transform 300ms ease-in-out' : 'none'");
  }
  &-enter-active {
    transition: transform 300ms ease-in-out;
    transform: scale(1);
  }
  &-enter-from {
    transform: scale(0.75);
  }
  &-leave-active {
    transition: opacity 300ms ease-in-out;
    position: absolute;
  }
  &-leave-to {
    opacity: 0;
  }
}

.no-transition {
  transition: none !important;
}
</style>
