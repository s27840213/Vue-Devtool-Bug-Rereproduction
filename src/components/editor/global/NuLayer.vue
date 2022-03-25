<template lang="pug">
  div(class="nu-layer" :style="styles()" ref="body"
      @drop="config.type !== 'image' ? onDrop($event) : onDropClipper($event)"
      @dragover.prevent
      @dragleave.prevent
      @dragenter.prevent)
    div(class="layer-scale" ref="scale"
        :style="scaleStyles()")
      nu-clipper(:config="config" :layerIndex="layerIndex" :imgControl="imgControl")
        component(:is="`nu-${config.type}`" :config="config" class="transition-none"
        :pageIndex="pageIndex" :layerIndex="layerIndex" :subLayerIndex="subLayerIndex")
    div(v-if="appendShadowEffect" class="img-shadow-effect" :style="shadowStyles()")
    div(v-if="config.inProcess" class="nu-layer__inProcess")
      square-loading
      //- svg-icon(class="spiner"
      //-   :iconName="'spiner'"
      //-   :iconColor="'white'"
      //-   :iconWidth="'150px'")
</template>

<script lang="ts">
import Vue from 'vue'
import { LayerType } from '@/store/types'
import CssConveter from '@/utils/cssConverter'
import MouseUtils from '@/utils/mouseUtils'
import MathUtils from '@/utils/mathUtils'
import TextEffectUtils from '@/utils/textEffectUtils'
import { IImage } from '@/interfaces/layer'
import layerUtils from '@/utils/layerUtils'
import imageUtils from '@/utils/imageUtils'
import imageShadowUtils from '@/utils/imageShadowUtils'
import { ShadowEffectType } from '@/interfaces/imgShadow'
import SquareLoading from '@/components/global/SqureLoading.vue'

export default Vue.extend({
  components: {
    SquareLoading
  },
  props: {
    config: Object,
    pageIndex: Number,
    layerIndex: Number,
    subLayerIndex: Number,
    flip: Object,
    imgControl: Boolean
  },
  data() {
    return {
      LayerType
    }
  },
  mounted() {
    if (this.config.type === 'shape') {
      const scaleLayer = this.$refs.scale as HTMLElement
      if (scaleLayer) {
        scaleLayer.classList.add('shape')
      }
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
    },
    appendShadowEffect(): boolean {
      if (this.config.type !== LayerType.image) return false
      const config = this.config as IImage
      return [ShadowEffectType.projection, ShadowEffectType.halo].includes(config.styles.shadow.currentEffect)
    }
  },
  methods: {
    styles() {
      const styles = Object.assign(
        CssConveter.convertDefaultStyle(this.config.styles),
        {
          'pointer-events': imageUtils.isImgControl(this.pageIndex) ? 'none' : 'initial'
        }
      )
      switch (this.config.type) {
        case LayerType.text: {
          const textEffectStyles = TextEffectUtils.convertTextEffect(this.config.styles.textEffect || {})
          Object.assign(
            styles,
            textEffectStyles,
            {
              background: 'rgba(0, 0, 255, 0)',
              willChange: 'text-shadow',
              '--base-stroke': `${textEffectStyles.webkitTextStroke?.split('px')[0] ?? 0}px`
            }
          )
          break
        }
        case LayerType.image: {
          imageShadowUtils.handleShadowStyles(this.config, styles, this.imgControl)
        }
      }
      return styles
    },
    shadowStyles() {
      return imageShadowUtils.convertShadowEffect(this.config)
    },
    scaleStyles() {
      let { width, height } = this.config.styles
      const { scale, scaleX, scaleY, zindex } = this.config.styles
      const { type } = this.config
      width /= (type === LayerType.image ? 1 : scale)
      height /= (type === LayerType.image ? 1 : scale)

      /**
       * If layer type is group, we need to set its transform-style to flat, or its order will be affect by the inner layer.
       * And if type is tmp and its zindex value is larger than 0 (default is 0, isn't 0 means its value has been reassigned before), we need to set it to flat too.
       */
      const styles = {
        width: this.config.type === 'shape' ? '' : `${width}px`,
        height: this.config.type === 'shape' ? '' : `${height}px`,
        transform: type === 'image' ? 'none' : `scale(${scale}) scaleX(${scaleX}) scaleY(${scaleY})`,
        'transform-style': type === 'group' ? 'flat' : (type === 'tmp' && zindex > 0) ? 'flat' : 'preserve-3d'
      }
      return styles
    },
    flipStyles() {
      const { horizontalFlip, verticalFlip } = this.config.styles
      return CssConveter.convertFlipStyle(horizontalFlip, verticalFlip)
    },
    onDrop(e: DragEvent) {
      MouseUtils.onDrop(e, this.pageIndex, this.getLayerPos)
      e.stopPropagation()
    },
    onDropClipper(e: DragEvent) {
      MouseUtils.onDropClipper(e, this.pageIndex, this.layerIndex, this.getLayerPos, this.config.path, this.config.styles)
      e.stopPropagation()
    },
    toggleHighlighter(evt: MouseEvent, pageIndex: number, layerIndex: number, shown: boolean) {
      layerUtils.updateLayerProps(pageIndex, layerIndex, {
        shown
      })
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
  &__inProcess {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    background-color: setColor(gray-1, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.img-shadow-effect {
  position: absolute;
  pointer-events: none;
  display: block;
  border-radius: 100px/50px;
}

.shape {
  position: absolute;
  transform-origin: top left;
  top: 0;
  left: 0;
}

.layer-flip {
  transition: transform 0.2s linear;
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

.spiner {
  animation: rotation 0.5s infinite linear;
}

@keyframes rotation {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}
</style>
