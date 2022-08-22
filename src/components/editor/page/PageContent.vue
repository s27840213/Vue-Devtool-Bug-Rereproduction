<template lang="pug">
div(class="overflow-container"
    :style="styles")
  div(:style="stylesWith3DPreserve")
    div(:class="['page-content']"
        :style="styles"
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
        @mousedown.native.left="pageClickHandler()")
      nu-layer(v-for="(layer,index) in config.layers"
        :key="layer.id"
        :class="!layer.locked ? `nu-layer--p${pageIndex}` : ''"
        :data-index="`${index}`"
        :data-pindex="`${pageIndex}`"
        :layerIndex="index"
        :pageIndex="pageIndex"
        :config="layer")
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
import { mapActions, mapGetters, mapMutations } from 'vuex'
import textUtils from '@/utils/textUtils'
import editorUtils from '@/utils/editorUtils'
import generalUtils from '@/utils/generalUtils'
import queueUtils from '@/utils/queueUtils'

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
    },
    isPagePreview: {
      type: Boolean,
      required: false
    },
    handleSequentially: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      pageIsHover: false
    }
  },
  computed: {
    ...mapGetters({
      isProcessImgShadow: 'shadow/isProcessing',
      isUploadImgShadow: 'shadow/isUploading'
    }),
    isHandleShadow(): boolean {
      return this.isProcessImgShadow || this.isUploadImgShadow
    },
    styles(): { [index: string]: string } {
      return {
        width: `${this.config.width}px`,
        height: `${this.config.height}px`
      }
    },
    stylesWith3DPreserve(): { [index: string]: string } {
      return {
        width: `${this.config.width}px`,
        height: `${this.config.height}px`,
        transformStyle: 'preserve-3d'
      }
    }
  },
  mounted() {
    if (this.config.isAutoResizeNeeded) {
      // this.handleFontLoading()
      this.handleSequentially ? queueUtils.push(this.handleFontLoading) : this.handleFontLoading()
    }
  },
  watch: {
    'config.isAutoResizeNeeded'(newVal) {
      if (newVal) {
        // this.handleFontLoading()
        this.handleSequentially ? queueUtils.push(this.handleFontLoading) : this.handleFontLoading()
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
      this.pageIsHover = isHover
    },
    pageClickHandler(e: PointerEvent): void {
      groupUtils.deselect()
      // imageUtils.setImgControlDefault(false)
      editorUtils.setInMultiSelectionMode(false)
      this.setCurrActivePageIndex(this.pageIndex)
      const sel = window.getSelection()
      if (sel) {
        sel.empty()
        sel.removeAllRanges()
      }
    },
    onRightClick(event: MouseEvent) {
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
      textUtils.untilFontLoadedForPage(this.config).then(() => {
        this.updatePageProps({
          pageIndex: this.pageIndex,
          props: { isAutoResizeNeeded: false }
        })
      })
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
  width: 100%;
  height: 100%;
  background-color: setColor(gray-4);
}
</style>
