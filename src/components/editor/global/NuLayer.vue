<template lang="pug">
  div(class="nu-layer" :style="styles()"
      @drop="onDrop"
      @dragover.prevent,
      @dragenter.prevent)
    div(:class="{'layer-scale': true, 'layer-text': config.type === 'text'}" :style="scaleStyles()")
      nu-clipper(v-if="config.type !== 'group'" :config="config")
        component(:is="`nu-${config.type}`" :config="config"
        :pageIndex="pageIndex" :layerIndex="layerIndex")
      component(v-else :is="`nu-${config.type}`" :config="config" :pageIndex="pageIndex")
</template>

<script lang="ts">
import Vue from 'vue'
import { LayerType } from '@/store/types'
import CssConveter from '@/utils/cssConverter'
import MouseUtils from '@/utils/mouseUtils'

export default Vue.extend({
  props: {
    config: Object,
    pageIndex: Number,
    layerIndex: Number
  },
  data() {
    return {
      LayerType
    }
  },
  computed: {
    getLayerPos(): { x: number, y: number } {
      return {
        x: this.config.styles.x,
        y: this.config.styles.y
      }
    },
    getLayerX(): number {
      return this.config.styles.x
    },
    getLayerY(): number {
      return this.config.styles.y
    }
  },
  methods: {
    styles() {
      return this.config.type === 'text' ? Object.assign(CssConveter.convertDefaultStyle(this.config.styles), { background: 'rgba(0, 0, 255, 0)' })
        : CssConveter.convertDefaultStyle(this.config.styles)
    },
    scaleStyles() {
      if (this.config.type === 'text') {
        return {
          transform: `
          translateX(${(this.config.styles.width - this.config.styles.initWidth) / 2}px)
          translateY(${(this.config.styles.height - this.config.styles.initHeight) / 2}px)
          scale(${this.config.styles.scale})`
        }
      }
      return {
        transform: `
        translateX(${(this.config.styles.width - this.config.styles.initWidth) / 2}px)
        translateY(${(this.config.styles.height - this.config.styles.initHeight) / 2}px)
        scale(${this.config.styles.scale})`
      }
    },
    onDrop(e: DragEvent) {
      MouseUtils.onDrop(e, this.pageIndex, this.getLayerPos)
      e.stopPropagation()
    }
  }
})
</script>

<style lang="scss" scoped>
.nu-layer {
  position: absolute;
  top: 0;
  left: 0;
  display: inline-block;
  // box-shadow: inset 0px 0px 0px 7px rgba(136, 136, 136, 0.5);
  width: 100px;
  height: 100px;

  &:focus {
    background-color: rgba(168, 218, 220, 1);
  }
  &:hover {
    cursor: pointer;
  }
}
.layer-scale {
  position: absolute;
}
.layer-text {
  // margin: 10px;
}
</style>
