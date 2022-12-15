<template lang="pug">
div(class="nu-layer" :style="layerStyles()" ref="body"
    :class="!isLocked ? `nu-layer--p${pageIndex}` : ''"
    :data-index="dataIndex === '-1' ? `${subLayerIndex}` : dataIndex"
    :data-p-index="pageIndex"
    :data-pindex="dataPindex"
    @drop="config.type !== 'image' ? onDrop($event) : onDropClipper($event)"
    @dragover.prevent
    @dragleave.prevent
    @dragenter.prevent)
  div(class="layer-translate posAbs"
      :style="translateStyles()")
    div(class="layer-scale posAbs" ref="scale"
        :style="scaleStyles()")
      nu-clipper(:config="config"
          :pageIndex="pageIndex" :layerIndex="layerIndex" :subLayerIndex="subLayerIndex"
          :imgControl="imgControl" :contentScaleRatio="contentScaleRatio")
        component(:is="`nu-${config.type}`"
          class="transition-none"
          :config="config"
          :imgControl="imgControl"
          :contentScaleRatio="contentScaleRatio"
          :pageIndex="pageIndex" :layerIndex="layerIndex" :subLayerIndex="subLayerIndex"
          :scaleRatio="scaleRatio"
          :isPagePreview="isPagePreview")
  div(v-if="showSpinner()" class="nu-layer__inProcess")
    square-loading
    //- svg-icon(class="spiner"
    //-   :iconName="'spiner'"
    //-   :iconColor="'white'"
    //-   :iconWidth="'150px'")
</template>

<script lang="ts">
import Vue, { PropType, defineComponent } from 'vue'
import { LayerType } from '@/store/types'
import CssConveter from '@/utils/cssConverter'
import MouseUtils from '@/utils/mouseUtils'
import TextEffectUtils from '@/utils/textEffectUtils'
import textBgUtils from '@/utils/textBgUtils'
import layerUtils from '@/utils/layerUtils'
import SquareLoading from '@/components/global/SqureLoading.vue'
import frameUtils from '@/utils/frameUtils'
import { mapGetters } from 'vuex'
import pageUtils from '@/utils/pageUtils'
import { IFrame, ILayer, IText } from '@/interfaces/layer'

