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
        @callback="$emit('loadMore')"
        :rootMargin="'0px 0px 400px'")
        svg-icon(v-if="pending"
          :iconName="'loading'"
          :iconColor="'gray-2'"
          :iconWidth="'20px'")
</template>

<script lang="ts">
/**
 * This components is temporarily used for img section, and it will be remove in the future
 */
import Vue from 'vue'
import { mapGetters, mapState } from 'vuex'
import GalleryUtils from '@/utils/galleryUtils'
import GalleryPhoto from '@/components/GalleryPhoto.vue'
import ObserverSentinel from '@/components/ObserverSentinel.vue'

export default Vue.extend({
  components: {
    ObserverSentinel,
    GalleryPhoto
  },
  computed: {
    ...mapState('photos', ['page', 'pending']),
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
      prevLastRow: [],
      galleryUtils: new GalleryUtils(260, 70, 5)
    }
  },
  watch: {
    getCurrentPagePhotos(val) {
      const { prevLastRow } = this
      const rows = this.galleryUtils
        .generate(prevLastRow.concat(val))
        .map((row, idx) => ({
          list: row,
          id: `row${this.page}${idx}`,
          size: row[0].preview.height + this.margin
        }))
      this.prevLastRow = (rows.splice(-1)[0].list || []) as any
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
