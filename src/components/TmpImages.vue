<template lang="pug">

div(class="temp__content")
  div(v-for="(row, index) in rows"
    :key="`rows${index}`",
    :style="{ marginBottom: `${margin}px` }")
    img(v-for="(photo, i) in row"
      :key="photo.id",
      :src="photo.urls.regular",
      :width="photo.preview.width",
      :height="photo.preview.height",
      :style="i && { marginLeft: `${margin}px` }",
      draggable="true",
      class="temp__img"
      @dragstart="dragStart($event,photo)"
      @click="addImage(photo)")
</template>

<script lang="ts">
/**
 * This components is temporarily used for img section, and it will be remove in the future
 */
import layerFactary from '@/utils/layerFactary'
import layerUtils from '@/utils/layerUtils'
import Vue from 'vue'
import { mapGetters } from 'vuex'
import GalleryUtils from '@/utils/galleryUtils'

export default Vue.extend({
  computed: {
    ...mapGetters({
      lastSelectedPageIndex: 'getLastSelectedPageIndex',
      photos: 'getPhotos',
      pageSize: 'getPageSize'
    }),
    rows (): any[] {
      // @TODO lazyload, generate for lastest coming data
      const { galleryUtils, photos } = this
      return galleryUtils.generate(photos)
    },
    margin (): number {
      return this.galleryUtils.margin
    }
  },
  data () {
    return {
      galleryUtils: new GalleryUtils(260, 100, 5)
    }
  },
  methods: {
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
      const config = {
        src: photo.urls.regular,
        styles: {
          x: this.pageSize.width / 2 - (photo.width / 20) / 2,
          y: this.pageSize.height / 2 - (photo.height / 20) / 2,
          width: photo.width / 20,
          height: photo.height / 20,
          initWidth: photo.width / 20,
          initHeight: photo.height / 20,
          imgWidth: photo.width / 20,
          imgHeight: photo.height / 20
        }
      }
      layerUtils.addLayers(this.lastSelectedPageIndex, layerFactary.newImage(config))
    }
  }
})
</script>

<style lang="scss" scoped>
.temp {
  &__content {
    height: 100%;
    line-height: 0;
    text-align: left;
    box-sizing: border-box;
    overflow-y: scroll;
    &::-webkit-scrollbar {
      display: none;
    }
  }
  &__img {
    background-color: #f1f1f1;
  }
}
</style>
