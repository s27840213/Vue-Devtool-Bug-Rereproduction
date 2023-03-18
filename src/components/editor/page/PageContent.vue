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
        @tap="tapPageContent")
      //- @dblclick will not be trigger in mobile, use @tap + doubleTapUtils instead.
      div(class="content" :class="`nu-page-content-${pageIndex}`" :style="contentStyles")
        nu-bg-image(
            :image="config.backgroundImage"
            :pageIndex="pageIndex"
            :page="config"
            :color="config.backgroundColor"
            :key="config.backgroundImage.config.id"
            @mousedown.native.left="pageClickHandler()"
            :contentScaleRatio="contentScaleRatio"
            :padding="contentStyles.margin")
        nu-layer(
          v-for="(layer,index) in config.layers"
          :key="layer.id"
          :dataIndex="`${index}`"
          :dataPindex="`${pageIndex}`"
          :snapUtils="snapUtils"
          :layerIndex="index"
          :pageIndex="pageIndex"
          :page="config"
          :config="layer"
          :contentScaleRatio="contentScaleRatio"
          :forceRender="forceRender"
          :lazyLoadTarget="lazyLoadTarget")
      div(v-if="isShowBleed" class="bleed-line" :style="bleedLineStyles")
      div(v-if="userId === 'backendRendering' && backendRenderParams.isTrim" class="trim")
        div(class="trim__tl" :style="trimStyles.tl")
        div(class="trim__tr" :style="trimStyles.tr")
        div(class="trim__bl" :style="trimStyles.bl")
        div(class="trim__br" :style="trimStyles.br")
    template(v-else)
      div(class='pages-loading')
</template>

<script lang="ts">
import NuBgImage from '@/components/editor/global/NuBgImage.vue'
import LazyLoad from '@/components/LazyLoad.vue'
import i18n from '@/i18n'
import { ILayer } from '@/interfaces/layer'
import { IPage } from '@/interfaces/page'
import { SidebarPanelType } from '@/store/types'
import doubleTapUtils from '@/utils/doubleTapUtils'
import DragUtils from '@/utils/dragUtils'
import editorUtils from '@/utils/editorUtils'
import groupUtils from '@/utils/groupUtils'
import imageUtils from '@/utils/imageUtils'
import layerUtils from '@/utils/layerUtils'
import modalUtils from '@/utils/modalUtils'
import networkUtils from '@/utils/networkUtils'
import pageUtils from '@/utils/pageUtils'
import popupUtils from '@/utils/popupUtils'
import textUtils from '@/utils/textUtils'
import uploadUtils from '@/utils/uploadUtils'
import { notify } from '@kyvg/vue3-notification'
import { defineComponent, PropType } from 'vue'
import { mapActions, mapGetters, mapMutations, mapState } from 'vuex'

