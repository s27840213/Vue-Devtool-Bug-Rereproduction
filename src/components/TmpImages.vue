<template lang="pug">
infinite-scroll(class="temp__content"
  @callback="$emit('loadMore')")
  div(v-for="(row, index) in rows"
    :key="`rows${index}`",
    :style="{ marginBottom: `${margin}px` }")
    lazy-load(v-for="(photo, i) in row"
      :key="photo.id")
      img(:src="photo.urls.thumb",
        :style="imageStyle(photo.preview, i > 0)",
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
import InfiniteScroll from '@/components/InfiniteScroll.vue'
import LazyLoad from '@/components/LazyLoad.vue'

export default Vue.extend({
  props: {
    photos: {
      type: Array,
      default: () => []
    }
  },
  components: {
    InfiniteScroll,
    LazyLoad
  },
  computed: {
    ...mapGetters({
      lastSelectedPageIndex: 'getLastSelectedPageIndex',
      pageSize: 'getPageSize'
    }),
    margin (): number {
      return this.galleryUtils.margin
    }
  },
  data () {
    return {
      rows: [],
      galleryUtils: new GalleryUtils(260, 100, 5)
    }
  },
  watch: {
    photos (val) {
      const rows = this.galleryUtils.generate(val) as any
      this.rows = this.rows.concat(rows)
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
    },
    imageStyle(attr: any, addMarginLeft: boolean) {
      return {
        width: `${attr.width}px`,
        height: `${attr.height}px`,
        marginLeft: (addMarginLeft ? `${this.margin}px` : '0px')
      }
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
    display: inline-block;
    background-color: #f1f1f1;
  }
}
</style>
