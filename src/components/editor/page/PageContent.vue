<template lang="pug">
div(class="overflow-container"
    :style="styles()")
  div(:style="Object.assign(styles(), {transformStyle: 'preserve-3d'})")
    div(v-if="imgLoaded"
        :class="['page-content']"
        :style="styles()"
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
        :color="this.config.backgroundColor"
        :key="this.config.backgroundImage.id"
        @click.native.left="pageClickHandler()")
      nu-layer(v-for="(layer,index) in config.layers"
        :key="layer.id"
        :class="!layer.locked ? `nu-layer--p${pageIndex}` : ''"
        :data-index="`${index}`"
        :data-pindex="`${pageIndex}`"
        :layerIndex="index"
        :pageIndex="pageIndex"
        :config="layer")
    template(v-else)
      div(class='pages-loading')
</template>

<script lang="ts">
import Vue from 'vue'
import imageUtils from '@/utils/imageUtils'
import { mapActions, mapGetters, mapMutations, mapState } from 'vuex'
import groupUtils from '@/utils/groupUtils'
import pageUtils from '@/utils/pageUtils'
import mouseUtils from '@/utils/mouseUtils'
import popupUtils from '@/utils/popupUtils'
import stepsUtils from '@/utils/stepsUtils'
import uploadUtils from '@/utils/uploadUtils'
import { LayerType, SidebarPanelType } from '@/store/types'
import assetUtils from '@/utils/assetUtils'
import NuBgImage from '@/components/editor/global/NuBgImage.vue'
import modalUtils from '@/utils/modalUtils'
import networkUtils from '@/utils/networkUtils'
import DragUtils from '@/utils/dragUtils'
import layerUtils from '@/utils/layerUtils'
import generalUtils from '@/utils/generalUtils'
import imageShadowUtils from '@/utils/imageShadowUtils'

export default Vue.extend({
  components: { NuBgImage },
  props: {
    config: {
      type: Object,
      required: true
    },
    pageIndex: {
      type: Number,
      required: true
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
      isUploadImgShadow: 'shadow/isUploading'
    }),
    isHandleShadow(): boolean {
      return this.isProcessImgShadow || this.isUploadImgShadow
    }
  },
  mounted() {
    if (this.setLayersDone) {
      this.loadLayerImg()
    }
  },
  watch: {
    setLayersDone(newVal: boolean) {
      // When first page mounted, its layers is not ready,
      // so trigger loadLayerImg when uploadUtils call SET_pages.
      if (newVal) {
        this.loadLayerImg()
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
      _deletePage: 'DELETE_page'
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
          modalUtils.setIsModalOpen(true)
          modalUtils.setModalInfo(`${this.$t('NN0350')}`, [], '')
        }
      }
    },
    styles() {
      return {
        width: `${this.config.width}px`,
        height: `${this.config.height}px`
      }
    },
    togglePageHighlighter(isHover: boolean): void {
      this.pageIsHover = isHover
    },
    pageClickHandler(): void {
      if (!this.isHandleShadow) {
        groupUtils.deselect()
      } else {
        imageUtils.setImgControlDefault(false)
      }
      this.setCurrActivePageIndex(this.pageIndex)
      const sel = window.getSelection()
      if (sel) {
        sel.empty()
        sel.removeAllRanges()
      }
    },
    onRightClick(event: MouseEvent) {
      this.setCurrActivePageIndex(this.pageIndex)
      if (!this.isHandleShadow) {
        groupUtils.deselect()
      }
      popupUtils.openPopup('page', { event })
    },
    pageDblClickHandler(): void {
      if (!this.isHandleShadow) {
        return
      }
      const { srcObj, locked } = this.config.backgroundImage.config
      if ((srcObj?.assetId ?? '') !== '' && !locked) {
        pageUtils.startBackgroundImageControl(this.pageIndex)
      }
      if ((srcObj?.assetId ?? '') !== '' && locked) {
        this.$notify({ group: 'copy', text: '🔒背景已被鎖定，請解鎖後再進行操作' })
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
  transform-style: preserve-3d;
}

.pages-loading {
  width: 100%; height: 100%;
  background-color: setColor(gray-4);
}
</style>
