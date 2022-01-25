<template lang="pug">
div(class="overflow-container"
    :style="styles()")
  div(:style="Object.assign(styles(), {transformStyle: 'preserve-3d'})")
    div(:class="['page-content']"
        :style="styles()"
        ref="page-content"
        @drop.prevent="onDrop"
        @dragover.prevent,
        @dragenter.prevent,
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
</template>

<script lang="ts">
import Vue from 'vue'
import imageUtils from '@/utils/imageUtils'
import { mapMutations } from 'vuex'
import groupUtils from '@/utils/groupUtils'
import pageUtils from '@/utils/pageUtils'
import mouseUtils from '@/utils/mouseUtils'
import popupUtils from '@/utils/popupUtils'
import stepsUtils from '@/utils/stepsUtils'
import uploadUtils from '@/utils/uploadUtils'
import { SidebarPanelType } from '@/store/types'
import assetUtils from '@/utils/assetUtils'
import NuBgImage from '@/components/editor/global/NuBgImage.vue'
import modalUtils from '@/utils/modalUtils'
import networkUtils from '@/utils/networkUtils'
import DragUtils from '@/utils/dragUtils'

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
      pageIsHover: false
    }
  },
  computed: {

  },
  mounted() {
    const pageContent = this.$refs['page-content'] as HTMLElement
    /**
     * Prevent the context menu from showing up when right click or Ctrl + left click on controller
     */
    pageContent.addEventListener('contextmenu', (e: MouseEvent) => {
      e.preventDefault()
    }, false)
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
    onDrop(e: DragEvent) {
      if (!navigator.onLine) {
        networkUtils.notifyNetworkError()
        return
      }
      const dt = e.dataTransfer
      if (e.dataTransfer?.getData('data')) {
        console.log(this.pageIndex)
        new DragUtils().itemOnDrop(e, this.pageIndex)
      } else if (dt && dt.files.length !== 0) {
        const files = dt.files
        this.setCurrSidebarPanel(SidebarPanelType.file)
        if (uploadUtils.isLogin) {
          uploadUtils.uploadAsset('image', files, true)
        } else {
          modalUtils.setIsModalOpen(true)
          modalUtils.setModalInfo('請登入後，才可上傳檔案', [], '')
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
      groupUtils.deselect()
      this.setCurrActivePageIndex(this.pageIndex)
      const sel = window.getSelection()
      if (sel) {
        sel.empty()
        sel.removeAllRanges()
      }
    },
    onRightClick(event: MouseEvent) {
      this.setCurrActivePageIndex(this.pageIndex)
      groupUtils.deselect()
      popupUtils.openPopup('page', { event })
    },
    pageDblClickHandler(): void {
      const { srcObj, locked } = this.config.backgroundImage.config
      if ((srcObj?.assetId ?? '') !== '' && !locked) {
        pageUtils.startBackgroundImageControl(this.pageIndex)
        stepsUtils.record()
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
</style>
