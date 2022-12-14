<template lang="pug">
  //- @pointerdown="moveStart"
  div
    div(class="nu-layer" :class="!config.locked ? `nu-layer--p${pageIndex}` : ''" :style="layerStyles()" ref="body" :id="`nu-layer_${pageIndex}_${layerIndex}_${subLayerIndex}`"
        :data-index="dataIndex === '-1' ? `${subLayerIndex}` : dataIndex"
        :data-p-index="pageIndex"
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
            lazy-load(:target="lazyLoadTarget"
                :rootMargin="'300px 0px 300px 0px'"
                :minHeight="config.styles.height * contentScaleRatio"
                :minWidth="config.styles.width * contentScaleRatio"
                :threshold="[0]"
                :handleUnrender="handleUnrender"
                :anamationEnabled="false"
                :forceRender="isSubLayer || forceRender")
              component(:is="`nu-${config.type}`"
                class="transition-none"
                :config="config"
                :imgControl="imgControl"
                :contentScaleRatio="contentScaleRatio"
                :pageIndex="pageIndex" :layerIndex="layerIndex" :subLayerIndex="subLayerIndex"
                :scaleRatio="scaleRatio"
                :isPagePreview="isPagePreview"
                :forRender="forRender"
                v-bind="$attrs")
      div(v-if="showSpinner()" class="nu-layer__inProcess")
        square-loading
    //- nu-controller(v-if="isActive && !forRender"
    //-   data-identifier="controller"
    //-   :key="`controller-${config.id}`"
    //-   :layerIndex="layerIndex"
    //-   :pageIndex="pageIndex"
    //-   :config="config"
    //-   :snapUtils="snapUtils"
    //-   :contentScaleRatio="contentScaleRatio")
        //- svg-icon(class="spiner"
        //-   :iconName="'spiner'"
        //-   :iconColor="'white'"
        //-   :iconWidth="'150px'")
</template>

<script lang="ts">
import Vue, { PropType } from 'vue'
import { FunctionPanelType, ILayerInfo, LayerType } from '@/store/types'
import CssConveter from '@/utils/cssConverter'
import MouseUtils from '@/utils/mouseUtils'
import TextEffectUtils from '@/utils/textEffectUtils'
import textBgUtils from '@/utils/textBgUtils'
import layerUtils from '@/utils/layerUtils'
import SquareLoading from '@/components/global/SqureLoading.vue'
import frameUtils from '@/utils/frameUtils'
import { mapGetters, mapMutations, mapState } from 'vuex'
import pageUtils from '@/utils/pageUtils'
import { IFrame, IGroup, IImage, ILayer } from '@/interfaces/layer'
import LazyLoad from '@/components/LazyLoad.vue'
import SubControllerUtils from '@/utils/subControllerUtils'
import generalUtils from '@/utils/generalUtils'
import { MovingUtils } from '@/utils/movingUtils'

export default Vue.extend({
  inheritAttrs: false,
  components: {
    SquareLoading,
    LazyLoad
  },
  props: {
    config: Object,
    pageIndex: Number,
    layerIndex: Number,
    imgControl: Boolean,
    snapUtils: Object,
    subLayerIndex: {
      type: Number,
      default: -1
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
    'data-index': {
      default: '-1',
      type: String
    },
    lazyLoadTarget: {
      default: '.editor-view',
      type: String
    },
    forceRender: {
      default: true,
      type: Boolean
    },
    forRender: {
      default: false,
      type: Boolean
    },
    handleUnrender: {
      default: false,
      type: Boolean
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
      LayerType,
      eventTarget: null as unknown as HTMLElement,
      dblTabsFlag: false,
      initialPos: { x: 0, y: 0 },
      initTranslate: { x: 0, y: 0 },
      movingByControlPoint: false,
      isControlling: false,
      isDoingGestureAction: false,
      isHandleMovingHandler: false,
      isMoved: false,
      isPointerDownFromSubController: false
    }
  },
  mounted() {
    /**
     * Use definedProperty to bind some props of the vue.$props with the movingUtils
     * thus, we are unnecessary to watching these props and update them manually
     */
    const body = this.$refs.body as HTMLElement
    const props = this.$props
    const layerInfo = {} as ILayerInfo
    Object.defineProperty(layerInfo, 'pageIndex', {
      get() {
        return props.pageIndex
      }
    })
    Object.defineProperty(layerInfo, 'layerIndex', {
      get() {
        return props.layerIndex
      }
    })
    Object.defineProperty(layerInfo, 'subLayerIdx', {
      get() {
        return props.subLayerIndex
      }
    })
    const _config = { config: this.config }
    Object.defineProperty(_config, 'config', {
      get() {
        return props.config
      }
    })

    const data = {
      _config: _config,
      component: this,
      snapUtils: this.snapUtils,
      layerInfo,
      body
    }

    if (this.subLayerIndex === -1) {
      const movingUtils = new MovingUtils(data)
      const moveStart = movingUtils.moveStart.bind(movingUtils)
      body.addEventListener('pointerdown', moveStart)
    } else {
      const subCtrlUtils = new SubControllerUtils(data)
      const pointerdown = subCtrlUtils.onPointerdown.bind(subCtrlUtils)
      console.log(subCtrlUtils)
      body.addEventListener('pointerdown', pointerdown)
      console.log('sub layer')
    }
  },
  computed: {
    ...mapState('text', ['sel', 'props']),
    ...mapState('shadow', ['processId', 'handleId']),
    ...mapState(['currDraggedPhoto']),
    ...mapGetters('imgControl', ['isBgImgCtrl']),
    ...mapGetters('text', ['getDefaultFonts']),
    ...mapGetters({
      lastSelectedLayerIndex: 'getLastSelectedLayerIndex',
      currSubSelectedInfo: 'getCurrSubSelectedInfo',
      currHoveredPageIndex: 'getCurrHoveredPageIndex',
      inMultiSelectionMode: 'mobileEditor/getInMultiSelectionMode',
      isProcessImgShadow: 'shadow/isProcessing',
      currSelectedInfo: 'getCurrSelectedInfo',
      scaleRatio: 'getPageScaleRatio',
      currFunctionPanelType: 'getCurrFunctionPanelType',
      isUploadingShadowImg: 'shadow/isUploading',
      isHandling: 'shadow/isHandling',
      isShowPagePanel: 'page/getShowPagePanel'
    }),
    layerInfo(): ILayerInfo {
      return {
        pageIndex: this.pageIndex,
        layerIndex: this.layerIndex
      }
    },
    isDragging(): boolean {
      return (this.config as ILayer).dragging
    },
    isImgControl(): boolean {
      switch (this.getLayerType) {
        case 'image':
          return this.config.imgControl
        case 'group':
          return (this.config as IGroup).layers
            .some(layer => {
              return layer.type === 'image' && layer.imgControl
            })
        case 'frame':
          return (this.config as IFrame).clips
            .some(layer => {
              return layer.imgControl
            })
      }
      return false
    },
    isActive(): boolean {
      return this.config.active
    },
    transformStyle(): { [index: string]: string } {
      return {
        transformStyle: this.enalble3dTransform ? 'preserve-3d' : 'initial'
      }
    },
    enalble3dTransform(): boolean {
      return this.pageIndex === pageUtils._3dEnabledPageIndex
    },
    contentEditable(): boolean {
      return this.config.contentEditable
    },
    getLayerType(): string {
      return this.config.type
    },
    isLine(): boolean {
      return this.config.type === 'shape' && this.config.category === 'D'
    }
  },
  methods: {
    ...mapMutations({
      setLastSelectedLayerIndex: 'SET_lastSelectedLayerIndex',
      setIsLayerDropdownsOpened: 'SET_isLayerDropdownsOpened',
      setCurrSidebarPanel: 'SET_currSidebarPanelType',
      setMoving: 'SET_moving',
      setImgConfig: 'imgControl/SET_CONFIG',
      setBgConfig: 'imgControl/SET_BG_CONFIG'
    }),
    outlineStyles() {
      const outlineColor = (() => {
        if (this.getLayerType === 'frame' && this.config.clips[0].isFrameImg) {
          return '#F10994'
        } else if (this.isLocked()) {
          return '#EB5757'
        } else {
          return '#7190CC'
        }
      })()

      if (this.isLine || (this.config.moving && this.currSelectedInfo.index !== this.layerIndex)) {
        return 'none'
      } else if (this.config.shown || this.isActive) {
        if (this.config.type === 'tmp' || this.isControlling) {
          return `${2 * (100 / this.scaleRatio) * this.contentScaleRatio}px solid ${outlineColor}`
        } else {
          return `${2 * (100 / this.scaleRatio) * this.contentScaleRatio}px solid ${outlineColor}`
        }
      } else {
        return 'none'
      }
    },
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
          // 'pointer-events': 'none',
          outline: this.outlineStyles(),
          transformStyle: this.enalble3dTransform ? 'preserve-3d' : 'initial',
          willChange: !this.isSubLayer && this.isDragging ? 'transform' : ''
        }
      )
      switch (this.config.type) {
        case LayerType.text: {
          const textEffectStyles = TextEffectUtils.convertTextEffect(this.config)
          const textBgStyles = textBgUtils.convertTextEffect(this.config.styles)
          Object.assign(
            styles,
            textEffectStyles,
            textBgStyles,
            {
              willChange: 'text-shadow' + (this.isDragging ? ', transform' : ''),
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
      const isImgType = type === LayerType.image || (type === LayerType.frame && frameUtils.isImageFrame(this.config))
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
      const isImgType = type === LayerType.image || (type === LayerType.frame && frameUtils.isImageFrame(this.config))

      const styles = {
        transform: isImgType ? `scale(${this.compensationRatio()})` : `scale(${scale * (this.contentScaleRatio)}) scale(${this.compensationRatio()}) scaleX(${scaleX}) scaleY(${scaleY})`,
        'transform-style': pageUtils._3dEnabledPageIndex !== this.pageIndex ? 'initial' : type === 'group' || this.config.isFrame ? 'flat' : (type === 'tmp' && zindex > 0) ? 'flat' : 'preserve-3d'
      }
      return styles
    },
    setCursorStyle(cursor: string) {
      const layer = this.$el as HTMLElement
      if (layer) {
        layer.style.cursor = cursor
        document.body.style.cursor = cursor
      }
    },
    isLocked(): boolean {
      return this.config.locked
    },
    disableTouchEvent(e: TouchEvent) {
      if (generalUtils.isTouchDevice()) {
        e.preventDefault()
        e.stopPropagation()
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.nu-layer {
  touch-action: none;
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
