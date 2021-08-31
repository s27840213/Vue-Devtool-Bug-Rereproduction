<template lang="pug">
  div(class="gallery-photo")
    svg-icon(class="pointer gallery-photo__more"
      @click.native="showPhotoInfo"
      :iconName="'more_horizontal'"
      :iconColor="'gray-2'"
      :iconWidth="'20px'")
    img(:src="inFilePanel ? photo.urls.full : photo.urls.small",
      draggable="true",
      class="gallery-photo__img pointer"
      @dragstart="dragStart($event,photo)"
      @click="addImage(photo)")
    div(v-if="isUploading"
        class="gallery-photo__progress")
      div(class="gallery-photo__progress-bar"
        :style="{'width': `${photo.progress}%`}")
    //- div(v-if="photo.progress && photo.progress !== 100" class="gallery-photo__progress")
    //-   span {{}}
</template>

<script lang="ts">
import Vue from 'vue'
import { mapGetters, mapMutations } from 'vuex'
import layerFactary from '@/utils/layerFactary'
import layerUtils from '@/utils/layerUtils'
import { IGroup, IImage, IShape, IText, ITmp } from '@/interfaces/layer'

export default Vue.extend({
  props: {
    photo: Object,
    inFilePanel: {
      type: Boolean,
      default: false
    }
  },
  components: {},
  computed: {
    ...mapGetters({
      lastSelectedPageIndex: 'getLastSelectedPageIndex',
      scaleRatio: 'getPageScaleRatio',
      pageSize: 'getPageSize',
      getLayers: 'getLayers'
    }),
    isUploading(): boolean {
      return this.photo.progress && this.photo.progress !== 100
    }
  },
  methods: {
    ...mapMutations({
      _setCurrSelectedPhotoInfo: 'SET_currSelectedPhotoInfo'
    }),
    dragStart(e: DragEvent, photo: any) {
      const dataTransfer = e.dataTransfer as DataTransfer
      dataTransfer.dropEffect = 'move'
      dataTransfer.effectAllowed = 'move'
      const width = photo.width / 20
      const height = photo.height / 20
      const rect = (e.target as Element).getBoundingClientRect()
      const data = {
        type: 'image',
        // @/assets/img/svg/img-tmp.svg
        src: this.inFilePanel ? photo.urls.full : photo.urls.regular,
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
        const imageLayers = this.getLayers(this.lastSelectedPageIndex).filter((layer: IShape | IText | IImage | IGroup | ITmp) => {
          const src = this.inFilePanel ? photo.urls.full : photo.urls.regular
          return (layer.type === 'image') && (!layer.moved) && (layer.src === src)
        }) as Array<IImage>

        const x = imageLayers.length === 0 ? this.pageSize.width / 2 - photoWidth / 2 : imageLayers[imageLayers.length - 1].styles.x + 20
        const y = imageLayers.length === 0 ? this.pageSize.height / 2 - photoHeight / 2 : imageLayers[imageLayers.length - 1].styles.y + 20
        const config = {
          src: this.inFilePanel ? photo.urls.full : photo.urls.regular,
          styles: {
            x: x,
            y: y,
            width: photoWidth,
            height: photoHeight,
            initWidth: photoWidth,
            initHeight: photoHeight,
            imgWidth: photoWidth,
            imgHeight: photoHeight
          }
        }
        layerUtils.addLayers(this.lastSelectedPageIndex, layerFactary.newImage(config))
      }
    },
    showPhotoInfo(evt: Event) {
      const { user, tags, vendor } = this.photo
      this._setCurrSelectedPhotoInfo({
        userName: user.name,
        userLink: user.link,
        vendor,
        tags
      })
      this.$nextTick(() => {
        const el = document.querySelector('.photo-info') as HTMLElement
        const { top, left, height } = (evt.target as HTMLElement).getBoundingClientRect()
        el.style.transform = `translate3d(${left}px, ${top + height + 5}px,0)`
        el.focus()
      })
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
  &__more {
    position: absolute;
    top: 0px;
    right: 0px;
    margin: 5px;
    opacity: 0;
    z-index: -1;
    background-color: setColor(white, 0.7);
    border-radius: 2px;
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
    background-color: white;
    border-radius: 10px;
    overflow: hidden;
    border: 1px solid setColor(gray-4);
    box-shadow: 2px 2px 5px setColor(blue-1);
    box-sizing: border-box;
    &-bar {
      height: 100%;
      background-color: setColor(red);
      transition: width 0.3s;
    }
  }
  &:hover {
    #{$this}__more {
      opacity: 1;
      z-index: 1;
    }
  }
}
</style>
