<template lang="pug">
  div
    div(class="nu-layer" :class="!config.locked ? `nu-layer--p${pageIndex}` : ''" :style="layerStyles" ref="body" :id="`nu-layer_${pageIndex}_${layerIndex}_${subLayerIndex}`"
        :data-index="dataIndex === '-1' ? `${subLayerIndex}` : dataIndex"
        :data-p-index="pageIndex"
        v-press="isTouchDevice()? onPress : -1"
        @pointerdown="onPointerDown"
        @click.right.stop="onRightClick"
        @dragenter="dragEnter"
        @dblclick="dblClick")
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
</template>

<script lang="ts">
import Vue, { PropType } from 'vue'
import { FunctionPanelType, ILayerInfo, LayerType, SidebarPanelType } from '@/store/types'
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
import DragUtils from '@/utils/dragUtils'
import { ShadowEffectType } from '@/interfaces/imgShadow'
import i18n from '@/i18n'
import imageShadowUtils from '@/utils/imageShadowUtils'
import imageUtils from '@/utils/imageUtils'
import eventUtils, { ImageEvent } from '@/utils/eventUtils'
import uploadUtils from '@/utils/uploadUtils'
import groupUtils from '@/utils/groupUtils'
import controlUtils from '@/utils/controlUtils'
import { AnyTouchEvent } from '@any-touch/shared'
import editorUtils from '@/utils/editorUtils'
import popupUtils from '@/utils/popupUtils'

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
    primaryLayer: {
      type: Object,
      default: undefined
    },
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
      initPos: { x: 0, y: 0 },
      movingByControlPoint: false,
      isControlling: false,
      isDoingGestureAction: false,
      isHandleMovingHandler: false,
      isMoved: false,
      isPointerDownFromSubController: false,
      dragUtils: this.isSubLayer ? new DragUtils(layerUtils.getLayer(this.pageIndex, this.layerIndex).id, this.config.id) : new DragUtils(this.config.id),
      movingUtils: null as unknown as MovingUtils
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
      this.movingUtils = new MovingUtils(data)
      const moveStart = this.movingUtils.moveStart.bind(this.movingUtils)
      body.addEventListener('pointerdown', moveStart)
    } else {
      const subCtrlUtils = new SubControllerUtils(data)
      const pointerdown = subCtrlUtils.onPointerdown.bind(subCtrlUtils)
      body.addEventListener('pointerdown', pointerdown)
    }
  },
  computed: {
    ...mapState('text', ['sel', 'props']),
    ...mapState('shadow', ['processId', 'handleId']),
    ...mapState(['currDraggedPhoto']),
    ...mapState('imgControl', {
      imgCtrlConfig: 'image'
    }),
    ...mapGetters('imgControl', ['isBgImgCtrl', 'isImgCtrl']),
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
      isShowPagePanel: 'page/getShowPagePanel',
      isHandleShadow: 'shadow/isHandling'
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
    },
    layerStyles(): any {
      const styles = Object.assign(
        CssConveter.convertDefaultStyle(this.config.styles, pageUtils._3dEnabledPageIndex !== this.pageIndex, this.contentScaleRatio),
        {
          outline: this.outlineStyles(),
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
    toggleHighlighter(evt: MouseEvent, pageIndex: number, layerIndex: number, shown: boolean) {
      layerUtils.updateLayerProps(pageIndex, layerIndex, {
        shown
      })
    },
    hasSelectedLayer(): boolean {
      return this.currSelectedInfo.layers.length > 0
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
    isTouchDevice(): boolean {
      return generalUtils.isTouchDevice()
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
    isLocked(): boolean {
      return this.config.locked
    },
    onRightClick(event: MouseEvent) {
      if (this.isTouchDevice()) {
        // in touch device, right click will be triggered by long click
        event.preventDefault()
        return
      }
      /**
       * If current-selected-layer is exact this layer, record the sub-active-layer.
       * After deselecting, set it to active
       */
      const subLayerIdx = layerUtils.layerIndex === this.layerIndex ? layerUtils.subLayerIdx : -1

      if (this.currSelectedInfo.pageIndex !== this.pageIndex || this.currSelectedInfo.index !== this.layerIndex) {
        groupUtils.deselect()
        groupUtils.select(this.pageIndex, [this.layerIndex])
      }

      if (this.getLayerType === 'frame') {
        frameUtils.updateFrameLayerProps(this.pageIndex, this.layerIndex, subLayerIdx, { active: true })
      }
      this.$nextTick(() => {
        popupUtils.openPopup('layer', { event, layerIndex: this.layerIndex })
      })
    },
    onPress(event: AnyTouchEvent) {
      const initPos = { x: this.initPos.x, y: this.initPos.y }
      this.initPos.x = -1
      this.initPos.y = -1
      if (this.config.styles.x - initPos.x !== 0 || this.config.styles.y - initPos.y !== 0) {
        return
      }
      if (!this.isActive) {
        groupUtils.deselect()
        groupUtils.select(this.pageIndex, [this.layerIndex])
      }
      if (this.getLayerType === 'text') {
        layerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { editing: false, shown: false, contentEditable: false, isTyping: false })
      }

      this.movingUtils && this.movingUtils.removeListener()
      editorUtils.setInMultiSelectionMode(true)
    },
    onPointerDown(e: PointerEvent) {
      e.stopPropagation()
      if (this.isImgCtrl && this.imgCtrlConfig.id !== this.config.id) {
        imageUtils.setImgControlDefault()
      }
      this.initPos.x = this.config.styles.x
      this.initPos.y = this.config.styles.y
    },
    disableTouchEvent(e: TouchEvent) {
      if (generalUtils.isTouchDevice()) {
        e.preventDefault()
        e.stopPropagation()
      }
    },
    dblClick(e: MouseEvent) {
      e.stopPropagation()
      const isSubLayer = this.subLayerIndex !== -1
      if (isSubLayer) {
        if (!this.primaryLayer || this.isHandleShadow) return
        let updateSubLayerProps = null as any
        let target = undefined as ILayer | undefined
        switch (this.primaryLayer.type) {
          case LayerType.group:
            target = (this.primaryLayer as IGroup).layers[this.subLayerIndex]
            updateSubLayerProps = layerUtils.updateSubLayerProps
            if (!target.active) {
              return
            }
            break
          case LayerType.frame:
            target = (this.primaryLayer as IFrame).clips[this.subLayerIndex]
            updateSubLayerProps = frameUtils.updateFrameLayerProps
            if (!target.active || (target as IImage).srcObj.type === 'frame') {
              return
            }
            break
          case LayerType.image:
          default:
            return
        }
        if (target.type === LayerType.image && !target.inProcess) {
          updateSubLayerProps(this.pageIndex, this.layerIndex, this.subLayerIndex, { imgControl: true })
        }
      } else {
        if (this.getLayerType !== 'image' || this.isLocked()) return
        if (this.currSelectedInfo.index < 0) {
          groupUtils.select(this.pageIndex, [this.layerIndex])
        }
        switch (this.getLayerType) {
          case LayerType.image: {
            const { shadow } = (this.config as IImage).styles
            const needRedrawShadow = shadow.currentEffect === ShadowEffectType.imageMatched || shadow.isTransparent
            if (!(this.isHandleShadow && needRedrawShadow)) {
              controlUtils.updateLayerProps(this.pageIndex, this.layerIndex, { imgControl: true })
            }
          }
        }
      }
    },
    dragEnter(e: DragEvent) {
      if (!e.target || (e.target as HTMLElement).tagName !== 'IMG') return
      const body = this.$refs.body as HTMLElement
      const dragSrcObj = this.$store.state.currDraggedPhoto.srcObj
      if (this.getLayerType === 'image' && dragSrcObj.assetId !== this.config.srcObj.assetId) {
        body.addEventListener('dragleave', this.layerDragLeave)
        body.addEventListener('drop', this.layerOnDrop)
        const shadow = (this.config as IImage).styles.shadow
        const shadowEffectNeedRedraw = shadow.isTransparent || shadow.currentEffect === ShadowEffectType.imageMatched
        const hasShadowSrc = shadow && shadow.srcObj && shadow.srcObj?.type && shadow.srcObj?.type !== 'upload'
        const handleWithNoCanvas = this.config.inProcess === 'imgShadow' && !hasShadowSrc
        if (!handleWithNoCanvas && (!this.isHandleShadow || (this.handleId.layerId !== this.config.id && !shadowEffectNeedRedraw))) {
          this.dragUtils.onImageDragEnter(e, this.pageIndex, this.config as IImage)
        } else {
          Vue.notify({ group: 'copy', text: `${i18n.t('NN0665')}` })
          body.removeEventListener('dragleave', this.layerDragLeave)
          body.removeEventListener('drop', this.layerOnDrop)
        }
      }
    },
    layerDragLeave(e: DragEvent) {
      if (!e.target || (e.target as HTMLElement).tagName !== 'IMG') return
      const body = this.$refs.body as HTMLElement
      body.removeEventListener('dragleave', this.layerDragLeave)
      body.removeEventListener('drop', this.layerOnDrop)
      if (this.getLayerType === 'image') {
        this.dragUtils.onImageDragLeave(e, this.pageIndex)
      }
    },
    layerOnDrop(e: DragEvent) {
      e.stopPropagation()
      const body = this.$refs.body as HTMLElement
      body.removeEventListener('dragleave', this.layerDragLeave)
      body.removeEventListener('drop', this.layerOnDrop)

      const dt = e.dataTransfer
      if (e.dataTransfer?.getData('data')) {
        if (!this.currDraggedPhoto.srcObj.type || this.getLayerType !== 'image') {
          this.dragUtils.itemOnDrop(e, this.pageIndex)
        } else if (this.getLayerType === 'image') {
          if (this.isHandleShadow) {
            const replacedImg = new Image()
            replacedImg.crossOrigin = 'anonynous'
            replacedImg.onload = () => {
              const isTransparent = imageShadowUtils.isTransparentBg(replacedImg)
              const layerInfo = { pageIndex: this.pageIndex, layerIndex: this.layerIndex }
              imageShadowUtils.updateEffectProps(layerInfo, { isTransparent })
            }
            const size = ['unsplash', 'pexels'].includes(this.config.srcObj.type) ? 150 : 'prev'
            const src = imageUtils.getSrc(this.config, size)
            replacedImg.src = src + `${src.includes('?') ? '&' : '?'}ver=${generalUtils.generateRandomString(6)}`
            // return
          } else {
            eventUtils.emit(ImageEvent.redrawCanvasShadow + this.config.id)
          }
        }
        // GroupUtils.deselect()
        // this.setLastSelectedLayerIndex(this.layerIndex)
        // GroupUtils.select(this.pageIndex, [this.layerIndex])
      } else if (dt && dt.files.length !== 0) {
        const files = dt.files
        this.setCurrSidebarPanel(SidebarPanelType.file)
        uploadUtils.uploadAsset('image', files, {
          addToPage: true
        })
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
