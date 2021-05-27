<template lang="pug">
  div(class="nu-layer" :style="styles()"
      @drop="!config.clipper ? onDrop($event) : onDropClipper($event)"
      @dragover.prevent,
      @dragenter.prevent)
    div(class='layer-scale'
        :class="{'layer-text': config.type === 'text'}"
        :style="scaleStyles()")
      nu-image(v-if="config.imgControl" style="opacity: 0.35"
              :config="config" :pageIndex="pageIndex" :layerIndex="layerIndex")
      nu-clipper(:config="config")
        component(:is="`nu-${config.type}`" :config="config"
        :pageIndex="pageIndex" :layerIndex="layerIndex")
    //- div(class="test-index")
    //-   span {{layerIndex}}
    //- div(class="test-angle")
    //-   span {{`(z): ${config.styles.zindex}`}}
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
      const zindex = (this.layerIndex + 1) * 99
      const styles = this.config.type === 'text' ? Object.assign(CssConveter.convertDefaultStyle(this.config.styles),
        { background: 'rgba(0, 0, 255, 0)' }) : CssConveter.convertDefaultStyle(this.config.styles)
      if (this.config.imgControl) {
        styles.transform = `translate3d(${this.config.styles.x}px , ${this.config.styles.y}px, ${zindex}px) rotate(${this.config.styles.rotate}deg)`
      }
      return styles
    },
    scaleStyles() {
      /**
       * If layer type is group, we need to set its transform-style to flat, or its order will be affect by the inner layer.
       * And if type is tmp and its zindex value is larger than 0 (default is 0, isn't 0 means its value has been reassigned before), we need to set it to flat too.
       */
      return {
        transform: `scale(${this.config.styles.scale})`,
        'transform-style': this.config.type === 'group' ? 'flat' : (this.config.type === 'tmp' && this.config.styles.zindex > 0) ? 'flat' : 'preserve-3d'
      }
    },
    onDrop(e: DragEvent) {
      MouseUtils.onDrop(e, this.pageIndex, this.getLayerPos)
      e.stopPropagation()
    },
    onDropClipper(e: DragEvent) {
      MouseUtils.onDropClipper(e, this.pageIndex, this.layerIndex, this.getLayerPos, this.config.path, this.config.styles)
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
  display: flex;
  align-items: center;
  justify-content: center;
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
  // transform-origin: top left;
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
