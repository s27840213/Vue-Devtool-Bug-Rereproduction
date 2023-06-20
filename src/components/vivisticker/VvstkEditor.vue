<template lang="pug">
div(class="vvstk-editor" ref="editorView" :style="copyingStyles()" @pointerdown="selectStart" v-touch)
  div(class="vvstk-editor__pages-container" :style="containerStyles()")
    transition-group(name="scale-in-fade-out" tag="div" class="vvstk-editor__pages" @before-leave="handleBeforePageLeave" :css="animated")
      page-card(v-for="(page, index) in pagesState" :key="`page-${page.config.id}`"
                :class="{'no-transition': currActivePageIndex < 0}"
                :pageIndex="index"
                :pageState="page"
                :cardWidth="cardWidth"
                :cardHeight="cardHeight"
                :marginTop="marginTop"
                :no-bg="!editorTypeTemplate"
                @click.self.prevent="outerClick")
      div(v-if="editorTypeTemplate" class="page-add" :id="`page-card-${pagesState.length}`" key="page-add")
        div(class="page-add__page body-SM flex-column flex-center")
          div(class="page-add__text text-white" v-html="$t('STK0075')")
          div(class="page-add__btn text-black-3 bg-white flex-center" @click="addPage")
            svg-icon(class="page-add__btn__icon" iconName="add-page" iconWidth="24px" iconColor="gray-2")
            div(class="page-add__btn__text") {{ $t('STK0076') }}
  div(v-if="editorTypeTemplate && !isDuringCopy" class="page-pill" @click="showPanelPageManagement")
    svg-icon(iconName="pages" iconWidth="20px" iconColor="black-5")
    span(class="page-pill__text body-XS text-black-5") {{ strPagePill }}
  page-preivew(v-if="isInPagePreview" :pagesState="pagesState")
  share-template(v-if="isInTemplateShare" :isMultiPage="pagesState.length > 1")
</template>

