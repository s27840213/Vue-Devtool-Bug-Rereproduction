<template lang="pug">
div(class="gallery-photo" :class="{border: deletable}")
  div(v-if="deletable"
      class="gallery-photo__delete"
      @click.stop.prevent="handleDeletePhoto")
    svg-icon(iconName="close" iconColor="gray-2" iconWidth="24px")
  circle-checkbox(v-if="inFilePanel"
    class="gallery-photo__checkbox"
    :class="{show: hasCheckedAssets}"
    :value="photo.assetIndex"
    :checkedValues="checkedAssets"
    :disabled="isUploading"
    @update="handleCheck")
  svg-icon(v-if="showMoreBtn" class="pointer gallery-photo__more"
    @click.native="showPhotoInfo"
    :iconName="'more_vertical'"
    :iconColor="'gray-2'"
    :iconWidth="'20px'")
  img(:src="previewSrc",
    ref='img'
    draggable="true",
    class="gallery-photo__img pointer"
    @dragstart="dragStart($event, photo)"
    @dragend="dragEnd"
    @click="onClick($event, photo)")
  div(v-if="isUploading"
      class="gallery-photo__progress")
    div(class="gallery-photo__progress-bar"
      :style="{'width': `${photo.progress}%`}")
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { mapGetters, mapMutations, mapState } from 'vuex'
import { IFrame, IImage } from '@/interfaces/layer'
import CircleCheckbox from '@/components/CircleCheckbox.vue'
import AssetUtils, { RESIZE_RATIO_IMAGE } from '@/utils/assetUtils'
import imageUtils from '@/utils/imageUtils'
import pageUtils from '@/utils/pageUtils'
import { IAssetPhoto } from '@/interfaces/api'
import networkUtils from '@/utils/networkUtils'
import layerUtils from '@/utils/layerUtils'
import DragUtils from '@/utils/dragUtils'
import generalUtils from '@/utils/generalUtils'
import { FunctionPanelType, LayerType } from '@/store/types'
import eventUtils, { PanelEvent } from '@/utils/eventUtils'
import mouseUtils from '@/utils/mouseUtils'
import brandkitUtils from '@/utils/brandkitUtils'
import frameUtils from '@/utils/frameUtils'
import stepsUtils from '@/utils/stepsUtils'

