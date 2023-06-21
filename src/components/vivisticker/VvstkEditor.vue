<template lang="pug">
div(class="vvstk-editor" :style="copyingStyles()" @pointerdown="selectStart")
  div(class="vvstk-editor__pseudo-page" :style="styles('page')")
    div(class="vvstk-editor__scale-container" :style="styles('scale')")
      page-content(id="vvstk-editor" :config="config" :pageIndex="pageIndex" :noBg="true" :contentScaleRatio="contentScaleRatio" :snapUtils="snapUtils")
      dim-background(v-if="isImgCtrl" :config="config" :contentScaleRatio="contentScaleRatio")
    div(class="page-control" :style="styles('control')")
      nu-controller(v-if="currFocusPageIndex === pageIndex && currLayer.type" data-identifier="controller"
        :key="`controller-${currLayer.id}`"
        :layerIndex="currSelectedIndex"
        :pageIndex="pageIndex"
        :page="config"
        :config="currLayer"
        :snapUtils="snapUtils"
        :contentScaleRatio="contentScaleRatio")
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
import { mapGetters } from 'vuex'

export default defineComponent({
  props: {
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
  mounted() {
    window.addEventListener('resize', this.handleResize)
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.handleResize)
  },
  watch: {
    isInEditor(newVal, oldVal): void {
      if (newVal && !oldVal) this.handleResize()
      if (newVal && this.inEffectEditingMode) {
        this.$nextTick(() => {
          editorUtils.setCurrActivePanel('photo-shadow')
        })
      }
    }
  },
  computed: {
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
      imgControlPageIdx: 'imgControl/imgControlPageIdx',
      contentScaleRatio: 'getContentScaleRatio',
      isDuringCopy: 'vivisticker/getIsDuringCopy',
      isImgCtrl: 'imgControl/isImgCtrl',
      isBgImgCtrl: 'imgControl/isBgImgCtrl',
      inEffectEditingMode: 'bgRemove/getInEffectEditingMode',
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
    }
  },
  components: {
    PageContent,
    DimBackground
  },
  methods: {
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
            margin: `${this.marginTop}px auto 0 auto`,
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
    handleResize() {
      const elTop = document.getElementsByClassName('vivisticker__top')[0]
      const headerHeight = 44
      const shortEdge = Math.min(elTop.clientWidth, elTop.clientHeight - headerHeight)
      const pageSize = Math.round(shortEdge * 0.9)
      resizeUtils.resizePage(0, this.config, { width: pageSize, height: pageSize })
      this.marginTop = Math.round(shortEdge * 0.05)
    }
  }
})
</script>

<style lang="scss" scoped>
.vvstk-editor {
  @include size(100%);
  background: setColor(black-2);
  overflow: hidden;
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
</style>