<script lang="ts">
import PageCard from '@/components/vivisticker/PageCard.vue'
import PagePreivew from '@/components/vivisticker/PagePreivew.vue'
import ShareTemplate from '@/components/vivisticker/ShareTemplate.vue'
import { IPageState } from '@/interfaces/page'
import { LayerType } from '@/store/types'
import controlUtils from '@/utils/controlUtils'
import editorUtils from '@/utils/editorUtils'
import frameUtils from '@/utils/frameUtils'
import layerUtils from '@/utils/layerUtils'
import { MovingUtils } from '@/utils/movingUtils'
import pageUtils from '@/utils/pageUtils'
import resizeUtils from '@/utils/resizeUtils'
import stepsUtils from '@/utils/stepsUtils'
import SwipeDetector from '@/utils/SwipeDetector'
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
      animated: false,
      swipeDetector: null as unknown as SwipeDetector,
      isInPageAdd: false
    }
  },
  mounted() {
    const editorView = this.$refs.editorView as HTMLElement
    this.swipeDetector = new SwipeDetector(editorView, { targetDirection: 'horizontal' }, this.handleSwipe)
  },
  beforeUnmount() {
    this.swipeDetector.unbind()
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
    currFocusPageIndex() {
      editorUtils.setInBgSettingMode(false)
    },
    currActivePageIndex(newVal) {
      if (newVal === -1) this.$nextTick(() => { vivistickerUtils.scrollIntoPage(pageUtils.currFocusPageIndex, 300) })
    }
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
      isInTemplateShare: 'vivisticker/getIsInTemplateShare',
      isInPagePreview: 'vivisticker/getIsInPagePreview',
    }),
    currFocusPageIndex(): number {
      return pageUtils.currFocusPageIndex
    },
    strPagePill(): string {
      return this.pagesState.length > 1 ? `${this.currFocusPageIndex + 1} / ${this.pagesState.length}` : this.$t('STK0070')
    },
    pageSize(): { width: number, height: number } {
      return {
        width: this.pagesState[this.pagesState.length - 1].config.width,
        height: this.pagesState[this.pagesState.length - 1].config.height
      }
    },
    isPageNumMax(): boolean {
      return this.pagesState.length >= vivistickerUtils.MAX_PAGE_NUM
    },
    hasSelectedLayer(): boolean {
      return this.currSelectedInfo.layers.length > 0
    }
  },
  components: {
    PageCard,
    PagePreivew,
    ShareTemplate
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
    outerClick() {
      editorUtils.setInBgSettingMode(false)
      pageUtils.setBackgroundImageControlDefault()
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
      if (this.isInTemplateShare || this.isInPagePreview) return

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

      // reset initial step to prevent wrong size of page when undo
      if (stepsUtils.steps.length === 1) stepsUtils.reset()

      this.$nextTick(() => { vivistickerUtils.scrollIntoPage(pageUtils.currFocusPageIndex, 0) })
    },
    handleSwipe(dir: string) {
      if (this.hasSelectedLayer || this.isBgImgCtrl || this.isImgCtrl) return
      if (dir === 'right') {
        if (!this.isInPageAdd) this.setCurrActivePageIndex(Math.max(0, this.currFocusPageIndex - 1))
        this.isInPageAdd = false
        this.$nextTick(() => { vivistickerUtils.scrollIntoPage(pageUtils.currFocusPageIndex, 300) })
      } else if (dir === 'left') {
        if (pageUtils.currFocusPageIndex === this.pagesState.length - 1) {
          if (!this.editorTypeTemplate || this.isPageNumMax) return
          this.isInPageAdd = true
          vivistickerUtils.scrollIntoPage(this.pagesState.length, 300)
        } else {
          this.setCurrActivePageIndex(Math.min(this.currFocusPageIndex + 1, this.pagesState.length - 1))
          this.$nextTick(() => { vivistickerUtils.scrollIntoPage(pageUtils.currFocusPageIndex, 300) })
        }
      }
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
    },
    addPage() {
      const lastPage = this.pagesState[this.pagesState.length - 1].config
      pageUtils.addPageToPos(pageUtils.newPage({
        width: lastPage.width,
        height: lastPage.height,
        physicalWidth: lastPage.physicalWidth,
        backgroundColor: lastPage.backgroundColor,
        physicalHeight: lastPage.physicalHeight,
        isEnableBleed: lastPage.isEnableBleed,
        bleeds: lastPage.bleeds,
        physicalBleeds: lastPage.physicalBleeds,
        unit: lastPage.unit
      }), this.pagesState.length)
      this.setCurrActivePageIndex(this.pagesState.length - 1)
      this.$nextTick(() => { vivistickerUtils.scrollIntoPage(this.pagesState.length - 1, 500) })
      stepsUtils.record()
    }
  }
})
</script>

<style lang="scss" scoped>
.vvstk-editor {
  @include size(100%);
  background: setColor(black-2);
  &__pages-container {
    @include size(100%);
    overflow: hidden;
    transition: transform 0.3s map-get($ease-functions, ease-in-out-quint);
  }
  &__pages {
    display: grid;
    grid-auto-flow: column;
    position: relative;
  }
}

.page-add {
  width: v-bind("`${cardWidth}px`");
  height: v-bind("`${cardHeight}px`");
  &__page {
    margin: 0 auto;
    width: v-bind("`${pageSize.width}px`");
    height: v-bind("`${pageSize.height}px`");
    margin-top: v-bind("`${marginTop}px`");
    background-color: setColor(black-3);
    box-shadow: 0px 0px 8px rgba(60, 60, 60, 0.31);
    border-radius: 10px;
    row-gap: 20px;
  }
  &__text {
    white-space: pre-wrap;
  }
  &__btn {
    border-radius: 10px;
    padding: 9px 16px;
    column-gap: 8px;
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
    transition: v-bind("animated ? 'transform 500ms ease-in-out' : 'none'");
  }
  &-enter-active {
    transition: transform 500ms ease-in-out;
    transform: scale(1);
  }
  &-enter-from {
    transform: scale(0.75);
  }
  &-leave-active {
    transition: opacity 500ms ease-in-out;
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