export default defineComponent({
  name: 'GalleryPhoto',
  props: {
    photo: {
      type: Object,
      required: true
    },
    vendor: {
      type: String,
      required: true
    },
    inFilePanel: {
      type: Boolean,
      default: false
    },
    inLogoPanel: {
      type: Boolean,
      default: false
    },
    deletable: {
      type: Boolean,
      default: false
    }
  },
  components: {
    CircleCheckbox
  },
  data() {
    return {
    }
  },
  computed: {
    ...mapState({
      closeMobilePanelFlag: 'mobileEditor/closeMobilePanelFlag'
    }),
    ...mapState('mobileEditor', { mobilePanel: 'currActivePanel' }),
    ...mapGetters({
      scaleRatio: 'getPageScaleRatio',
      getPageSize: 'getPageSize',
      getLayers: 'getLayers',
      checkedAssets: 'file/getCheckedAssets',
      getCurrFunctionPanelType: 'getCurrFunctionPanelType',
      isAdmin: 'user/isAdmin'
    }),
    isUploading(): boolean {
      return typeof this.photo.progress !== 'undefined' && this.photo.progress !== 100
    },
    hasCheckedAssets(): boolean {
      return this.checkedAssets.length !== 0
    },
    pageSize(): { width: number, height: number } {
      return this.getPageSize(pageUtils.currFocusPageIndex)
    },
    previewSrc(): string {
      const { inFilePanel, inLogoPanel, photo, vendor } = this
      if (inFilePanel || inLogoPanel || photo.urls) return photo.urls.tiny || photo.urls.thumb
      const data = {
        srcObj: { type: vendor, userId: '', assetId: photo.id }
      } as IImage
      const sizeMap = this.$store.state.user.imgSizeMap as Array<{ [key: string]: number | string }>
      return imageUtils.appendRandomQuery(imageUtils.getSrc(data, sizeMap.flatMap(e => e.key === 'tiny' ? [e.size] : [])[0] || 150))
    },
    fullSrc(): string {
      const { inFilePanel, inLogoPanel, photo, vendor } = this
      if (inFilePanel || inLogoPanel || photo.urls) return photo.urls.full
      const data = {
        srcObj: { type: vendor, userId: '', assetId: photo.id }
      } as IImage
      return imageUtils.getSrc(data, photo.width)
    },
    showMoreBtn(): boolean {
      return !this.inFilePanel && !this.inLogoPanel && !generalUtils.isTouchDevice()
    },
    panelPreviewSrc(): string {
      const img = this.$refs.img as HTMLImageElement
      if (!img) {
        console.error('img in gallery photo is null')
        return ''
      }
      return img.src
    }
  },
  methods: {
    ...mapMutations({
      _setCurrSelectedResInfo: 'SET_currSelectedResInfo',
      addCheckedAssets: 'file/ADD_CHECKED_ASSETS',
      deleteCheckedAssets: 'file/DELETE_CHECKED_ASSETS',
      updateCheckedAssets: 'file/UPDATE_CHECKED_ASSETS',
      setCurrDraggedPhoto: 'SET_currDraggedPhoto',
      setCloseMobilePanelFlag: 'mobileEditor/SET_closeMobilePanelFlag'
    }),
    dragStart(e: DragEvent, photo: any) {
      if (!networkUtils.check()) {
        networkUtils.notifyNetworkError()
        return
      }
      if (this.getCurrFunctionPanelType === FunctionPanelType.photoShadow) {
        eventUtils.emit(PanelEvent.showPhotoShadow, '')
      }
      if (this.isUploading) {
        e.preventDefault()
      } else {
        const pageSize = this.$store.getters.getPageSize(layerUtils.pageIndex)
        const resizeRatio = RESIZE_RATIO_IMAGE
        const pageAspectRatio = pageSize.width / pageSize.height
        const photoAspectRatio = photo.width / photo.height
        const photoWidth = photoAspectRatio > pageAspectRatio ? pageSize.width * resizeRatio : (pageSize.height * resizeRatio) * photoAspectRatio
        const photoHeight = photoAspectRatio > pageAspectRatio ? (pageSize.width * resizeRatio) / photoAspectRatio : pageSize.height * resizeRatio

        const src = this.fullSrc
        const type = imageUtils.getSrcType(this.fullSrc)
        const srcObj = {
          type,
          userId: imageUtils.getUserId(src, type),
          assetId: (!this.isAdmin && photo.assetIndex) ? photo.assetIndex : imageUtils.getAssetId(src, type),
          brandId: imageUtils.getBrandId(src, type)
        }

        new DragUtils().itemDragStart(e, 'image', { type: 'image', srcObj }, {
          width: photoWidth,
          height: photoHeight,
          offsetX: 10,
          offsetY: 15,
          panelPreviewSrc: this.panelPreviewSrc
        })

        const previewSize = imageUtils.getSignificantDimension(this.photo.preview.width, this.photo.preview.height)
        const imgPreview = new Image()
        imgPreview.src = imageUtils.getSrc({ srcObj } as IImage, imageUtils.getSrcSize(srcObj, previewSize))
        imgPreview.onload = () => {
          const significantSize = imageUtils.getSignificantDimension(photoWidth, photoHeight)
          const imgPreload = new Image()
          imgPreload.src = imageUtils.getSrc({ srcObj } as IImage, imageUtils.getSrcSize(srcObj, significantSize))
        }

        this.setCurrDraggedPhoto({
          srcObj: {
            ...srcObj
          },
          styles: { width: photoWidth, height: photoHeight },
          isPreview: this.isUploading,
          previewsrc: this.previewSrc,
          panelPreviewSrc: this.panelPreviewSrc
        })
      }
    },
    dragEnd() {
      this.setCurrDraggedPhoto({
        srcObj: { type: '', assetId: '', userId: '' },
        styles: { width: 0, height: 0 },
        previewsrc: ''
      })
    },
    onClick(e: MouseEvent, photo: IAssetPhoto) {
      if (generalUtils.isTouchDevice() && this.mobilePanel === 'replace') {
        this.replaceImg(photo)
      } else if (this.hasCheckedAssets && this.inFilePanel) {
        this.modifyCheckedAssets(photo.assetIndex as number)
      } else {
        this.addImage(photo)
      }
    },
    replaceImg(photo: IAssetPhoto) {
      const { getCurrLayer: layer, getCurrConfig: _config, pageIndex, layerIndex, subLayerIdx } = layerUtils
      if (_config.type !== LayerType.image && _config.type !== LayerType.frame) return

      const url = this.isUploading ? (photo as IAssetPhoto).urls.prev : this.fullSrc
      const type = imageUtils.getSrcType(url)
      const assetIndex = (this.inFilePanel || this.inLogoPanel) && !photo.id ? photo.assetIndex : undefined
      const srcObj = {
        type,
        userId: imageUtils.getUserId(url, type),
        assetId: assetIndex ?? (imageUtils.getAssetId(url, type)),
        brandId: imageUtils.getBrandId(url, type)
      }

      const resizeRatio = RESIZE_RATIO_IMAGE
      const pageAspectRatio = this.pageSize.width / this.pageSize.height
      const photoAspectRatio = photo.width / photo.height
      const photoWidth = photoAspectRatio > pageAspectRatio ? this.pageSize.width * resizeRatio : (this.pageSize.height * resizeRatio) * photoAspectRatio
      const photoHeight = photoAspectRatio > pageAspectRatio ? (this.pageSize.width * resizeRatio) / photoAspectRatio : this.pageSize.height * resizeRatio

      const isPrimaryLayerFrame = layer.type === LayerType.frame
      const config = isPrimaryLayerFrame ? ((layer as IFrame).clips.find(c => c.active) ?? (layer as IFrame).clips[0]) : _config as IImage
      const { imgWidth, imgHeight } = config.styles
      const path = `path('M0,0h${imgWidth}v${imgHeight}h${-imgWidth}z`
      const styles = {
        ...config.styles,
        ...mouseUtils.clipperHandler({
          styles: {
            width: photoWidth,
            height: photoHeight
          }
        } as unknown as IImage, path, config.styles).styles
      }
      if (isPrimaryLayerFrame) {
        frameUtils.updateFrameLayerStyles(pageIndex, layerIndex, Math.max(subLayerIdx, 0), styles)
        frameUtils.updateFrameClipSrc(pageIndex, layerIndex, Math.max(subLayerIdx, 0), srcObj)
        frameUtils.updateFrameLayerProps(pageIndex, layerIndex, Math.max(subLayerIdx, 0), { panelPreviewSrc: this.panelPreviewSrc })
      } else {
        layerUtils.updateLayerStyles(pageIndex, layerIndex, styles, subLayerIdx)
        layerUtils.updateLayerProps(pageIndex, layerIndex, {
          srcObj,
          panelPreviewSrc: this.panelPreviewSrc
        }, subLayerIdx)
      }
      this.setCloseMobilePanelFlag(true)
      stepsUtils.record()
    },
    addImage(photo: IAssetPhoto) {
      if (this.getCurrFunctionPanelType === FunctionPanelType.photoShadow) {
        eventUtils.emit(PanelEvent.showPhotoShadow, '')
      }
      if (!networkUtils.check()) {
        networkUtils.notifyNetworkError()
        return
      }
      const src = this.isUploading ? (photo as IAssetPhoto).urls.prev : this.fullSrc
      const photoAspectRatio = photo.width / photo.height
      AssetUtils.addImage(
        src,
        photoAspectRatio,
        {
          pageIndex: pageUtils.currFocusPageIndex,
          panelPreviewSrc: this.panelPreviewSrc,
          ...((this.inFilePanel || this.inLogoPanel) && !photo.id && { assetIndex: photo.assetIndex }),
          ...((this.inFilePanel || this.inLogoPanel) && photo.id && { assetId: photo.id }),
          // The following props is used for preview image during polling process
          ...(this.isUploading && { isPreview: true, assetId: photo.id })
        }
      )
      if (generalUtils.isTouchDevice()) {
        this.setCloseMobilePanelFlag(true)
      }
    },
    showPhotoInfo(evt: Event) {
      const { vendor } = this
      const { info = {}, tags } = this.photo
      this._setCurrSelectedResInfo({
        type: 'photo',
        userName: info.user?.name ?? '',
        userLink: info.user?.link ?? '',
        vendor,
        tags
      })
      this.$nextTick(() => {
        const el = document.querySelector('.res-info') as HTMLElement
        const { top, left, height } = (evt.target as HTMLElement).getBoundingClientRect()
        el.style.transform = `translate(${left}px, ${top + height + 5}px)`
        el.focus()
      })
    },
    handleCheck(value: Array<unknown>) {
      this.updateCheckedAssets(value)
    },
    modifyCheckedAssets(assetIndex: number) {
      if (!this.isUploading) {
        this.checkedAssets.includes(assetIndex) ? this.deleteCheckedAssets(assetIndex) : this.addCheckedAssets(assetIndex)
      }
    },
    handleDeletePhoto() {
      brandkitUtils.setMobileDeleteItemFromPhoto(this.photo.assetIndex)
    }
  }
})
</script>

