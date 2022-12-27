<template lang="pug">
div(class="overflow-container"
    :style="pageStyles")
  div(:style="stylesWith3DPreserve")
    div(v-if="imgLoaded"
        :class="['page-content']"
        :style="pageStyles"
        ref="page-content"
        @drop.prevent="onDrop"
        @dragover.prevent
        @dragenter.prevent
        @contextmenu.prevent
        @click.right.stop="onRightClick"
        @dblclick="pageDblClickHandler()"
        @mouseover="togglePageHighlighter(true)"
        @mouseout="togglePageHighlighter(false)")
      nu-bg-image(:image="this.config.backgroundImage"
        :pageIndex="pageIndex"
        :color="this.config.backgroundColor"
        :key="this.config.backgroundImage.id"
        @mousedown.native.left="pageClickHandler()"
        :contentScaleRatio="contentScaleRatio")
      //- lazy-load(v-for="(layer,index) in config.layers"
      //-     :key="layer.id"
      //-     target=".editor-view"
      //-     :threshold="[0,1]")
      //- template(v-if="layerLazyLoad")
      //-   lazy-load(v-for="(layer,index) in config.layers"
      //-       :key="layer.id"
      //-       :target="lazyLoadTarget"
      //-       :minHeight="layer.styles.height * contentScaleRatio"
      //-       :minWidth="layer.styles.width * contentScaleRatio"
      //-       :threshold="[0]")
      //-     nu-layer(
      //-       :class="!layer.locked ? `nu-layer--p${pageIndex}` : ''"
      //-       :data-index="`${index}`"
      //-       :data-pindex="`${pageIndex}`"
      //-       :layerIndex="index"
      //-       :pageIndex="pageIndex"
      //-       :config="layer"
      //-       :currSelectedInfo="currSelectedInfo"
      //-       :contentScaleRatio="contentScaleRatio"
      //-       :scaleRatio="scaleRatio"
      //-       :getCurrFunctionPanelType="getCurrFunctionPanelType"
      //-       :isUploadingShadowImg="isUploadingShadowImg"
      //-       :isHandling="isHandling"
      //-       :isShowPagePanel="isShowPagePanel"
      //-       :imgSizeMap="imgSizeMap"
      //-       :userId="userId"
      //-       :verUni="verUni"
      //-       :uploadId="uploadId"
      //-       :handleId="handleId"
      //-       :uploadShadowImgs="uploadShadowImgs"
      //-       :isPagePreview="true"
      //-       :forceRender="forceRender")
      //- template(v-else)
      nu-layer(
        v-for="(layer,index) in config.layers"
        :key="layer.id"
        :data-index="`${index}`"
        :data-pindex="`${pageIndex}`"
        :snapUtils="snapUtils"
        :layerIndex="index"
        :pageIndex="pageIndex"
        :config="layer"
        :currSelectedInfo="currSelectedInfo"
        :contentScaleRatio="contentScaleRatio"
        :scaleRatio="scaleRatio"
        :getCurrFunctionPanelType="getCurrFunctionPanelType"
        :isUploadingShadowImg="isUploadingShadowImg"
        :isHandling="isHandling"
        :isShowPagePanel="isShowPagePanel"
        :imgSizeMap="imgSizeMap"
        :userId="userId"
        :verUni="verUni"
        :uploadId="uploadId"
        :handleId="handleId"
        :uploadShadowImgs="uploadShadowImgs"
        :isPagePreview="isPagePreview"
        :forceRender="forceRender"
        :lazyLoadTarget="lazyLoadTarget"
        v-on="$listeners")
      div(v-if="this.userId === 'backendRendering' && (this.bleed || this.trim)" class="bleed-line" :style="bleedLineStyles")
      div(v-if="this.userId === 'backendRendering' && this.trim" class="trim")
        div(class="trim__tl" :style="trimStyles.tl")
        div(class="trim__tr" :style="trimStyles.tr")
        div(class="trim__bl" :style="trimStyles.bl")
        div(class="trim__br" :style="trimStyles.br")
    template(v-else)
      div(class='pages-loading')
</template>

<script lang="ts">
import Vue from 'vue'
import groupUtils from '@/utils/groupUtils'
import pageUtils from '@/utils/pageUtils'
import popupUtils from '@/utils/popupUtils'
import uploadUtils from '@/utils/uploadUtils'
import { SidebarPanelType } from '@/store/types'
import NuBgImage from '@/components/editor/global/NuBgImage.vue'
import modalUtils from '@/utils/modalUtils'
import networkUtils from '@/utils/networkUtils'
import DragUtils from '@/utils/dragUtils'
import { mapActions, mapGetters, mapMutations, mapState } from 'vuex'
import textUtils from '@/utils/textUtils'
import editorUtils from '@/utils/editorUtils'
import generalUtils from '@/utils/generalUtils'
import LazyLoad from '@/components/LazyLoad.vue'
import { ILayer } from '@/interfaces/layer'

