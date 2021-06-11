<template lang="pug">
infinite-scroll(class="temp__content"
  @callback="$emit('loadMore')")
  div(v-for="(row, index) in rows"
    :key="`rows${index}`",
    :style="{ marginBottom: `${margin}px` }")
    gallery-photo(v-for="(photo, i) in row"
      :style="imageStyle(photo.preview, i > 0)",
      :photo="photo"
      :key="photo.id")
</template>

<script lang="ts">
/**
 * This components is temporarily used for img section, and it will be remove in the future
 */
import Vue from 'vue'
import GalleryUtils from '@/utils/galleryUtils'
import InfiniteScroll from '@/components/InfiniteScroll.vue'
import GalleryPhoto from '@/components/GalleryPhoto.vue'

export default Vue.extend({
  props: {
    photos: {
      type: Array,
      default: () => []
    }
  },
  components: {
    InfiniteScroll,
    GalleryPhoto
  },
  computed: {
    margin(): number {
      return this.galleryUtils.margin
    }
  },
  data() {
    return {
      rows: [],
      galleryUtils: new GalleryUtils(260, 80, 5)
    }
  },
  watch: {
    photos(val) {
      const rows = this.galleryUtils.generate(val) as any
      this.rows = this.rows.concat(rows)
    }
  },
  methods: {
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
}
</style>