export default defineComponent({
  emits: [],
  inheritAttrs: false,
  components: {
    SquareLoading
  },
  props: {
    config: {
      type: Object,
      required: true
    },
    pageIndex: {
      type: Number,
      required: true
    },
    layerIndex: {
      type: Number,
      required: true
    },
    subLayerIndex: {
      type: Number
    },
    imgControl: {
      type: Boolean
    },
    isSubLayer: {
      type: Boolean,
      default: false
    },
    isFrame: {
      type: Boolean,
      default: false
    },
    contentScaleRatio: {
      default: 1,
      type: Number
    },
    isPagePreview: {
      default: false,
      type: Boolean
    },
    dataIndex: {
      default: '-1',
      type: String
    },
    dataPindex: {
      default: '-1',
      type: String
    },
    inTmp: {
      type: Boolean,
      default: false
    },
    primaryScale: {
      type: Number,
      default: 1
    }
    /**
     * @Note Vuex Props
    //  */
    // currSelectedInfo: Object as PropType<ICurrSelectedInfo>,
    // scaleRatio: Number,
    // getCurrFunctionPanelType: Number,
    // isUploadingShadowImg: Boolean,
    // isHandling: Boolean,
    // isShowPagePanel: Boolean,
    // imgSizeMap: Array as PropType<Array<{ [key: string]: string | number }>>,
    // userId: String,
    // verUni: String,
    // uploadId: Object as PropType<ILayerIdentifier>,
    // handleId: Object as PropType<ILayerIdentifier>,
    // uploadShadowImgs: Array as PropType<Array<IUploadShadowImg>>
  },
  data() {
    return {
      LayerType
    }
  },
  computed: {
    ...mapGetters({
      currSelectedInfo: 'getCurrSelectedInfo',
      scaleRatio: 'getPageScaleRatio',
      getCurrFunctionPanelType: 'getCurrFunctionPanelType',
      isUploadingShadowImg: 'shadow/isUploading',
      isHandling: 'shadow/isHandling',
      isShowPagePanel: 'page/getShowPagePanel'
    }),
    isDragging(): boolean {
      return (this.config as ILayer).dragging
    },
    transformStyle(): { [index: string]: string } {
      return {
        transformStyle: this.enalble3dTransform ? 'preserve-3d' : 'initial'
      }
    },
    enalble3dTransform(): boolean {
      return this.pageIndex === pageUtils._3dEnabledPageIndex
    },
    isLocked(): boolean {
      return (this.config as ILayer).locked
    }
  },
  methods: {
    onDrop(e: DragEvent) {
      MouseUtils.onDrop(e, this.pageIndex, this.getLayerPos())
      e.stopPropagation()
    },
    onDropClipper(e: DragEvent) {
      MouseUtils.onDropClipper(e, this.pageIndex, this.layerIndex, this.getLayerPos(), this.config.path, this.config.styles)
      e.stopPropagation()
    },
    toggleHighlighter(evt: MouseEvent, pageIndex: number, layerIndex: number, shown: boolean) {
      layerUtils.updateLayerProps(pageIndex, layerIndex, {
        shown
      })
    },
    hasSelectedLayer(): boolean {
      return this.currSelectedInfo.layers.length > 0
    },
    layerStyles(): any {
      const styles = Object.assign(
        CssConveter.convertDefaultStyle(this.config.styles, pageUtils._3dEnabledPageIndex !== this.pageIndex, this.contentScaleRatio),
        {
          // 'pointer-events': imageUtils.isImgControl(this.pageIndex) ? 'none' : 'initial'
          'pointer-events': 'none',
          transformStyle: this.enalble3dTransform ? 'preserve-3d' : 'initial',
          willChange: !this.isSubLayer && this.isDragging ? 'transform' : 'none',
          ...this.subLayerInTmpStyles(this.config as ILayer)
        }
      )
      switch (this.config.type) {
        case LayerType.text: {
          const textEffectStyles = TextEffectUtils.convertTextEffect(this.config as IText)
          const textBgStyles = textBgUtils.convertTextEffect(this.config.styles)
          Object.assign(
            styles,
            textEffectStyles,
            textBgStyles,
            {
              willChange: 'text-shadow',
              '--base-stroke': `${textEffectStyles.webkitTextStroke?.split('px')[0] ?? 0}px`
            }
          )
          break
        }
        case LayerType.shape: {
          Object.assign(
            styles,
            { 'mix-blend-mode': this.config.styles.blendMode }
          )
        }
      }
      return styles
    },
    getLayerPos(): { x: number, y: number } {
      return {
        x: this.config.styles.x,
        y: this.config.styles.y
      }
    },
    subLayerInTmpStyles(layer: ILayer) {
      return (layer.type === 'shape' && layer.category === 'D') ? {} : { outline: this.inTmp ? `${2 / this.primaryScale}px solid #7190CC` : {} }
    },
    pageScaleRatio(): number {
      return pageUtils.scaleRatio / 100
    },
    compensationRatio(): number {
      return Math.max(1, this.pageScaleRatio())
    },
    showSpinner(): boolean {
      const { config } = this
      const shadow = this.config.styles.shadow
      const hasShadowSrc = shadow && shadow.srcObj && shadow.srcObj.type && shadow.srcObj.type !== 'upload'
      const isHandleShadow = config.inProcess === 'imgShadow' && !hasShadowSrc
      const isHandleBgRemove = config.inProcess === 'bgRemove'
      return isHandleBgRemove || isHandleShadow
    },
    translateStyles(): { [index: string]: string } {
      const { zindex } = this.config.styles
      const { type } = this.config
      const isImgType = type === LayerType.image || (type === LayerType.frame && frameUtils.isImageFrame(this.config as IFrame))
      const transform = isImgType ? `scale(${1 / (this.compensationRatio())})` : `scale(${1 / (this.compensationRatio())})`
      /**
      * If layer type is group, we need to set its transform-style to flat, or its order will be affect by the inner layer.
      * And if type is tmp and its zindex value is larger than 0 (default is 0, isn't 0 means its value has been reassigned before), we need to set it to flat too.
      */
      return {
        transform,
        'transform-style': pageUtils._3dEnabledPageIndex !== this.pageIndex ? 'initial' : type === 'group' || this.config.isFrame ? 'flat' : (type === 'tmp' && zindex > 0) ? 'flat' : 'preserve-3d'
      }
    },
    scaleStyles(): { [index: string]: string } {
      const { zindex } = this.config.styles
      const { scale, scaleX, scaleY } = this.config.styles
      const { type } = this.config
      const isImgType = type === LayerType.image || (type === LayerType.frame && frameUtils.isImageFrame(this.config as IFrame))

      const styles = {
        transform: isImgType ? `scale(${this.compensationRatio()})` : `scale(${scale * (this.contentScaleRatio)}) scale(${this.compensationRatio()}) scaleX(${scaleX}) scaleY(${scaleY})`,
        'transform-style': pageUtils._3dEnabledPageIndex !== this.pageIndex ? 'initial' : type === 'group' || this.config.isFrame ? 'flat' : (type === 'tmp' && zindex > 0) ? 'flat' : 'preserve-3d'
      }
      return styles
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
  // content-visibility: auto;
  // box-shadow: inset 0px 0px 0px 7px rgba(136, 136, 136, 0.5);
  width: 100px;
  height: 100px;
  &:focus {
    background-color: rgba(168, 218, 220, 1);
  }
  &__BG {
    position: absolute;
    left: 0;
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

.posAbs {
  position: absolute;
  transform-origin: top left;
  top: 0;
  left: 0;
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
