<template lang="pug">
div(class="vvstk-editor" v-touch :style="copyingStyles()" @pointerdown="selectStart" @swiperight="handleSwipeRight" @swipeleft="handleSwipeLeft")
  transition-group(name="scale" tag="div" class="vvstk-editor__pages" :style="styles('pages')")
    div(v-for="(page, index) in pagesState" :key="`page-${page.config.id}`" class="vvstk-editor__pseudo-page" :class="`nu-page nu-page_${index}`" :style="styles('page')")
      div(class="vvstk-editor__scale-container" :style="styles('scale')")
        page-content(id="vvstk-editor" :config="page.config" :pageIndex="pageIndex" :noBg="true" :contentScaleRatio="contentScaleRatio" :snapUtils="snapUtils")
        dim-background(v-if="isImgCtrl" :config="page.config" :contentScaleRatio="contentScaleRatio")
      div(class="page-control" :style="styles('control')")
        nu-controller(v-if="currFocusPageIndex === index && currLayer.type" data-identifier="controller"
          :key="`controller-${currLayer.id}`"
          :layerIndex="currSelectedIndex"
          :pageIndex="index"
          :page="page.config"
          :config="currLayer"
          :snapUtils="snapUtils"
          :contentScaleRatio="contentScaleRatio")
  div(v-if="isMultiPage" class="page-pill" @click="showPanelPageManagement")
    svg-icon(iconName="all-pages" iconWidth="16px" iconColor="black-5")
    span(class="page-pill__text body-XS text-black-5") {{ strPagePill }}
</template>

<script lang="ts">
import DimBackground from '@/components/editor/page/DimBackground.vue'
import PageContent from '@/components/editor/page/PageContent.vue'
import { ILayer } from '@/interfaces/layer'
import { IPage } from '@/interfaces/page'
import { LayerType } from '@/store/types'
import controlUtils from '@/utils/controlUtils'
import editorUtils from '@/utils/editorUtils'
import frameUtils from '@/utils/frameUtils'
import layerUtils from '@/utils/layerUtils'
import { MovingUtils } from '@/utils/movingUtils'
import pageUtils from '@/utils/pageUtils'
import resizeUtils from '@/utils/resizeUtils'
import SnapUtils from '@/utils/snapUtils'
import vivistickerUtils from '@/utils/vivistickerUtils'
import { defineComponent } from 'vue'
import { mapGetters, mapMutations, mapState } from 'vuex'

const MULTI_PAGE_EDITOR_TYPES = ['story', 'post']

export default defineComponent({
  props: {
    // currPage: {
    //   type: Object as PropType<IPage>,
    //   required: true
    // },
    isInEditor: {
      type: Boolean,
      required: true
    }
  },
  data() {
    return {
      pageIndex: 0,
      marginTop: 44
    }
  },
  created() {
    this.pagesState[this.pageIndex].modules.snapUtils.pageIndex = this.pageIndex
  },
  watch: {
    isInEditor(newVal, oldVal): void {
      if (newVal && !oldVal) {
        this.$nextTick(() => {
          this.handleResize()
        })
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
      imgControlPageIdx: 'imgControl/imgControlPageIdx',
      contentScaleRatio: 'getContentScaleRatio',
      isDuringCopy: 'vivisticker/getIsDuringCopy',
      isImgCtrl: 'imgControl/isImgCtrl',
      isBgImgCtrl: 'imgControl/isBgImgCtrl'
    }),
    config(): IPage {
      return this.pagesState[this.pageIndex].config
    },
    snapUtils(): SnapUtils {
      return this.pagesState[this.pageIndex].modules.snapUtils
    },
    currLayer(): ILayer {
      return layerUtils.getCurrLayer
    },
    currFocusPageIndex(): number {
      return pageUtils.currFocusPageIndex
    },
    selectedLayerCount(): number {
      return this.currSelectedInfo.layers.length
    },
    strPagePill(): string {
      return this.pagesState.length > 1 ? `${this.currFocusPageIndex + 1} / ${this.pagesState.length}` : 'Pages'
    },
    isMultiPage(): boolean {
      return MULTI_PAGE_EDITOR_TYPES.includes(this.editorType)
    }
  },
  components: {
    PageContent,
    DimBackground
  },
  methods: {
    ...mapMutations({
      setCurrActivePageIndex: 'SET_currActivePageIndex',
    }),
    styles(type: string) {
      switch (type) {
        case 'control':
          return {
            width: `${this.config.width}px`,
            height: `${this.config.height}px`,
            overflow: this.selectedLayerCount > 0 ? 'initial' : 'hidden'
          }
        case 'page':
          return {
            width: `${this.config.width}px`,
            height: `${this.config.height}px`,
            backgroundColor: this.isDuringCopy ? 'transparent' : this.editorBg,
            margin: `${this.marginTop}px calc((100% - ${this.config.width}px) / 2) 0`,
            ...(this.isDuringCopy ? { boxShadow: '0 0 0 2000px #1f1f1f', borderRadius: '0' } : {})
          }
        case 'scale':
          return {
            transform: `scale(${1 / this.contentScaleRatio})`
          }
      }
    },
    copyingStyles() {
      return this.isDuringCopy ? { background: 'transparent' } : {}
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
      resizeUtils.resizePage(0, this.config, vivistickerUtils.getPageSize(this.editorType))
      const elTop = document.getElementsByClassName('vivisticker__top')[0]
      const headerHeight = 44
      const shortEdge = Math.min(elTop.clientWidth, elTop.clientHeight - headerHeight)
      this.marginTop = Math.round(shortEdge * 0.05)
      this.$nextTick(() => { pageUtils.scrollIntoPage(pageUtils.currFocusPageIndex, undefined, 0) })
    },
    handleSwipeRight() {
      console.log('handleSwipeRight')
      this.setCurrActivePageIndex(Math.max(0, this.currFocusPageIndex - 1))
      this.$nextTick(() => { pageUtils.scrollIntoPage(pageUtils.currFocusPageIndex, undefined, 300) })
    },
    handleSwipeLeft() {
      console.log('handleSwipeLeft')
      this.setCurrActivePageIndex(Math.min(this.currFocusPageIndex + 1, this.pagesState.length - 1))
      this.$nextTick(() => { pageUtils.scrollIntoPage(pageUtils.currFocusPageIndex, undefined, 300) })
    }
  }
})
</script>

<style lang="scss" scoped>
.vvstk-editor {
  @include size(100%);
  background: setColor(black-2);
  overflow: hidden;
  &__pages {
    display: grid;
    grid-auto-flow: column;
    grid-template-columns: repeat(v-bind("pagesState.length"), 100%);
  }
  &__pseudo-page {
    position: relative;
    transform-style: preserve-3d;
    user-select: none;
    box-shadow: 0px 0px 8px rgba(60, 60, 60, 0.31);
    border-radius: 10px;
  }
  &__scale-container {
    width: 0px;
    height: 0px;
    position: relative;
    box-sizing: border-box;
    transform-origin: 0 0;
  }
}

.page-control {
  position: absolute;
  top: 0px;
  left: 0px;
  transform-style: preserve-3d;
  // this css property will prevent the page-control div from blocking all the event of page-content
  pointer-events: none;
  :focus {
    outline: none;
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

.scale {
  &-enter-active,
  &-leave-active {
    transition: transform 300ms ease-in-out;
    transform: scale(1);
  }
  &-enter-from,
  &-leave-to {
    transform: scale(0.75);
  }
}
</style>
