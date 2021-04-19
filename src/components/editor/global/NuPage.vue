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
            @mouseover="togglePageHighlighter(true)"
            @mouseout="togglePageHighlighter(false)")
          nu-layer(v-for="(layer,index) in config.layers"
            :key="`layer-${index}`"
            :config="layer"
            @mouseover.native.stop="toggleHighlighter(pageIndex,index,true)"
            @mouseout.native.stop="toggleHighlighter(pageIndex,index,false)")
        div(v-if="pageIsHover"
          class="page-highlighter"
          :style="styles()")
        div(class="page-control" :style="styles('control')")
          nu-controller(v-for="(layer,index) in config.layers"
            data-identifier="controller"
            :key="`controller-${index}`"
            :config="layer")
          nu-highlighter(v-for="(layer,index) in config.layers"
            :key="`highlighter-${index}`"
            :config="layer")
</template>

<script lang="ts">
import Vue from 'vue'
import { mapMutations, mapGetters } from 'vuex'
import { IShape, IText, IImage, IGroup } from '@/interfaces/layer'

export default Vue.extend({
  data() {
    return {
      pageIsHover: false
    }
  },
  props: {
    config: Object,
    pageIndex: Number,
    pageScaleRatio: Number
  },
  computed: {
    ...mapGetters({
      scaleRatio: 'getPageScaleRatio'
    })
  },
  methods: {
    ...mapMutations({
      ADD_newLayer: 'ADD_newLayer',
      updateLayerProps: 'Update_layerProps'
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
      if (e.dataTransfer != null) {
        const data = JSON.parse(e.dataTransfer.getData('data'))

        const page = e.target as HTMLElement
        const pageLeft = page.getBoundingClientRect().x
        const pageTop = page.getBoundingClientRect().y

        const left = (e.clientX - pageLeft - data.geometry.left) * (100 / this.scaleRatio)
        const top = (e.clientY - pageTop - data.geometry.top) * (100 / this.scaleRatio)

        const layerInfo = {
          type: 'image',
          pageIndex: this.config.pageIndex,
          src: require('@/assets/img/svg/img-tmp.svg'),
          active: true,
          shown: false,
          styles: {
            x: left,
            y: top,
            scale: 0,
            scaleX: 0,
            scaleY: 0,
            rotate: 0,
            width: 150,
            height: 150
          }
        }
        this.addNewLayer(this.pageIndex, layerInfo)
      }
    },
    addNewLayer(pageIndex: number, layer: IShape | IText | IImage | IGroup) {
      this.ADD_newLayer({
        pageIndex,
        layer
      })
    },
    toggleHighlighter(pageIndex: number, layerIndex: number, shown: boolean) {
      console.log(shown)
      this.updateLayerProps({
        pageIndex,
        layerIndex,
        props: {
          shown
        }
      })
    },
    togglePageHighlighter(isHover: boolean) {
      console.log('sadas')
      this.pageIsHover = isHover
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
  .nu-controller::v-deep {
    // We want to prevent the page-control div from blocking all the event of page-content,
    // but still allow event on nu-controller, so set this property on controller to initial
    pointer-events: initial;
  }
}
</style>