<style lang="scss" scoped>
.gallery-photo {
  $this: &;
  position: relative;
  display: inline-flex;
  justify-content: center;
  &.border {
    border: 1px solid #d9dbe1;
    border-radius: 5px;
    padding: 6px;
    box-sizing: border-box;
  }
  &__delete {
    position: absolute;
    top: -11px;
    right: -11px;
    @include size(24px);
    background: #ffffff;
    box-shadow: 0px 0px 8px rgba(60, 60, 60, 0.31);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  &__checkbox {
    position: absolute;
    top: 5px;
    left: 5px;
    opacity: 0;
    transition: opacity 0.2s ease-out;
  }
  &__more {
    position: absolute;
    top: 0px;
    right: 0px;
    margin: 5px;
    opacity: 0;
    z-index: -1;
    background-color: setColor(white, 0.7);
    border-radius: 2px;
    transition: opacity 0.2s ease-out;
    &:hover {
      background-color: setColor(white, 1);
    }
  }
  &__img {
    width: 100%;
    height: 100%;
  }
  &__res-info {
    position: absolute;
    top: 0;
    right: 0;
  }
  &__progress {
    width: 90%;
    height: 10px;
    bottom: 4px;
    position: absolute;
    background-color: rgba(black, 0.5);
    border-radius: 10px;
    overflow: hidden;
    border: 1px solid setColor(white, 0.8);
    box-shadow: 2px 2px 5px setColor(blue-1);
    box-sizing: border-box;
    &-bar {
      height: 100%;
      background: setLinearGradient(progress-bar);
      transition: width 0.3s;
    }
  }
  &:hover {
    #{$this}__more {
      opacity: 1;
      z-index: 1;
    }
    #{$this}__checkbox {
      opacity: 1;
      z-index: 1;
    }
  }
}

.show {
  opacity: 1;
}
</style>
