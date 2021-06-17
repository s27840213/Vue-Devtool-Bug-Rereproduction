<template lang="pug">
  div(class="gallery-photo")
    svg-icon(class="pointer gallery-photo__more"
      @click.native="showPhotoInfo"
      :iconName="'more_horizontal'"
      :iconColor="'gray-2'"
      :iconWidth="'20px'")
    lazy-load
      img(:src="photo.urls.thumb",
        draggable="true",
        class="gallery-photo__img pointer"
        @dragstart="dragStart($event,photo)"
        @click="addImage(photo)")
</template>

<script lang="ts">
import Vue from 'vue'
import { mapGetters, mapMutations } from 'vuex'
import LazyLoad from '@/components/LazyLoad.vue'
import layerFactary from '@/utils/layerFactary'
import layerUtils from '@/utils/layerUtils'

export default Vue.extend({
  props: {
    photo: Object
  },
  components: {
    LazyLoad
  },
  computed: {
    ...mapGetters({
      lastSelectedPageIndex: 'getLastSelectedPageIndex',
      pageSize: 'getPageSize'
    })
  },
  methods: {
    ...mapMutations({
      _setCurrSelectedPhotoInfo: 'SET_currSelectedPhotoInfo'
    }),
    dragStart(e: DragEvent, photo: any) {
      const dataTransfer = e.dataTransfer as DataTransfer
      dataTransfer.dropEffect = 'move'
      dataTransfer.effectAllowed = 'move'

      const rect = (e.target as Element).getBoundingClientRect()
      const data = {
        type: 'image',
        // @/assets/img/svg/img-tmp.svg
        src: photo.urls.regular,
        styles: {
          x: e.clientX - rect.x,
          y: e.clientY - rect.y,
          width: photo.width / 20,
          height: photo.height / 20
        }
      }
      dataTransfer.setData('data', JSON.stringify(data))
    },
    addImage(photo: any) {
      const resizeRatio = 0.8
      const pageAspectRatio = this.pageSize.width / this.pageSize.height
      const photoAspectRatio = photo.width / photo.height
      const photoWidth = photoAspectRatio > pageAspectRatio ? this.pageSize.width * resizeRatio : (this.pageSize.height * resizeRatio) * photoAspectRatio
      const photoHeight = photoAspectRatio > pageAspectRatio ? (this.pageSize.width * resizeRatio) / photoAspectRatio : this.pageSize.height * resizeRatio
      const config = {
        src: photo.urls.regular,
        styles: {
          x: this.pageSize.width / 2 - photoWidth / 2,
          y: this.pageSize.height / 2 - photoHeight / 2,
          width: photoWidth,
          height: photoHeight,
          initWidth: photoWidth,
          initHeight: photoHeight,
          imgWidth: photoWidth,
          imgHeight: photoHeight
        }
      }
      layerUtils.addLayers(this.lastSelectedPageIndex, layerFactary.newImage(config))
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
  display: inline-block;
  background-color: #f1f1f1;
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
  &:hover {
    #{$this}__more {
      opacity: 1;
      z-index: 1;
    }
  }
}
</style>
