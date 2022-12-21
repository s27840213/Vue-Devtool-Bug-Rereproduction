<template lang="pug">
  div(class="nu-clipper layer-flip" ref="body"
    :style="styles"
    :id="config.type === 'frame' ? `nu-clipper-${layerIndex}` : ''"
    @dragenter="dragEnter")
    slot
</template>

<script lang="ts">
import { ShadowEffectType } from '@/interfaces/imgShadow'
import { IFrame, IGroup, IImage, IText } from '@/interfaces/layer'
import { LayerType, SidebarPanelType } from '@/store/types'
import cssConverter from '@/utils/cssConverter'
import frameUtils from '@/utils/frameUtils'
import layerUtils from '@/utils/layerUtils'
import Vue from 'vue'
import Svgpath from 'svgpath'
import pageUtils from '@/utils/pageUtils'
import { mapGetters, mapMutations, mapState } from 'vuex'
import generalUtils from '@/utils/generalUtils'
import mouseUtils from '@/utils/mouseUtils'
import stepsUtils from '@/utils/stepsUtils'
import DragUtils from '@/utils/dragUtils'
import i18n from '@/i18n'
import imageShadowUtils from '@/utils/imageShadowUtils'
import imageUtils from '@/utils/imageUtils'
import eventUtils, { ImageEvent } from '@/utils/eventUtils'
import uploadUtils from '@/utils/uploadUtils'

