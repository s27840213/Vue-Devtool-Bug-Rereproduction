<template lang="pug">
  recycle-scroller(v-else
    class="temp__content"
    :items="rows")
    template(v-slot="{ item }")
      div
        gallery-photo(v-for="(photo, i) in item.list"
          :style="imageStyle(photo.preview, i > 0)",
          :photo="photo"
          :key="photo.id")
    template(#after)
      observer-sentinel(target=".temp__content"
        @callback="$emit('loadMore')")
</template>

<script lang="ts">
/**
 * This components is temporarily used for img section, and it will be remove in the future
 */
import Vue from 'vue'
import { mapGetters } from 'vuex'
import GalleryUtils from '@/utils/galleryUtils'
import GalleryPhoto from '@/components/GalleryPhoto.vue'
import ObserverSentinel from '@/components/ObserverSentinel.vue'

export default Vue.extend({
  components: {
    ObserverSentinel,
    GalleryPhoto
  },
  computed: {
    ...mapGetters('photos', [
      'getCurrentPagePhotos'
    ]),
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
    getCurrentPagePhotos(val) {
      const rows = this.galleryUtils
        .generate(val)
        .map((row, idx) => ({
          list: row,
          id: `row${idx}`,
          size: row[0].preview.height + this.margin
        }))
      this.rows = this.rows.concat(rows as any)
    }
  },
  methods: {
    imageStyle(attr: any, addMarginLeft: boolean) {
      return {
        width: `${attr.width}px`,
        height: `${attr.height}px`,
        marginLeft: `${addMarginLeft ? this.margin : 0}px`
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