export default Vue.extend({
  components: {
    NuBgImage,
    LazyLoad
  },
  props: {
    snapUtils: Object,
    config: {
      type: Object,
      required: true
    },
    pageIndex: {
      type: Number,
      required: true
    },
    isPagePreview: {
      type: Boolean,
      required: false
    },
    handleSequentially: {
      type: Boolean,
      default: false
    },
    contentScaleRatio: {
      default: 1,
      type: Number
    },
    forceRender: {
      default: false,
      type: Boolean
    },
    lazyLoadTarget: {
      type: String,
      default: '.editor-view'
    }
  },
  data() {
    return {
      imgLoaded: false,
      imgLoading: false,
      pageIsHover: false
    }
  },
  computed: {
    ...mapGetters({
      setLayersDone: 'file/getSetLayersDone',
      isProcessImgShadow: 'shadow/isProcessing',
      isUploadImgShadow: 'shadow/isUploading',
      currSelectedInfo: 'getCurrSelectedInfo',
      scaleRatio: 'getPageScaleRatio',
      getCurrFunctionPanelType: 'getCurrFunctionPanelType',
      isUploadingShadowImg: 'shadow/isUploading',
      isHandling: 'shadow/isHandling',
      isShowPagePanel: 'page/getShowPagePanel',
      currSelectedPageIndex: 'getCurrSelectedPageIndex'
    }),
    ...mapState('user', ['imgSizeMap', 'userId', 'verUni', 'bleed', 'trim']),
    ...mapState('shadow', ['uploadId', 'handleId', 'uploadShadowImgs']),
    isHandleShadow(): boolean {
      return this.isProcessImgShadow || this.isUploadImgShadow
    },
    pageStyles(): { [index: string]: string } {
      return {
        width: `${this.config.width * this.contentScaleRatio}px`,
        height: `${this.config.height * this.contentScaleRatio}px`,
        transformStyle: pageUtils._3dEnabledPageIndex === this.pageIndex ? 'preserve-3d' : 'initial'
      }
    },
    stylesWith3DPreserve(): { [index: string]: string } {
      return {
        width: `${this.config.width * this.contentScaleRatio}px`,
        height: `${this.config.height * this.contentScaleRatio}px`,
        transformStyle: pageUtils._3dEnabledPageIndex === this.pageIndex ? 'preserve-3d' : 'initial'
      }
    },
    layerFilter(): any {
      const filterResult = this.config.layers.filter((layer: ILayer) => {
        // return layer.type !== LayerType.shape
        // return layer.type !== LayerType.text
        return layer
      })

      return filterResult
    },
    hasSelectedLayer(): boolean {
      return this.currSelectedInfo.layers.length > 0
    },
    bleedLineStyles() {
      // const borderSize = { top: 1, bottom: 1 }
      // if (this.isDetailPage && this.pages.length > 1) {
      //   if (this.pageIndex === 0) {
      //     borderSize.bottom = 0
      //   } else if (this.pageIndex === this.pagesLength - 1) {
      //     borderSize.top = 0
      //   } else {
      //     borderSize.bottom = 0
      //     borderSize.top = 0
      //   }
      // }

      return {
        top: this.config.bleeds.top * this.contentScaleRatio + 'px',
        bottom: this.config.bleeds.bottom * this.contentScaleRatio + 'px',
        left: this.config.bleeds.left * this.contentScaleRatio + 'px',
        right: this.config.bleeds.right * this.contentScaleRatio + 'px'
        // borderTop: borderSize.top + 'px solid white',
        // borderBottom: borderSize.bottom + 'px solid white'
      }
    },
    trimStyles() {
      return {
        tl: {
          top: '-1px',
          bottom: `${(this.config.height - this.config.bleeds.top) * this.contentScaleRatio - 1}px`,
          left: '-1px',
          right: `${(this.config.width - this.config.bleeds.left) * this.contentScaleRatio - 1}px`
        },
        tr: {
          top: '-1px',
          bottom: `${(this.config.height - this.config.bleeds.top) * this.contentScaleRatio - 1}px`,
          left: `${(this.config.width - this.config.bleeds.right) * this.contentScaleRatio - 1}px`,
          right: '-1px'
        },
        bl: {
          top: `${(this.config.height - this.config.bleeds.bottom) * this.contentScaleRatio - 1}px`,
          bottom: '-1px',
          left: '-1px',
          right: `${(this.config.width - this.config.bleeds.left) * this.contentScaleRatio - 1}px`
        },
        br: {
          top: `${(this.config.height - this.config.bleeds.bottom) * this.contentScaleRatio - 1}px`,
          bottom: '-1px',
          left: `${(this.config.width - this.config.bleeds.right) * this.contentScaleRatio - 1}px`,
          right: '-1px'
        }
      }
    }
  },
  mounted() {
    if (this.setLayersDone) {
      this.loadLayerImg()
      // this.handleSequentially ? queueUtils.push(this.loadLayerImg) : this.loadLayerImg()
    }
    if (this.config.isAutoResizeNeeded) {
      this.handleFontLoading()
      // this.handleSequentially ? queueUtils.push(this.handleFontLoading) : this.handleFontLoading()
    }
  },
  watch: {
    setLayersDone(newVal: boolean) {
      // When first page mounted, its layers is not ready,
      // so trigger loadLayerImg when uploadUtils call SET_pages.
      if (newVal) {
        this.loadLayerImg()
        // this.handleSequentially ? queueUtils.push(this.loadLayerImg) : this.loadLayerImg()
      }
    },
    'config.isAutoResizeNeeded'(newVal) {
      if (newVal) {
        this.handleFontLoading()
        // this.handleSequentially ? queueUtils.push(this.handleFontLoading) : this.handleFontLoading()
      }
    }
  },
  methods: {
    ...mapMutations({
      ADD_newLayers: 'ADD_newLayers',
      setCurrActivePageIndex: 'SET_currActivePageIndex',
      setCurrSidebarPanel: 'SET_currSidebarPanelType',
      setDropdown: 'popup/SET_STATE',
      _addPage: 'ADD_page',
      _deletePage: 'DELETE_page',
      updatePageProps: 'UPDATE_pageProps'
    }),
    ...mapActions({
      updatePageImages: 'file/updatePageImages',
      updatePageFonts: 'brandkit/updatePageFonts',
      updatePageLogos: 'brandkit/updatePageLogos'
    }),
    async loadLayerImg() {
      if (this.setLayersDone && !this.imgLoaded && !this.imgLoading) {
        this.imgLoading = true
        await Promise.all([
          this.updatePageImages({ pageIndex: this.pageIndex }),
          this.updatePageFonts({ pageIndex: this.pageIndex }),
          this.updatePageLogos({ pageIndex: this.pageIndex })
        ])
        this.imgLoaded = true
        this.imgLoading = false
      }
    },
    onDrop(e: DragEvent) {
      if (!navigator.onLine) {
        networkUtils.notifyNetworkError()
        return
      }
      const dt = e.dataTransfer
      if (e.dataTransfer?.getData('data')) {
        new DragUtils().itemOnDrop(e, this.pageIndex)
      } else if (dt && dt.files.length !== 0) {
        const files = dt.files
        this.setCurrSidebarPanel(SidebarPanelType.file)
        if (uploadUtils.isLogin) {
          uploadUtils.uploadAsset('image', files, {
            addToPage: true
          })
        } else {
          modalUtils.setModalInfo(`${this.$t('NN0350')}`, [])
        }
      }
    },
    togglePageHighlighter(isHover: boolean): void {
      if (this.isPagePreview) return
      this.pageIsHover = isHover
    },
    pageClickHandler(e: PointerEvent): void {
      if (this.isPagePreview) return
      groupUtils.deselect()
      // imageUtils.setImgControlDefault(false)
      editorUtils.setInMultiSelectionMode(false)
      if (this.currSelectedPageIndex !== this.pageIndex) {
        pageUtils.setBackgroundImageControlDefault()
        this.setCurrActivePageIndex(this.pageIndex)
      }
      const sel = window.getSelection()
      if (sel) {
        sel.empty()
        sel.removeAllRanges()
      }
    },
    onRightClick(event: MouseEvent) {
      if (this.isPagePreview) return
      if (generalUtils.isTouchDevice()) {
        return
      }

      this.setCurrActivePageIndex(this.pageIndex)
      if (!this.isHandleShadow) {
        groupUtils.deselect()
      }
      popupUtils.openPopup('page', { event })
    },
    pageDblClickHandler(): void {
      if (this.isPagePreview) return

      if (this.isHandleShadow) {
        return
      }
      const { srcObj, locked } = this.config.backgroundImage.config
      if ((srcObj?.assetId ?? '') !== '' && !locked) {
        pageUtils.startBackgroundImageControl(this.pageIndex)
      }
      if ((srcObj?.assetId ?? '') !== '' && locked) {
        this.$notify({ group: 'copy', text: '🔒背景已被鎖定，請解鎖後再進行操作' })
      }
    },
    async handleFontLoading() {
      if (this.$route.name === 'Editor' || this.$route.name === 'MobileEditor') {
        textUtils.untilFontLoadedForPage(this.config, true).then(() => {
          setTimeout(() => {
            this.updatePageProps({
              pageIndex: this.pageIndex,
              props: { isAutoResizeNeeded: false }
            })
          }, 200) // for the delay between font loading and dom rendering
        })
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.overflow-container {
  position: relative;
  overflow: hidden;
  transform-origin: 0 0;
}

.page-content {
  position: absolute;
  box-sizing: border-box;
  background-repeat: no-repeat;
}

.pages-loading {
  width: 100%;
  height: 100%;
  background-color: setColor(gray-4);
}

.bleed-line {
  pointer-events: none;
  position: absolute;
  left: 0px;
  top: 0px;
  box-sizing: border-box;
  border: 1px solid white
}

.trim {
  pointer-events: none;
  >div {
  position: absolute;
  left: 0px;
  top: 0px;
  box-sizing: border-box;
  border: 1px solid setColor(gray-2)
  }
}
</style>