export default Vue.extend({
  props: {
    config: Object,
    pageIndex: Number,
    layerIndex: Number,
    subLayerIndex: Number,
    imgControl: Boolean,
    contentScaleRatio: {
      default: 1,
      type: Number
    }
  },
  data() {
    return {
      dragUtils: this.subLayerIndex !== -1 ? new DragUtils(layerUtils.getLayer(this.pageIndex, this.layerIndex).id, this.config.id) : new DragUtils(this.config.id),
      imgBuff: {} as {
        styles: { [key: string]: number | boolean },
        srcObj: { type: string, assetId: string | number, userId: string },
        panelPreviewSrc: ''
      }
    }
  },
  computed: {
    ...mapState('shadow', ['processId', 'handleId']),
    ...mapState(['currDraggedPhoto']),
    ...mapGetters({
      isShowPagePanel: 'page/getShowPagePanel',
      isHandleShadow: 'shadow/isHandling'
    }),
    primaryLayer(): IGroup | IFrame | undefined {
      if (this.subLayerIndex !== -1 && typeof this.subLayerIndex !== 'undefined') {
        return layerUtils.getLayer(this.pageIndex, this.layerIndex) as IGroup | IFrame
      } else {
        return undefined
      }
    },
    styles(): any {
      const { type, imgControl } = this.config
      const { horizontalFlip, verticalFlip } = this.config.styles
      const flip = type === 'image' ? {} : cssConverter.convertFlipStyle(horizontalFlip, verticalFlip)
      let { width, height, scale } = this.config.styles
      const layerPath = `path('M0,0h${width}v${height}h${-width}z`
      let clipPath = ''

      switch (type) {
        case 'image':
          if (this.config.isFrame) {
            // clipPath = imgControl || !this.config.clipPath ? layerPath : `path('${this.config.clipPath}')`
            clipPath = imgControl || !this.config.clipPath ? layerPath : `path('${new Svgpath(this.config.clipPath).scale(this.contentScaleRatio).toString()}')`
          }
          if (!this.config.isImageFrame && this.primaryLayer && (this.primaryLayer as IFrame).type === LayerType.frame) {
            width = `${width * this.contentScaleRatio}px`
            height = `${height * this.contentScaleRatio}px`
          } else {
            width = `${width * this.contentScaleRatio}px`
            height = `${height * this.contentScaleRatio}px`
          }
          break
        case 'shape':
          width = `${this.shapeWidth()}px`
          height = `${this.shapeHeight()}px`
          break
        case 'frame':
          if (frameUtils.isImageFrame(this.config)) {
            width = `${width * this.contentScaleRatio}px`
            height = `${height * this.contentScaleRatio}px`
          } else {
            width = `${width / scale}px`
            height = `${height / scale}px`
          }
          break
        default:
          width = `${width / scale}px`
          height = `${height / scale}px`
      }
      return {
        width,
        height,
        ...(!this.imgControl && this.config.type === 'image' && this.config.styles.shadow.currentEffect === ShadowEffectType.none && { clipPath }),
        ...flip,
        'transform-style': pageUtils._3dEnabledPageIndex === this.pageIndex ? 'preserve-3d' : 'initial'
      }
    }
  },
  methods: {
    ...mapMutations({
      setCurrSidebarPanel: 'SET_currSidebarPanelType',
      setCurrDraggedPhoto: 'SET_currDraggedPhoto'
    }),
    shapeWidth(): number {
      return (this.config.vSize?.[0] ?? 0) + (this.config.pDiff?.[0])
    },
    shapeHeight(): number {
      return (this.config.vSize?.[1] ?? 0) + (this.config.pDiff?.[1])
    },
    dragEnter(e: DragEvent) {
      if (this.primaryLayer && this.primaryLayer.type) {
        return this.onFrameDragEnter(e)
      }
      this.onLayerDragEnter(e)
    },
    onFrameDragEnter(e: DragEvent) {
      const { primaryLayer } = this
      if (primaryLayer && !primaryLayer.locked) {
        const body = this.$refs.body as HTMLElement
        body.addEventListener('dragleave', this.onFrameDragLeave)
        body.addEventListener('drop', this.onFrameDrop)
        e.stopPropagation()
        if (this.currDraggedPhoto.srcObj.type !== '' && !this.currDraggedPhoto.isPreview) {
          const clips = generalUtils.deepCopy(primaryLayer.clips) as Array<IImage>
          const clip = clips[this.subLayerIndex]

          Object.assign(this.imgBuff, {
            srcObj: {
              ...clips[this.subLayerIndex].srcObj
            },
            panelPreviewSrc: clips[this.subLayerIndex].panelPreviewSrc,
            styles: {
              imgX: clip.styles.imgX,
              imgY: clip.styles.imgY,
              imgWidth: clip.styles.imgWidth,
              imgHeight: clip.styles.imgHeight,
              adjust: clip.styles.adjust
            }
          })
          frameUtils.updateFrameClipSrc(this.pageIndex, this.layerIndex, this.subLayerIndex, this.currDraggedPhoto.srcObj)
          frameUtils.updateFrameLayerProps(this.pageIndex, this.layerIndex, this.subLayerIndex, { panelPreviewSrc: this.currDraggedPhoto.panelPreviewSrc })

          Object.assign(clip.srcObj, this.currDraggedPhoto.srcObj)
          const { imgWidth, imgHeight, imgX, imgY } = mouseUtils
            .clipperHandler(this.currDraggedPhoto, clip.clipPath, clip.styles).styles

          frameUtils.updateFrameLayerStyles(this.pageIndex, this.layerIndex, this.subLayerIndex, {
            imgWidth,
            imgHeight,
            imgX,
            imgY
          })
        }
      }
    },
    onFrameDragLeave(e: DragEvent) {
      e.stopPropagation()
      const body = this.$refs.body as HTMLElement
      body.removeEventListener('dragleave', this.onFrameDragLeave)
      body.removeEventListener('drop', this.onFrameDrop)
      const primaryLayer = layerUtils.getLayer(this.pageIndex, this.layerIndex) as IFrame
      if (this.currDraggedPhoto.srcObj.type !== '' && !primaryLayer.locked) {
        frameUtils.updateFrameClipSrc(this.pageIndex, this.layerIndex, this.subLayerIndex, this.imgBuff.srcObj)
        frameUtils.updateFrameLayerStyles(this.pageIndex, this.layerIndex, this.subLayerIndex, this.imgBuff.styles)
        frameUtils.updateFrameLayerProps(this.pageIndex, this.layerIndex, this.subLayerIndex, { panelPreviewSrc: this.imgBuff.panelPreviewSrc })
      }
    },
    onFrameDrop(e: DragEvent) {
      e.stopPropagation()
      const body = this.$refs.body as HTMLElement
      body.removeEventListener('dragleave', this.onFrameDragLeave)
      body.removeEventListener('drop', this.onFrameDrop)
      stepsUtils.record()
      this.setCurrDraggedPhoto({
        srcObj: {
          type: '',
          assetId: '',
          userId: ''
        }
      })
    },
    onLayerDragEnter(e: DragEvent) {
      const body = this.$refs.body as HTMLElement
      const dragSrcObj = this.$store.state.currDraggedPhoto.srcObj
      if (this.config.type === 'image' && dragSrcObj.assetId !== this.config.srcObj.assetId) {
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
      const body = this.$refs.body as HTMLElement
      body.removeEventListener('dragleave', this.layerDragLeave)
      body.removeEventListener('drop', this.layerOnDrop)
      if (this.config.type === 'image') {
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
        if (!this.currDraggedPhoto.srcObj.type || this.config.type !== 'image') {
          this.dragUtils.itemOnDrop(e, this.pageIndex)
        } else if (this.config.type === 'image') {
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
.nu-clipper {
  // overflow: hidden;
}

.layer-flip {
  transition: transform 0.2s linear;
}
</style>