export default defineComponent({
  emits: [],
  components: {
    NuBgImage,
    LazyLoad
  },
  props: {
    snapUtils: Object,
    config: {
      type: Object as PropType<IPage>,
      required: true
    },
    pageIndex: {
      type: Number,
      required: true
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
      imgLoading: false
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
    ...mapGetters('imgControl', {
      isImgCtrl: 'isImgCtrl'
    }),
    ...mapState('user', ['imgSizeMap', 'userId', 'verUni', 'backendRenderParams']),
    ...mapState('shadow', ['uploadId', 'handleId', 'uploadShadowImgs']),
    isHandleShadow(): boolean {
      return this.isProcessImgShadow || this.isUploadImgShadow
    },
    pageStyles(): { [index: string]: string } {
      return {
        width: `${this.config.width * this.contentScaleRatio + this.margin.right}px`,
        height: `${this.config.height * this.contentScaleRatio + this.margin.bottom}px`,
        transformStyle: pageUtils._3dEnabledPageIndex === this.pageIndex ? 'preserve-3d' : 'initial'
        // ...(this.userId === 'backendRendering' && { paddingBottom: 8 + 'px' })
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
    isShowBleed() {
      if (this.userId === 'backendRendering') return false
      return this.config.isEnableBleed
    },
    contentStyles() {
      if (!this.config.isEnableBleed) {
        return {
          width: this.config.width * this.contentScaleRatio + 'px',
          height: this.config.height * this.contentScaleRatio + 'px',
          padding: [
            '0px',
            this.margin.right + 'px',
            this.margin.bottom + 'px',
            '0px'
          ].join(' ')
        }
      }
      return {
        width: (this.config.width - this.config.bleeds.left - this.config.bleeds.right) * this.contentScaleRatio + 'px',
        height: (this.config.height - this.config.bleeds.top - this.config.bleeds.bottom) * this.contentScaleRatio + 'px',
        margin: [
          this.config.bleeds.top * this.contentScaleRatio + 'px',
          this.config.bleeds.right * this.contentScaleRatio + this.margin.right + 'px',
          this.config.bleeds.bottom * this.contentScaleRatio + this.margin.bottom + 'px',
          this.config.bleeds.left * this.contentScaleRatio + 'px'
        ].join(' ')
      }
    },
    bleedLineStyles() {
      return {
        top: (this.config.bleeds.top - 1) * this.contentScaleRatio + 'px',
        bottom: (this.config.bleeds.bottom - 1) * this.contentScaleRatio + this.margin.bottom + 'px',
        left: (this.config.bleeds.left - 1) * this.contentScaleRatio + 'px',
        right: (this.config.bleeds.right - 1) * this.contentScaleRatio + this.margin.right + 'px',
        border: this.userId === 'backendRendering' ? `${this.contentScaleRatio}px solid white` : `${this.config.isEnableBleed ? this.contentScaleRatio : 0}px dashed white`,
        boxShadow: this.userId === 'backendRendering' ? 'none' : '0 0 3px 1px rgba(0, 0, 0, 0.15)'
      }
    },
    trimStyles() {
      return {
        tl: {
          top: '-2px',
          bottom: `${(this.config.height - this.config.bleeds.top) * this.contentScaleRatio + this.margin.bottom}px`,
          left: '-2px',
          right: `${(this.config.width - this.config.bleeds.left) * this.contentScaleRatio + this.margin.right}px`,
          borderWidth: `${this.contentScaleRatio}px`
        },
        tr: {
          top: '-2px',
          bottom: `${(this.config.height - this.config.bleeds.top) * this.contentScaleRatio + this.margin.bottom}px`,
          left: `${(this.config.width - this.config.bleeds.right) * this.contentScaleRatio}px`,
          right: '-2px',
          borderWidth: `${this.contentScaleRatio}px`
        },
        bl: {
          top: `${(this.config.height - this.config.bleeds.bottom) * this.contentScaleRatio}px`,
          bottom: '-2px',
          left: '-2px',
          right: `${(this.config.width - this.config.bleeds.left) * this.contentScaleRatio + this.margin.right}px`,
          borderWidth: `${this.contentScaleRatio}px`
        },
        br: {
          top: `${(this.config.height - this.config.bleeds.bottom) * this.contentScaleRatio}px`,
          bottom: '-2px',
          left: `${(this.config.width - this.config.bleeds.right) * this.contentScaleRatio}px`,
          right: '-2px',
          borderWidth: `${this.contentScaleRatio}px`
        }
      }
    },
    margin() {
      // additional margin for backend render
      return (this.userId === 'backendRendering' ? this.backendRenderParams.margin : { bottom: 0, right: 0 })
    }
  },
  mounted() {
    if (this.setLayersDone) {
      this.loadLayerImg()
      // this.handleSequentially ? queueUtils.push(this.loadLayerImg) : this.loadLayerImg()
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
  },
  methods: {
    ...mapMutations({
      ADD_newLayers: 'ADD_newLayers',
      setCurrActivePageIndex: 'SET_currActivePageIndex',
      setCurrSidebarPanel: 'SET_currSidebarPanelType',
      setDropdown: 'popup/SET_STATE',
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
    pageClickHandler(): void {
      if (!this.isImgCtrl) {
        groupUtils.deselect()
        editorUtils.setInMultiSelectionMode(false)
        // if (this.currSelectedPageIndex !== this.pageIndex) {
        if (layerUtils.pageIndex !== this.pageIndex) {
          pageUtils.setBackgroundImageControlDefault()
          this.setCurrActivePageIndex(this.pageIndex)
        }
        const sel = window.getSelection()
        if (sel) {
          sel.empty()
          sel.removeAllRanges()
        }
      } else {
        imageUtils.setImgControlDefault()
        editorUtils.setShowMobilePanel(false)
      }
    },
    onRightClick(event: MouseEvent) {
      if (this.$isTouchDevice()) {
        return
      }

      this.setCurrActivePageIndex(this.pageIndex)
      if (!this.isHandleShadow) {
        groupUtils.deselect()
      }
      popupUtils.openPopup('page', { event })
    },
    tapPageContent(e: Event): void {
      const target = e.target as HTMLElement
      if (!target.matches('.nu-background-image img')) return
      doubleTapUtils.click(e, { doubleClickCallback: this.pageDblClickHandler })
    },
    pageDblClickHandler(): void {
      if (this.isHandleShadow) {
        return
      }
      const { srcObj, locked } = this.config.backgroundImage.config
      if ((srcObj?.assetId ?? '') !== '' && !locked) {
        pageUtils.startBackgroundImageControl(this.pageIndex)
        editorUtils.setCurrActivePanel('crop')
      }
      if ((srcObj?.assetId ?? '') !== '' && locked) {
        notify({ group: 'copy', text: i18n.global.tc('NN0804') })
      }
    },
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

.content {
  position: absolute;
  left: 0px;
  top: 0px;
  transform-style: preserve-3d;
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
  >div {
  position: absolute;
  left: 0px;
  top: 0px;
  box-sizing: border-box;
  border: 1px solid setColor(gray-2)
  }
}
</style>
