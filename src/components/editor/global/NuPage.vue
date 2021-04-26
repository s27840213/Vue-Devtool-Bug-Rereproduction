<template lang="pug">
  div(class="nu-page")
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

export default Vue.extend({
  data() {
    return {
      pageIsHover: false
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
      scaleRatio: 'getPageScaleRatio'
    })
  },
  methods: {
    ...mapMutations({
      ADD_newLayers: 'ADD_newLayers',
      updateLayerProps: 'Update_layerProps',
      addSelectedLayer: 'ADD_selectedLayer',
      clearSelectedInfo: 'CLEAR_currSelectedInfo',
      setLastSelectedPageIndex: 'SET_lastSelectedPageIndex'
    }),
    styles(type: string) {
      return type === 'content' ? {
        width: `${this.config.width}px`,
        height: `${this.config.height}px`,
        backgroundColor: this.config.backgroundColor
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
      this.clearSelectedInfo()
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
