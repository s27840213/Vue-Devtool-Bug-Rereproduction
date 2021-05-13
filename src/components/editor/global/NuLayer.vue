<template lang="pug">
  div(class="nu-layer" :style="styles()"
      @drop="onDrop"
      @dragover.prevent,
      @dragenter.prevent)
    div(class='layer-scale'
        :class="{'layer-text': config.type === 'text'}"
        :style="scaleStyles()")
      nu-clipper(:config="config")
        component(:is="`nu-${config.type}`" :config="config"
        :pageIndex="pageIndex" :layerIndex="layerIndex")
    div(class="test-index")
      span {{layerIndex}}
    div(class="test-angle")
      span {{`(z): ${config.styles.zindex}`}}
      //- span {{`(x,y): (${config.styles.x},${config.styles.y})`}}
      //- span {{`(initX,initY): (${config.styles.initX},${config.styles.initY})`}}
      //- span {{`Rotated Deg: ${Math.floor(config.styles.rotate*100)/100}`}}
      //- span {{`Pos: (${Math.round(config.styles.x)},${Math.round(config.styles.y)})`}}
</template>

<script lang="ts">
import Vue from 'vue'
import { LayerType } from '@/store/types'
import CssConveter from '@/utils/cssConverter'
import MouseUtils from '@/utils/mouseUtils'
import MathUtils from '@/utils/mathUtils'

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
    },
    getCos(): number {
      return MathUtils.cos(this.config.styles.rotate)
    }
  },
  methods: {
    styles() {
      return this.config.type === 'text' ? Object.assign(CssConveter.convertDefaultStyle(this.config.styles), { background: 'rgba(0, 0, 255, 0)' })
        : CssConveter.convertDefaultStyle(this.config.styles)
    },
    scaleStyles() {
      // if (this.config.type === 'group' || this.config.type === 'tmp') {
      //   console.log(this.config.styles.width, this.config.styles.height, this.config.styles.initWidth, this.config.styles.initHeight)
      // }
      if (this.config.type === 'text') {
        return {
          transform: `
          translateX(${(this.config.styles.width - this.config.styles.initWidth) / 2}px)
          translateY(${(this.config.styles.height - this.config.styles.initHeight) / 2}px)
          scale(${this.config.styles.scale})`,
          'transform-style': 'preserve-3d'
        }
      }
      if (this.config.type === 'group') {
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
        scale(${this.config.styles.scale})`,
        'transform-style': 'preserve-3d'
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
  transform-style: preserve-3d;
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
.test-index {
  position: absolute;
  top: 0;
  left: 50%;
  font-size: 18px;
  color: white;
  font-weight: bold;
  text-shadow: 2px 2px 5px setColor(blue-1);
  z-index: 100;
}

.test-angle {
  width: 100%;
  position: absolute;
  bottom: -80px;
  font-size: 18px;
  color: white;
  font-weight: bold;
  text-shadow: 2px 2px 5px setColor(blue-1);
  z-index: 100;
  display: flex;
  flex-direction: column;
}
</style>
