<template lang="pug">
  div(class="nu-page"
      @keydown.delete.exact.stop.prevent.self="ShortcutUtils.del()"
      @keydown.ctrl.67.exact.stop.prevent.self="ShortcutUtils.copy()"
      @keydown.meta.67.exact.stop.prevent.self="ShortcutUtils.copy()"
      @keydown.ctrl.88.exact.stop.prevent.self="ShortcutUtils.cut()"
      @keydown.meta.88.exact.stop.prevent.self="ShortcutUtils.cut()"
      @keydown.ctrl.86.exact.stop.prevent.self="ShortcutUtils.paste()"
      @keydown.meta.86.exact.stop.prevent.self="ShortcutUtils.paste()"
      @keydown.ctrl.71.exact.stop.prevent.self="ShortcutUtils.group()"
      @keydown.meta.71.exact.stop.prevent.self="ShortcutUtils.group()"
      @keydown.ctrl.shift.71.exact.stop.prevent.self="ShortcutUtils.ungroup()"
      @keydown.meta.shift.71.exact.stop.prevent.self="ShortcutUtils.ungroup()"
      @keydown.ctrl.90.exact.stop.prevent.self="ShortcutUtils.undo()"
      @keydown.meta.90.exact.stop.prevent.self="ShortcutUtils.undo()"
      @keydown.ctrl.shift.90.exact.stop.prevent.self="ShortcutUtils.redo()"
      @keydown.meta.shift.90.exact.stop.prevent.self="ShortcutUtils.redo()"
      tabindex="0")
    div(class="page-title text-left text-gray-3 mb-5" :style="{'width': `${config.width * (scaleRatio/100)}px`,}")
      span {{config.name}}
    div(class='pages-wrapper'
        :style="wrapperStyles()")
      div(class="scale-container" :style="`transform: scale(${scaleRatio/100})`")
        div(class="page-content"
            :style="styles('content')"
            @drop="onDrop"
            @dragover.prevent,
            @dragenter.prevent
            @click.self="pageClickHandler()"
            @mouseover="togglePageHighlighter(true)"
            @mouseout="togglePageHighlighter(false)")
          nu-layer(v-for="(layer,index) in config.layers"
            :key="`layer-${index}`"
            :class="`nu-layer--p${pageIndex}`"
            :data-index="`${index}`"
            :data-pindex="`${pageIndex}`"
            :layerIndex="index"
            :pageIndex="pageIndex"
            :config="layer"
            @mouseover.native.stop="toggleHighlighter(pageIndex,index,true)")
        div(v-if="pageIsHover"
          class="page-highlighter"
          :style="styles()")
        div(class="page-control" :style="styles('control')")
          nu-controller(v-for="(layer,index) in config.layers"
            data-identifier="controller"
            :key="`controller-${index}`"
            :layerIndex="index"
            :pageIndex="pageIndex"
            :config="layer")
          //- nu-controller(
          //-   v-if="currSelected.layers.length > 1"
          //-   :key="`mul-controller-${index}`"
          //-   :layerIndex="index"
          //-   :pageIndex="pageIndex"
          //-   :config="layer")
</template>

<script lang="ts">
import Vue from 'vue'
import { mapMutations, mapGetters } from 'vuex'
import { IShape, IText, IImage, IGroup } from '@/interfaces/layer'
import MouseUtils from '@/utils/mouseUtils'
import ShortcutUtils from '@/utils/shortcutUtils'
import GroupUtils from '@/utils/groupUtils'

export default Vue.extend({
  data() {
    return {
      pageIsHover: false,
      ShortcutUtils
    }
  },
  props: {
    config: Object,
    pageIndex: Number,
    isSelecting: Boolean,
    pageScaleRatio: Number
  },
  computed: {
    ...mapGetters({
      scaleRatio: 'getPageScaleRatio',
      currSelectedInfo: 'getCurrSelectedInfo'
    })
  },
  methods: {
    ...mapMutations({
      ADD_newLayers: 'ADD_newLayers',
      updateLayerProps: 'Update_layerProps',
      setLastSelectedPageIndex: 'SET_lastSelectedPageIndex'
    }),
    styles(type: string) {
      return type === 'content' ? {
        width: `${this.config.width}px`,
        height: `${this.config.height}px`,
        backgroundColor: this.config.backgroundColor,
        backgroundImage: `url(${this.config.backgroundImage.src})`,
        backgroundPosition: this.config.backgroundImage.posX === -1 ? 'center center'
          : `${this.config.backgroundImage.posX}% ${this.config.backgroundImage.posY}%`
      } : {
        width: `${this.config.width}px`,
        height: `${this.config.height}px`
      }
    },
    wrapperStyles() {
      return {
        width: `${this.config.width * (this.scaleRatio / 100)}px`,
        height: `${this.config.height * (this.scaleRatio / 100)}px`
      }
    },
    onDrop(e: DragEvent) {
      MouseUtils.onDrop(e, this.pageIndex)
    },
    addNewLayer(pageIndex: number, layer: IShape | IText | IImage | IGroup) {
      this.ADD_newLayers({
        pageIndex: pageIndex,
        layers: [layer]
      })
    },
    toggleHighlighter(pageIndex: number, layerIndex: number, shown: boolean): void {
      if (!this.isSelecting) {
        this.updateLayerProps({
          pageIndex,
          layerIndex,
          props: {
            shown
          }
        })
      }
    },
    togglePageHighlighter(isHover: boolean) {
      this.pageIsHover = isHover
    },
    pageClickHandler() {
      this.setLastSelectedPageIndex(this.pageIndex)
      GroupUtils.deselect()
    }
  }
})
</script>

<style lang="scss" scoped>
.nu-page {
  @include flexCenter;
  min-height: 100%;
  min-width: 100%;
  flex-direction: column;
  box-sizing: border-box;
  position: relative;
  &:focus {
    outline: none;
  }
}

.page-title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.pages-wrapper {
  position: relative;
  box-sizing: content-box;
}
.scale-container {
  width: 0px;
  height: 0px;
  position: relative;
  // border: 1px solid blue;
  box-sizing: border-box;
  transform-origin: 0 0;
}
.page-content {
  overflow: hidden;
  position: absolute;
  // border: 5px solid green;
  box-sizing: border-box;
  background-size: cover;
  background-repeat: no-repeat;
}
.page-highlighter {
  position: absolute;
  border: 2px solid setColor(blue-2, 0.5);
  box-sizing: border-box;
  z-index: 5;
  pointer-events: none;
}
.page-control {
  position: absolute;
  top: 0px;
  left: 0px;
  // this css property will prevent the page-control div from blocking all the event of page-content
  pointer-events: none;
}
</style>
