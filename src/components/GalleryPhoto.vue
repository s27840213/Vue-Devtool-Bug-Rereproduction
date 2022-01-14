<template lang="pug">
  div(class="gallery-photo")
    circle-checkbox(v-if="inFilePanel"
      class="gallery-photo__checkbox"
      :class="{show: hasCheckedAssets}"
      :value="photo.assetIndex"
      :checkedValues="checkedAssets"
      :disabled="isUploading"
      @update="handleCheck")
    svg-icon(v-if="!inFilePanel" class="pointer gallery-photo__more"
      @click.native="showPhotoInfo"
      :iconName="'more_vertical'"
      :iconColor="'gray-2'"
      :iconWidth="'20px'")
    img(:src="previewSrc",
      draggable="true",
      class="gallery-photo__img pointer"
      @dragstart="dragStart($event, photo)"
      @dragend="dragEnd"
      @click="hasCheckedAssets ? modifyCheckedAssets(photo.assetIndex) : addImage(photo)")
    div(v-if="isUploading"
        class="gallery-photo__progress")
      div(class="gallery-photo__progress-bar"
        :style="{'width': `${photo.progress}%`}")
</template>

<script lang="ts">
import Vue from 'vue'
import { mapGetters, mapMutations } from 'vuex'
import { IGroup, IImage, IShape, IText, ITmp } from '@/interfaces/layer'
import CircleCheckbox from '@/components/CircleCheckbox.vue'
import AssetUtils from '@/utils/assetUtils'
import ImageUtils from '@/utils/imageUtils'
import pageUtils from '@/utils/pageUtils'
import { IAssetPhoto } from '@/interfaces/api'
import networkUtils from '@/utils/networkUtils'
import modalUtils from '@/utils/modalUtils'

export default Vue.extend({
  name: 'GalleryPhoto',
  props: {
    photo: Object,
    vendor: String,
    inFilePanel: {
      type: Boolean,
      default: false
    }
  },
  components: {
    CircleCheckbox
  },
  data() {
    return {
      online: true
    }
  },
  created() {
    networkUtils.onNetworkChange((online) => {
      this.online = online
    })

    this.online = navigator.onLine
  },
  computed: {
    ...mapGetters({
      middlemostPageIndex: 'getMiddlemostPageIndex',
      currActivePageIndex: 'getCurrActivePageIndex',
      scaleRatio: 'getPageScaleRatio',
      getPageSize: 'getPageSize',
      getLayers: 'getLayers',
      checkedAssets: 'user/getCheckedAssets',
      isAdmin: 'user/isAdmin'
    }),
    isUploading(): boolean {
      return this.photo.progress && this.photo.progress !== 100
    },
    hasCheckedAssets(): boolean {
      return this.checkedAssets.length !== 0
    },
    pageSize(): { width: number, height: number } {
      return this.getPageSize(pageUtils.currFocusPageIndex)
    },
    previewSrc(): string {
      const { inFilePanel, photo, vendor } = this
      if (inFilePanel || photo.urls) return photo.urls.prev || photo.urls.thumb
      const data = {
        srcObj: { type: vendor, userId: '', assetId: photo.id }
      } as IImage
      return ImageUtils.getSrc(data, 200)
    },
    fullSrc(): string {
      const { inFilePanel, photo, vendor } = this
      if (inFilePanel || photo.urls) return photo.urls.full
      const data = {
        srcObj: { type: vendor, userId: '', assetId: photo.id }
      } as IImage
      return ImageUtils.getSrc(data, photo.width)
    }
  },
  methods: {
    ...mapMutations({
      _setCurrSelectedResInfo: 'SET_currSelectedResInfo',
      addCheckedAssets: 'user/ADD_CHECKED_ASSETS',
      deleteCheckedAssets: 'user/DELETE_CHECKED_ASSETS',
      updateCheckedAssets: 'user/UPDATE_CHECKED_ASSETS',
      setCurrDraggedPhoto: 'SET_currDraggedPhoto'
    }),
    dragStart(e: DragEvent, photo: any) {
      if (!this.online) {
        networkUtils.notifyNetworkError()
        return
      }
      if (this.isUploading) {
        e.preventDefault()
      } else {
        const dataTransfer = e.dataTransfer as DataTransfer
        dataTransfer.dropEffect = 'move'
        dataTransfer.effectAllowed = 'move'
        const width = photo.width / 20
        const height = photo.height / 20
        const rect = (e.target as Element).getBoundingClientRect()
        const src = this.fullSrc
        const type = ImageUtils.getSrcType(this.fullSrc)
        const data = {
          type: 'image',
          // @/assets/img/svg/img-tmp.svg
          srcObj: {
            type,
            userId: ImageUtils.getUserId(src, type),
            assetId: (!this.isAdmin && photo.assetIndex) ? photo.assetIndex : ImageUtils.getAssetId(src, type)
          },
          styles: {
            x: ((e.clientX - rect.x) / rect.width * width) * (this.scaleRatio / 100),
            y: ((e.clientY - rect.y) / rect.height * height) * (this.scaleRatio / 100),
            width: width,
            height: height
          }
        }
        dataTransfer.setData('data', JSON.stringify(data))
        fetch(ImageUtils.getSrc(data as IImage))
        fetch(ImageUtils.getSrc(data as IImage, ImageUtils.getSrcSize(data.srcObj.type,
          ImageUtils.getSignificantDimension(data.styles.width, data.styles.height),
          'next')))
        this.setCurrDraggedPhoto({
          srcObj: {
            ...data.srcObj
          },
          styles: { width, height },
          isPreview: this.isUploading
        })
      }
    },
    dragEnd() {
      this.setCurrDraggedPhoto({
        srcObj: { type: '', assetId: '', userId: '' },
        styles: { width: 0, height: 0 }
      })
    },
    addImage(photo: IAssetPhoto) {
      if (!this.online) {
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
          ...(this.inFilePanel && !photo.id && { assetIndex: photo.assetIndex }),
          ...(this.inFilePanel && photo.id && { assetId: photo.id }),
          // The following props is used for preview image during polling process
          ...(this.isUploading && { isPreview: true, assetId: photo.id })
        }
      )
    },
    showPhotoInfo(evt: Event) {
      const { vendor } = this
      const { info = {}, tags } = this.photo
      this._setCurrSelectedResInfo({
        create: 'Photo',
        userName: info.user?.name ?? '',
        userLink: info.user?.link ?? '',
        vendor,
        tags
      })
      this.$nextTick(() => {
        const el = document.querySelector('.res-info') as HTMLElement
        const { top, left, height } = (evt.target as HTMLElement).getBoundingClientRect()
        el.style.transform = `translate3d(${left}px, ${top + height + 5}px,0)`
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
