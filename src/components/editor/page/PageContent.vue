<template lang="pug">
div(class="overflow-container"
    :style="styles()")
  div(:style="Object.assign(styles(), {transformStyle: 'preserve-3d'})")
    div(:class="['page-content']"
        :style="styles()"
        ref="page-content"
        @drop="onDrop"
        @dragover.prevent,
        @dragenter.prevent
        @click.right.stop="onRightClick"
        @click.left.self="pageClickHandler()"
        @dblclick="pageDblClickHandler()"
        @mouseover="togglePageHighlighter(true)"
        @mouseout="togglePageHighlighter(false)")
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

export default Vue.extend({
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
      setLastSelectedPageIndex: 'SET_lastSelectedPageIndex',
      setCurrActivePageIndex: 'SET_currActivePageIndex',
      setDropdown: 'popup/SET_STATE',
      _addPage: 'ADD_page',
      _deletePage: 'DELETE_page',
      deleteGuideline: 'DELETE_guideline'
    }),
    onDrop(e: DragEvent) {
      mouseUtils.onDrop(e, this.pageIndex)
    },
    styles() {
      return {
        width: `${this.config.width}px`,
        height: `${this.config.height}px`,
        backgroundColor: this.config.backgroundColor,
        backgroundImage: `url(${this.config.backgroundImage.config.srcObj ? imageUtils.getSrc(this.config.backgroundImage.config) : this.config.backgroundImage.src})`,
        backgroundPosition: this.config.backgroundImage.posX === -1 ? 'center center'
          : `${this.config.backgroundImage.posX}px ${this.config.backgroundImage.posY}px`,
        backgroundSize: `${this.config.backgroundImage.config.styles.imgWidth}px ${this.config.backgroundImage.config.styles.imgHeight}px`
      }
    },
    togglePageHighlighter(isHover: boolean): void {
      this.pageIsHover = isHover
    },
    pageClickHandler(): void {
      groupUtils.deselect()
      this.setLastSelectedPageIndex(this.pageIndex)
      this.setCurrActivePageIndex(this.pageIndex)
      const sel = window.getSelection()
      if (sel) {
        sel.empty()
        sel.removeAllRanges()
      }
    },
    onRightClick(event: MouseEvent) {
      popupUtils.openPopup('page', { event })
    },
    pageDblClickHandler(): void {
      if ((this.config.backgroundImage.config.srcObj?.assetId ?? '') !== '') {
        pageUtils.startBackgroundImageControl(this.pageIndex)
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
