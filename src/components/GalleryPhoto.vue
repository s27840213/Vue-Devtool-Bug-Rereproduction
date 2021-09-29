<template lang="pug">
  div(class="gallery-photo")
    circle-checkbox(v-if="inFilePanel"
      class="gallery-photo__checkbox"
      :class="{show: hasCheckedAssets}"
      :value="photo.id"
      :checkedValues="checkedAssets"
      @update="handleCheck")
    svg-icon(class="pointer gallery-photo__more"
      @click.native="showPhotoInfo"
      :iconName="'more_horizontal'"
      :iconColor="'gray-2'"
      :iconWidth="'20px'")
    img(:src="inFilePanel ? photo.urls.prev : photo.urls.thumb",
      draggable="true",
      class="gallery-photo__img pointer"
      @dragstart="dragStart($event,photo)"
      @click="hasCheckedAssets ? modifyCheckedAssets(photo.id) :addImage(photo)")
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
import layerUtils from '@/utils/layerUtils'

export default Vue.extend({
  props: {
    photo: Object,
    inFilePanel: {
      type: Boolean,
      default: false
    }
  },
  components: {
    CircleCheckbox
  },
  computed: {
    ...mapGetters({
      lastSelectedPageIndex: 'getLastSelectedPageIndex',
      scaleRatio: 'getPageScaleRatio',
      pageSize: 'getPageSize',
      getLayers: 'getLayers',
      checkedAssets: 'user/getCheckedAssets'
    }),
    isUploading(): boolean {
      return this.photo.progress && this.photo.progress !== 100
    },
    hasCheckedAssets(): boolean {
      return this.checkedAssets.length !== 0
    }
  },
  methods: {
    ...mapMutations({
      _setCurrSelectedPhotoInfo: 'SET_currSelectedPhotoInfo',
      addCheckedAssets: 'user/ADD_CHECKED_ASSETS',
      deleteCheckedAssets: 'user/DELETE_CHECKED_ASSETS',
      updateCheckedAssets: 'user/UPDATE_CHECKED_ASSETS'
    }),
    dragStart(e: DragEvent, photo: any) {
      const dataTransfer = e.dataTransfer as DataTransfer
      dataTransfer.dropEffect = 'move'
      dataTransfer.effectAllowed = 'move'
      const width = photo.width / 20
      const height = photo.height / 20
      const rect = (e.target as Element).getBoundingClientRect()
      const src = this.inFilePanel ? photo.urls.full : photo.urls.regular
      const type = ImageUtils.getSrcType(photo.urls.full)
      const data = {
        type: 'image',
        // @/assets/img/svg/img-tmp.svg
        srcObj: {
          type,
          userId: ImageUtils.getUserId(src, type),
          assetId: ImageUtils.getAssetId(src, type)
        },
        styles: {
          x: ((e.clientX - rect.x) / rect.width * width) * (this.scaleRatio / 100),
          y: ((e.clientY - rect.y) / rect.height * height) * (this.scaleRatio / 100),
          width: width,
          height: height
        }
      }
      dataTransfer.setData('data', JSON.stringify(data))
    },
    addImage(photo: any) {
      if (!this.isUploading) {
        const resizeRatio = 0.8
        const pageAspectRatio = this.pageSize.width / this.pageSize.height
        const photoAspectRatio = photo.width / photo.height
        const photoWidth = photoAspectRatio > pageAspectRatio ? this.pageSize.width * resizeRatio : (this.pageSize.height * resizeRatio) * photoAspectRatio
        const photoHeight = photoAspectRatio > pageAspectRatio ? (this.pageSize.width * resizeRatio) / photoAspectRatio : this.pageSize.height * resizeRatio
        const allLayers = this.getLayers(this.lastSelectedPageIndex)
        const imageLayers = allLayers.filter((layer: IShape | IText | IImage | IGroup | ITmp) => {
          const src = this.inFilePanel ? photo.urls.full : photo.urls.regular
          const type = ImageUtils.getSrcType(src)
          const assetId = ImageUtils.getAssetId(src, type)

          return (layer.type === 'image') && (!layer.moved) && ((layer as IImage).srcObj.assetId === assetId)
        }) as Array<IImage>

        const x = imageLayers.length === 0 ? this.pageSize.width / 2 - photoWidth / 2 : imageLayers[imageLayers.length - 1].styles.x + 20
        const y = imageLayers.length === 0 ? this.pageSize.height / 2 - photoHeight / 2 : imageLayers[imageLayers.length - 1].styles.y + 20
        const src = this.inFilePanel ? photo.urls.full : photo.urls.regular
        AssetUtils.addImage(
          src,
          {
            pageIndex: this.lastSelectedPageIndex,
            styles: { x, y, width: photoWidth, height: photoHeight }
          }
        )
      }
    },
    showPhotoInfo(evt: Event) {
      const { user = {}, tags, vendor } = this.photo
      this._setCurrSelectedPhotoInfo({
        userName: user.name || '',
        userLink: user.link || '',
        vendor,
        tags
      })
      this.$nextTick(() => {
        const el = document.querySelector('.photo-info') as HTMLElement
        const { top, left, height } = (evt.target as HTMLElement).getBoundingClientRect()
        el.style.transform = `translate3d(${left}px, ${top + height + 5}px,0)`
        el.focus()
      })
    },
    handleCheck(value: Array<unknown>) {
      this.updateCheckedAssets(value)
    },
    modifyCheckedAssets(id: string) {
      this.checkedAssets.includes(id) ? this.deleteCheckedAssets(id) : this.addCheckedAssets(id)
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
  &__photo-info {
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
